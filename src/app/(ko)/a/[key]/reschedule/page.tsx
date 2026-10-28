"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { assessRequest, deadlineText, kstParts, type ProgressView, type SlotView } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";

/**
 * 일정 재조정 (/a/:key/reschedule) — N7 [새 일정 고르기]. 공개 슬롯 중 하나를 다시 고르면
 * 새 상담일 7일 전이 새 검사 마감이 되고, 이미 마친 검사는 그대로 인정된다.
 */
export default function ReschedulePage() {
  const { key } = useParams<{ key: string }>();
  const { view, setView, needsVerify, error, reload } = useProgress(key);
  const [slots, setSlots] = useState<SlotView[] | null>(null);
  const [fromText, setFromText] = useState("");
  const [slotId, setSlotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiRequest<{ fromText: string; slots: SlotView[] }>("/api/assessment/slots").then((r) => {
      setSlots(r.ok && r.data ? r.data.slots : []);
      setFromText(r.data?.fromText ?? "");
    });
  }, []);

  const days = useMemo(() => {
    const map = new Map<string, SlotView[]>();
    for (const s of slots ?? []) {
      if (view && !s.methods.includes(view.method)) continue;
      const k = kstParts(s.startsAt).dateKey;
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots, view]);

  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!view) return <Skeleton className="mx-auto my-14 h-64 max-w-lg" />;

  const picked = slots?.find((s) => s.id === slotId);
  const submit = async () => {
    setBusy(true);
    setMsg("");
    const r = await assessRequest<ProgressView>(key, "/reschedule", { method: "POST", body: JSON.stringify({ slotId }) });
    setBusy(false);
    if (r.ok && r.data) {
      setView(r.data);
      setDone(true);
    } else setMsg(r.message || "바꾸지 못했어요. 다른 시간을 골라 주세요.");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)] text-3xl text-[var(--brand)]">✓</div>
        <h1 className="mt-5 text-2xl font-bold text-[var(--foreground)]">새 일정으로 바꿨어요</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          해석 상담 <b>{view.sessionText}</b>
          <br />새 검사 마감 {view.testDeadlineText} 밤 12시
        </p>
        <Link href={`/a/${key}`} className="mt-8 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
          내 진행 상황 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl text-[var(--foreground)]">해석 상담 일정 다시 고르기</h1>
        {view.hold !== "reschedule" ? (
          <p className="mt-4 rounded-2xl bg-[var(--surface)] p-5 text-sm text-[var(--foreground-muted)]">지금은 일정을 바꿀 수 없어요. 바꿔야 하면 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
              이미 마친 검사는 그대로 인정돼요. 새 해석 상담일의 7일 전이 새 검사 마감일이 돼요. {fromText && `${fromText}부터 고를 수 있어요.`}
            </p>
            {!slots ? (
              <Skeleton className="mt-6 h-40" />
            ) : days.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--foreground-muted)]">아직 열린 시간이 없어요. 카카오톡 채널로 알려 주시면 맞춰 드릴게요.</p>
            ) : (
              <div className="mt-6 space-y-2">
                {days.map(([k, list]) => (
                  <div key={k} className="flex items-start gap-3 rounded-xl border border-[var(--border-light)] p-3">
                    <p className="w-20 shrink-0 pt-2.5 text-sm font-bold">{kstParts(list[0].startsAt).dayText}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((s) => (
                        <button
                          key={s.id}
                          disabled={!s.available}
                          onClick={() => setSlotId(s.id)}
                          aria-pressed={s.id === slotId}
                          className={cx(
                            "h-11 min-w-[5.5rem] rounded-xl px-3 text-sm font-semibold",
                            !s.available ? "cursor-not-allowed bg-[var(--surface)] text-[var(--foreground-subtle)] line-through" : s.id === slotId ? "cursor-pointer bg-[var(--brand)] text-white" : "cursor-pointer border border-[var(--border)] bg-white"
                          )}
                        >
                          {s.available ? kstParts(s.startsAt).timeText : "마감"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {picked && (
              <p className="mt-4 rounded-xl bg-[var(--brand-light)] px-4 py-3 text-sm">
                새 일정: <b>{kstParts(picked.startsAt).dayText} {kstParts(picked.startsAt).timeText}</b> · 검사 마감 {deadlineText(picked.startsAt)} 밤 12시
              </p>
            )}
            {msg && <p className="mt-3 text-sm text-[var(--error)]">{msg}</p>}
            <button onClick={submit} disabled={!slotId || busy} className="mt-6 h-14 w-full cursor-pointer rounded-xl bg-[var(--brand)] text-lg font-bold text-white disabled:opacity-50">
              {busy ? "바꾸는 중…" : "이 일정으로 바꾸기"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
