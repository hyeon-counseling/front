"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  // 로그아웃 처리 후 홈으로 이동
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  // 로그인 상태에 따라 오른쪽 메뉴 구성
  // - 초기 복원 중(loading): 아무것도 안 보여서 깜빡임 방지
  // - 로그인 전: Login 링크
  // - 로그인 후: My Page + (관리자면 Admin) + Logout 버튼
  const authLinks = loading ? null : user ? (
    <>
      <Link
        href="/mypage"
        className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
          pathname === "/mypage"
            ? "text-[var(--brand)]"
            : "text-[var(--foreground-muted)]"
        }`}
      >
        My Page
      </Link>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
            pathname === "/admin"
              ? "text-[var(--brand)]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Admin
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="cursor-pointer text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--brand)]"
      >
        Logout
      </button>
    </>
  ) : (
    <Link
      href="/login"
      className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
        pathname === "/login"
          ? "text-[var(--brand)]"
          : "text-[var(--foreground-muted)]"
      }`}
    >
      Login
    </Link>
  );

  // 모바일 메뉴용 동일 구성
  const mobileAuthLinks = loading ? null : user ? (
    <>
      <Link
        href="/mypage"
        onClick={() => setMenuOpen(false)}
        className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
          pathname === "/mypage"
            ? "text-[var(--brand)]"
            : "text-[var(--foreground-muted)]"
        }`}
      >
        My Page
      </Link>
      {user.role === "admin" && (
        <Link
          href="/admin"
          onClick={() => setMenuOpen(false)}
          className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
            pathname === "/admin"
              ? "text-[var(--brand)]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Admin
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="block w-full cursor-pointer px-6 py-3 text-left text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)]"
      >
        Logout
      </button>
    </>
  ) : (
    <Link
      href="/login"
      onClick={() => setMenuOpen(false)}
      className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
        pathname === "/login"
          ? "text-[var(--brand)]"
          : "text-[var(--foreground-muted)]"
      }`}
    >
      Login
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        {/* 로고 */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-[var(--brand)] transition-opacity hover:opacity-80"
        >
          Hyeon Counseling
        </Link>

        {/* 데스크톱 내비게이션 */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
              pathname === "/"
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
              pathname === "/shop" || pathname.startsWith("/shop/")
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Shop
          </Link>
          <Link
            href="/content"
            className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
              pathname === "/content" || pathname.startsWith("/content/")
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Articles
          </Link>
          {authLinks}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="flex cursor-pointer flex-col gap-1.5 p-1 sm:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 bg-[var(--foreground)] transition-transform ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[var(--foreground)] transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[var(--foreground)] transition-transform ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <nav className="border-t border-[var(--border)] bg-[var(--background)] sm:hidden">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
              pathname === "/"
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMenuOpen(false)}
            className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
              pathname === "/shop" || pathname.startsWith("/shop/")
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Shop
          </Link>
          <Link
            href="/content"
            onClick={() => setMenuOpen(false)}
            className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
              pathname === "/content" || pathname.startsWith("/content/")
                ? "text-[var(--brand)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            Articles
          </Link>
          {mobileAuthLinks}
        </nav>
      )}
    </header>
  );
}
