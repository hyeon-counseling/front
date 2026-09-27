"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { MyWorkbook } from "@/lib/workbook";
import type { MyCourse } from "@/lib/course";
import { Skeleton } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 내 학습(마이페이지) — 진행 중인 워크북(이어하기) · 수강 중인 강의(이어보기) · 주문 내역
// ─────────────────────────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [workbooks, setWorkbooks] = useState<MyWorkbook[] | null>(null);
  const [courses, setCourses] = useState<MyCourse[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my");
      return;
    }
    apiRequest<MyWorkbook[]>("/api/my/workbooks").then((res) => setWorkbooks(res.ok && res.data ? res.data : []));
    apiRequest<MyCourse[]>("/api/my/courses").then((res) => setCourses(res.ok && res.data ? res.data : []));
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3"><span className="eyebrow">내 학습</span></p>
        <h1 className="font-display text-3xl text-[var(--foreground)] sm:text-4xl">{user.name}님, 오늘도 10분.</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{user.email}</p>

        {/* 워크북 */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">내 워크북</h2>
            <Link href="/workbooks" className="text-sm font-semibold text-[var(--brand)]">워크북 둘러보기 →</Link>
          </div>
          {workbooks === null ? (
            <Skeleton className="h-36" />
          ) : workbooks.length === 0 ? (
            <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">아직 시작한 워크북이 없어요</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">1주차는 누구나 무료예요. 오늘 10분부터 시작해 보세요.</p>
              </div>
              <Link href="/workbooks" className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
                무료로 시작하기
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {workbooks.map((w) => {
                const pct = w.totalDays ? Math.round((w.completedCount / w.totalDays) * 100) : 0;
                return (
                  <div key={w.slug} className="card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
                          {w.seriesLabel} · {w.fullAccess ? "전체 이용권" : "무료 체험"}
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-[var(--foreground)]">{w.title}</h3>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {w.completedCount}/{w.totalDays}일 완료
                          {w.resume && ` · 다음: ${w.resume.label} ${w.resume.title}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/my/workbooks/${w.slug}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                          내 기록
                        </Link>
                        {w.resume && (
                          <Link href={`/workbook/${w.slug}/${w.resume.key}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                            이어하기
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-[var(--surface-muted)]">
                      <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 강의 */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">내 강의</h2>
            <Link href="/courses" className="text-sm font-semibold text-[var(--brand)]">강의 둘러보기 →</Link>
          </div>
          {courses === null ? (
            <Skeleton className="h-28" />
          ) : courses.length === 0 ? (
            <div className="card p-6">
              <p className="font-semibold text-[var(--foreground)]">수강 중인 강의가 없어요</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">10분짜리 영상으로 편하게 시작해 보세요.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {courses.map((c) => (
                <div key={c.slug} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
                        영상 {c.lessonCount}편 · {c.enrollment.completedAt ? "수강 완료" : `${c.enrollment.progressPct}% 수강`}
                        {c.enrollment.expiresAt && ` · ${new Date(c.enrollment.expiresAt).toLocaleDateString("ko-KR")}까지`}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[var(--foreground)]">{c.title}</h3>
                      {c.enrollment.resume && <p className="mt-1 text-sm text-[var(--foreground-muted)]">다음: {c.enrollment.resume.title}</p>}
                    </div>
                    {c.enrollment.resume && (
                      <Link href={`/learn/${c.slug}/${c.enrollment.resume.key}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                        {c.enrollment.completedAt ? "다시 보기" : c.enrollment.progressPct > 0 ? "이어보기" : "시작하기"}
                      </Link>
                    )}
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[var(--surface-muted)]">
                    <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${c.enrollment.progressPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 주문 */}
        <section className="mt-10">
          <Link href="/my/orders" className="card card-hover block p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">주문 내역</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">강의·워크북 결제 내역과 구매한 전자책</p>
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
