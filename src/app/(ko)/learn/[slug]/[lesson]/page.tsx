"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { formatDuration, LESSON_TYPE_LABEL, type CourseDetail, type LessonResponse, type Playback } from "@/lib/course";
import { Markdown } from "@/components/practice/Markdown";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { AudioPlayer } from "@/components/course/AudioPlayer";
import { QuizLesson } from "@/components/course/QuizLesson";
import { CardsLesson } from "@/components/course/CardsLesson";
import { LessonQA } from "@/components/course/LessonQA";
import { LearnShell, type LearnNavGroup } from "@/components/learn/LearnShell";
import { Callout } from "@/components/practice/Markdown";
import { ExerciseBlock } from "@/components/practice/ExerciseBlock";
import { RewardModal } from "@/components/course/RewardModal";
import { GuidedLesson } from "@/components/guided/GuidedLesson";
import { GuidedChatView } from "@/components/guided/GuidedChatView";
import { practiceToSteps } from "@/lib/practiceToSteps";
import type { CouponView } from "@/lib/payment";
import { Skeleton } from "@/components/ui";

// localStorage 키 — 쓰기 실습 대화형 선택 기억
const PRACTICE_MODE_KEY = "practice-chat-mode";

type LessonState = { status: "ok"; data: LessonResponse } | { status: "locked"; message: string } | { status: "error"; message: string };

