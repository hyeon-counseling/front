"use client";

import Link from "next/link";
import { couponBenefit, type CouponView } from "@/lib/payment";

/** 수료 축하 쿠폰 안내 — 수료 쿠폰이 설정된 강의를 처음 수료했을 때 */
export function RewardModal({ coupon, onClose }: { coupon: CouponView; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-label="수료 축하 쿠폰">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-xl">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">수료를 축하해요!</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          꾸준히 해낸 나에게 주는 선물이에요.
          <br />
          다음 강의를 <strong className="text-[var(--brand)]">{couponBenefit(coupon)}</strong>받을 수 있는 쿠폰을 드려요.
        </p>
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--brand)] bg-[var(--brand-light)] px-4 py-3">
          <p className="font-mono text-sm font-bold text-[var(--brand-ink)]">{coupon.code}</p>
          {coupon.validUntil && <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{new Date(coupon.validUntil).toLocaleDateString("ko-KR")}까지</p>}
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="h-11 flex-1 cursor-pointer rounded-xl bg-[var(--surface)] text-sm font-semibold">닫기</button>
          <Link href="/my/coupons" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-semibold text-white">쿠폰함 보기</Link>
        </div>
      </div>
    </div>
  );
}
