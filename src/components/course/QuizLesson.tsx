"use client";

import { useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { PublicQuiz, QuizResult } from "@/lib/course";
import { Markdown } from "@/components/practice/Markdown";
import { Alert, Badge, Button, cx } from "@/components/ui";

/**
 * 퀴즈(예상문제) 차시 — 모두 풀고 채점 → 정답·근거·해설 확인 → 다시 풀기 / 틀린 문제만 다시
 * 정답은 서버에만 있고, 제출해야 결과가 온다. 서술형은 점수에 넣지 않고 모범답안과 비교.
 */
const MARKS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

type Answers = Record<string, number[]>;

export function QuizLesson({
  endpoint,
  quiz,
  enrolled,
  best,
  attempts,
  onGraded,
}: {
  endpoint: string;
  quiz: PublicQuiz;
  enrolled: boolean;
  best: number | null;
  attempts: number;
  onGraded: (r: QuizResult) => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [essays, setEssays] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [retryOnly, setRetryOnly] = useState<Set<string> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bestScore, setBestScore] = useState(best);
  const [tries, setTries] = useState(attempts);

  const byKey = useMemo(() => new Map(result?.results.map((r) => [r.key, r]) ?? []), [result]);
  const gradable = quiz.questions.filter((q) => q.kind !== "essay");
  const unanswered = gradable.filter((q) => !(answers[q.key]?.length)).length;
  const visible = retryOnly ? quiz.questions.filter((q) => retryOnly.has(q.key)) : quiz.questions;

  const pick = (key: string, i: number, multiple: boolean) => {
    if (result) return;
    setAnswers((a) => {
      const cur = a[key] ?? [];
      if (!multiple) return { ...a, [key]: [i] };
      return { ...a, [key]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((x, y) => x - y) };
    });
  };

  const submit = async () => {
    if (unanswered > 0 && !window.confirm(`아직 ${unanswered}문항을 풀지 않았어요. 그대로 채점할까요?`)) return;
    setSubmitting(true);
    setError("");
    const res = await apiRequest<QuizResult>(endpoint, { method: "POST", body: JSON.stringify({ answers }) });
    setSubmitting(false);
    if (!res.ok || !res.data) {
      setError(res.message || "채점하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setResult(res.data);
    setRetryOnly(null);
    if (res.data.saved) {
      setBestScore(res.data.best);
      setTries((t) => t + 1);
    }
    onGraded(res.data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = (wrongOnly: boolean) => {
    if (wrongOnly && result) {
      const wrong = new Set(result.results.filter((r) => r.correct === false).map((r) => r.key));
      // 맞힌 문제의 답은 그대로 두고 틀린 문제만 비운다
      setAnswers((a) => Object.fromEntries(Object.entries(a).filter(([k]) => !wrong.has(k))));
      setRetryOnly(wrong);
    } else {
      setAnswers({});
      setEssays({});
      setRetryOnly(null);
    }
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wrongCount = result?.results.filter((r) => r.correct === false).length ?? 0;

  return (
    <div>
      {/* 머리 — 안내 또는 결과 */}
      {result ? (
        <div className={cx("rounded-2xl px-5 py-5 sm:px-7", result.passed ? "bg-[var(--brand-light)]" : "bg-amber-50")}>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <p className={cx("text-4xl font-bold tabular-nums", result.passed ? "text-[var(--brand)]" : "text-amber-700")}>{result.score}점</p>
            <p className="pb-1 text-sm text-[var(--foreground-muted)]">
              {result.gradable}문항 중 {result.correctCount}문항 정답 · 합격 기준 {quiz.passScore}점
            </p>
          </div>
          <p className="mt-2 font-semibold text-[var(--foreground)]">
            {result.passed ? "합격이에요! 이 차시를 완료했어요." : "조금만 더! 해설을 보고 틀린 문제를 다시 풀어 보세요."}
          </p>
          {result.saved ? (
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">최고 점수 {result.best}점 · {tries}번째 응시</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{enrolled ? "" : "수강 신청하면 점수와 완료가 기록돼요."}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {wrongCount > 0 && <Button onClick={() => restart(true)}>틀린 {wrongCount}문제만 다시 풀기</Button>}
            <Button variant="secondary" onClick={() => restart(false)}>처음부터 다시 풀기</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-[var(--surface)] px-5 py-4 text-sm">
          <span className="font-semibold text-[var(--foreground)]">{quiz.questions.length}문항</span>
          <span className="text-[var(--foreground-muted)]">합격 기준 {quiz.passScore}점</span>
          {bestScore !== null && <span className="text-[var(--foreground-muted)]">내 최고 점수 {bestScore}점 · {tries}회 응시</span>}
          {retryOnly && <Badge tone="warning">틀린 문제 {retryOnly.size}개만 다시 푸는 중</Badge>}
        </div>
      )}

      {/* 문항 */}
      <ol className="mt-6 space-y-5">
        {visible.map((q) => {
          const n = quiz.questions.indexOf(q) + 1;
          const r = byKey.get(q.key);
          const chosen = answers[q.key] ?? [];
          return (
            <li key={q.key} className={cx("rounded-2xl border px-5 py-5 sm:px-6", r ? (r.correct === true ? "border-emerald-200" : r.correct === false ? "border-red-200" : "border-[var(--border-light)]") : "border-[var(--border-light)]")}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-sm font-bold text-[var(--brand)]">Q{n}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.kind === "ox" && <Badge>O/X</Badge>}
                    {q.kind === "essay" && <Badge>서술형</Badge>}
                    {q.multiple && <Badge tone="brand">정답 여러 개</Badge>}
                    {r && r.correct !== null && (
                      <Badge tone={r.correct ? "success" : "error"}>{r.correct ? "정답" : "오답"}</Badge>
                    )}
                  </div>
                  <div className="mt-2 font-medium leading-relaxed text-[var(--foreground)]">
                    <Markdown md={q.stem} />
                  </div>

                  {/* 보기 */}
                  {q.kind === "ox" ? (
                    <div className="mt-4 flex gap-3">
                      {q.options.map((o, i) => (
                        <button
                          key={i}
                          onClick={() => pick(q.key, i, false)}
                          disabled={!!result}
                          className={cx(
                            "h-14 flex-1 cursor-pointer rounded-xl border-2 text-2xl font-bold transition disabled:cursor-default",
                            optionTone(i, chosen, r)
                          )}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  ) : q.kind === "choice" ? (
                    <ul className="mt-4 space-y-2">
                      {q.options.map((o, i) => (
                        <li key={i}>
                          <button
                            onClick={() => pick(q.key, i, q.multiple)}
                            disabled={!!result}
                            className={cx(
                              "flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-[0.95rem] transition disabled:cursor-default",
                              optionTone(i, chosen, r)
                            )}
                          >
                            <span className="shrink-0 font-semibold">{MARKS[i] ?? `${i + 1}.`}</span>
                            <span className="min-w-0">{o}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea
                      value={essays[q.key] ?? ""}
                      onChange={(e) => setEssays((s) => ({ ...s, [q.key]: e.target.value }))}
                      readOnly={!!result}
                      rows={4}
                      placeholder="내 답을 적어 보세요. (채점하지 않고, 채점 후 모범답안과 비교해요)"
                      className="mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-[0.95rem] focus:border-[var(--brand)] focus:outline-none"
                    />
                  )}

                  {/* 해설 */}
                  {r && (
                    <div className="mt-4 space-y-3 rounded-xl bg-[var(--surface)] px-4 py-4 text-sm leading-relaxed">
                      {r.kind !== "essay" && (
                        <p>
                          <span className="font-semibold text-[var(--foreground)]">정답 </span>
                          {r.answers.map((a) => (q.kind === "ox" ? q.options[a] : MARKS[a] ?? a + 1)).join(", ")}
                        </p>
                      )}
                      {r.modelAnswer && (
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">모범답안</p>
                          <Markdown md={r.modelAnswer} className="!text-sm" />
                        </div>
                      )}
                      {(r.ground || r.where) && (
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">근거{r.where ? ` · ${r.where}` : ""}</p>
                          {r.ground && <Markdown md={r.ground} className="!text-sm" />}
                        </div>
                      )}
                      {r.explanation && (
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">해설</p>
                          <Markdown md={r.explanation} className="!text-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-6 space-y-3">
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={submit} loading={submitting}>채점하기</Button>
            {unanswered > 0 && <span className="text-sm text-[var(--foreground-muted)]">남은 문항 {unanswered}개</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/** 보기 색 — 풀 때는 고른 것만, 채점 후에는 정답 초록 · 고른 오답 빨강 */
function optionTone(i: number, chosen: number[], r?: QuizResult["results"][number]) {
  const picked = chosen.includes(i);
  if (!r) {
    return picked
      ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand-ink)]"
      : "border-[var(--border-light)] hover:border-[var(--border)] hover:bg-[var(--surface)]";
  }
  if (r.answers.includes(i)) return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (picked) return "border-red-300 bg-red-50 text-red-700";
  return "border-[var(--border-light)] text-[var(--foreground-muted)]";
}
