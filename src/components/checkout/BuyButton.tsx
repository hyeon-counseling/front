"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { startPurchase, type ItemType } from "@/lib/payment";
import { cx } from "@/components/ui";

/** 구매하기 버튼 — 로그인 확인 → 주문 생성 → 결제 페이지로 이동 */
export function BuyButton({
  itemType,
  slug,
  label = "구매하기",
  className,
  variant = "primary",
}: {
  itemType: ItemType;
  slug: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    setError("");
    const r = await startPurchase(itemType, slug);
    if (r.checkoutUrl) router.push(r.checkoutUrl);
    else if (r.owned) router.push(r.owned);
    else {
      setError(r.error ?? "");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy}
        className={cx(
          "flex h-12 w-full cursor-pointer items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-60",
          variant === "primary"
            ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
            : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
          className
        )}
      >
        {busy ? "주문 준비 중…" : user ? label : "로그인하고 구매하기"}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}
