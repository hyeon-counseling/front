"use client";

import Link from "next/link";

// 더미 구매 내역 데이터 (실제 API 연결 전 임시 데이터)
const DUMMY_PURCHASES = [
  {
    id: "order_001",
    bookTitle: "Understanding Anxiety",
    purchasedAt: "2026-02-10",
    price: 12.0,
    status: "Delivered",
  },
  {
    id: "order_002",
    bookTitle: "Emotional Boundaries",
    purchasedAt: "2026-01-28",
    price: 11.0,
    status: "Delivered",
  },
];

export default function MyPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* 페이지 헤더 */}
        <div className="mb-10">
          <h1 className="mb-1 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            My Page
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            View and download your purchased e-books
          </p>
        </div>

        {/* 구매 내역 섹션 */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Purchase History
          </h2>

          {DUMMY_PURCHASES.length === 0 ? (
            /* 구매 내역 없을 때 */
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10 text-center">
              <p className="mb-4 text-[var(--foreground-muted)]">
                No purchases yet.
              </p>
              <Link
                href="/shop"
                className="inline-block rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                Browse E-Books
              </Link>
            </div>
          ) : (
            /* 구매 내역 목록 */
            <div className="space-y-3">
              {DUMMY_PURCHASES.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* 책 정보 */}
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {purchase.bookTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                      Purchased on {purchase.purchasedAt} &middot; $
                      {purchase.price.toFixed(2)}
                    </p>
                  </div>

                  {/* 상태 + 다운로드 버튼 */}
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
                      {purchase.status}
                    </span>
                    <button
                      className="rounded-full border border-[var(--brand)] px-4 py-1.5 text-xs font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
                      onClick={() =>
                        alert("Download functionality coming soon.")
                      }
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 계정 섹션 */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Account
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-sm text-[var(--foreground-muted)]">
              Signed in as{" "}
              <span className="font-medium text-[var(--foreground)]">
                user@example.com
              </span>
            </p>
            <button
              className="mt-3 text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:underline"
              onClick={() => alert("Logout functionality coming soon.")}
            >
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
