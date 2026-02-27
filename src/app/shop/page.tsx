"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// 백엔드 상품 데이터 타입
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  language: "ko" | "en" | "both";
  isActive: boolean;
  coverImageUrl?: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // GET /api/products — 활성화된 상품 전체 목록
        const data = await apiFetch("/api/products");
        setProducts(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "상품 목록을 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* 페이지 헤더 */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            Our E-Books
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Thoughtfully written psychology resources to support your growth
          </p>
        </div>

        {/* 로딩 중 스켈레톤 */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-[var(--surface)]"
              />
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10 text-center">
            <p className="text-[var(--foreground-muted)]">{error}</p>
          </div>
        )}

        {/* 상품 없음 */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10 text-center">
            <p className="text-[var(--foreground-muted)]">
              No e-books available yet. Check back soon!
            </p>
          </div>
        )}

        {/* 상품 카드 목록 */}
        {!loading && !error && products.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/shop/${product._id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-shadow hover:shadow-md"
              >
                {/* 커버 이미지 영역 */}
                {product.coverImageUrl ? (
                  <img
                    src={product.coverImageUrl}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-[#3d6b5e] flex items-center justify-center">
                    {/* 책 아이콘 플레이스홀더 */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                )}

                {/* 텍스트 영역 */}
                <div className="flex flex-col flex-1 p-6">
                  {/* 언어 태그 */}
                  <span className="mb-3 inline-block self-start rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {product.language === "ko"
                      ? "Korean"
                      : product.language === "en"
                        ? "English"
                        : "KO / EN"}
                  </span>

                  {/* 제목 */}
                  <h2 className="mb-3 flex-1 text-lg font-semibold text-[var(--foreground)]">
                    {product.title}
                  </h2>

                  {/* 설명 (최대 2줄) */}
                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {product.description}
                  </p>

                  {/* 가격 + 버튼 */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[var(--foreground)]">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-medium text-white transition-colors group-hover:bg-[var(--brand-hover)]">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
