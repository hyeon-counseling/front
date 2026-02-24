import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* 브랜드명 */}
          <div>
            <p className="text-sm font-semibold text-[var(--brand)]">
              Hyeon Counseling
            </p>
            <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
              Psychological knowledge for everyday wellbeing
            </p>
          </div>

          {/* 푸터 링크 */}
          <nav className="flex items-center gap-4">
            <Link
              href="/shop"
              className="text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
            >
              Shop
            </Link>
            <Link
              href="/login"
              className="text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
            >
              Login
            </Link>
          </nav>
        </div>

        {/* 저작권 */}
        <p className="mt-6 text-center text-xs text-[var(--foreground-subtle)]">
          &copy; {currentYear} Hyeon Counseling. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
