"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 백엔드 콘텐츠 상세 데이터 타입 (body 포함)
interface ContentDetail {
  _id: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      try {
        // GET /api/contents/:id — 발행된 콘텐츠 상세 (인증 불필요)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/contents/${id}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "불러오기 실패");
        setContent(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "콘텐츠를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  // 로딩 중
  if (loading) {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 h-8 w-24 animate-pulse rounded-full bg-[var(--surface)]" />
          <div className="mb-4 h-10 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="mb-8 h-5 w-40 animate-pulse rounded bg-[var(--surface)]" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-[var(--surface)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 에러
  if (error || !content) {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 text-[var(--foreground-muted)]">
            {error || "콘텐츠를 찾을 수 없습니다."}
          </p>
          <Link
            href="/content"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* 뒤로가기 링크 */}
        <Link
          href="/content"
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--brand)]"
        >
          ← Back to Articles
        </Link>

        {/* 카테고리 뱃지 */}
        {content.category && (
          <div className="mt-4 mb-3">
            <span className="inline-block rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
              {content.category}
            </span>
          </div>
        )}

        {/* 제목 */}
        <h1 className="mb-3 text-2xl font-semibold leading-snug text-[var(--foreground)] sm:text-3xl">
          {content.title}
        </h1>

        {/* 작성일 */}
        <p className="mb-10 text-sm text-[var(--foreground-subtle)]">
          {new Date(content.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* 구분선 */}
        <hr className="mb-10 border-[var(--border)]" />

        {/* 마크다운 본문 렌더링 */}
        {/* tailwindcss/typography 패키지 없이 직접 스타일 적용 */}
        <div className="prose-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-8 text-2xl font-bold text-[var(--foreground)]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-7 text-xl font-bold text-[var(--foreground)]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-6 text-lg font-semibold text-[var(--foreground)]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-5 leading-7 text-[var(--foreground)]">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-5 list-disc space-y-1 pl-6 text-[var(--foreground)]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-5 list-decimal space-y-1 pl-6 text-[var(--foreground)]">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-7">{children}</li>
              ),
              // react-markdown v10: pre 안에 있으면 블록 코드, 없으면 인라인 코드
              // pre 컴포넌트에서 블록 코드 전체 스타일을 처리
              code: ({ children }) => (
                <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-sm text-[var(--brand)]">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="mb-5 overflow-x-auto rounded-xl bg-[var(--surface)] p-4 font-mono text-sm leading-6 text-[var(--foreground)] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[var(--foreground)]">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-5 border-l-4 border-[var(--brand)] pl-4 italic text-[var(--foreground-muted)]">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-[var(--foreground)]">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[var(--foreground)]">{children}</em>
              ),
              hr: () => (
                <hr className="my-8 border-[var(--border)]" />
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand)] underline hover:opacity-80"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content.body}
          </ReactMarkdown>
        </div>

        {/* 하단 뒤로가기 링크 */}
        <div className="mt-14 border-t border-[var(--border)] pt-8">
          <Link
            href="/content"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--brand)]"
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
