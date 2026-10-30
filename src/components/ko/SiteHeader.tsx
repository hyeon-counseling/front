"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SHOW_COUNSELING, SHOW_COURSES } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────
// 한국어 사이트 헤더 — 흰 바탕·굵은 로고·둥근 CTA (한국형 SaaS 톤)
// ─────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; children?: { href: string; label: string; desc?: string }[]; match?: string[] };

const NAV: NavItem[] = [
  { href: "/courses", label: "강의" },
  {
    href: "/assessment",
    label: "심리검사",
    match: ["/assessment", "/tests", "/a"],
    children: [
      { href: "/assessment", label: "전문 심리검사", desc: "TCI · MMPI-3 · SCT + 해석 상담" },
      { href: "/tests", label: "간이 무료 심리검사", desc: "지금 바로 해 보는 자가 검사" },
    ],
  },
  { href: "/counseling", label: "상담" },
  { href: "/articles", label: "아티클" },
  { href: "/about", label: "소개" },
];

/** 당분간 숨긴 메뉴(lib/site.ts)는 관리자에게만 */
function visibleNav(admin: boolean): NavItem[] {
  return NAV.filter((n) => admin || ((SHOW_COURSES || n.href !== "/courses") && (SHOW_COUNSELING || n.href !== "/counseling")));
}

/** 마이페이지 하위 메뉴 — 상담을 숨긴 동안(lib/site.ts) 「심리상담 현황」은 관리자에게만 */
export function myNav(admin: boolean) {
  return MY_NAV.filter((m) => admin || SHOW_COUNSELING || m.href !== "/my/counseling");
}

/** 마이페이지 하위 메뉴 (모바일 메뉴에서도 씀) */
export const MY_NAV = [
  { href: "/my", label: "내 학습" },
  { href: "/my/assessment", label: "심리검사 진행" },
  { href: "/my/counseling", label: "심리상담 현황" },
  { href: "/my/orders", label: "주문 내역" },
  { href: "/my/coupons", label: "쿠폰함" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function itemActive(pathname: string, n: NavItem) {
  return (n.match ?? [n.href]).some((h) => isActive(pathname, h));
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)] text-base font-extrabold text-white">
        현
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-[var(--foreground)]">심리상담실 현</span>
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = visibleNav(user?.role === "admin");

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  const linkCls = (href: string, n?: NavItem) =>
    `rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${
      (n ? itemActive(pathname, n) : isActive(pathname, href))
        ? "text-[var(--foreground)] bg-[var(--surface)]"
        : "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) =>
              n.children ? (
                <div key={n.href} className="group relative">
                  <Link href={n.href} className={`${linkCls(n.href, n)} inline-flex items-center gap-1`} aria-haspopup="true">
                    {n.label}
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="opacity-50 transition-transform group-hover:rotate-180 group-focus-within:rotate-180">
                      <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  {/* 하위 메뉴 — 마우스를 올리거나 키보드로 들어오면 열림 */}
                  <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="w-64 rounded-2xl border border-[var(--border-light)] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                      {n.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--surface)] ${isActive(pathname, c.href) ? "bg-[var(--surface)]" : ""}`}
                        >
                          <span className="block text-[0.92rem] font-semibold text-[var(--foreground)]">{c.label}</span>
                          {c.desc && <span className="mt-0.5 block text-xs text-[var(--foreground-subtle)]">{c.desc}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={n.href} href={n.href} className={linkCls(n.href)}>
                  {n.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className={linkCls("/admin")}>
                  관리자
                </Link>
              )}
              <Link
                href="/my"
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                마이페이지
              </Link>
              <button onClick={handleLogout} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                무료로 시작하기
              </Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="flex cursor-pointer flex-col gap-1.5 rounded-lg p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <span className={`block h-0.5 w-5 rounded bg-[var(--foreground)] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 rounded bg-[var(--foreground)] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 rounded bg-[var(--foreground)] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-[var(--border-light)] bg-white px-3 py-3 md:hidden">
          {nav.map((n) => (
            <div key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-[0.95rem] font-medium ${itemActive(pathname, n) ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}
              >
                {n.label}
              </Link>
              {n.children?.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className={`ml-4 block rounded-xl px-4 py-2.5 text-sm ${isActive(pathname, c.href) ? "font-semibold text-[var(--brand)]" : "text-[var(--foreground-muted)]"}`}
                >
                  · {c.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="my-2 border-t border-[var(--border-light)]" />
          {loading ? null : user ? (
            <>
              <Link href="/my" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-[0.95rem] font-medium text-[var(--foreground)]">
                마이페이지
              </Link>
              {myNav(user.role === "admin").map((m) => (
                <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className="ml-4 block rounded-xl px-4 py-2.5 text-sm text-[var(--foreground-muted)]">
                  · {m.label}
                </Link>
              ))}
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-[0.95rem] text-[var(--foreground-muted)]">
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-sm text-[var(--foreground-subtle)]">
                로그아웃
              </button>
            </>
          ) : (
            <div className="flex gap-2 px-1 pt-1">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-medium">
                로그인
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-3 text-center text-sm font-semibold text-white">
                무료로 시작하기
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
