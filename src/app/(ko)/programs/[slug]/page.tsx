"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { totalTimeLabel, type ProgramDetail } from "@/lib/program";
import { formatPrice } from "@/lib/workbook";
import { Markdown } from "@/components/workbook/Markdown";
import { BuyButton } from "@/components/checkout/BuyButton";
import { Skeleton } from "@/components/ui";

// 과정(여러 과목 묶음) 소개 + 과목 목록(과목별 진도) + 구매/이어하기
export default function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { loading: authLoading } = useAuth();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    apiRequest<ProgramDetail>(`/api/programs/${slug}`).then((res) => {
      if (res.ok && res.data) setProgram(res.data);
      else setError(res.message || "과정을 불러오지 못했어요.");
    });
  }, [authLoading, slug]);

  if (error && !program) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href="/courses" className="link-underline mt-4 inline-block text-sm">강의 목록으로</Link>
      </div>
    );
  }
  if (!program) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const e = program.enrollment;
  const active = program.canAccess && !!e?.active;
  const price = formatPrice(program.salePriceEffective);
  const original = program.salePrice && program.price && program.price > program.salePrice ? formatPrice(program.price) : null;
  const separate = program.separateTotal && program.salePriceEffective && program.separateTotal > program.salePriceEffective ? program.separateTotal : null;
  // 이어서 할 과목: 공부하던 과목 중 안 끝낸 것 → 아직 안 끝낸 첫 과목 → 첫 과목
  const next = program.courses.find((c) => c.resume && !c.completed) ?? program.courses.find((c) => !c.completed) ?? program.courses[0];

  return (
    <div>
      <section className="bg-brand-gradient px-4 pb-14 pt-12 text-white sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/courses" className="text-sm text-white/70 hover:text-white">← 강의</Link>
          <p className="mt-6 text-sm font-semibold text-white/70">{["과정", program.instructor].filter(Boolean).join(" · ")}</p>
          <h1 className="font-display-tight mt-2 text-3xl sm:text-5xl">{program.title}</h1>
          {program.subtitle && <p className="mt-4 max-w-2xl text-lg text-white/85">{program.subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              program.visibility === "private" ? "초대 전용 과정" : "",
              `${program.courseCount}과목`,
              `${program.lessonCount}차시`,
              totalTimeLabel(program.totalMinutes),
              program.accessDays ? `${program.accessDays}일 수강` : "기간 제한 없음",
              "모두 수료하면 과정 수료증",
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
          {program.description && <Markdown md={program.description} />}

          <h2 className={`font-display text-2xl text-[var(--foreground)] ${program.description ? "mt-12" : ""}`}>과목 {program.courseCount}개</h2>
          <ol className="card mt-5 overflow-hidden">
            {program.courses.map((c, i) => {
              // 비공개 과목은 과정을 신청하기 전에는 소개 화면도 열리지 않으므로 링크를 걸지 않는다
              const open = program.canAccess || c.visibility !== "private";
              const row = "flex items-center gap-4 px-5 py-4 sm:px-6";
              const inner = (
                <>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.completed ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-subtle)]"}`}>
                    {c.completed ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--foreground)]">{c.title}</span>
                    <span className="mt-0.5 block text-sm text-[var(--foreground-muted)]">
                      {[`${c.lessonCount}차시`, totalTimeLabel(c.totalMinutes).replace("총 ", "")].filter(Boolean).join(" · ")}
                      {active && c.resume && !c.completed ? ` · 다음: ${c.resume.title}` : ""}
                    </span>
                    {active && (
                      <span className="mt-2 block h-1.5 rounded-full bg-[var(--surface-muted)]">
                        <span className="block h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${c.progressPct}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--foreground-subtle)]">
                    {active ? (c.completed ? "수료" : `${c.progressPct}%`) : open ? "→" : "🔒"}
                  </span>
                </>
              );
              return (
                <li key={c.slug} className="border-b border-[var(--border-light)] last:border-b-0">
                  {open ? (
                    <Link href={`/courses/${c.slug}`} className={`${row} transition-colors hover:bg-[var(--surface)]`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={row}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
          {program.courses.length === 0 && <p className="mt-4 text-sm text-[var(--foreground-muted)]">아직 준비 중인 과정이에요.</p>}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card shadow-soft p-6">
            {active ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">과정 진도</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">{e!.progressPct}%</p>
                <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                  <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${e!.progressPct}%` }} />
                </div>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                  {program.courseCount}과목 중 <strong className="text-[var(--foreground)]">{e!.completedCourses}과목</strong> 수료
                </p>
                {e!.completedAt && (
                  <Link href="/my/certificates" className="mt-2 block text-sm font-semibold text-[var(--brand)]">🎉 과정을 모두 마쳤어요 · 수료증 보기</Link>
                )}
                {next && (
                  <Link href={`/courses/${next.slug}`} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-center font-semibold text-white hover:bg-[var(--brand-hover)]">
                    {e!.progressPct > 0 ? `이어서: ${next.title}` : `시작하기: ${next.title}`}
                  </Link>
                )}
                <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">
                  {e!.expiresAt ? `${new Date(e!.expiresAt).toLocaleDateString("ko-KR")}까지 수강할 수 있어요` : "기간 제한 없이 수강할 수 있어요"}
                </p>
              </>
            ) : program.canAccess ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">관리자 미리보기</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">관리자는 모든 과목을 열어 볼 수 있어요.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">과정 수강료</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">
                  {original && <span className="mr-2 text-base font-semibold text-[var(--foreground-subtle)] line-through">{original}</span>}
                  {price ?? "준비 중"}
                </p>
                {separate && price && (
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    과목을 따로 사면 {formatPrice(separate)} · <strong className="text-[var(--brand)]">{formatPrice(separate - program.salePriceEffective!)} 아껴요</strong>
                  </p>
                )}
                <div className="mt-5">
                  {price ? (
                    <BuyButton itemType="program" slug={program.slug} label="과정 신청하기" />
                  ) : (
                    <button disabled className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--surface)] font-semibold text-[var(--foreground-subtle)]">
                      {program.visibility === "private" ? "초대받은 분만 들을 수 있어요" : "판매 준비 중"}
                    </button>
                  )}
                </div>
                {e?.status === "revoked" && <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">환불 등으로 과정 수강권이 종료되었어요.</p>}
                <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                  결제 후 모든 과목을 바로 들을 수 있어요. 이미 따로 산 과목도 진도가 그대로 이어져요. 환불 기준은{" "}
                  <Link href="/refund" className="underline">환불 규정</Link>을 확인해 주세요.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
