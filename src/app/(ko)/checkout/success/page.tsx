"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { won, type OrderSummary } from "@/lib/payment";

/**
 * 결제 성공 콜백 — 토스와 같은 successUrl?paymentKey&orderId&amount
 * 서버에 승인(confirm)을 요청하고, 서버가 금액을 다시 확인한 뒤 이용권을 발급한다.
 * ?free=1&orderId= : 쿠폰으로 0원이 된 주문 — 결제 없이 완료 처리(/orders/:id/free)
 */
function SuccessInner() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const sent = useRef(false);
  const [result, setResult] = useState<{ ok: true; order: OrderSummary } | { ok: false; message: string; retry?: string } | null>(null);

  useEffect(() => {
    if (loading || !user || sent.current) return;
    sent.current = true; // 새로고침·재렌더에서 중복 승인 요청 방지 (서버도 멱등 처리)
    const orderId = params.get("orderId") ?? "";
    const req =
      params.get("free") === "1"
        ? apiRequest<OrderSummary>(`/api/payments/orders/${encodeURIComponent(orderId)}/free`, { method: "POST" })
        : apiRequest<OrderSummary>("/api/payments/confirm", {
            method: "POST",
            body: JSON.stringify({ paymentKey: params.get("paymentKey") ?? "", orderId, amount: Number(params.get("amount")) }),
          });
    req.then((res) => {
      if (res.ok && res.data) return setResult({ ok: true, order: res.data });
      // 결제 직전에 쿠폰을 못 쓰게 된 경우 — 주문은 그대로, 결제 페이지로 돌아가 쿠폰을 빼고 다시
      const couponGone = (res.data as { reason?: string } | null)?.reason === "coupon_unavailable";
      setResult({ ok: false, message: res.message || "결제 승인에 실패했어요.", retry: couponGone ? `/checkout/${orderId}` : undefined });
    });
  }, [loading, user, params]);

  if (!loading && !user) {
    return <p className="text-[var(--foreground-muted)]">로그인이 필요해요.</p>;
  }
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-light)] border-t-[var(--brand)]" />
        <p className="font-semibold text-[var(--foreground)]">결제를 확인하고 있어요…</p>
        <p className="text-sm text-[var(--foreground-subtle)]">창을 닫지 말고 잠시만 기다려 주세요.</p>
      </div>
    );
  }
  if (!result.ok) {
    return (
      <>
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">결제를 완료하지 못했어요</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{result.message}</p>
        <p className="mt-1 text-sm text-[var(--foreground-subtle)]">금액이 빠져나갔다면 자동으로 취소되거나, 문의해 주시면 바로 확인해 드려요.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {result.retry && (
            <Link href={result.retry} className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">결제 페이지로 돌아가기</Link>
          )}
          <Link href="/my/orders" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold">주문 내역 보기</Link>
        </div>
      </>
    );
  }
  const o = result.order;
  return (
    <>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)] text-3xl text-[var(--brand)]">✓</div>
      <h1 className="mt-5 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{o.amount === 0 ? "쿠폰으로 이용권을 받았어요" : "결제가 완료되었어요"}</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">
        {o.itemTitle} · {won(o.amount)}
        {(o.discountAmount ?? 0) > 0 && ` (쿠폰 -${won(o.discountAmount)})`}
        {o.provider === "mock" && " (테스트 결제)"}
      </p>
      {o.amount > 0 && <p className="mt-1 text-sm text-[var(--foreground-subtle)]">영수증을 이메일로 보내 드렸어요.</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={o.itemPath} className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-7 font-semibold text-white hover:bg-[var(--brand-hover)]">
          바로 시작하기
        </Link>
        <Link href="/my" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
          내 학습
        </Link>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Suspense fallback={null}>
        <SuccessInner />
      </Suspense>
    </div>
  );
}
