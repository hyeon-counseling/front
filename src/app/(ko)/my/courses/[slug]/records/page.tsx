"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { Exercise } from "@/lib/practice";
import { EntryView } from "@/components/practice/EntryView";
import { EmptyState, Skeleton } from "@/components/ui";

interface EntriesResponse {
  course: { slug: string; title: string };
  lessons: {
    sectionTitle: string;
    key: string;
    label: string;
    title: string;
    completed: boolean;
    items: { blockKey: string; exercise: Exercise; value: unknown; updatedAt: string }[];
  }[];
}

// 내 쓰기 기록 모아보기 — 강의의 쓰기 실습 차시에 내가 적은 답을 한 번에 본다 (예전 '워크북 기록')
export default function MyCourseRecordsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<EntriesResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/my/courses/${slug}/records`);
      return;
    }
    apiRequest<EntriesResponse>(`/api/my/courses/${slug}/entries`).then((res) => {
      if (res.ok && res.data) setData(res.data);
      else setError(res.message || "불러오지 못했어요.");
    });
  }, [loading, user, slug, router]);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href={`/courses/${slug}`} className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">← 강의로</Link>
        <p className="mt-6"><span className="eyebrow">내 기록</span></p>
        <h1 className="font-display mt-3 text-3xl text-[var(--foreground)] sm:text-4xl">{data?.course.title ?? "강의"} 기록 모아보기</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">내가 적은 내용은 나만 볼 수 있어요. 고치고 싶으면 해당 차시로 가서 수정하면 돼요.</p>

        <div className="mt-10 space-y-6">
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          {!data && !error && [1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          {data?.lessons.length === 0 && <EmptyState title="아직 적은 기록이 없어요" description="첫 차시부터 시작해 보세요." />}
          {data?.lessons.map((d) => (
            <section key={d.key} className="card p-6 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground-subtle)]">{d.sectionTitle}</p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">
                    {d.label && <span className="mr-2 text-[var(--brand)]">{d.label}</span>}
                    {d.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {d.completed && <span className="text-xs font-semibold text-[var(--brand)]">✓ 완료</span>}
                  <Link href={`/learn/${slug}/${d.key}`} className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-muted)]">
                    열기
                  </Link>
                </div>
              </div>
              <div className="space-y-5">
                {d.items.map((it) => (
                  <div key={it.blockKey} className="border-t border-[var(--border-light)] pt-4">
                    <p className="mb-2 text-sm font-semibold text-[var(--foreground-muted)]">{it.exercise.prompt}</p>
                    <EntryView exercise={it.exercise} value={it.value} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
