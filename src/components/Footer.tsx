import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* 메인 푸터 링크 영역 */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">

          {/* 브랜드 */}
          <div>
            <p className="text-sm font-semibold text-[var(--brand)]">Hyeon Counseling</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-subtle)]">
              Psychological knowledge for everyday wellbeing
            </p>
            <div className="mt-4 space-y-1">
              <Link
                href="/shop"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Shop
              </Link>
              <Link
                href="/about"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                About
              </Link>
              <Link
                href="/login"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Login
              </Link>
            </div>
          </div>

          {/* 법적 페이지 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Legal</p>
            <div className="space-y-2">
              <Link
                href="/privacy"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Refund Policy
              </Link>
            </div>
          </div>

          {/* 지원 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Support</p>
            <div className="space-y-2">
              <Link
                href="/faq"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                Contact Us
              </Link>
              <a
                href="mailto:support@hyeoncounseling.com"
                className="block text-xs text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
              >
                support@hyeoncounseling.com
              </a>
            </div>
          </div>

        </div>

        {/* 구분선 */}
        <div className="my-8 border-t border-[var(--border)]" />

        {/* 회사 정보 */}
        <div className="mb-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
          <p>Hyeon Counseling &nbsp;|&nbsp; 16, Sangdo-ro 15da-gil, Dongjak-gu, Seoul 06951, Republic of Korea</p>
          <p className="mt-1">Business Registration No. 185-25-02396</p>
        </div>

        {/* 면책 고지 */}
        <p className="mb-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
          All content is for educational purposes only and does not constitute medical or therapeutic advice.
        </p>

        {/* 저작권 */}
        <p className="text-xs text-[var(--foreground-subtle)]">
          &copy; {currentYear} Hyeon Counseling. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
