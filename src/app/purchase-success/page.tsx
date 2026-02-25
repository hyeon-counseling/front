"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * 결제 완료 후 Polar가 리다이렉트하는 중간 페이지.
 * 인증 불필요 — 로그인 여부와 관계없이 접근 가능.
 *
 * 동작:
 *  1. 페이지 로드 즉시 hyeonapp://purchase-success 딥링크 시도
 *  2. 앱이 설치되어 있으면 Flutter 앱이 열리며 마이페이지로 이동
 *  3. 앱이 없거나 웹 브라우저만 사용하는 경우 → 이 페이지에서 안내
 */
export default function PurchaseSuccessPage() {
  useEffect(() => {
    // 딥링크로 앱 복귀 시도
    window.location.href = "hyeonapp://purchase-success";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
        Purchase Complete!
      </h1>
      <p className="mb-8 max-w-sm text-sm text-[var(--foreground-muted)]">
        Returning to the app… If the app doesn&apos;t open automatically,
        please go to My Page to download your e-book.
      </p>

      <Link
        href="/mypage"
        className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
      >
        Go to My Page
      </Link>
    </div>
  );
}
