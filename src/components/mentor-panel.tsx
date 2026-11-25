"use client";

import { useState } from "react";

type MentorPanelProps = { topic: string; task: string; answer: string };

export function MentorPanel({ topic, task, answer }: MentorPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkAnswer() {
    if (!answer.trim() || loading) return;
    setLoading(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, task, answer }),
      });
      const result = await response.json() as { feedback?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось проверить решение.");
      setFeedback(result.feedback || "Попробуй добавить чуть больше подробностей о своём решении.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось связаться с наставником.");
    } finally {
      setLoading(false);
    }
  }

  return <section aria-label="ИИ-наставник" className="mt-4 overflow-hidden rounded-2xl border border-[#315177] bg-[#10182c] shadow-sm">
    <div className="flex items-center gap-3 border-b border-[#315177] bg-[#17223b] p-4">
      <img src="/images/robo-mentor.png" alt="Робот Robo" className="size-14 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#e7edff]">Robo — твой ИИ-наставник</p>
        <p className="text-xs leading-5 text-[#c0cde0]">Проверит решение и подскажет следующий шаг</p>
      </div>
      <span className="size-2 shrink-0 rounded-full bg-[#63e5c2] shadow-[0_0_10px_#63e5c2]" aria-label="Готов помогать" />
    </div>
    <div className="space-y-3 p-4">
      {!feedback && !error && <p className="text-sm leading-6 text-[#c0cde0]">Напиши решение задания — я отмечу удачные идеи, найду ошибки и помогу разобраться, не раскрывая весь ответ.</p>}
      {feedback && <div role="status" aria-live="polite" className="whitespace-pre-wrap rounded-xl border border-[#3a5577] bg-[#0a1322] p-4 text-sm leading-7 text-[#e1e9f7]">{feedback}</div>}
      {error && <p role="alert" className="rounded-xl border border-[#71445c] bg-[#311d2c] p-3 text-sm leading-6 text-[#ffd3e7]">{error}</p>}
      <button type="button" onClick={checkAnswer} disabled={!answer.trim() || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#7191d1] bg-[#6651ac] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#7863c2] disabled:cursor-not-allowed disabled:opacity-55">
        {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Robo проверяет…</> : feedback ? "Проверить ещё раз" : "Проверить моё решение"}
      </button>
    </div>
  </section>;
}
