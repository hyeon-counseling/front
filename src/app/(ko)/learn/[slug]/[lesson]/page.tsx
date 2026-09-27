"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatDuration, type CourseDetail, type LessonResponse, type Playback } from "@/lib/course";
import { Markdown } from "@/components/workbook/Markdown";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { Skeleton } from "@/components/ui";

type LessonState = { status: "ok"; data: LessonResponse } | { status: "locked"; message: string } | { status: "error"; message: string };

// 강의 수강 화면 — 플레이어 · 이어보기 · 진도 저장 · 완료 · 이전/다음 · 커리큘럼
export default function LearnPage() {
  const { slug, lesson: lessonKey } = useParams<{ slug: string; lesson: string }>();
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<{ key: string; value: LessonState } | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [playback, setPlayback] = useState<{ key: string; value: Playback | null; error: string } | null>(null);
  const [completed, setCompleted] = useState<{ key: string; value: boolean } | null>(null);
  const [savingDone, setSavingDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    apiRequest<LessonResponse>(`/api/courses/${slug}/lessons/${lessonKey}`).then((res) => {
      const value: LessonState = res.ok && res.data
        ? { status: "ok", data: res.data }
        : res.status === 403
          ? { status: "locked", message: res.message }
          : { status: "error", message: res.message || "차시를 불러오지 못했어요." };
      setState({ key: lessonKey, value });
      if (value.status === "ok" && value.data.lesson.hasVideo) {
        apiRequest<Playback>(`/api/courses/${slug}/lessons/${lessonKey}/playback`).then((p) =>
          setPlayback({ key: lessonKey, value: p.ok ? p.data : null, error: p.ok ? "" : p.message || "영상을 불러오지 못했어요." })
        );
      }
    });
  }, [authLoading, slug, lessonKey]);

  const reloadCourse = useCallback(() => {
    apiRequest<CourseDetail>(`/api/courses/${slug}`).then((res) => res.ok && res.data && setCourse(res.data));
  }, [slug]);
  useEffect(() => {
    if (!authLoading) reloadCourse();
  }, [authLoading, reloadCourse, lessonKey]);

  const current = state?.key === lessonKey ? state.value : null;
  const data = current?.status === "ok" ? current.data : null;
  const isDone = completed?.key === lessonKey ? completed.value : !!data?.progress.completed;

  const saveProgress = useCallback(
    (body: { positionSec?: number; completed?: boolean }) => {
      if (!data?.enrolled) return Promise.resolve(null);
      return apiRequest<{ completed: boolean; progressPct: number }>(`/api/courses/${slug}/lessons/${lessonKey}/progress`, {
        method: "PUT",
        body: JSON.stringify(body),
        keepalive: true,
      }).then((res) => {
        if (res.ok && res.data && typeof res.data.completed === "boolean") setCompleted({ key: lessonKey, value: res.data.completed });
        return res;
      });
    },
    [data?.enrolled, slug, lessonKey]
  );

  const onProgress = useCallback((sec: number) => void saveProgress({ positionSec: Math.floor(sec) }), [saveProgress]);
  const onEnded = useCallback(() => {
    saveProgress({ completed: true }).then(reloadCourse);
  }, [saveProgress, reloadCourse]);

  const toggleDone = async () => {
    setSavingDone(true);
    await saveProgress({ completed: !isDone });
    setSavingDone(false);
    reloadCourse();
  };

  if (!current) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (current.status !== "ok") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
          {current.status === "locked" ? "수강권이 필요한 차시예요" : "차시를 열 수 없어요"}
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{current.message}</p>
        <Link href={`/courses/${slug}`} className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
          강의 소개 보기
        </Link>
      </div>
    );
  }

  const d = current.data;
  const pb = playback?.key === lessonKey ? playback : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <Link href={`/courses/${slug}`} className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← {d.course.title}</Link>

        <div className="mt-4">
          {d.lesson.type === "video" &&
            (!d.lesson.hasVideo ? (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--surface)] text-sm text-[var(--foreground-muted)]">영상 준비 중이에요.</div>
            ) : !pb ? (
              <Skeleton className="aspect-video w-full" />
            ) : pb.value ? (
              <LessonPlayer key={lessonKey} playback={pb.value} startAt={d.progress.positionSec} onProgress={onProgress} onEnded={onEnded} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--surface)] px-6 text-center text-sm text-[var(--foreground-muted)]">{pb.error}</div>
            ))}
        </div>

        <p className="mt-6 text-sm font-semibold text-[var(--brand)]">
          {d.section.title} · {d.position.index + 1}/{d.position.total}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{d.lesson.title}</h1>
        {d.lesson.summary && <p className="mt-2 text-[var(--foreground-muted)]">{d.lesson.summary}</p>}

        {!d.enrolled && d.lesson.isPreview && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--brand-light)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--brand-ink)]">미리보기 중이에요. 나머지 차시는 수강 신청 후 볼 수 있어요.</p>
            <Link href={`/courses/${slug}`} className="text-sm font-bold text-[var(--brand)]">수강 신청 →</Link>
          </div>
        )}

        {d.lesson.body && (
          <div className="mt-8">
            <Markdown md={d.lesson.body} />
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--border-light)] pt-6">
          {d.enrolled && (
            <button
              onClick={toggleDone}
              disabled={savingDone}
              className={`inline-flex h-11 cursor-pointer items-center rounded-xl px-5 text-sm font-semibold disabled:opacity-60 ${isDone ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"}`}
            >
              {isDone ? "✓ 완료함" : "완료로 표시"}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {d.prev && (
              <Link href={`/learn/${slug}/${d.prev.key}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                ← 이전
              </Link>
            )}
            {d.next &&
              (d.next.locked ? (
                <Link href={`/courses/${slug}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground-subtle)]">
                  🔒 다음 차시
                </Link>
              ) : (
                <Link href={`/learn/${slug}/${d.next.key}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                  다음 차시 →
                </Link>
              ))}
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <p className="text-sm font-bold text-[var(--foreground)]">커리큘럼</p>
            {course?.enrollment?.active && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-muted)]">
                  <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${course.enrollment.progressPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-[var(--foreground-muted)]">{course.enrollment.progressPct}%</span>
              </div>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {course?.sections.flatMap((s) =>
              s.lessons.map((l) => {
                const here = l.key === lessonKey;
                const inner = (
                  <>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${l.completed ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-subtle)]"}`}>
                      {l.completed ? "✓" : l.locked ? "🔒" : "▶"}
                    </span>
                    <span className={`flex-1 text-sm ${here ? "font-bold text-[var(--brand)]" : "text-[var(--foreground)]"}`}>{l.title}</span>
                    <span className="text-xs text-[var(--foreground-subtle)]">{formatDuration(l.durationSec)}</span>
                  </>
                );
                return (
                  <li key={l.key} className="border-b border-[var(--border-light)] last:border-b-0">
                    {l.locked ? (
                      <div className="flex items-center gap-3 px-5 py-3 opacity-60">{inner}</div>
                    ) : (
                      <Link href={`/learn/${slug}/${l.key}`} className={`flex items-center gap-3 px-5 py-3 hover:bg-[var(--surface)] ${here ? "bg-[var(--surface)]" : ""}`}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
