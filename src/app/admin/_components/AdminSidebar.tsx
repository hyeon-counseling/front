"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────
// 어드민 사이드바 — 채널 우선(한국어/영어/공통) 2단 메뉴
//
// 영어(Polar) 쇼핑몰은 당분간 비활성이라 접이식으로 축소 표시한다.
// ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  // /admin은 정확 일치, 그 외 섹션은 startsWith로 활성 판정
  const active =
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-[var(--brand-light)] font-medium text-[var(--brand)]"
          : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
      {children}
    </p>
  );
}

export default function AdminSidebar() {
  // 영어 쇼핑몰은 비활성이라 기본 접힘
  const [enOpen, setEnOpen] = useState(false);

  return (
    <aside className="shrink-0 border-b border-[var(--border)] px-3 py-4 lg:w-60 lg:border-b-0 lg:border-r lg:py-8">
      <nav className="flex flex-col lg:sticky lg:top-24">
        <NavLink item={{ label: "대시보드", href: "/admin" }} />

        {/* 한국어 쇼핑몰 (카페24) — 집중 영역 */}
        <SectionLabel>한국어 쇼핑몰 · 카페24</SectionLabel>
        <NavLink item={{ label: "상품", href: "/admin/kr/products" }} />
        <NavLink item={{ label: "주문", href: "/admin/kr/orders" }} />
        <NavLink item={{ label: "고객", href: "/admin/kr/customers" }} />
        <NavLink item={{ label: "예약 캘린더", href: "/admin/kr/calendar" }} />

        {/* 영어 쇼핑몰 (Polar) — 당분간 비활성, 접이식 */}
        <button
          type="button"
          onClick={() => setEnOpen((v) => !v)}
          className="mt-5 mb-1 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)]"
        >
          <span>영어 쇼핑몰 · Polar</span>
          <span className="text-[10px]">{enOpen ? "▼" : "▶"}</span>
        </button>
        {enOpen && (
          <>
            <NavLink item={{ label: "상품", href: "/admin/en/products" }} />
            <NavLink item={{ label: "주문", href: "/admin/en/orders" }} />
          </>
        )}

        {/* 공통 */}
        <SectionLabel>공통</SectionLabel>
        <NavLink item={{ label: "콘텐츠", href: "/admin/common/contents" }} />
        <NavLink item={{ label: "이메일 템플릿", href: "/admin/email-templates" }} />
        <NavLink item={{ label: "카카오 템플릿", href: "/admin/kakao-templates" }} />
        <NavLink item={{ label: "설정", href: "/admin/common/settings" }} />
      </nav>
    </aside>
  );
}
