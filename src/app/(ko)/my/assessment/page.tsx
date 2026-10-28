"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { ProgressView } from "@/lib/assessment";
import { EmptyState, Skeleton } from "@/components/ui";
import { StageTracker } from "@/components/assessment/StageTracker";

// 마이페이지 · 심리검사 진행 — 내 종합심리검사 신청 목록 → 진행 화면(/a/:key)
export default function MyAssessmentPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [list, setList] = useState<ProgressView[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my/assessment");
      return;
    }
    apiRequest<ProgressView[]>("/api/assessment/my").then((r) => setList(r.ok && r.data ? r.data : []));
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">심리검사 진행</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">신청한 전문 심리검사가 지금 어디까지 왔는지 보여 드려요.</p>

        {!list ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-40" />
          </div>
        ) : list.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="아직 신청한 검사가 없어요"
              description="검사 3종과 해석 상담으로 나를 더 깊이 이해해 보세요."
              action={
                <Link href="/assessment" className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
                  전문 심리검사 보기
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {list.map((a) => (
              <div key={a.applicationNo} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground-subtle)]">신청 번호 {a.applicationNo}</p>
                    <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">종합심리검사 + 해석 상담</h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      해석 상담 {a.sessionText} · {a.methodText}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--brand-light)] px-3 py-1 text-xs font-bold text-[var(--brand)]">
                    {a.closed ? (a.closed === "refunded" ? "환불됨" : "취소됨") : a.cancelRequestedAt ? "취소 요청됨" : a.holdLabel || `${a.stage}/8 ${a.stageLabel}`}
                  </span>
                </div>
                {!a.closed && <StageTracker stage={a.stage} hold={a.hold} compact />}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/a/${a.linkKey}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
                    진행 상황 보기
                  </Link>
                  {!a.closed &&
                    (a.cancelRequestedAt ? (
                      <span className="text-xs font-semibold text-[var(--foreground-subtle)]">취소 요청됨 · 상담가 확인 중</span>
                    ) : (
                      <Link href={`/a/${a.linkKey}/cancel`} className="text-sm text-[var(--foreground-subtle)] underline underline-offset-2 hover:text-[var(--error)]">
                        취소 요청
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
