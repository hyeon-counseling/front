"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatPrice, type CurriculumDay, type WorkbookDetail } from "@/lib/workbook";
import { Markdown } from "@/components/workbook/Markdown";
import { Skeleton } from "@/components/ui";

// 워크북 소개 + 커리큘럼 + 시작/이어하기
export default function WorkbookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wb, setWb] = useState<WorkbookDetail | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    apiRequest<WorkbookDetail>(`/api/workbooks/${slug}`).then((res) => {
      if (res.ok && res.data) setWb(res.data);
      else setError(res.message || "워크북을 불러오지 못했어요.");
    });
  }, [authLoading, slug]);

  const allDays = useMemo(() => (wb ? wb.weeks.flatMap((w) => w.days) : []), [wb]);
  const resumeDay = useMemo<CurriculumDay | null>(() => {
    if (!wb?.enrollment) return null;
    const idx = allDays.findIndex((d) => d.key === wb.enrollment!.lastDayKey);
    if (idx < 0) return allDays.find((d) => !d.completed && !d.locked) ?? allDays[0] ?? null;
    const last = allDays[idx];
    return last.completed && allDays[idx + 1] && !allDays[idx + 1].locked ? allDays[idx + 1] : last;
  }, [wb, allDays]);

  const start = async () => {
    if (!user) {
      router.push(`/login?next=/workbooks/${slug}`);
      return;
    }
    setStarting(true);
    const res = await apiRequest<{ firstDayKey: string }>(`/api/workbooks/${slug}/enroll`, { method: "POST" });
    setStarting(false);
    if (res.ok && res.data?.firstDayKey) router.push(`/workbook/${slug}/${res.data.firstDayKey}`);
    else setError(res.message || "시작하지 못했어요.");
  };

  if (error && !wb) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href="/workbooks" className="link-underline mt-4 inline-block text-sm">워크북 목록으로</Link>
      </div>
    );
  }
  if (!wb) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const e = wb.enrollment;
  const doneCount = e?.completedDays.length ?? 0;
  const totalDays = allDays.length;
  const pct = totalDays ? Math.round((doneCount / totalDays) * 100) : 0;
  const upcoming = wb.plannedWeeks.slice(wb.weeks.length);
  const price = formatPrice(wb.salePrice ?? wb.price);

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-brand-gradient px-4 pb-14 pt-12 text-white sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/workbooks" className="text-sm text-white/70 hover:text-white">← 셀프 워크북</Link>
          <p className="mt-6 text-sm font-semibold text-white/70">{wb.seriesLabel}</p>
          <h1 className="font-display-tight mt-2 text-4xl sm:text-5xl">{wb.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{wb.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[wb.framework, wb.durationLabel, "하루 10~15분", "1주차 무료"].filter(Boolean).map((t) => (
              <span key={t} className="rounded-lg bg-white/15 px-3 py-1 ring-1 ring-white/20">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:gap-12">
        {/* 본문 */}
        <div className="min-w-0">
          <Markdown md={wb.description} />

          <h2 className="font-display mt-12 text-2xl text-[var(--foreground)]">커리큘럼</h2>
          <div className="mt-5 space-y-4">
            {wb.weeks.map((w) => (
              <details key={w.key} open={!w.locked} className="card group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[var(--foreground)]">{w.title}</h3>
                      {w.free ? (
                        <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">무료</span>
                      ) : w.locked ? (
                        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--foreground-muted)]">🔒 이용권</span>
                      ) : null}
                    </div>
                    {w.theme && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{w.theme}</p>}
                  </div>
                  <span className="mt-1 text-[var(--foreground-subtle)] transition-transform group-open:rotate-180" aria-hidden>▾</span>
                </summary>
                <ul className="border-t border-[var(--border-light)]">
                  {w.days.map((d) => {
                    const inner = (
                      <>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${d.completed ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-subtle)]"}`}>
                          {d.completed ? "✓" : d.locked ? "🔒" : ""}
                        </span>
                        <span className="w-14 shrink-0 text-xs font-semibold text-[var(--foreground-subtle)]">{d.label}</span>
                        <span className="flex-1 text-[0.95rem] text-[var(--foreground)]">{d.title}</span>
                        <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">{d.estMinutes}분</span>
                      </>
                    );
                    return (
                      <li key={d.key} className="border-b border-[var(--border-light)] last:border-b-0">
                        {d.locked ? (
                          <div className="flex items-center gap-3 px-5 py-3.5 opacity-60 sm:px-6">{inner}</div>
                        ) : (
                          <Link href={`/workbook/${slug}/${d.key}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface)] sm:px-6">
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
            {upcoming.map((t) => (
              <div key={t} className="flex items-center justify-between rounded-2xl border border-dashed border-[var(--border)] px-5 py-4 sm:px-6">
                <span className="font-semibold text-[var(--foreground-muted)]">{t}</span>
                <span className="text-xs font-semibold text-[var(--foreground-subtle)]">공개 예정</span>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드 카드 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card shadow-soft p-6">
            {e ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">내 진행률</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">
                  {pct}% <span className="text-base font-semibold text-[var(--foreground-subtle)]">{doneCount}/{totalDays}일</span>
                </p>
                <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                  <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
                </div>
                {resumeDay && (
                  <Link href={`/workbook/${slug}/${resumeDay.key}`} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)]">
                    이어하기 · {resumeDay.label}
                  </Link>
                )}
                <Link href={`/my/workbooks/${slug}`} className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                  내 기록 모아보기
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">시작하기 + 1주차</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">무료</p>
                <button
                  onClick={start}
                  disabled={starting}
                  className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
                >
                  {starting ? "준비 중…" : user ? "무료로 시작하기" : "로그인하고 시작하기"}
                </button>
                <p className="mt-2 text-center text-xs text-[var(--foreground-subtle)]">카드 없이 바로 시작해요.</p>
              </>
            )}

            <div className="mt-6 border-t border-[var(--border-light)] pt-5">
              {e?.fullAccess ? (
                <p className="text-sm font-semibold text-[var(--brand)]">
                  ✓ 전체 이용권 이용 중{e.expiresAt ? ` · ${new Date(e.expiresAt).toLocaleDateString("ko-KR")}까지` : ""}
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--foreground)]">전체 이용권 (8주)</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">2주차부터 이어서 진행하려면 필요해요. 이후 주차도 공개되는 대로 포함돼요.</p>
                  <button disabled className="mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--foreground-subtle)]">
                    {price ? `${price} · 결제 준비 중` : "구매 준비 중"}
                  </button>
                </>
              )}
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
        </aside>
      </div>
    </div>
  );
}
