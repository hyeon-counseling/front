"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// 백엔드 상품 상세 타입
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  language: "ko" | "en" | "both";
  pdfFiles: { filename: string; r2Key: string }[];
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params.id as string;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // GET /api/products/:id — 상품 상세 조회
        const data = await apiFetch(`/api/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "상품 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // 구매 버튼 클릭 처리
  const handlePurchase = () => {
    if (!user) {
      // 로그인 안 된 상태 → 로그인 페이지로 이동
      router.push("/login");
      return;
    }
    // 로그인된 상태 → Polar.sh 체크아웃 페이지로 이동
    // (NEXT_PUBLIC_POLAR_PRODUCT_ID는 .env.local에서 관리)
    const polarProductId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID;
    window.location.href = `https://polar.sh/checkout/products/${polarProductId}`;
  };

  // 로딩 중 스켈레톤
  if (loading) {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface)]" />
        </div>
      </div>
    );
  }

  // 상품 없음 또는 에러
  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg text-[var(--foreground-muted)]">
            {error || "Book not found."}
          </p>
          <Link
            href="/shop"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* 뒤로가기 */}
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
        >
          &larr; Back to Shop
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 sm:p-10">
          {/* 언어 태그 */}
          <span className="mb-4 inline-block rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
            {product.language === "ko"
              ? "Korean"
              : product.language === "en"
                ? "English"
                : "KO / EN"}
          </span>

          {/* 제목 */}
          <h1 className="mb-6 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {product.title}
          </h1>

          {/* 설명 */}
          <p className="mb-8 leading-relaxed text-[var(--foreground-muted)]">
            {product.description}
          </p>

          {/* PDF 파일 목록 (있을 때만 표시) */}
          {product.pdfFiles && product.pdfFiles.length > 0 && (
            <div className="mb-8 rounded-xl bg-[var(--surface)] p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Included Files
              </h2>
              <ul className="space-y-2">
                {product.pdfFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
                  >
                    <span className="text-[var(--brand)]">&#x2022;</span>
                    {file.filename}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 구분선 */}
          <div className="mb-6 border-t border-[var(--border)]" />

          {/* 가격 + 구매 버튼 */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[var(--foreground-subtle)]">Price</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handlePurchase}
              className="w-full rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)] sm:w-auto"
            >
              {user
                ? `Purchase — $${product.price.toFixed(2)}`
                : "Sign in to Purchase"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
