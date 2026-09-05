"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────
// 한국어 사이트 헤더 — 흰 바탕·굵은 로고·둥근 CTA (한국형 SaaS 톤)
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

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${
      isActive(pathname, href)
        ? "text-[var(--foreground)] bg-[var(--surface)]"
        : "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={linkCls(n.href)}>
                {n.label}
              </Link>
            ))}
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
                내 학습
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
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-[0.95rem] font-medium ${isActive(pathname, n.href) ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}
            >
              {n.label}
            </Link>
          ))}
          <div className="my-2 border-t border-[var(--border-light)]" />
          {loading ? null : user ? (
            <>
              <Link href="/my" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-[0.95rem] font-medium text-[var(--foreground)]">
                내 학습
              </Link>
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
