import { STAGES } from "@/lib/assessment";

/**
 * 종합심리검사 8단계 진행 표시 — 지난 단계 ✓, 지금 단계 강조, 보류(재조정·안전 확인)는 지금 단계에 표시.
 * compact: 목록 카드용 한 줄 막대.
 */
export function StageTracker({ stage, hold, compact }: { stage: number; hold?: string; compact?: boolean }) {
  const holdText = hold === "safety" ? "안전 확인 중" : hold === "reschedule" ? "일정 재조정 필요" : "";

  if (compact) {
    return (
      <div className="mt-5">
        <div className="flex gap-1" aria-hidden="true">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i + 1 < stage ? "bg-[var(--brand)]" : i + 1 === stage ? (holdText ? "bg-[var(--warning)]" : "bg-[var(--brand)]") : "bg-[var(--surface-muted)]"}`}
            />
          ))}
        </div>
        <p className="sr-only">
          8단계 중 {stage}단계 {STAGES[stage - 1]}
          {holdText && ` · ${holdText}`}
        </p>
      </div>
    );
  }

  return (
    <ol className="mt-2 space-y-0" aria-label="진행 단계">
      {STAGES.map((label, i) => {
        const n = i + 1;
        const done = n < stage;
        const now = n === stage;
        return (
          <li key={label} className="relative flex gap-4 pb-5 last:pb-0" aria-current={now ? "step" : undefined}>
            {n < STAGES.length && (
              <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${done ? "bg-[var(--brand)]" : "bg-[var(--border-light)]"}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done
                  ? "bg-[var(--brand)] text-white"
                  : now
                    ? holdText
                      ? "bg-[var(--warning)] text-white ring-4 ring-amber-100"
                      : "bg-[var(--brand)] text-white ring-4 ring-[var(--brand-light)]"
                    : "bg-[var(--surface)] text-[var(--foreground-subtle)]"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-[0.95rem] ${now ? "font-bold text-[var(--foreground)]" : done ? "text-[var(--foreground-muted)]" : "text-[var(--foreground-subtle)]"}`}>{label}</p>
              {now && holdText && <p className="mt-0.5 text-xs font-semibold text-[var(--warning)]">{holdText}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
