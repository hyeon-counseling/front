"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { METHOD_LABEL, won, type CheckoutOrder } from "@/lib/payment";
import { Skeleton } from "@/components/ui";
import { CouponPicker } from "@/components/checkout/CouponPicker";

/**
 * 결제 페이지 — 토스 결제위젯이 들어갈 자리.
 * 지금(mock)은 결제수단 선택 → [결제하기] → 서버가 결제키 발급 → 토스와 같은 successUrl 로 이동.
 * 쿠폰을 적용하면 서버가 금액을 다시 계산하고, 0원이 되면 [무료로 받기] → success?free=1 에서 완료 처리.
 *
 * 전문 심리검사 주문은 결제하지 않고 이 화면을 떠나면(뒤로가기·다른 메뉴) 신청을 바로 취소해 상담 시간을 푼다 (10/29 상담가).
 * 창을 닫거나 새로고침해서 알 수 없을 때는 서버가 10분 뒤 자동 취소한다. [결제하기]·[쿠폰으로 신청 완료]로 넘어갈 때는 취소하지 않는다.
 */
// 개발 모드는 화면을 한 번 붙였다 떼었다 다시 붙인다 — 떼는 순간 바로 보내지 않고 잠깐 기다렸다가 보낸다
const pendingLeave = new Map<string, ReturnType<typeof setTimeout>>();
function leaveCheckout(orderId: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessment/checkout/${encodeURIComponent(orderId)}/leave`, {
    method: "POST",
    keepalive: true,
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}
export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("card");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  // 결제·쿠폰 완료로 넘어가는 중이면 true — 이때 화면이 떠나도 취소하지 않는다
  const proceeding = useRef(false);
  const leaveWatch = order?.itemType === "assessment" && order.status === "pending";

  useEffect(() => {
    if (!leaveWatch) return;
    const t = pendingLeave.get(orderId);
    if (t) clearTimeout(t);
    pendingLeave.delete(orderId);
    return () => {
      if (proceeding.current) return;
      pendingLeave.set(
        orderId,
        setTimeout(() => {
          pendingLeave.delete(orderId);
          leaveCheckout(orderId);
        }, 300)
      );
    };
  }, [leaveWatch, orderId]);

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
    proceeding.current = true;
    const res = await apiRequest<{ paymentKey: string; orderId: string; amount: number }>("/api/payments/mock/authorize", {
      method: "POST",
      body: JSON.stringify({ orderId: order.orderId, method }),
    });
    if (!res.ok || !res.data) {
      proceeding.current = false;
      setError(res.message || "결제를 시작하지 못했어요.");
      setBusy(false);
      return;
    }
    const q = new URLSearchParams({ paymentKey: res.data.paymentKey, orderId: res.data.orderId, amount: String(res.data.amount) });
    router.push(`/checkout/success?${q}`);
  };

  const claimFree = () => {
    if (!order) return;
    proceeding.current = true;
    router.push(`/checkout/success?${new URLSearchParams({ free: "1", orderId: order.orderId })}`);
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
  const free = order.amount === 0 && !!order.coupon;
  // 전문 심리검사는 지금 쿠폰으로만 신청을 마칠 수 있다 (카드 결제 창구 준비 중) — 관리자만 테스트 결제 가능
  const couponOnly = order.itemType === "assessment" && user?.role !== "admin";
  const methods = order.checkout.mode === "mock" ? order.checkout.methods : [];

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg">
        {isMock && !couponOnly && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <strong>테스트 결제입니다.</strong> 실제로 돈이 결제되지 않아요. 결제 흐름을 시험하기 위한 화면이에요.
          </div>
        )}

        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">결제하기</h1>

        <div className="card mt-6 p-6">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">{order.itemType === "course" ? "강의" : order.itemType === "program" ? "과정 · 과목 묶음" : order.itemType === "assessment" ? "전문 심리검사 · 해석 상담 포함" : "셀프 워크북 · 전체 이용권"}</p>
          <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{order.itemTitle}</p>
          {(order.discountAmount ?? 0) > 0 && (
            <div className="mt-5 space-y-1.5 border-t border-[var(--border-light)] pt-4 text-sm">
              <div className="flex justify-between text-[var(--foreground-muted)]">
                <span>상품 금액</span>
                <span>{won(order.originalAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[var(--brand)]">
                <span>쿠폰 할인</span>
                <span>-{won(order.discountAmount)}</span>
              </div>
            </div>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-[var(--border-light)] pt-4">
            <span className="text-[var(--foreground-muted)]">결제 금액</span>
            <span className="text-2xl font-extrabold text-[var(--foreground)]">{won(order.amount)}</span>
          </div>
          <p className="mt-2 text-right text-xs text-[var(--foreground-subtle)]">주문번호 {order.orderId}</p>
        </div>

        <CouponPicker order={order} onChange={setOrder} />

        {free ? null : couponOnly ? (
          <div className="mt-8 rounded-2xl bg-[var(--brand-light)] p-5 text-sm leading-relaxed text-[var(--foreground)]">
            <strong>지금은 쿠폰으로 신청을 마칠 수 있어요.</strong>
            <br />
            받으신 쿠폰을 위 <b>쿠폰</b> 칸에서 고르거나 코드를 넣어 주세요. 고른 상담 시간은 30분 동안 잡아 둬요.
          </div>
        ) : isMock ? (
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
          onClick={free ? claimFree : pay}
          disabled={!agree || busy || (!isMock && !free) || (couponOnly && !free)}
          className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "결제 중…" : free ? (order.itemType === "assessment" ? "쿠폰으로 신청 완료하기" : "쿠폰으로 무료로 받기") : `${won(order.amount)} 결제하기`}
        </button>

        {isMock && !free && !couponOnly && (
          <button onClick={simulateFail} className="mt-3 w-full cursor-pointer text-center text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
            실패로 처리해 보기 (테스트)
          </button>
        )}
      </div>
    </div>
  );
}
