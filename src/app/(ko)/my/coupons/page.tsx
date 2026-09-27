"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { couponBenefit, couponConditions, type MyCoupon } from "@/lib/payment";
import { EmptyState, Skeleton, cx } from "@/components/ui";

const STATE_LABEL: Record<MyCoupon["state"], string> = {
  available: "사용 가능",
  used: "사용함",
  expired: "기간 만료",
  disabled: "사용 중지",
};

// 내 쿠폰함 — 쓸 수 있는 쿠폰과 지난 쿠폰. 쿠폰은 결제 페이지에서 고르면 바로 적용된다.
export default function MyCouponsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [list, setList] = useState<MyCoupon[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my/coupons");
      return;
    }
    apiRequest<MyCoupon[]>("/api/my/coupons").then((r) => setList(r.ok && r.data ? r.data : []));
  }, [loading, user, router]);

  const available = list?.filter((c) => c.state === "available") ?? [];
  const past = list?.filter((c) => c.state !== "available") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/my" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← 내 학습</Link>
      <h1 className="font-display mt-3 text-3xl text-[var(--foreground)]">쿠폰함</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">결제 페이지에서 쿠폰을 고르면 할인된 금액으로 결제돼요.</p>

      {!list ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="아직 받은 쿠폰이 없어요" description="워크북을 95% 이상 완주하면 다음 워크북 할인 쿠폰을 드려요." />
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-sm font-bold text-[var(--foreground)]">사용 가능 {available.length}장</h2>
          <ul className="mt-3 space-y-3">
            {available.map((c) => (
              <CouponCard key={c.id} c={c} />
            ))}
            {available.length === 0 && <li className="text-sm text-[var(--foreground-muted)]">지금 쓸 수 있는 쿠폰이 없어요.</li>}
          </ul>
          {past.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-bold text-[var(--foreground-subtle)]">지난 쿠폰</h2>
              <ul className="mt-3 space-y-3">
                {past.map((c) => (
                  <CouponCard key={c.id} c={c} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CouponCard({ c }: { c: MyCoupon }) {
  const active = c.state === "available";
  return (
    <li className={cx("flex overflow-hidden rounded-2xl border", active ? "border-[var(--brand)]/40 bg-white" : "border-[var(--border-light)] bg-[var(--surface)] opacity-70")}>
      <div className={cx("flex w-28 shrink-0 flex-col items-center justify-center px-2 text-center", active ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)]")}>
        <span className="text-xl font-extrabold leading-tight">
          {c.discountType === "percent" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString("ko-KR")}원`}
        </span>
        <span className="mt-0.5 text-xs">할인</span>
      </div>
      <div className="min-w-0 flex-1 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[var(--foreground)]">{c.name}</p>
          <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", active ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-white text-[var(--foreground-subtle)]")}>
            {STATE_LABEL[c.state]}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          {couponBenefit(c)}
          {couponConditions(c) && ` · ${couponConditions(c)}`}
        </p>
        <p className="mt-1 font-mono text-xs text-[var(--foreground-subtle)]">{c.code}</p>
      </div>
    </li>
  );
}
