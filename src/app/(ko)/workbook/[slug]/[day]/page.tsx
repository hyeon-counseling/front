"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { DayResponse } from "@/lib/workbook";
import { Callout, Markdown } from "@/components/workbook/Markdown";
import { ExerciseBlock } from "@/components/workbook/ExerciseBlock";
import { Skeleton } from "@/components/ui";

// 워크북 하루 수행 화면 — 본문 + 문항(자동 저장) + 완료 + 이전/다음
export default function WorkbookDayPage() {
  const { slug, day } = useParams<{ slug: string; day: string }>();
  const { user, loading: authLoading } = useAuth();
  // 불러온 결과를 일차 key와 함께 보관 — 다른 일차로 이동하면 자동으로 로딩 상태가 된다
  const [result, setResult] = useState<{ day: string; data?: DayResponse; locked?: boolean; error?: string } | null>(null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    apiRequest<DayResponse>(`/api/workbooks/${slug}/days/${day}`).then((res) => {
      if (res.ok && res.data) {
        setResult({ day, data: res.data });
        setCompletedMap((m) => ({ ...m, [day]: res.data!.completed }));
      } else if (res.status === 403) setResult({ day, locked: true });
      else setResult({ day, error: res.message || "불러오지 못했어요." });
    });
  }, [authLoading, slug, day]);

  const current = result?.day === day ? result : null;
  const data = current?.data ?? null;
  const locked = !!current?.locked;
  const error = current?.error ?? "";
  const completed = !!completedMap[day];
  const setCompleted = (v: boolean) => setCompletedMap((m) => ({ ...m, [day]: v }));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [day]);

  const toggleComplete = async () => {
    setCompleting(true);
    const res = await apiRequest(`/api/workbooks/${slug}/days/${day}/complete`, {
      method: "POST",
      body: JSON.stringify({ completed: !completed }),
    });
    setCompleting(false);
    if (res.ok) setCompleted(!completed);
  };

  if (locked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="font-display mt-4 text-2xl">전체 이용권이 필요한 일차예요</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">시작하기와 1주차는 무료예요. 2주차부터는 전체 이용권으로 이어서 진행할 수 있어요.</p>
        <Link href={`/workbooks/${slug}`} className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
          워크북 소개로
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href={`/workbooks/${slug}`} className="link-underline mt-4 inline-block text-sm">워크북으로</Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-14">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { day: d, week, position, prev, next, entries } = data;
  const pct = Math.round(((position.index + 1) / position.total) * 100);
  const canSave = !!user;

  return (
    <div>
      {/* 상단 진행 바 */}
      <div className="sticky top-16 z-40 border-b border-[var(--border-light)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <Link href={`/workbooks/${slug}`} className="shrink-0 text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            ← {data.workbook.title}
          </Link>
          <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-muted)]">
            <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--foreground-subtle)]">
            {position.index + 1}/{position.total}
          </span>
        </div>
      </div>

      <article className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:pt-14">
        <header className="mb-10">
          <p className="text-sm font-semibold text-[var(--brand)]">{week.title}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-lg bg-[var(--brand)] px-2.5 py-1 text-xs font-bold text-white">{d.label}</span>
            {d.estMinutes && <span className="text-xs text-[var(--foreground-subtle)]">약 {d.estMinutes}분</span>}
            {completed && <span className="text-xs font-semibold text-[var(--brand)]">✓ 완료</span>}
          </div>
          <h1 className="font-display-tight mt-3 text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">{d.title}</h1>
        </header>

        {!canSave && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl bg-[var(--brand-light)]/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--foreground)]">로그인하면 적은 내용이 자동으로 저장돼요.</p>
            <Link href={`/login?next=/workbook/${slug}/${day}`} className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
              로그인하고 기록하기
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {d.blocks.map((b) =>
            b.type === "text" ? (
              <Markdown key={b.key} md={b.md ?? ""} />
            ) : b.type === "callout" ? (
              <Callout key={b.key} block={b} />
            ) : (
              <ExerciseBlock key={`${day}-${b.key}`} slug={slug} block={b} initial={entries[b.key]} canSave={canSave} />
            )
          )}
        </div>

        {/* 완료 + 이동 */}
        <div className="mt-14 card p-6 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            {completed ? "오늘 몫을 마쳤어요. 수고했어요." : "다 적었다면 오늘을 완료로 표시해요. 적은 내용은 이미 저장돼 있어요."}
          </p>
          {canSave && (
            <button
              onClick={toggleComplete}
              disabled={completing}
              className={`mt-4 inline-flex h-12 min-w-[200px] cursor-pointer items-center justify-center rounded-xl px-6 font-semibold transition-colors disabled:opacity-60 ${
                completed ? "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]" : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
              }`}
            >
              {completed ? "✓ 완료됨 · 취소하기" : `${d.label} 완료하기`}
            </button>
          )}
        </div>

        <nav className="mt-6 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/workbook/${slug}/${prev.key}`} className="card card-hover p-4">
              <p className="text-xs text-[var(--foreground-subtle)]">← 이전</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{prev.label} · {prev.title}</p>
            </Link>
          ) : <span />}
          {next &&
            (next.locked ? (
              <Link href={`/workbooks/${slug}`} className="rounded-[20px] border border-dashed border-[var(--border)] p-4 text-right">
                <p className="text-xs text-[var(--foreground-subtle)]">🔒 다음 · 전체 이용권 필요</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground-muted)]">{next.label} · {next.title}</p>
              </Link>
            ) : (
              <Link href={`/workbook/${slug}/${next.key}`} className="card card-hover p-4 text-right">
                <p className="text-xs text-[var(--foreground-subtle)]">다음 →</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{next.label} · {next.title}</p>
              </Link>
            ))}
        </nav>
      </article>
    </div>
  );
}
