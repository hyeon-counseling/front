"use client";

/**
 * GuidedQuiz — guided 차시 인라인 퀴즈 (5종)
 * 처음 답한 뒤 POST /api/my/review/seen 으로 SM-2 복습 카드에 추가한다.
 */

import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import type { Quiz } from "@/lib/guided";

interface Props {
  quiz: Quiz;
  courseSlug: string;
  lessonKey: string;
  /** 미리보기/비로그인 시 seen 저장 생략 */
  canSave?: boolean;
}

const KIND_LABEL: Record<Quiz["kind"], string> = {
  ox: "O / X",
  mc: "고르기",
  blank: "빈칸 채우기",
  order: "순서 맞추기",
  match: "짝 맞추기",
};

/** 결정론적 셔플 (seed 고정) */
function deterministicShuffle<T>(arr: T[], seed = 7): T[] {
  const r = [...arr];
  let x = seed;
  for (let i = r.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function GuidedQuiz({ quiz, courseSlug, lessonKey, canSave = true }: Props) {
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [shownAnswer, setShownAnswer] = useState<string | null>(null);

  // order 상태
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [orderDisabled, setOrderDisabled] = useState<Set<number>>(new Set());

  // match 상태
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [matchDone, setMatchDone] = useState<Set<string>>(new Set());
  const [matchMiss, setMatchMiss] = useState(0);
  const [matchShake, setMatchShake] = useState<string | null>(null);

  const finish = useCallback(
    (ok: boolean, shown?: string) => {
      if (answered) return;
      setAnswered(true);
      setCorrect(ok);
      setShownAnswer(shown ?? null);
      if (canSave) {
        void apiRequest(`/api/my/review/seen`, {
          method: "POST",
          body: JSON.stringify({ course: courseSlug, lesson: lessonKey, ids: [quiz.id] }),
        });
      }
    },
    [answered, canSave, courseSlug, lessonKey, quiz.id]
  );

  const q = quiz.q.replace("___", "___");

  return (
    <div
      className={`my-6 rounded-2xl border p-5 ${
        answered
          ? correct
            ? "border-[var(--success)] bg-[#f0faf5]"
            : "border-[var(--error)] bg-[#fdf4f4]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
      role="group"
      aria-label={`퀴즈: ${q}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-[var(--brand-light)] px-2 py-0.5 text-xs font-bold text-[var(--brand)]">
          {KIND_LABEL[quiz.kind]}
        </span>
        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--foreground-subtle)]">
          오늘의 퀴즈에 담김
        </span>
      </div>

      {/* 문제 */}
      {quiz.kind === "blank" ? (
        <p className="mb-4 text-[0.95rem] font-medium leading-relaxed text-[var(--foreground)]">
          {quiz.q.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="mx-1 inline-block min-w-[60px] rounded-lg border-b-2 border-[var(--brand)] bg-[var(--brand-light)] px-3 py-0.5 text-center font-bold text-[var(--brand)]">
                  {orderPicked[0] ?? "?"}
                </span>
              )}
            </span>
          ))}
        </p>
      ) : (
        <p className="mb-4 text-[0.95rem] font-medium leading-relaxed text-[var(--foreground)]">{quiz.q}</p>
      )}

      {/* 선택지 영역 */}
      {!answered && (
        <>
          {quiz.kind === "ox" && (
            <div className="flex gap-3">
              {[
                { label: "O", value: true, aria: "맞다 O" },
                { label: "X", value: false, aria: "아니다 X" },
              ].map(({ label, value, aria }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={aria}
                  onClick={() => finish(value === quiz.ans, value === quiz.ans ? undefined : quiz.ans ? "O" : "X")}
                  className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--border)] bg-white text-2xl font-bold text-[var(--foreground)] transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {quiz.kind === "mc" && quiz.opts && (
            <div className="space-y-2">
              {quiz.opts.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const ok = i === quiz.ans;
                    finish(ok, ok ? undefined : quiz.opts![quiz.ans as number]);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-left text-sm transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-bold">
                    {"가나다라마바사"[i]}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {quiz.kind === "blank" && quiz.opts && (
            <div className="flex flex-wrap gap-2">
              {quiz.opts.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => finish(i === quiz.ans, i === quiz.ans ? undefined : quiz.opts![quiz.ans as number])}
                  className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {quiz.kind === "order" && quiz.items && (
            <div className="space-y-3">
              {/* 선택된 순서 */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: quiz.items.length }, (_, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
                      orderPicked[i]
                        ? "border-[var(--brand)] bg-[var(--brand-light)] font-medium text-[var(--brand)]"
                        : "border-dashed border-[var(--border)] text-[var(--foreground-subtle)]"
                    }`}
                  >
                    <span className="text-xs font-bold">{i + 1}</span>
                    {orderPicked[i] ?? "…"}
                  </span>
                ))}
              </div>
              {/* 선택 버튼들 */}
              <div className="flex flex-wrap gap-2">
                {deterministicShuffle(quiz.items.map((item, idx) => ({ item, idx })), quiz.items.length * 3).map(
                  ({ item, idx }) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={orderDisabled.has(idx)}
                      onClick={() => {
                        const newPicked = [...orderPicked, item];
                        const newDisabled = new Set(orderDisabled);
                        newDisabled.add(idx);
                        setOrderPicked(newPicked);
                        setOrderDisabled(newDisabled);
                        if (newPicked.length === quiz.items!.length) {
                          const ok = newPicked.every((p, i) => p === quiz.items![i]);
                          finish(ok, quiz.items!.join(" → "));
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)] disabled:opacity-40"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {quiz.kind === "match" && quiz.pairs && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {quiz.pairs.map(([left]) => (
                  <button
                    key={left}
                    type="button"
                    disabled={matchDone.has(left)}
                    onClick={() => setMatchSelected(left)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-sm text-left transition-colors disabled:opacity-40 ${
                      matchSelected === left
                        ? "border-[var(--brand)] bg-[var(--brand-light)] font-semibold text-[var(--brand)]"
                        : "border-[var(--border)] bg-white hover:border-[var(--brand)]"
                    }`}
                  >
                    {left}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {deterministicShuffle(quiz.pairs.map(([, right]) => right), 11).map((right) => (
                  <button
                    key={right}
                    type="button"
                    disabled={matchDone.has(right)}
                    onClick={() => {
                      if (!matchSelected) return;
                      if (matchDone.has(right)) return;
                      const pair = quiz.pairs!.find(([l]) => l === matchSelected);
                      const ok = pair?.[1] === right;
                      if (ok) {
                        const newDone = new Set(matchDone);
                        newDone.add(matchSelected);
                        newDone.add(right);
                        setMatchDone(newDone);
                        setMatchSelected(null);
                        if (newDone.size === quiz.pairs!.length * 2) {
                          finish(matchMiss === 0, null as unknown as string);
                        }
                      } else {
                        setMatchMiss((m) => m + 1);
                        setMatchShake(right);
                        setTimeout(() => setMatchShake(null), 400);
                      }
                    }}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-sm text-left transition-colors disabled:opacity-40 ${
                      matchDone.has(right)
                        ? "border-[var(--success)] bg-[#f0faf5] text-[var(--success)]"
                        : matchShake === right
                          ? "border-[var(--error)] bg-[#fdf4f4] text-[var(--error)]"
                          : "border-[var(--border)] bg-white hover:border-[var(--brand)]"
                    }`}
                  >
                    {right}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 결과 피드백 */}
      {answered && (
        <div
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            correct ? "bg-[#e8f7ef] text-[var(--success)]" : "bg-[#fdf4f4] text-[var(--error)]"
          }`}
          aria-live="polite"
        >
          <p className="font-bold">{correct ? "맞아요!" : "이렇게 볼 수도 있어요"}</p>
          {!correct && shownAnswer && (
            <p className="mt-0.5 font-semibold">정답 · {shownAnswer}</p>
          )}
          {quiz.why && <p className="mt-1 text-[var(--foreground-muted)]">{quiz.why}</p>}
        </div>
      )}
    </div>
  );
}
