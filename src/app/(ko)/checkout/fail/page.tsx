"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { OrderSummary } from "@/lib/payment";

/** 결제 실패·취소 콜백 — 토스와 같은 failUrl?code&message&orderId */
function FailInner() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const sent = useRef(false);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const message = params.get("message") || "결제가 완료되지 않았어요.";

  useEffect(() => {
    if (loading || !user || sent.current) return;
    sent.current = true;
    const orderId = params.get("orderId");
    if (!orderId) return;
    apiRequest<OrderSummary>("/api/payments/fail", {
      method: "POST",
      body: JSON.stringify({ orderId, code: params.get("code"), message }),
    }).then((res) => res.ok && res.data && setOrder(res.data));
  }, [loading, user, params, message]);

  return (
    <>
      <p className="text-4xl">🙁</p>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">결제가 완료되지 않았어요</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">{message}</p>
      <p className="mt-1 text-sm text-[var(--foreground-subtle)]">결제된 금액은 없어요. 다시 시도하거나 다른 결제 수단을 선택해 주세요.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {order?.itemPath && (
          <Link href={order.itemPath} className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
            다시 시도하기
          </Link>
        )}
        <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
          홈으로
        </Link>
      </div>
    </>
  );
}

export default function CheckoutFailPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Suspense fallback={null}>
        <FailInner />
      </Suspense>
    </div>
  );
}
