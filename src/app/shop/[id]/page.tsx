"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  polarProductId?: string;   // Polar.sh에 등록된 상품 ID
  coverImageUrl?: string;
}

// 주문 목록에서 필요한 최소 타입
interface OrderSummary {
  _id: string;
  productId: { _id: string } | null;
  status: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

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

  // 로그인 상태이면 구매 여부 확인 — 이미 구매한 경우 버튼 대신 안내 문구 표시
  useEffect(() => {
    if (!user || !id) return;

    const checkPurchased = async () => {
      try {
        const orders: OrderSummary[] = await apiFetch("/api/orders/my");
        const purchased = orders.some(
          (order) =>
            order.status === "paid" &&
            String(order.productId?._id) === id
        );
        setAlreadyPurchased(purchased);
      } catch {
        // 조회 실패 시 구매 여부 확인 생략 — 기존 구매 버튼 표시
      }
    };

    checkPurchased();
  }, [user, id]);

  const [isPurchasing, setIsPurchasing] = useState(false);

  // 구매 버튼 클릭 처리
  const handlePurchase = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!product) return;

    if (!product.polarProductId) {
      alert("This product is not yet available for purchase. Please contact us.");
      return;
    }

    setIsPurchasing(true);
    try {
      // 백엔드에서 Polar 체크아웃 세션 생성 → URL 반환
      const data = await apiFetch(`/api/products/${product._id}/checkout`, {
        method: "POST",
      });
      // 반환된 Polar 결제 URL로 이동
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "결제 페이지를 열 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setIsPurchasing(false);
    }
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
          {/* 커버 이미지 */}
          {product.coverImageUrl ? (
            <img
              src={product.coverImageUrl}
              alt={product.title}
              className="mb-8 w-full max-h-80 object-contain rounded-2xl"
            />
          ) : (
            <div className="mb-8 w-full h-64 bg-[#3d6b5e] rounded-2xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
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

          {/* 설명 — 마크다운 렌더링 */}
          <div className="mb-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 mt-8 text-2xl font-bold text-[var(--foreground)]">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-7 text-lg font-bold text-[var(--foreground)]">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-5 text-base font-semibold text-[var(--foreground)]">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-7 text-[var(--foreground-muted)]">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[var(--foreground-muted)]">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[var(--foreground-muted)]">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-7">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-[var(--foreground-muted)]">{children}</em>
                ),
                hr: () => <hr className="my-6 border-[var(--border)]" />,
                blockquote: ({ children }) => (
                  <blockquote className="mb-4 rounded-r-xl border-l-4 border-[var(--brand)] bg-[var(--surface)] py-3 pl-4 pr-4 italic text-[var(--foreground-muted)]">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-[var(--foreground-muted)]">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left font-semibold text-[var(--foreground)]">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-[var(--border)] px-3 py-2">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--brand)] underline hover:opacity-80">
                    {children}
                  </a>
                ),
              }}
            >
              {product.description}
            </ReactMarkdown>
          </div>

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

          {/* 저자 정보 */}
          <div className="mb-8 rounded-xl bg-[var(--surface)] p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              About the Author
            </h2>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-base text-white">
                &#129504;
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">Hyeon</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className="inline-block rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">
                    M.A. Counseling &amp; Psychotherapy
                  </span>
                  <span className="inline-block rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">
                    B.A. Youth Counseling
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                  A licensed psychological counselor and author based in Seoul, South Korea.
                  Holds a Master&apos;s degree in Counseling and Psychotherapy and a Bachelor&apos;s degree in
                  Youth Counseling. Specializes in translating evidence-based psychological frameworks
                  — including CBT — into practical, accessible guides for everyday self-understanding.
                </p>
              </div>
            </div>
          </div>

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
            {alreadyPurchased ? (
              /* 이미 구매한 상품 — 마이페이지 안내 링크 표시 */
              <Link
                href="/mypage"
                className="text-sm font-medium text-[#3d6b5e] hover:underline"
              >
                Already purchased &mdash; Go to My Page &rarr;
              </Link>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isPurchasing
                  ? "Redirecting..."
                  : user
                    ? `Purchase — $${product.price.toFixed(2)}`
                    : "Sign in to Purchase"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
