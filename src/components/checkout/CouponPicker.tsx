"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { couponBenefit, couponConditions, won, type CheckoutOrder, type OrderCoupon } from "@/lib/payment";
import { cx } from "@/components/ui";

/**
 * 결제 페이지 쿠폰 — 내 쿠폰(쓸 수 있는 것 먼저, 할인액 표시) 고르기 + 코드 직접 입력 + 빼기
 * 적용·해제하면 서버가 금액을 다시 계산한 주문을 onChange로 돌려준다.
 */
export function CouponPicker({ order, onChange }: { order: CheckoutOrder; onChange: (o: CheckoutOrder) => void }) {
  const [coupons, setCoupons] = useState<OrderCoupon[] | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    apiRequest<OrderCoupon[]>(`/api/payments/orders/${order.orderId}/coupons`).then((r) => setCoupons(r.ok && r.data ? r.data : []));
  }, [order.orderId]);
  useEffect(load, [load]);

  const apply = async (body: { code?: string; couponId?: string }) => {
    setBusy(true);
    setError("");
    const res = await apiRequest<CheckoutOrder>(`/api/payments/orders/${order.orderId}/coupon`, { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.message || "쿠폰을 적용하지 못했어요.");
      return;
    }
    setCode("");
    setOpen(false);
    onChange(res.data);
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    const res = await apiRequest<CheckoutOrder>(`/api/payments/orders/${order.orderId}/coupon`, { method: "DELETE" });
    setBusy(false);
    if (res.ok && res.data) onChange(res.data);
    else setError(res.message || "쿠폰을 빼지 못했어요.");
  };

  const usable = coupons?.filter((c) => c.usable) ?? [];
  const applied = order.coupon?.code;

  return (
    <div className="card mt-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">쿠폰</h2>
        {applied ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[var(--brand)]">{applied} · -{won(order.discountAmount ?? 0)}</span>
            <button onClick={remove} disabled={busy} className="cursor-pointer text-[var(--foreground-subtle)] underline underline-offset-2 hover:text-[var(--foreground)]">
              빼기
            </button>
          </span>
        ) : (
          <button onClick={() => setOpen((v) => !v)} className="cursor-pointer text-sm font-semibold text-[var(--brand)]">
            {usable.length ? `사용 가능 ${usable.length}장 ${open ? "▲" : "▼"}` : open ? "닫기 ▲" : "코드 입력 ▼"}
          </button>
        )}
      </div>

      {!applied && usable.length > 0 && !open && (
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          최대 {won(usable[0].discount)} 할인받을 수 있어요.{" "}
          <button onClick={() => apply({ couponId: usable[0].id })} disabled={busy} className="cursor-pointer font-semibold text-[var(--brand)] underline underline-offset-2">
            바로 적용
          </button>
        </p>
      )}

      {!applied && open && (
        <div className="mt-4 space-y-2">
          {coupons?.map((c) => (
            <button
              key={c.id}
              onClick={() => c.usable && apply({ couponId: c.id })}
              disabled={!c.usable || busy}
              className={cx(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                c.usable ? "cursor-pointer border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)]" : "cursor-not-allowed border-[var(--border-light)] opacity-60"
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--foreground)]">{c.name}</span>
                <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
                  {couponBenefit(c)}
                  {couponConditions(c) && ` · ${couponConditions(c)}`}
                </span>
                {!c.usable && c.reason && <span className="mt-0.5 block text-xs text-[var(--error)]">{c.reason}</span>}
              </span>
              {c.usable && <span className="shrink-0 text-sm font-bold text-[var(--brand)]">-{won(c.discount)}</span>}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void apply({ code });
            }}
            className="flex gap-2 pt-1"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="쿠폰 코드 입력"
              aria-label="쿠폰 코드"
              className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm uppercase focus:border-[var(--brand)] focus:outline-none"
            />
            <button type="submit" disabled={busy || !code.trim()} className="h-11 shrink-0 cursor-pointer rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white disabled:opacity-40">
              적용
            </button>
          </form>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}
