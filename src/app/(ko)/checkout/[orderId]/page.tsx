"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { METHOD_LABEL, won, type CheckoutOrder } from "@/lib/payment";
import { Skeleton } from "@/components/ui";

/**
 * 결제 페이지 — 토스 결제위젯이 들어갈 자리.
 * 지금(mock)은 결제수단 선택 → [결제하기] → 서버가 결제키 발급 → 토스와 같은 successUrl 로 이동.
 */
export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("card");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/checkout/${orderId}`);
      return;
    }
    apiRequest<CheckoutOrder>(`/api/payments/orders/${orderId}`).then((res) => {
      if (res.ok && res.data) setOrder(res.data);
      else setError(res.message || "주문을 찾을 수 없어요.");
    });
  }, [loading, user, orderId, router]);

  const pay = async () => {
    if (!order) return;
    setBusy(true);
    setError("");
    const res = await apiRequest<{ paymentKey: string; orderId: string; amount: number }>("/api/payments/mock/authorize", {
      method: "POST",
      body: JSON.stringify({ orderId: order.orderId, method }),
    });
    if (!res.ok || !res.data) {
      setError(res.message || "결제를 시작하지 못했어요.");
      setBusy(false);
      return;
    }
    const q = new URLSearchParams({ paymentKey: res.data.paymentKey, orderId: res.data.orderId, amount: String(res.data.amount) });
    router.push(`/checkout/success?${q}`);
  };

  const simulateFail = () => {
    if (!order) return;
    const q = new URLSearchParams({ code: "PAY_PROCESS_CANCELED", message: "결제를 취소했어요.", orderId: order.orderId });
    router.push(`/checkout/fail?${q}`);
  };

  if (error && !order) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href="/my/orders" className="link-underline mt-4 inline-block text-sm">주문 내역으로</Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (order.status !== "pending") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {order.status === "paid" ? "이미 결제가 끝난 주문이에요" : "진행할 수 없는 주문이에요"}
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{order.itemTitle}</p>
        <Link href={order.itemPath} className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
          {order.status === "paid" ? "바로 시작하기" : "상품 페이지로"}
        </Link>
      </div>
    );
  }

  const isMock = order.checkout.mode === "mock";
  const methods = order.checkout.mode === "mock" ? order.checkout.methods : [];

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg">
        {isMock && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <strong>테스트 결제입니다.</strong> 실제로 돈이 결제되지 않아요. 결제 흐름을 시험하기 위한 화면이에요.
          </div>
        )}

        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">결제하기</h1>

        <div className="card mt-6 p-6">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">{order.itemType === "course" ? "강의" : "셀프 워크북 · 전체 이용권"}</p>
          <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{order.itemTitle}</p>
          <div className="mt-5 flex items-center justify-between border-t border-[var(--border-light)] pt-4">
            <span className="text-[var(--foreground-muted)]">결제 금액</span>
            <span className="text-2xl font-extrabold text-[var(--foreground)]">{won(order.amount)}</span>
          </div>
          <p className="mt-2 text-right text-xs text-[var(--foreground-subtle)]">주문번호 {order.orderId}</p>
        </div>

        {isMock ? (
          <>
            <h2 className="mt-8 text-sm font-bold text-[var(--foreground)]">결제 수단</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`h-14 cursor-pointer rounded-xl text-sm font-semibold transition-colors ${method === m ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"}`}
                >
                  {METHOD_LABEL[m] ?? m}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-2xl bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
            토스페이먼츠 결제창 연결을 준비하고 있어요.
          </div>
        )}

        <label className="mt-8 flex cursor-pointer items-start gap-3 text-sm text-[var(--foreground-muted)]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>
            주문 내용을 확인했고, <Link href="/refund" className="underline" target="_blank">환불 규정</Link>과{" "}
            <Link href="/terms" className="underline" target="_blank">이용약관</Link>에 동의해요. 디지털 콘텐츠는 이용을 시작하면 환불이 제한될 수 있어요.
          </span>
        </label>

        {error && <p className="mt-4 text-sm text-[var(--error)]">{error}</p>}

        <button
          onClick={pay}
          disabled={!agree || busy || !isMock}
          className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "결제 중…" : `${won(order.amount)} 결제하기`}
        </button>

        {isMock && (
          <button onClick={simulateFail} className="mt-3 w-full cursor-pointer text-center text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
            실패로 처리해 보기 (테스트)
          </button>
        )}
      </div>
    </div>
  );
}
