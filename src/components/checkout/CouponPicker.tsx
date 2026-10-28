"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { couponBenefit, couponConditions, won, type CheckoutOrder, type OrderCoupon } from "@/lib/payment";
import { Modal, cx } from "@/components/ui";

/**
 * 결제 페이지 쿠폰 — 「내 쿠폰 선택」 중심 (10/29 상담가 요청)
 *   [내 쿠폰 선택] → 시트에 내 쿠폰함: 이 상품에 쓸 수 있는 것 위(혜택·대상·기한·할인 후 금액), 못 쓰는 것 아래 회색(이유)
 *   하나 고르면 바로 적용(서버가 금액 다시 계산), 다시 누르면 해제. 선물로 받은 쿠폰도 쿠폰함이라 함께 나온다.
 *   쓸 수 있는 쿠폰이 있으면 배지로 알려 주지만 자동 적용은 하지 않는다.
 *   쿠폰 코드는 아래 「쿠폰 코드가 있나요?」에서 (외부에 배포한 코드용).
 */
export function CouponPicker({ order, onChange }: { order: CheckoutOrder; onChange: (o: CheckoutOrder) => void }) {
  const [coupons, setCoupons] = useState<OrderCoupon[] | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiRequest<OrderCoupon[]>(`/api/payments/orders/${order.orderId}/coupons`).then((r) => setCoupons(r.ok && r.data ? r.data : []));
  }, [order.orderId]);
  useEffect(load, [load]);

  const base = order.originalAmount ?? order.amount + (order.discountAmount ?? 0);
  const usable = coupons?.filter((c) => c.usable) ?? [];
  const unusable = coupons?.filter((c) => !c.usable) ?? [];
  const applied = order.coupon?.code ?? null;

  const apply = async (body: { code?: string; couponId?: string }) => {
    setBusy(true);
    setError("");
    const res = await apiRequest<CheckoutOrder>(`/api/payments/orders/${order.orderId}/coupon`, { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.message || "쿠폰을 적용하지 못했어요.");
      return false;
    }
    onChange(res.data);
    setOpen(false);
    setCode("");
    load();
    return true;
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    const res = await apiRequest<CheckoutOrder>(`/api/payments/orders/${order.orderId}/coupon`, { method: "DELETE" });
    setBusy(false);
    if (res.ok && res.data) {
      onChange(res.data);
      load();
    } else setError(res.message || "쿠폰을 빼지 못했어요.");
  };

  return (
    <div className="card mt-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">쿠폰</h2>
        {applied ? (
          <span className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-[var(--brand)]">-{won(order.discountAmount ?? 0)} 적용됨</span>
            <button onClick={() => setOpen(true)} className="cursor-pointer font-semibold text-[var(--foreground)] underline underline-offset-2">
              바꾸기
            </button>
            <button onClick={remove} disabled={busy} className="cursor-pointer text-[var(--foreground-subtle)] underline underline-offset-2 hover:text-[var(--foreground)]">
              빼기
            </button>
          </span>
        ) : (
          <button onClick={() => setOpen(true)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
            내 쿠폰 선택
            {usable.length > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--brand)]">사용 가능 {usable.length}장</span>}
          </button>
        )}
      </div>
      {!applied && coupons && usable.length === 0 && <p className="mt-2 text-xs text-[var(--foreground-subtle)]">쓸 수 있는 쿠폰이 없어요.</p>}

      {/* 쿠폰 코드 — 외부에 배포한 코드용, 작게 접어 둠 */}
      <div className="mt-3 border-t border-[var(--border-light)] pt-3">
        <button onClick={() => setCodeOpen((v) => !v)} aria-expanded={codeOpen} className="cursor-pointer text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
          쿠폰 코드가 있나요? {codeOpen ? "▲" : "▼"}
        </button>
        {codeOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void apply({ code });
            }}
            className="mt-2 flex gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="쿠폰 코드 입력"
              aria-label="쿠폰 코드"
              className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm uppercase focus:border-[var(--brand)] focus:outline-none"
            />
            <button type="submit" disabled={busy || !code.trim()} className="h-10 shrink-0 cursor-pointer rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white disabled:opacity-40">
              적용
            </button>
          </form>
        )}
      </div>

      {error && !open && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="내 쿠폰">
        {!coupons ? (
          <p className="text-sm text-[var(--foreground-muted)]">불러오는 중…</p>
        ) : coupons.length === 0 ? (
          <p className="rounded-xl bg-[var(--surface)] p-5 text-center text-sm text-[var(--foreground-muted)]">쿠폰함에 쿠폰이 없어요. 쿠폰 코드가 있다면 결제 화면 아래 「쿠폰 코드가 있나요?」에 넣어 주세요.</p>
        ) : (
          <div className="space-y-4">
            <section>
              <p className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">이 상품에 쓸 수 있어요 · {usable.length}장</p>
              {usable.length === 0 ? (
                <p className="rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">쓸 수 있는 쿠폰이 없어요.</p>
              ) : (
                <ul className="space-y-2">
                  {usable.map((c) => {
                    const on = applied === c.code;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => (on ? remove().then(() => setOpen(false)) : apply({ couponId: c.id }))}
                          disabled={busy}
                          aria-pressed={on}
                          className={cx(
                            "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition",
                            on ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-[var(--border-light)] hover:border-[var(--brand)]"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block font-semibold text-[var(--foreground)]">{c.name}</span>
                            <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
                              {couponBenefit(c)}
                              {couponConditions(c) && ` · ${couponConditions(c)}`}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-bold text-[var(--brand)]">-{won(c.discount)}</span>
                            <span className="block text-xs text-[var(--foreground-subtle)]">{won(Math.max(0, base - c.discount))} 결제</span>
                            <span className={cx("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", on ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)]")}>
                              {on ? "선택됨 · 해제" : "선택"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            {unusable.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">이 상품에는 못 써요 · {unusable.length}장</p>
                <ul className="space-y-2">
                  {unusable.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 opacity-70">
                      <span className="block text-sm font-semibold text-[var(--foreground-muted)]">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-[var(--foreground-subtle)]">
                        {couponBenefit(c)}
                        {couponConditions(c) && ` · ${couponConditions(c)}`}
                      </span>
                      {c.reason && <span className="mt-0.5 block text-xs font-medium text-[var(--foreground-muted)]">{c.reason}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
