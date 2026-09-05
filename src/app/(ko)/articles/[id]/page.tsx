"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui";

interface ContentDetail {
  _id: string;
  title: string;
  category: string;
  body: string;
  createdAt: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contents/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "불러오기 실패");
        setContent(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "아티클을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-12" />
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-4" />)}
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="px-4 py-24 text-center sm:px-6">
        <p className="text-[var(--foreground-muted)]">{error || "아티클을 찾을 수 없습니다."}</p>
        <Link href="/articles" className="link-underline mt-4 inline-block text-sm text-[var(--foreground)]">
          아티클 목록으로
        </Link>
      </div>
    );
  }

  return (
    <article className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/articles" className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--brand)]">
          ← 아티클
        </Link>
        <header className="mt-6 mb-10 border-b border-[var(--border)] pb-8">
          {content.category && <p className="mb-3"><span className="eyebrow">{content.category}</span></p>}
          <h1 className="font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">{content.title}</h1>
          <p className="mt-4 text-sm text-[var(--foreground-subtle)]">
            심리상담가 현 ·{" "}
            {new Date(content.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </header>
        <div className="prose-ko text-[1.02rem]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.body}</ReactMarkdown>
        </div>
        <footer className="mt-14 rounded-2xl bg-[var(--surface)] p-6">
          <p className="font-display text-lg text-[var(--foreground)]">더 깊이 가고 싶다면</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">워크북으로 매일 10분씩 직접 해보거나, 강의로 원리를 배워 보세요.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/workbooks" className="rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">워크북</Link>
            <Link href="/courses" className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--brand)] hover:text-[var(--brand)]">강의</Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
