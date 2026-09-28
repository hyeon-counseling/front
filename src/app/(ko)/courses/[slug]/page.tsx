"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatDuration, LESSON_TYPE_LABEL, type CourseDetail } from "@/lib/course";
import { formatPrice } from "@/lib/practice";
import { totalTimeLabel } from "@/lib/program";
import { Markdown } from "@/components/practice/Markdown";
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
  const trial = !!e?.trial;
  const previewLessons = course.sections.flatMap((s) => s.lessons).filter((l) => l.isPreview);
  const hasPractice = course.sections.some((s) => s.lessons.some((l) => l.type === "practice"));
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
          <p className="mt-6 text-sm font-semibold text-white/70">{[course.seriesLabel, course.instructor].filter(Boolean).join(" · ")}</p>
          <h1 className="font-display-tight mt-2 text-3xl sm:text-5xl">{course.title}</h1>
          {course.subtitle && <p className="mt-4 max-w-2xl text-lg text-white/85">{course.subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              course.visibility === "private" ? "초대 전용 과정" : "",
              course.durationLabel ?? "",
              allLessons.every((l) => l.type === "video") ? `영상 ${course.lessonCount}편` : `${course.lessonCount}차시`,
              totalTimeLabel(course.totalMinutes),
              course.accessDays ? `${course.accessDays}일 수강` : "기간 제한 없음",
              previewLessons.length ? `무료 체험 ${previewLessons.length}차시` : "",
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
                          <span className="block text-[0.95rem] font-semibold text-[var(--foreground)]">
                            {l.label && <span className="mr-2 text-xs font-bold text-[var(--brand)]">{l.label}</span>}
                            {l.title}
                          </span>
                          {l.summary && <span className="mt-0.5 block text-sm text-[var(--foreground-muted)]">{l.summary}</span>}
                        </span>
                        {l.isPreview && !active && (
                          <span className="shrink-0 rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">무료</span>
                        )}
                        <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">
                          {[l.type !== "video" ? LESSON_TYPE_LABEL[l.type] : "", formatDuration(l.durationSec)].filter(Boolean).join(" · ")}
                        </span>
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
                {hasPractice && (
                  <Link href={`/my/courses/${course.slug}/records`} className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                    내 기록 모아보기
                  </Link>
                )}
                <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">
                  {e!.viaProgram ? "과정 수강권으로 듣고 있어요 · " : ""}
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
                  <Link
                    href={`/learn/${course.slug}/${trial && e?.resume && previewLessons.some((l) => l.key === e.resume!.key) ? e.resume.key : firstPreview.key}`}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  >
                    {trial ? `무료 체험 이어하기 · ${e!.progressPct}%` : `무료 체험 시작 (${previewLessons.length}차시)`}
                  </Link>
                )}
                {trial && hasPractice && (
                  <Link href={`/my/courses/${course.slug}/records`} className="mt-2 block text-center text-xs font-semibold text-[var(--brand)]">
                    체험하며 적은 기록 보기 →
                  </Link>
                )}
                {e?.status === "revoked" && <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">환불 등으로 수강권이 종료되었어요.</p>}
                <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                  결제 후 바로 수강할 수 있어요.{trial ? " 무료 체험 때 적은 기록과 진도는 그대로 이어져요." : ""} 환불 기준은 <Link href="/refund" className="underline">환불 규정</Link>을 확인해 주세요.
                </p>
              </>
            )}
          </div>
          {!!course.programs?.length && (
            <div className="card mt-4 p-5">
              <p className="text-sm font-semibold text-[var(--foreground-muted)]">이 과목이 들어 있는 과정</p>
              <ul className="mt-2 space-y-1">
                {course.programs.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/programs/${p.slug}`} className="flex items-center justify-between gap-2 rounded-lg py-1.5 text-[0.95rem] font-semibold text-[var(--foreground)] hover:text-[var(--brand)]">
                      <span className="min-w-0 truncate">{p.title}</span>
                      <span className="shrink-0 text-xs font-semibold text-[var(--brand)]">{p.enrolled ? "수강 중" : "과정 보기 →"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
