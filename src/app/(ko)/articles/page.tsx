"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui";

// 한국어 아티클 목록 — GET /api/contents?lang=ko
interface ContentItem {
  _id: string;
  title: string;
  category: string;
  summary: string;
  createdAt: string;
}

export default function ArticlesPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contents?lang=ko`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "불러오기 실패");
        setItems(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "아티클을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = Array.from(new Set(items.map((c) => c.category).filter(Boolean)));
  const filtered = active === "all" ? items : items.filter((c) => c.category === active);

  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow mb-4">아티클</p>
        <h1 className="font-display text-4xl leading-tight text-[var(--brand-ink)] sm:text-5xl">읽으면서 시작하기</h1>
        <p className="mt-4 max-w-2xl text-[var(--foreground-muted)]">누구나 무료로 읽는 심리 지식. 짧고, 근거 있고, 오늘 써볼 수 있는 이야기.</p>

        {!loading && !error && categories.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active === c ? "bg-[var(--brand)] text-white" : "border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {c === "all" ? "전체" : c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52" />)}
            </div>
          )}
          {!loading && error && <EmptyState title="잠시 후 다시 시도해 주세요" description={error} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="아직 아티클이 없어요" description="한국어 아티클을 준비하고 있습니다. 곧 만나요." />
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, i) => (
                <Link
                  key={item._id}
                  href={`/articles/${item._id}`}
                  className={`group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] rise rise-${Math.min(i + 1, 5)}`}
                >
                  {item.category && <span className="eyebrow mb-3">{item.category}</span>}
                  <h2 className="font-display mb-3 flex-1 text-xl leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{item.title}</h2>
                  {item.summary && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{item.summary}</p>}
                  <p className="mt-auto text-xs text-[var(--foreground-subtle)]">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
