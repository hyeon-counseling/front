"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatDuration, type CourseDetail } from "@/lib/course";
import { formatPrice } from "@/lib/workbook";
import { Markdown } from "@/components/workbook/Markdown";
import { BuyButton } from "@/components/checkout/BuyButton";
import { Skeleton } from "@/components/ui";

// 강의 소개 + 커리큘럼 + 구매/이어보기
export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { loading: authLoading } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    apiRequest<CourseDetail>(`/api/courses/${slug}`).then((res) => {
      if (res.ok && res.data) setCourse(res.data);
      else setError(res.message || "강의를 불러오지 못했어요.");
    });
  }, [authLoading, slug]);

  if (error && !course) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href="/courses" className="link-underline mt-4 inline-block text-sm">강의 목록으로</Link>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const e = course.enrollment;
  const active = !!e?.active;
  const allLessons = course.sections.flatMap((s) => s.lessons);
  const firstPreview = allLessons.find((l) => l.isPreview);
  const start = e?.resume?.key ?? allLessons[0]?.key;
  const price = formatPrice(course.salePriceEffective);
  const original = course.salePrice && course.price && course.price > course.salePrice ? formatPrice(course.price) : null;

  return (
    <div>
      <section className="bg-brand-gradient px-4 pb-14 pt-12 text-white sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/courses" className="text-sm text-white/70 hover:text-white">← 강의</Link>
          <p className="mt-6 text-sm font-semibold text-white/70">{course.instructor}</p>
          <h1 className="font-display-tight mt-2 text-3xl sm:text-5xl">{course.title}</h1>
          {course.subtitle && <p className="mt-4 max-w-2xl text-lg text-white/85">{course.subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              `영상 ${course.lessonCount}편`,
              course.totalMinutes ? `총 ${course.totalMinutes}분` : "",
              course.accessDays ? `${course.accessDays}일 수강` : "기간 제한 없음",
              firstPreview ? "1편 미리보기" : "",
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="rounded-lg bg-white/15 px-3 py-1 ring-1 ring-white/20">{t}</span>
              ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:gap-12">
        <div className="min-w-0">
          <Markdown md={course.description} />

          <h2 className="font-display mt-12 text-2xl text-[var(--foreground)]">커리큘럼</h2>
          <div className="mt-5 space-y-4">
            {course.sections.map((s) => (
              <div key={s.key} className="card overflow-hidden">
                <h3 className="border-b border-[var(--border-light)] px-5 py-4 text-lg font-bold text-[var(--foreground)] sm:px-6">{s.title}</h3>
                <ul>
                  {s.lessons.map((l, i) => {
                    const inner = (
                      <>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${l.completed ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-subtle)]"}`}>
                          {l.completed ? "✓" : l.locked ? "🔒" : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.95rem] font-semibold text-[var(--foreground)]">{l.title}</span>
                          {l.summary && <span className="mt-0.5 block text-sm text-[var(--foreground-muted)]">{l.summary}</span>}
                        </span>
                        {l.isPreview && !active && (
                          <span className="shrink-0 rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">미리보기</span>
                        )}
                        <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">{formatDuration(l.durationSec)}</span>
                      </>
                    );
                    return (
                      <li key={l.key} className="border-b border-[var(--border-light)] last:border-b-0">
                        {l.locked ? (
                          <div className="flex items-center gap-3 px-5 py-4 opacity-60 sm:px-6">{inner}</div>
                        ) : (
                          <Link href={`/learn/${course.slug}/${l.key}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface)] sm:px-6">
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card shadow-soft p-6">
            {active ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">내 진도</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">{e!.progressPct}%</p>
                <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                  <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${e!.progressPct}%` }} />
                </div>
                {e!.completedAt && <p className="mt-3 text-sm font-semibold text-[var(--brand)]">🎉 수강을 모두 마쳤어요</p>}
                {start && (
                  <Link href={`/learn/${course.slug}/${start}`} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)]">
                    {e!.progressPct > 0 ? "이어보기" : "수강 시작하기"}
                  </Link>
                )}
                <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">
                  {e!.expiresAt ? `${new Date(e!.expiresAt).toLocaleDateString("ko-KR")}까지 수강할 수 있어요` : "기간 제한 없이 수강할 수 있어요"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">수강료</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">
                  {original && <span className="mr-2 text-base font-semibold text-[var(--foreground-subtle)] line-through">{original}</span>}
                  {price ?? "준비 중"}
                </p>
                <div className="mt-5">
                  {price ? (
                    <BuyButton itemType="course" slug={course.slug} label="수강 신청하기" />
                  ) : (
                    <button disabled className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--surface)] font-semibold text-[var(--foreground-subtle)]">
                      판매 준비 중
                    </button>
                  )}
                </div>
                {firstPreview && (
                  <Link href={`/learn/${course.slug}/${firstPreview.key}`} className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                    1편 미리보기
                  </Link>
                )}
                {e?.status === "revoked" && <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">환불 등으로 수강권이 종료되었어요.</p>}
                <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                  결제 후 바로 수강할 수 있어요. 환불 기준은 <Link href="/refund" className="underline">환불 규정</Link>을 확인해 주세요.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