// 강의 수강 화면 — 왼쪽 목차(섹션·차시) · 영상/오디오 플레이어 · 퀴즈 · 요약카드 · 쓰기 실습 · 이어보기 · 진도 저장 · 완료 · 이전/다음
// 무료 체험 차시는 로그인하면 수강권이 없어도 진도·기록이 저장된다(체험 수강권)
export default function LearnPage() {
  const { slug, lesson: lessonKey } = useParams<{ slug: string; lesson: string }>();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<{ key: string; value: LessonState } | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [playback, setPlayback] = useState<{ key: string; value: Playback | null; error: string } | null>(null);
  const [completed, setCompleted] = useState<{ key: string; value: boolean } | null>(null);
  const [savingDone, setSavingDone] = useState(false);
  const [reward, setReward] = useState<CouponView | null>(null); // 수료 쿠폰
  // 쓰기 실습 대화형 모드 (quiet 강의는 항상 한 페이지)
  const [practiceChat, setPracticeChat] = useState<boolean>(() => {
    try { return localStorage.getItem(PRACTICE_MODE_KEY) === "1"; } catch { return false; }
  });

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
  // 기록을 남길 수 있는가 — 수강권이 있거나, 로그인하고 무료 체험 차시를 보는 중
  const canTrack = !!data && (data.enrolled || (!!user && data.lesson.isPreview));

  // 목차 그룹 — 이 화면에서 완료가 바뀌면 바로 반영
  const groups = useMemo<LearnNavGroup[] | null>(
    () =>
      course
        ? course.sections.map((s) => ({
            key: s.key,
            title: s.title,
            badge: !course.enrollment?.active && s.lessons.length > 0 && s.lessons.every((l) => l.isPreview) ? "무료" : undefined,
            items: s.lessons.map((l) => ({
              key: l.key,
              href: `/learn/${slug}/${l.key}`,
              label: l.label || undefined,
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
      {reward && <RewardModal coupon={reward} onClose={() => setReward(null)} />}
    </LearnShell>
  );

  const saveProgress = useCallback(
    (body: { positionSec?: number; completed?: boolean }) => {
      if (!canTrack) return Promise.resolve(null);
      return apiRequest<{ completed: boolean; progressPct: number; reward?: { coupon: CouponView } | null }>(`/api/courses/${slug}/lessons/${lessonKey}/progress`, {
        method: "PUT",
        body: JSON.stringify(body),
        keepalive: true,
      }).then((res) => {
        if (res.ok && res.data && typeof res.data.completed === "boolean") setCompleted({ key: lessonKey, value: res.data.completed });
        if (res.ok && res.data?.reward?.coupon) setReward(res.data.reward.coupon);
        return res;
      });
    },
    [canTrack, slug, lessonKey]
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

  // 쓰기 실습 대화형 전환 — localStorage에 선택 기억
  const switchPracticeMode = (chat: boolean) => {
    setPracticeChat(chat);
    try { localStorage.setItem(PRACTICE_MODE_KEY, chat ? "1" : "0"); } catch { /* 무시 */ }
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
        {(d.lesson.label || d.lesson.type === "practice") && (
          <div className="mt-3 flex items-center gap-2">
            {d.lesson.label && <span className="rounded-lg bg-[var(--brand)] px-2.5 py-1 text-xs font-bold text-white">{d.lesson.label}</span>}
            {d.lesson.type === "practice" && d.lesson.durationSec ? <span className="text-xs text-[var(--foreground-subtle)]">약 {Math.round(d.lesson.durationSec / 60)}분</span> : null}
            {isDone && <span className="text-xs font-semibold text-[var(--brand)]">✓ 완료</span>}
          </div>
        )}
        <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{d.lesson.title}</h1>
        {d.lesson.summary && <p className="mt-2 text-[var(--foreground-muted)]">{d.lesson.summary}</p>}

        {!d.enrolled && d.lesson.isPreview && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--brand-light)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--brand-ink)]">
              {user ? "무료 체험 중이에요. 적은 내용과 진도는 저장되고, 수강 신청하면 그대로 이어져요." : "무료 체험 차시예요. 로그인하면 적은 내용과 진도가 저장돼요."}
            </p>
            {user ? (
              <Link href={`/courses/${slug}`} className="text-sm font-bold text-[var(--brand)]">수강 신청 →</Link>
            ) : (
              <Link href={`/login?next=/learn/${slug}/${lessonKey}`} className="text-sm font-bold text-[var(--brand)]">로그인 →</Link>
            )}
          </div>
        )}

        {d.lesson.body && (
          <div className="mt-8">
            <Markdown md={d.lesson.body} />
          </div>
        )}

        {d.lesson.type === "practice" && (
          <div className="mt-8">
            {/* quiet 강의(pro)가 아닐 때만 전환 토글 표시 */}
            {!d.quiet && (
              <div className="mb-6 flex items-center gap-1 rounded-2xl bg-[var(--surface)] p-1">
                <button
                  type="button"
                  onClick={() => switchPracticeMode(false)}
                  className={`flex-1 cursor-pointer rounded-xl py-2 text-sm font-semibold transition-colors ${
                    !practiceChat
                      ? "bg-white text-[var(--foreground)] shadow-sm"
                      : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                  }`}
                >
                  한 페이지로 보기
                </button>
                <button
                  type="button"
                  onClick={() => switchPracticeMode(true)}
                  className={`flex-1 cursor-pointer rounded-xl py-2 text-sm font-semibold transition-colors ${
                    practiceChat
                      ? "bg-white text-[var(--foreground)] shadow-sm"
                      : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                  }`}
                >
                  숨이와 대화로 하기
                </button>
              </div>
            )}

            {/* 대화형 모드: GuidedChatView로 변환된 steps 렌더링 */}
            {practiceChat && !d.quiet ? (
              <GuidedChatView
                key={`practice-chat-${lessonKey}`}
                slug={slug}
                lessonKey={lessonKey}
                lessonTitle={d.lesson.title}
                lessonLabel={d.lesson.label}
                lessonMin={d.lesson.estMinutes ?? (d.lesson.durationSec ? Math.round(d.lesson.durationSec / 60) : undefined)}
                steps={practiceToSteps(
                  { title: d.lesson.title, sumi: d.lesson.sumi },
                  d.lesson.blocks ?? []
                )}
                initialEntries={d.entries ?? {}}
                canSave={canTrack}
                isDone={isDone}
                onCompleted={() => {
                  setCompleted({ key: lessonKey, value: true });
                  reloadCourse();
                }}
                onNext={d.next && !d.next.locked ? () => { window.location.href = `/learn/${slug}/${d.next!.key}`; } : undefined}
              />
            ) : (
              /* 한 페이지 모드 (기본) */
              <div className="space-y-8">
                {(d.lesson.blocks ?? []).map((b) =>
                  b.type === "text" ? (
                    <Markdown key={b.key} md={b.md ?? ""} />
                  ) : b.type === "callout" ? (
                    <Callout key={b.key} block={b} />
                  ) : (
                    <ExerciseBlock
                      key={`${lessonKey}-${b.key}`}
                      saveUrl={`/api/courses/${slug}/lessons/${lessonKey}/entries/${b.key}`}
                      block={b}
                      initial={d.entries?.[b.key]}
                      canSave={canTrack}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {d.lesson.type === "quiz" && d.lesson.quiz && (
          <div className="mt-8">
            <QuizLesson
              key={lessonKey}
              endpoint={`/api/courses/${slug}/lessons/${lessonKey}/quiz`}
              quiz={d.lesson.quiz}
              enrolled={canTrack}
              best={d.progress.quizBest ?? null}
              attempts={d.progress.quizAttempts ?? 0}
              onGraded={(r) => r.saved && onLessonSaved(r.passed)}
            />
          </div>
        )}

        {d.lesson.type === "guided" && d.lesson.steps && d.lesson.steps.length > 0 && (
          <div className="mt-8">
            <GuidedLesson
              key={lessonKey}
              slug={slug}
              lessonKey={lessonKey}
              lessonTitle={d.lesson.title}
              lessonLabel={d.lesson.label}
              lessonMin={d.lesson.estMinutes ?? (d.lesson.durationSec ? Math.max(1, Math.round(d.lesson.durationSec / 60)) : undefined)}
              steps={d.lesson.steps}
              check={d.lesson.check}
              gad7Def={d.lesson.gad7}
              initialEntries={d.entries ?? {}}
              canSave={canTrack}
              isDone={isDone}
              onCompleted={(sun) => {
                setCompleted({ key: lessonKey, value: true });
                reloadCourse();
                if (sun) {
                  // 햇살 보상은 GuidedLesson 내부에서 표시
                }
              }}
              onNext={d.next && !d.next.locked ? () => window.location.href = `/learn/${slug}/${d.next!.key}` : undefined}
            />
          </div>
        )}

        {d.lesson.type === "cards" && d.lesson.cards && (
          <div className="mt-8">
            <CardsLesson
              key={lessonKey}
              endpoint={`/api/courses/${slug}/lessons/${lessonKey}/cards`}
              cards={d.lesson.cards}
              enrolled={canTrack}
              initialKnown={d.progress.cardsKnown ?? []}
              onSaved={onLessonSaved}
            />
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--border-light)] pt-6">
          {canTrack && d.lesson.type === "quiz" && (
            <span className={`inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold ${isDone ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground-muted)]"}`}>
              {isDone ? "✓ 합격·완료" : `합격(${d.lesson.quiz?.passScore ?? 60}점 이상)하면 완료돼요`}
            </span>
          )}
          {canTrack && d.lesson.type !== "quiz" && d.lesson.type !== "guided" && (
            <button
              onClick={toggleDone}
              disabled={savingDone}
              className={`inline-flex h-11 cursor-pointer items-center rounded-xl px-5 text-sm font-semibold disabled:opacity-60 ${
                isDone
                  ? "bg-[var(--brand-light)] text-[var(--brand)]"
                  : d.lesson.type === "practice"
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                    : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {isDone ? "✓ 완료함" : d.lesson.type === "practice" ? `${d.lesson.label || "오늘"} 완료하기` : "완료로 표시"}
            </button>
          )}
          {!user && d.lesson.type === "practice" && (
            <Link href={`/login?next=/learn/${slug}/${lessonKey}`} className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
              로그인하고 기록하기
            </Link>
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

        {d.enrolled && <LessonQA key={lessonKey} slug={slug} lessonKey={lessonKey} />}
      </div>

    </div>
  );
}
