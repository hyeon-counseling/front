"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MY_NAV } from "@/components/ko/SiteHeader";

// ─────────────────────────────────────────────────────────────────
// 마이페이지 공통 — 하위 메뉴 탭 (내 학습 · 심리검사 진행 · 심리상담 현황 · 주문 내역 · 쿠폰함)
// 강의 기록처럼 깊은 화면에서는 탭을 숨긴다.
// ─────────────────────────────────────────────────────────────────
export default function MyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const deep = pathname.startsWith("/my/courses/");
  const active = (href: string) => (href === "/my" ? pathname === "/my" : pathname === href || pathname.startsWith(href + "/"));

  if (deep) return <>{children}</>;
  return (
    <>
      <div className="border-b border-[var(--border-light)] bg-white">
        <nav aria-label="마이페이지 메뉴" className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 sm:px-6">
          {MY_NAV.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              aria-current={active(m.href) ? "page" : undefined}
              className={`relative shrink-0 px-3 py-3.5 text-sm font-semibold transition-colors ${
                active(m.href) ? "text-[var(--foreground)]" : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              }`}
            >
              {m.label}
              {active(m.href) && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--brand)]" />}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </>
  );
}
