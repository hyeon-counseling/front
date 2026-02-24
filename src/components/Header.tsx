"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/login", label: "Login" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
                pathname === link.href
                  ? "text-[var(--brand)]"
                  : "text-[var(--foreground-muted)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="flex flex-col gap-1.5 p-1 sm:hidden"
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)] hover:text-[var(--brand)] ${
                pathname === link.href
                  ? "text-[var(--brand)]"
                  : "text-[var(--foreground-muted)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
