"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest, type RefundQuote } from "@/lib/assessment";
import { Skeleton } from "@/components/ui";
import { RefundRules } from "@/components/assessment/RefundRules";
import { VerifyGate } from "@/components/assessment/VerifyGate";

/**
 * 취소 요청 (/a/:key/cancel) — 마이페이지 → 심리검사 진행 → 취소 요청
 * ① 지금 취소하면 예상 환불액과 근거 구간 ② 사유(선택) ③ 「취소 요청」 한 번 더 확인 → 요청됨
 * 금액은 서버가 규정대로 계산하고, 상담가가 확인해 확정한다.
 */
interface QuoteRes {
  quote: RefundQuote;
  requestedAt: string | null;
  request: { reason: string; quoteAmount: number } | null;
  closed: string | null;
  refund: { amount: number; processedAt: string } | null;
}
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default function CancelPage() {
  const { key } = useParams<{ key: string }>();
  const [data, setData] = useState<QuoteRes | null>(null);
  const [verify, setVerify] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    assessRequest<QuoteRes & { needsVerify?: boolean; nameHint?: string }>(key, "/cancel").then((r) => {
      if (r.ok && r.data) {
        setData(r.data);
        setVerify(null);
      } else if (r.status === 403 && r.data?.needsVerify) setVerify(r.data.nameHint ?? "");
      else setError(r.message || "불러오지 못했어요.");
    });
  }, [key, tick]);

  if (verify !== null) return <VerifyGate linkKey={key} nameHint={verify} onDone={() => setTick((t) => t + 1)} />;
  if (error && !data) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!data) return <Skeleton className="mx-auto my-14 h-72 max-w-lg" />;

  const back = (
    <Link href={`/a/${key}`} className="mt-8 inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold">
      내 진행 상황으로
    </Link>
  );

  if (data.closed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{data.closed === "refunded" ? "환불 처리가 끝났어요" : "취소가 끝났어요"}</h1>
        {data.refund && data.refund.amount > 0 && <p className="mt-2 text-[var(--foreground-muted)]">환불 {won(data.refund.amount)} · 결제한 수단으로 영업일 3~5일 안에 들어가요.</p>}
        {back}
      </div>
    );
  }

  if (data.requestedAt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)] text-3xl text-[var(--brand)]">✓</div>
        <h1 className="mt-5 text-2xl font-bold text-[var(--foreground)]">취소 요청을 받았어요</h1>
        <p className="mt-2 leading-relaxed text-[var(--foreground-muted)]">
          {data.request && data.request.quoteAmount > 0 ? `예상 환불 ${won(data.request.quoteAmount)} · ` : ""}김태현 심리상담가가 확인한 뒤 결제한 수단으로 영업일 3~5일 안에 처리해 드려요. 그동안 진행 안내는 보내지 않아요.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground-subtle)]">마음이 바뀌었다면 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>
        {back}
      </div>
    );
  }

  const q = data.quote;
  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await assessRequest<{ quote: RefundQuote }>(key, "/cancel", { method: "POST", body: JSON.stringify({ reason }) });
    setBusy(false);
    if (r.ok) setTick((t) => t + 1);
    else setError(r.message || "요청하지 못했어요. 잠시 뒤 다시 해 주세요.");
  };

  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl text-[var(--foreground)]">취소 요청</h1>

        <section className="card mt-6 p-6">
          <p className="text-sm font-semibold text-[var(--foreground-subtle)]">지금 취소하면</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">{q.tier === "free" ? "환불 없음" : q.amount > 0 ? `${won(q.amount)} 환불` : "환불 없음"}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--brand)]">{q.label}</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{q.reason}</p>
          {q.ifStarted !== null && <p className="mt-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground-muted)]">이미 검사를 시작했다면 {won(q.ifStarted)}이에요. 상담가가 확인해서 확정해요.</p>}
          {q.tier !== "free" && <p className="mt-2 text-xs text-[var(--foreground-subtle)]">결제 금액 {won(q.paid)} 기준 · 상담가가 확인한 뒤 확정돼요.</p>}
        </section>

        <details className="mt-4 rounded-2xl border border-[var(--border-light)] bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">취소·환불 규정 전체 보기</summary>
          <div className="mt-4">
            <RefundRules highlight={q.tier} />
          </div>
        </details>

        <section className="mt-6">
          <label htmlFor="cancel-reason" className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
            취소하려는 이유 <span className="text-xs font-normal text-[var(--foreground-subtle)]">선택</span>
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="예: 일정이 맞지 않아요 / 지금은 다른 도움이 먼저일 것 같아요"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 leading-relaxed focus:border-[var(--brand)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">일정만 바꾸고 싶다면 취소하지 않고 카카오톡 채널로 알려 주세요. 상담 3일 전까지 1회 무료로 바꿀 수 있어요.</p>
        </section>

        {error && <p className="mt-4 text-sm text-[var(--error)]">{error}</p>}

        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="mt-6 h-14 w-full cursor-pointer rounded-xl border-2 border-[var(--error)] text-lg font-bold text-[var(--error)] hover:bg-red-50">
            취소 요청하기
          </button>
        ) : (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-[var(--foreground)]">정말 취소를 요청할까요?</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">요청하면 진행 안내가 멈추고, 상담가가 확인해 환불을 처리해요. 잡아 둔 상담 시간도 풀려요.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirm(false)} className="h-12 flex-1 cursor-pointer rounded-xl bg-white font-semibold">
                돌아가기
              </button>
              <button onClick={submit} disabled={busy} className="h-12 flex-1 cursor-pointer rounded-xl bg-[var(--error)] font-bold text-white disabled:opacity-60">
                {busy ? "요청 중…" : "취소 요청"}
              </button>
            </div>
          </div>
        )}
        <div className="text-center">{back}</div>
      </div>
    </div>
  );
}
