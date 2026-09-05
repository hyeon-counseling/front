"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────
// 한국어 사이트 헤더 — 로고(명조) · 메뉴 · 로그인/마이
// ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: "/courses", label: "강의" },
  { href: "/workbooks", label: "워크북" },
  { href: "/counseling", label: "상담" },
  { href: "/articles", label: "아티클" },
  { href: "/about", label: "소개" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const linkCls = (href: string) =>
    `text-sm transition-colors hover:text-[var(--brand)] ${
      isActive(pathname, href) ? "text-[var(--brand)] font-medium" : "text-[var(--foreground-muted)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {/* 로고 */}
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-[var(--brand-ink)] transition-opacity group-hover:opacity-80">
            심리상담실 현
          </span>
          <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-[var(--foreground-subtle)] sm:inline">
            Hyeon Counseling
          </span>
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={linkCls(n.href)}>
              {n.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-[var(--border)]" />
          {loading ? null : user ? (
            <>
              <Link href="/my" className={linkCls("/my")}>
                내 학습
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className={linkCls("/admin")}>
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className="cursor-pointer text-sm text-[var(--foreground-subtle)] hover:text-[var(--brand)]">
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[var(--brand)] px-4 py-1.5 text-sm font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
            >
              로그인
            </Link>
          )}
        </nav>

        {/* 모바일 햄버거 */}
        <button
          className="flex cursor-pointer flex-col gap-1.5 p-1 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <span className={`block h-0.5 w-5 bg-[var(--foreground)] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--foreground)] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--foreground)] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <nav className="border-t border-[var(--border)] bg-[var(--background)] px-2 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm ${isActive(pathname, n.href) ? "bg-[var(--brand-light)] text-[var(--brand)]" : "text-[var(--foreground-muted)]"}`}
            >
              {n.label}
            </Link>
          ))}
          <div className="my-2 border-t border-[var(--border-light)]" />
          {loading ? null : user ? (
            <>
              <Link href="/my" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm text-[var(--foreground-muted)]">
                내 학습
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm text-[var(--foreground-muted)]">
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-[var(--foreground-subtle)]">
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-[var(--brand)]">
              로그인 · 회원가입
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
