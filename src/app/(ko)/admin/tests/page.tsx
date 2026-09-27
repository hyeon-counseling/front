"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Skeleton } from "@/components/ui";

interface Row {
  slug: string;
  title: string;
  emoji: string;
  status: "draft" | "published";
  questionCount: number;
  recommendationCount: number;
  total: number;
  recent: number;
  crisis: number;
}

// 관리자 — 무료 심리검사 목록 (응시 수 · 위기 응답 수)
export default function AdminTestsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    apiFetch("/api/admin/tests").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">심리검사</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">검사 문구·결과 해설·결과별 추천을 고치고, 응시 결과를 확인해요.</p>
        </div>
        <Link href="/admin/test-results" className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
          전체 결과 보기
        </Link>
      </div>

      {rows === null ? (
        <Skeleton className="h-48" />
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">
          등록된 검사가 없어요. 서버에서 <code>npm run seed:tests</code> 로 기본 검사 5종을 넣어 주세요.
        </p>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <div key={r.slug} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{r.title}</h2>
                    <Badge tone={r.status === "published" ? "brand" : "warning"}>{r.status === "published" ? "공개" : "비공개"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    /tests/{r.slug} · {r.questionCount}문항 · 추천 {r.recommendationCount}개
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                    누적 {r.total}건 · 최근 30일 {r.recent}건
                    {r.crisis > 0 && <span className="ml-2 font-semibold text-red-600">위기 문항 응답 {r.crisis}건</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/tests/${r.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  미리보기
                </Link>
                <Link href={`/admin/test-results?test=${r.slug}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  결과
                </Link>
                <Link href={`/admin/tests/${r.slug}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
                  편집
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
