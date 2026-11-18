"use client";

import { useEffect, useState } from "react";

type RunResponse = { output?: string; stage?: "compile" | "run"; exitCode?: number | null; timedOut?: boolean; tooMuchOutput?: boolean; error?: string };

export function JavaCodeCell({ courseId, topicNumber, starterCode }: { courseId: string; topicNumber: number; starterCode: string }) {
  const storageKey = "mindloom-java-cell-" + encodeURIComponent(courseId) + "-" + topicNumber;
  const [code, setCode] = useState(starterCode);
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);

  useEffect(() => {
    try { setCode(window.localStorage.getItem(storageKey) ?? starterCode); } catch { setCode(starterCode); }
    setLoaded(true);
  }, [starterCode, storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, code); } catch { /* Saving a draft is optional. */ }
  }, [code, loaded, storageKey]);

  async function runCode() {
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/run-java", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json() as RunResponse;
      setResult(data);
    } catch {
      setResult({ error: "Не удалось связаться с локальным Java-запускателем." });
    } finally {
      setRunning(false);
    }
  }

  const failed = Boolean(result?.error || result?.exitCode !== undefined && result.exitCode !== 0 || result?.timedOut || result?.tooMuchOutput);

  return <section className="mt-6 overflow-hidden rounded-[22px] border-2 border-[#493950] bg-[#10182c] shadow-[5px_5px_0_#493950]" aria-labelledby="java-cell-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#394967] bg-[#17223b] px-5 py-4">
      <div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#70e6ff]">Java · javac</p><h2 id="java-cell-title" className="mt-1 text-lg font-extrabold text-[#eef2ff]">Попробуй код</h2></div>
      <button type="button" onClick={runCode} disabled={running || !loaded} className="rounded-lg border-2 border-[#ffcf4a] bg-[#ffcf4a] px-4 py-2 text-sm font-extrabold text-[#171629] shadow-[0_3px_0_#b88318] transition hover:bg-[#ffdc72] disabled:cursor-wait disabled:opacity-60">{running ? "Выполняется…" : "▶ Запустить"}</button>
    </div>
    <div className="p-4 sm:p-5">
      <label htmlFor="java-code-input" className="sr-only">Код Java</label>
      <textarea id="java-code-input" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} rows={12} className="w-full resize-y rounded-xl border-2 border-[#394967] bg-[#080d19] p-4 font-mono text-sm leading-6 text-[#d8e7ff] outline-none focus:border-[#70e6ff]" />
      <p className="mt-2 text-xs leading-5 text-slate-400">Код запускается на локальном сервере разработки. Черновик сохраняется в этом браузере.</p>
      {result && <div aria-live="polite" className={"mt-4 rounded-xl border p-4 " + (failed ? "border-[#865256] bg-[#271820]" : "border-[#285c50] bg-[#102822]")}>
        <p className={"text-xs font-bold uppercase tracking-[0.1em] " + (failed ? "text-[#ff9b9b]" : "text-[#7bdfb4]")}>{result.error ? "Не удалось запустить" : result.stage === "compile" ? "Результат компиляции" : result.timedOut ? "Превышено время выполнения" : result.tooMuchOutput ? "Слишком много вывода" : result.exitCode === 0 ? "Вывод программы" : "Ошибка выполнения"}</p>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[#e7edf8]">{result.error ?? result.output}</pre>
      </div>}
    </div>
  </section>;
}
