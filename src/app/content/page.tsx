"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// 백엔드 콘텐츠 데이터 타입 (목록용 — body 필드 없음)
interface ContentItem {
  _id: string;
  title: string;
  category: string;
  summary: string;
  isPublished: boolean;
  createdAt: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchContents = async () => {
      try {
        // GET /api/contents — 발행된 콘텐츠 목록 (인증 불필요)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/contents`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "불러오기 실패");
        setContents(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "콘텐츠를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, []);

  // 고유 카테고리 목록 추출 (빈 문자열 제외)
  const categories = Array.from(
    new Set(contents.map((c) => c.category).filter(Boolean))
  );

  // 카테고리 필터링
  const filtered =
    activeCategory === "all"
      ? contents
      : contents.filter((c) => c.category === activeCategory);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* 페이지 헤더 */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            Articles
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Psychology insights and self-growth resources from Hyeon Counseling
          </p>
        </div>

        {/* 카테고리 필터 버튼 */}
        {!loading && !error && categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-[var(--brand)] text-white"
                  : "border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 로딩 중 스켈레톤 */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl bg-[var(--surface)]"
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

        {/* 콘텐츠 없음 */}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10 text-center">
            <p className="text-[var(--foreground-muted)]">
              {activeCategory === "all"
                ? "No articles available yet. Check back soon!"
                : `No articles in "${activeCategory}" category.`}
            </p>
          </div>
        )}

        {/* 콘텐츠 카드 목록 */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <Link
                key={item._id}
                href={`/content/${item._id}`}
                className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-shadow hover:shadow-md"
              >
                {/* 카테고리 뱃지 */}
                {item.category && (
                  <span className="mb-3 inline-block self-start rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {item.category}
                  </span>
                )}

                {/* 제목 */}
                <h2 className="mb-3 flex-1 text-lg font-semibold leading-snug text-[var(--foreground)]">
                  {item.title}
                </h2>

                {/* 미리보기 텍스트 */}
                {item.summary && (
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {item.summary}
                  </p>
                )}

                {/* 작성일 */}
                <p className="mt-auto text-xs text-[var(--foreground-subtle)]">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
