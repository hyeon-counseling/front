"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { MyTestItem } from "@/lib/psychTest";
import { Skeleton } from "@/components/ui";

/** 내 무료 자가 검사 기록 — limit을 주면 최근 것만 보여 준다 */
export function MyTestRecords({ limit }: { limit?: number }) {
  const [tests, setTests] = useState<MyTestItem[] | null>(null);

  useEffect(() => {
    apiRequest<MyTestItem[]>("/api/my/tests").then((res) => setTests(res.ok && res.data ? res.data : []));
  }, []);

  if (tests === null) return <Skeleton className="h-20" />;
  if (tests.length === 0) {
    return (
      <div className="card p-6">
        <p className="font-semibold text-[var(--foreground)]">아직 해 본 검사가 없어요</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">3분이면 지금의 마음을 살펴볼 수 있어요.</p>
      </div>
    );
  }
  return (
    <ul className="card divide-y divide-[var(--border-light)] overflow-hidden">
      {(limit ? tests.slice(0, limit) : tests).map((t) => (
        <li key={t.id}>
          <Link href={`/tests/result/${t.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--surface)]">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[var(--foreground)]">{t.testTitle}</span>
              <span className="block text-xs text-[var(--foreground-subtle)]">{new Date(t.createdAt).toLocaleDateString("ko-KR")}</span>
            </span>
            <span className="text-right text-sm">
              <span className="block font-bold text-[var(--foreground)]">{t.bandLabel}</span>
              <span className="block text-xs text-[var(--foreground-subtle)]">
                {t.scaleScores.length ? t.scaleScores.map((s) => `${s.label} ${s.score}`).join(" · ") : `${Number.isInteger(t.score) ? t.score : t.score.toFixed(2)} / ${t.maxScore}`}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
