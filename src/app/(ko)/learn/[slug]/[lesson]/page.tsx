"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatDuration, LESSON_TYPE_LABEL, type CourseDetail, type LessonResponse, type Playback } from "@/lib/course";
import { Markdown } from "@/components/workbook/Markdown";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { AudioPlayer } from "@/components/course/AudioPlayer";
import { QuizLesson } from "@/components/course/QuizLesson";
import { CardsLesson } from "@/components/course/CardsLesson";
import { LearnShell, type LearnNavGroup } from "@/components/learn/LearnShell";
import { Skeleton } from "@/components/ui";

type LessonState = { status: "ok"; data: LessonResponse } | { status: "locked"; message: string } | { status: "error"; message: string };

// 강의 수강 화면 — 왼쪽 목차(섹션·차시) · 영상/오디오 플레이어 · 퀴즈 · 요약카드 · 이어보기 · 진도 저장 · 완료 · 이전/다음
export default function LearnPage() {
  const { slug, lesson: lessonKey } = useParams<{ slug: string; lesson: string }>();
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<{ key: string; value: LessonState } | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [playback, setPlayback] = useState<{ key: string; value: Playback | null; error: string } | null>(null);
  const [completed, setCompleted] = useState<{ key: string; value: boolean } | null>(null);
  const [savingDone, setSavingDone] = useState(false);

  // 재생 주소 (오디오 서명 주소가 만료되면 다시 호출)
  const loadPlayback = useCallback(() => {
    apiRequest<Playback>(`/api/courses/${slug}/lessons/${lessonKey}/playback`).then((p) =>
      setPlayback({ key: lessonKey, value: p.ok ? p.data : null, error: p.ok ? "" : p.message || "재생 주소를 불러오지 못했어요." })
    );
  }, [slug, lessonKey]);

  useEffect(() => {
    if (authLoading) return;
    apiRequest<LessonResponse>(`/api/courses/${slug}/lessons/${lessonKey}`).then((res) => {
      const value: LessonState = res.ok && res.data
        ? { status: "ok", data: res.data }
        : res.status === 403
          ? { status: "locked", message: res.message }
          : { status: "error", message: res.message || "차시를 불러오지 못했어요." };
      setState({ key: lessonKey, value });
      if (value.status === "ok" && (value.data.lesson.hasVideo || value.data.lesson.hasAudio)) loadPlayback();
    });
  }, [authLoading, slug, lessonKey, loadPlayback]);

  const reloadCourse = useCallback(() => {
    apiRequest<CourseDetail>(`/api/courses/${slug}`).then((res) => res.ok && res.data && setCourse(res.data));
  }, [slug]);
  useEffect(() => {
    if (!authLoading) reloadCourse();
  }, [authLoading, reloadCourse, lessonKey]);

  const current = state?.key === lessonKey ? state.value : null;
  const data = current?.status === "ok" ? current.data : null;
  const isDone = completed?.key === lessonKey ? completed.value : !!data?.progress.completed;

  // 목차 그룹 — 이 화면에서 완료가 바뀌면 바로 반영
  const groups = useMemo<LearnNavGroup[] | null>(
    () =>
      course
        ? course.sections.map((s) => ({
            key: s.key,
            title: s.title,
            items: s.lessons.map((l) => ({
              key: l.key,
              href: `/learn/${slug}/${l.key}`,
              title: l.title,
              meta: formatDuration(l.durationSec) || (l.type === "quiz" || l.type === "cards" ? LESSON_TYPE_LABEL[l.type] : undefined),
              completed: l.key === lessonKey ? isDone : l.completed,
              locked: l.locked,
            })),
          }))
        : null,
    [course, slug, lessonKey, isDone]
  );

  const shell = (content: ReactNode) => (
    <LearnShell
      title={course?.title ?? data?.course.title ?? "강의"}
      backHref={`/courses/${slug}`}
      lockedHref={`/courses/${slug}`}
      groups={groups}
      currentKey={lessonKey}
      prevHref={data?.prev ? `/learn/${slug}/${data.prev.key}` : null}
      nextHref={data?.next && !data.next.locked ? `/learn/${slug}/${data.next.key}` : null}
    >
      {content}
    </LearnShell>
  );

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
  // 퀴즈 합격·카드 완료 → 완료 표시와 목차 갱신
  const onLessonSaved = useCallback(
    (done: boolean) => {
      if (done) setCompleted({ key: lessonKey, value: true });
      reloadCourse();
    },
    [lessonKey, reloadCourse]
  );

  const toggleDone = async () => {
    setSavingDone(true);
    await saveProgress({ completed: !isDone });
    setSavingDone(false);
    reloadCourse();
  };

  if (!current) {
    return shell(
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (current.status !== "ok") {
    return shell(
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

  return shell(
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
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
          {d.lesson.type === "audio" &&
            (!d.lesson.hasAudio ? (
              <div className="rounded-2xl bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--foreground-muted)]">오디오 준비 중이에요.</div>
            ) : !pb ? (
              <Skeleton className="h-56 w-full" />
            ) : pb.value?.kind === "audio" ? (
              <AudioPlayer
                src={pb.value.url}
                title={d.lesson.title}
                subtitle={`${d.course.title} · ${d.section.title}`}
                startAt={d.progress.positionSec}
                durationHint={d.lesson.durationSec}
                onProgress={onProgress}
                onEnded={onEnded}
                onReload={loadPlayback}
              />
            ) : (
              <div className="rounded-2xl bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--foreground-muted)]">{pb.error || "오디오를 불러오지 못했어요."}</div>
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

        {d.lesson.type === "quiz" && d.lesson.quiz && (
          <div className="mt-8">
            <QuizLesson
              key={lessonKey}
              endpoint={`/api/courses/${slug}/lessons/${lessonKey}/quiz`}
              quiz={d.lesson.quiz}
              enrolled={d.enrolled}
              best={d.progress.quizBest ?? null}
              attempts={d.progress.quizAttempts ?? 0}
              onGraded={(r) => r.saved && onLessonSaved(r.passed)}
            />
          </div>
        )}

        {d.lesson.type === "cards" && d.lesson.cards && (
          <div className="mt-8">
            <CardsLesson
              key={lessonKey}
              endpoint={`/api/courses/${slug}/lessons/${lessonKey}/cards`}
              cards={d.lesson.cards}
              enrolled={d.enrolled}
              initialKnown={d.progress.cardsKnown ?? []}
              onSaved={onLessonSaved}
            />
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--border-light)] pt-6">
          {d.enrolled && d.lesson.type === "quiz" && (
            <span className={`inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold ${isDone ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground-muted)]"}`}>
              {isDone ? "✓ 합격·완료" : `합격(${d.lesson.quiz?.passScore ?? 60}점 이상)하면 완료돼요`}
            </span>
          )}
          {d.enrolled && d.lesson.type !== "quiz" && (
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

    </div>
  );
}
