"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { MyCourse } from "@/lib/course";
import type { MyProgram } from "@/lib/program";
import type { MyTestItem } from "@/lib/psychTest";
import { Skeleton } from "@/components/ui";
import { StampCard } from "@/components/my/StampCard";
import { ForestCard } from "@/components/my/ForestCard";

// ─────────────────────────────────────────────────────────────────
// 내 학습(마이페이지) — 내 과정 · 내 강의(무료 체험 포함, 이어보기 · 쓰기 기록) · 심리검사 · 주문 내역
// ─────────────────────────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [programs, setPrograms] = useState<MyProgram[] | null>(null);
  const [tests, setTests] = useState<MyTestItem[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my");
      return;
    }
    apiRequest<MyCourse[]>("/api/my/courses").then((res) => setCourses(res.ok && res.data ? res.data : []));
    apiRequest<MyProgram[]>("/api/my/programs").then((res) => setPrograms(res.ok && res.data ? res.data : []));
    apiRequest<MyTestItem[]>("/api/my/tests").then((res) => setTests(res.ok && res.data ? res.data : []));
  }, [loading, user, router]);

  if (loading || !user) return null;

  // 과정에 든 과목은 '내 과정' 카드에서 보여 주고, '내 강의'에는 과정 밖 과목만
  const inPrograms = new Set((programs ?? []).flatMap((p) => p.courses.map((c) => c.slug)));
  const soloCourses = courses?.filter((c) => !inPrograms.has(c.slug)) ?? null;

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3"><span className="eyebrow">내 학습</span></p>
        <h1 className="font-display text-3xl text-[var(--foreground)] sm:text-4xl">{user.name}님, 오늘도 편안한 속도로.</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{user.email}</p>

        <StampCard />
        <ForestCard />

        {/* 과정 (여러 과목 묶음) */}
        {!!programs?.length && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">내 과정</h2>
            <div className="grid gap-4">
              {programs.map((p) => (
                <div key={p.slug} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
                        {p.courseCount}과목 · {p.enrollment.completedAt ? "과정 수료" : `${p.enrollment.completedCourses}과목 수료`}
                        {p.enrollment.expiresAt && ` · ${new Date(p.enrollment.expiresAt).toLocaleDateString("ko-KR")}까지`}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[var(--foreground)]">{p.title}</h3>
                      {p.nextCourse && <p className="mt-1 text-sm text-[var(--foreground-muted)]">이어서: {p.nextCourse.title}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/programs/${p.slug}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                        과목 {p.courseCount}개 보기
                      </Link>
                      {p.nextCourse && (
                        <Link href={`/courses/${p.nextCourse.slug}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                          {p.enrollment.progressPct > 0 ? "이어하기" : "시작하기"}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-[var(--surface-muted)]">
                      <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${p.enrollment.progressPct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground-muted)]">{p.enrollment.progressPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 강의 */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">내 강의</h2>
            <Link href="/courses" className="text-sm font-semibold text-[var(--brand)]">강의 둘러보기 →</Link>
          </div>
          {soloCourses === null || programs === null ? (
            <Skeleton className="h-28" />
          ) : soloCourses.length === 0 ? (
            <div className="card p-6">
              <p className="font-semibold text-[var(--foreground)]">{inPrograms.size ? "과정 밖에서 따로 듣는 강의가 없어요" : "수강 중인 강의가 없어요"}</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{inPrograms.size ? "과정에 든 과목은 위 '내 과정'에서 볼 수 있어요." : "무료 체험 차시로 편하게 시작해 보세요."}</p>
              {!inPrograms.size && (
                <Link href="/courses" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
                  강의 둘러보기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {soloCourses.map((c) => (
                <div key={c.slug} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
                        {c.enrollment.trial && <span className="mr-1.5 rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[var(--brand)]">무료 체험</span>}
                        {c.lessonCount}차시 · {c.enrollment.completedAt ? "수강 완료" : `${c.enrollment.progressPct}% 수강`}
                        {c.enrollment.expiresAt && ` · ${new Date(c.enrollment.expiresAt).toLocaleDateString("ko-KR")}까지`}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[var(--foreground)]">{c.title}</h3>
                      {c.enrollment.resume && <p className="mt-1 text-sm text-[var(--foreground-muted)]">다음: {c.enrollment.resume.title}</p>}
                    </div>
                    <div className="flex gap-2">
                      {c.components?.includes("practice") && (
                        <Link href={`/my/courses/${c.slug}/records`} className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                          내 기록
                        </Link>
                      )}
                      {c.enrollment.resume && (
                        <Link href={`/learn/${c.slug}/${c.enrollment.resume.key}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                          {c.enrollment.completedAt ? "다시 보기" : c.enrollment.progressPct > 0 ? "이어하기" : "시작하기"}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[var(--surface-muted)]">
                    <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${c.enrollment.progressPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 심리검사 기록 */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">내 심리검사 기록</h2>
            <Link href="/tests" className="text-sm font-semibold text-[var(--brand)]">검사 하러 가기 →</Link>
          </div>
          {tests === null ? (
            <Skeleton className="h-20" />
          ) : tests.length === 0 ? (
            <div className="card p-6">
              <p className="font-semibold text-[var(--foreground)]">아직 해 본 검사가 없어요</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">3분이면 지금의 마음을 살펴볼 수 있어요.</p>
            </div>
          ) : (
            <ul className="card divide-y divide-[var(--border-light)] overflow-hidden">
              {tests.slice(0, 8).map((t) => (
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
          )}
        </section>

        {/* 주문 */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link href="/my/orders" className="card card-hover block p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">주문 내역</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">강의·과정 결제 내역과 구매한 전자책</p>
          </Link>
          <Link href="/my/coupons" className="card card-hover block p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">쿠폰함</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">받은 할인 쿠폰과 사용 내역</p>
          </Link>
          <Link href="/my/certificates" className="card card-hover block p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">수료증</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">수료·완주하면 자동 발급</p>
          </Link>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-6 text-sm">
          {user.role === "admin" && (
            <Link href="/admin" className="link-underline text-[var(--foreground)]">관리자 페이지</Link>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
