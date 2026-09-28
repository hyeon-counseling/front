"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────
// 어드민 사이드바 (S1 재배치)
//   대시보드 / LMS / 워크북 / 결제 / 회원 / 콘텐츠 / 알림 / Shop(기존 카페24·Polar) / 설정
// LMS·워크북·결제는 자리만 (S2~S4에서 채움).
// ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  soon?: boolean;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  if (item.soon) {
    return (
      <span className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--foreground-subtle)]">
        {item.label}
        <span className="text-[10px] uppercase tracking-wider">soon</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-[var(--brand-light)] font-medium text-[var(--brand)]" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">{children}</p>;
}

function Collapsible({ label, defaultOpen, children }: { label: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-5 mb-1 flex w-full cursor-pointer items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)]"
      >
        <span>{label}</span>
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
      </button>
      {open && children}
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const inShop = pathname.startsWith("/admin/shop");

  return (
    <aside className="shrink-0 border-b border-[var(--border)] px-3 py-4 lg:w-60 lg:border-b-0 lg:border-r lg:py-8">
      <nav className="flex flex-col lg:sticky lg:top-24">
        <NavLink item={{ label: "대시보드", href: "/admin" }} />

        <SectionLabel>학습</SectionLabel>
        <NavLink item={{ label: "강의 (LMS)", href: "/admin/lms/courses" }} />
        <NavLink item={{ label: "과정 (과목 묶음)", href: "/admin/lms/programs" }} />
        <NavLink item={{ label: "워크북", href: "/admin/workbooks" }} />
        <NavLink item={{ label: "질문 답변", href: "/admin/questions" }} />

        <SectionLabel>운영</SectionLabel>
        <NavLink item={{ label: "결제·주문", href: "/admin/payments" }} />
        <NavLink item={{ label: "쿠폰", href: "/admin/coupons" }} />
        <NavLink item={{ label: "심리검사", href: "/admin/tests" }} />
        <NavLink item={{ label: "검사 결과", href: "/admin/test-results" }} />
        <NavLink item={{ label: "회원", href: "/admin/users" }} />
        <NavLink item={{ label: "콘텐츠(아티클)", href: "/admin/common/contents" }} />

        <SectionLabel>알림</SectionLabel>
        <NavLink item={{ label: "이메일 템플릿", href: "/admin/email-templates" }} />
        <NavLink item={{ label: "카카오 템플릿", href: "/admin/kakao-templates" }} />

        {/* Shop — 기존 카페24·Polar 관리 (기능 변경 없음) */}
        <Collapsible label="Shop · 한국어 쇼핑몰(카페24)" defaultOpen={inShop || true}>
          <NavLink item={{ label: "상품", href: "/admin/shop/kr/products" }} />
          <NavLink item={{ label: "주문", href: "/admin/shop/kr/orders" }} />
          <NavLink item={{ label: "고객", href: "/admin/shop/kr/customers" }} />
          <NavLink item={{ label: "예약 캘린더", href: "/admin/shop/kr/calendar" }} />
        </Collapsible>
        <Collapsible label="Shop · 영어 쇼핑몰(Polar)" defaultOpen={pathname.startsWith("/admin/shop/en")}>
          <NavLink item={{ label: "상품", href: "/admin/shop/en/products" }} />
          <NavLink item={{ label: "주문", href: "/admin/shop/en/orders" }} />
        </Collapsible>

        <SectionLabel>설정</SectionLabel>
        <NavLink item={{ label: "설정", href: "/admin/common/settings" }} />
      </nav>
    </aside>
  );
}
