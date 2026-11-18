import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const maxSourceLength = 16_000;
const maxOutputLength = 16_000;

type ProcessResult = { output: string; exitCode: number | null; timedOut: boolean; tooMuchOutput: boolean; failedToStart: boolean };

function run(command: string, args: string[], cwd: string, timeoutMs: number): Promise<ProcessResult> {
  return new Promise((resolve) => {
    let output = "";
    let timedOut = false;
    let tooMuchOutput = false;
    let failedToStart = false;
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: false,
      env: {
        PATH: process.env.PATH ?? "",
        JAVA_HOME: process.env.JAVA_HOME ?? "",
        NODE_ENV: "development",
        SystemRoot: process.env.SystemRoot ?? "",
        TEMP: cwd,
        TMP: cwd,
      },
    });
    const append = (chunk: Buffer) => {
      output += chunk.toString("utf8");
      if (Buffer.byteLength(output, "utf8") > maxOutputLength) {
        tooMuchOutput = true;
        child.kill();
      }
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", () => { failedToStart = true; });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ output: output.slice(0, maxOutputLength), exitCode, timedOut, tooMuchOutput, failedToStart });
    });
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Запуск Java-кода доступен в локальном режиме разработки." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  if (!["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname) || !origin || origin !== requestUrl.origin) {
    return Response.json({ error: "Запрос отклонён." }, { status: 403 });
  }

  let body: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxSourceLength + 128) return Response.json({ error: "Код слишком большой. Лимит — 16 КБ." }, { status: 413 });
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxSourceLength + 128) return Response.json({ error: "Код слишком большой. Лимит — 16 КБ." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Не удалось прочитать код." }, { status: 400 });
  }
  const source = body && typeof body === "object" && "code" in body && typeof body.code === "string" ? body.code : "";
  if (!source.trim()) return Response.json({ error: "Добавьте Java-код перед запуском." }, { status: 400 });
  if (Buffer.byteLength(source, "utf8") > maxSourceLength) return Response.json({ error: "Код слишком большой. Лимит — 16 КБ." }, { status: 413 });
  if (!/\bclass\s+Main\b/.test(source) || !/\bstatic\s+void\s+main\s*\(/.test(source)) {
    return Response.json({ error: "Добавьте класс Main и метод public static void main(String[] args)." }, { status: 400 });
  }

  let directory: string | undefined;
  try {
    directory = await mkdtemp(path.join(os.tmpdir(), "mindloom-java-"));
    const sourceFile = path.join(directory, "Main.java");
    await writeFile(sourceFile, source, { encoding: "utf8", flag: "wx" });

    const compiled = await run("javac", ["-encoding", "UTF-8", "-proc:none", "-d", directory, sourceFile], directory, 10_000);
    if (compiled.failedToStart) return Response.json({ error: "Не найден javac. Установите JDK и добавьте его в PATH." }, { status: 503 });
    if (compiled.timedOut) return Response.json({ output: compiled.output || "Компиляция заняла слишком много времени.", stage: "compile", exitCode: compiled.exitCode }, { status: 200 });
    if (compiled.exitCode !== 0) return Response.json({ output: compiled.output || "Ошибка компиляции.", stage: "compile", exitCode: compiled.exitCode }, { status: 200 });

    const executed = await run("java", ["-Xmx64m", "-XX:MaxMetaspaceSize=48m", "-Xss256k", "-XX:+UseSerialGC", "-cp", directory, "Main"], directory, 3_000);
    if (executed.failedToStart) return Response.json({ error: "Не удалось запустить Java. Проверьте установку JDK." }, { status: 503 });
    return Response.json({ output: executed.output || (executed.exitCode === 0 ? "Программа завершилась без вывода." : "Программа завершилась с ошибкой."), stage: "run", exitCode: executed.exitCode, timedOut: executed.timedOut, tooMuchOutput: executed.tooMuchOutput });
  } catch {
    return Response.json({ error: "Не удалось запустить Java-код." }, { status: 500 });
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}
