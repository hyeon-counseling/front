"use client";

import { CoverImageField } from "@/components/admin/CoverImageField";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import { formatDuration, parseDuration, parseYoutubeId } from "@/lib/course";
import { Markdown } from "@/components/practice/Markdown";
import { Badge, Button, Input, Skeleton, Textarea, Toast } from "@/components/ui";
import { AudioEditor, CardsEditor, QuizEditor, type AudioValue, type QuizValue } from "@/components/course/LessonContentEditors";
import { PracticeBlocksEditor } from "@/components/admin/PracticeBlocksEditor";
import type { Block } from "@/lib/practice";
import type { TextCard } from "@/lib/lessonText";

// ─────────────────────────────────────────────────────────────────
// 관리자 — 강의 편집기
//   [기본 정보] (먼저 열림) 제목·소개·운영 상태·공개 범위(비공개=초대한 회원만)·시리즈·가격·수강 기간
//   [차시 구성] 섹션 → 차시(동영상/텍스트/오디오/퀴즈/요약카드) 편집, 순서 변경, 동영상·오디오 업로드
// 동영상: Cloudflare Stream 직접 업로드(200MB 이하) 또는 Stream 대시보드에서 올린 동영상 ID 붙여넣기.
//         Stream 도입 전 임시로 유튜브 '일부공개' 영상, 테스트용 직접 주소(https://…mp4)도 쓸 수 있다.
// ─────────────────────────────────────────────────────────────────

interface Video {
  provider: "stream" | "url" | "youtube";
  uid?: string | null;
  url?: string | null;
  youtubeId?: string | null;
  durationSec?: number | null;
  status?: "uploading" | "ready" | "error" | null;
}
interface Lesson {
  key: string;
  title: string;
  summary?: string;
  type: "video" | "text" | "audio" | "quiz" | "cards" | "practice" | "guided";
  isPreview?: boolean;
  label?: string;
  estMinutes?: number | null;
  blocks?: Block[];
  video?: Video | null;
  audio?: AudioValue | null;
  quiz?: QuizValue | null;
  cards?: TextCard[] | null;
  body?: string;
  /** guided 차시 — steps JSON */
  steps?: unknown[] | null;
  /** guided 차시 — 주차 점검 */
  check?: boolean;
}
interface Section {
  key: string;
  title: string;
  lessons: Lesson[];
}
interface CourseDoc {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string | null;
  instructor?: string;
  status: "draft" | "published" | "archived";
  visibility?: "public" | "private";
  seriesLabel?: string;
  completionRule?: { progressPct: number; quizAvg: number | null };
  completionCoupon?: { percent: number; validDays: number } | null;
  durationLabel?: string;
  price: number | null;
  salePrice: number | null;
  accessDays: number | null;
  sections: Section[];
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const BASIC_UPLOAD_LIMIT = 200 * 1024 * 1024; // Stream 기본 업로드 한도

function nextKey(used: string[], prefix: string) {
  let i = 1;
  while (used.includes(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export default function AdminCourseEditor() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<CourseDoc | null>(null);
  const [tab, setTab] = useState<"meta" | "lessons">("meta");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [streamReady, setStreamReady] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [openPractice, setOpenPractice] = useState<Record<string, boolean>>({}); // 쓰기 실습 내용 펼침

  useEffect(() => {
    apiFetch(`/api/admin/courses/${id}`).then(setDoc);
    apiFetch("/api/admin/courses/stream/config").then((c) => setStreamReady(!!c.configured)).catch(() => setStreamReady(false));
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (d: CourseDoc) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };
  const updateLesson = (si: number, li: number, fn: (l: Lesson) => void) => update((d) => fn(d.sections[si].lessons[li]));

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    setErrors([]);
    const { title, subtitle, description, coverImageUrl, instructor, status, visibility, seriesLabel, completionRule, completionCoupon, durationLabel, price, salePrice, accessDays, sections } = doc;
    const res = await apiRequest<{ errors?: string[] }>(`/api/admin/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title, subtitle, description, coverImageUrl, instructor, status,
        visibility: visibility ?? "public",
        seriesLabel: seriesLabel ?? "",
        durationLabel: durationLabel ?? "",
        completionRule: completionRule ?? { progressPct: 100, quizAvg: null },
        completionCoupon: completionCoupon ?? null,
        price, salePrice, accessDays, sections,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setToast("저장했어요.");
    } else setErrors(res.data?.errors ?? [res.message]);
  };

  const addSection = () =>
    update((d) => d.sections.push({ key: nextKey(d.sections.map((s) => s.key), "s"), title: `${d.sections.length + 1}부`, lessons: [] }));
  const addLesson = (si: number) =>
    update((d) =>
      d.sections[si].lessons.push({
        key: nextKey(d.sections.flatMap((s) => s.lessons.map((l) => l.key)), "l"),
        title: "새 차시",
        summary: "",
        type: "video",
        isPreview: false,
        video: { provider: "stream", uid: null, durationSec: null, status: null },
        body: "",
      })
    );
  const move = <T,>(arr: T[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  /** 동영상 상태·길이 확인 → 차시에 반영 */
  const checkStatus = async (si: number, li: number, uid: string) => {
    const res = await apiRequest<{ status: Video["status"]; durationSec: number | null }>(`/api/admin/courses/stream/${uid}`);
    if (!res.ok || !res.data) {
      setToast(res.message || "상태를 확인하지 못했어요.");
      return;
    }
    const { status, durationSec } = res.data;
    updateLesson(si, li, (l) => {
      l.video = { ...(l.video ?? { provider: "stream" }), provider: "stream", uid, status, durationSec };
    });
    setToast(status === "ready" ? "재생 준비 완료! 저장을 눌러 주세요." : status === "error" ? "인코딩 오류가 났어요. 다시 올려 주세요." : "아직 처리 중이에요. 잠시 후 다시 확인해 주세요.");
  };

  const upload = async (si: number, li: number, lesson: Lesson, file: File) => {
    if (file.size > BASIC_UPLOAD_LIMIT) {
      setToast("200MB가 넘는 파일은 Cloudflare Stream 대시보드에서 올린 뒤 동영상 ID를 붙여넣어 주세요.");
      return;
    }
    const res = await apiRequest<{ uploadURL: string; uid: string }>("/api/admin/courses/stream/direct-upload", {
      method: "POST",
      body: JSON.stringify({ name: `${doc?.slug}/${lesson.key} ${lesson.title}` }),
    });
    if (!res.ok || !res.data) {
      setToast(res.message || "업로드 주소를 받지 못했어요.");
      return;
    }
    const { uploadURL, uid } = res.data;
    updateLesson(si, li, (l) => {
      l.video = { provider: "stream", uid, status: "uploading", durationSec: null };
    });
    // 진행률을 보려고 XMLHttpRequest 사용 (fetch는 업로드 진행률을 주지 않음)
    const form = new FormData();
    form.append("file", file);
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadURL);
      xhr.upload.onprogress = (e) => e.lengthComputable && setUploading((u) => ({ ...u, [lesson.key]: Math.round((e.loaded / e.total) * 100) }));
      xhr.onload = () => {
        setUploading((u) => {
          const n = { ...u };
          delete n[lesson.key];
          return n;
        });
        setToast(xhr.status < 300 ? "업로드 완료! 인코딩에 몇 분 걸려요. 저장한 뒤 '상태 확인'을 눌러 주세요." : "업로드에 실패했어요.");
        resolve();
      };
      xhr.onerror = () => {
        setToast("업로드 중 연결이 끊겼어요.");
        resolve();
      };
      xhr.send(form);
    });
  };

  if (!doc) return <div className="p-10"><Skeleton className="h-96" /></div>;

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/lms/courses" className="text-sm text-[var(--foreground-subtle)]">← 강의 목록</Link>
          <h1 className="font-display mt-1 text-2xl">{doc.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-amber-600">저장하지 않은 변경</span>}
          <Link href={`/courses/${doc.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">
            미리보기
          </Link>
          <Button onClick={save} loading={saving}>저장</Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {([["meta", "기본 정보·판매"], ["lessons", "차시 구성"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold ${tab === k ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "meta" ? (
        <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Input id="t" label="제목" value={doc.title} onChange={(e) => update((d) => { d.title = e.target.value; })} />
            <Input id="st" label="부제" value={doc.subtitle ?? ""} onChange={(e) => update((d) => { d.subtitle = e.target.value; })} />
            <Input id="ins" label="강사" value={doc.instructor ?? ""} onChange={(e) => update((d) => { d.instructor = e.target.value; })} />
            <CoverImageField value={doc.coverImageUrl} onChange={(url) => update((d) => { d.coverImageUrl = url; })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">운영 상태</label>
              <div className="flex gap-2">
                {([["draft", "작성 중"], ["published", "운영 중"], ["archived", "보관"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => update((d) => { d.status = v; })} className={`h-10 flex-1 cursor-pointer rounded-xl text-sm font-semibold ${doc.status === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">공개 범위</label>
              <div className="flex gap-2">
                {([["public", "모두에게 보임"], ["private", "비공개 (초대한 회원만)"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => update((d) => { d.visibility = v; })} className={`h-10 flex-1 cursor-pointer rounded-xl text-sm font-semibold ${(doc.visibility ?? "public") === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {doc.visibility === "private" && (
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                  강의 목록·검색에 나오지 않고, 주소를 알아도 초대받지 않은 사람에게는 &lsquo;없는 강의&rsquo;로 보여요. 초대는{" "}
                  <Link href={`/admin/lms/courses/${doc._id}/enrollments`} className="font-semibold text-[var(--brand)] underline">수강생 관리</Link>
                  에서 이메일로 수강권을 주면 돼요.
                </p>
              )}
            </div>
            <Input id="series" label="시리즈 이름 (선택)" placeholder="예: 한양사이버 2026-2학기" value={doc.seriesLabel ?? ""} onChange={(e) => update((d) => { d.seriesLabel = e.target.value; })} />
            <div className="grid grid-cols-3 gap-3">
              <Input id="p" label="정가 (원)" inputMode="numeric" value={doc.price ?? ""} onChange={(e) => update((d) => { d.price = numOrNull(e.target.value); })} />
              <Input id="sp" label="할인가 (원)" inputMode="numeric" value={doc.salePrice ?? ""} onChange={(e) => update((d) => { d.salePrice = numOrNull(e.target.value); })} />
              <Input id="ad" label="수강 기간 (일)" inputMode="numeric" value={doc.accessDays ?? ""} onChange={(e) => update((d) => { d.accessDays = numOrNull(e.target.value); })} hint="비우면 무제한" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="crp"
                label="수료 기준: 진도율 (%)"
                inputMode="numeric"
                value={doc.completionRule?.progressPct ?? 100}
                onChange={(e) => update((d) => { d.completionRule = { progressPct: Math.max(1, Math.min(100, Number(e.target.value) || 1)), quizAvg: d.completionRule?.quizAvg ?? null }; })}
              />
              <Input
                id="crq"
                label="수료 기준: 퀴즈 평균 (점)"
                inputMode="numeric"
                value={doc.completionRule?.quizAvg ?? ""}
                placeholder="없음"
                hint="퀴즈 차시 최고점 평균. 비우면 보지 않아요."
                onChange={(e) => update((d) => { const v = e.target.value.trim(); d.completionRule = { progressPct: d.completionRule?.progressPct ?? 100, quizAvg: v === "" ? null : Math.max(1, Math.min(100, Number(v) || 1)) }; })}
              />
            </div>
            <p className="-mt-2 text-xs text-[var(--foreground-subtle)]">수료 기준을 채우면 수료증이 자동으로 발급돼요.</p>
            <div className="rounded-xl bg-[var(--surface)] p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="accent-[var(--brand)]"
                  checked={!!doc.completionCoupon}
                  onChange={(e) => update((d) => { d.completionCoupon = e.target.checked ? { percent: 10, validDays: 90 } : null; })}
                />
                수료하면 다른 강의 할인 쿠폰 주기
              </label>
              {doc.completionCoupon && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input id="ccp" label="할인율 (%)" inputMode="numeric" value={doc.completionCoupon.percent} onChange={(e) => update((d) => { d.completionCoupon = { ...d.completionCoupon!, percent: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }; })} />
                  <Input id="ccd" label="사용 기간 (일)" inputMode="numeric" value={doc.completionCoupon.validDays} onChange={(e) => update((d) => { d.completionCoupon = { ...d.completionCoupon!, validDays: Math.max(1, Number(e.target.value) || 1) }; })} />
                </div>
              )}
              <p className="mt-2 text-xs text-[var(--foreground-subtle)]">처음 수료한 회원에게 한 번, 이 강의를 뺀 강의에 쓸 수 있는 개인 쿠폰이 자동 발급돼요.</p>
            </div>
            <Input id="dl" label="기간 표시 (선택)" placeholder="예: 8주 과정" value={doc.durationLabel ?? ""} onChange={(e) => update((d) => { d.durationLabel = e.target.value; })} />
            <Textarea id="desc" label="소개 (마크다운)" className="min-h-[320px] font-mono text-sm" value={doc.description} onChange={(e) => update((d) => { d.description = e.target.value; })} />
          </div>
          <div className="card p-6">
            <p className="mb-3 text-xs font-semibold text-[var(--foreground-subtle)]">소개 미리보기</p>
            <Markdown md={doc.description} />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl space-y-6">
          {streamReady === false && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Cloudflare Stream이 아직 설정되지 않았어요(서버 환경변수 CF_STREAM_*). 그 전까지는 차시마다 &lsquo;YouTube 일부공개(임시)&rsquo;나 &lsquo;직접 주소&rsquo;로 영상을 연결할 수 있어요.
            </div>
          )}

          {doc.sections.map((s, si) => (
            <div key={s.key} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={s.title}
                  onChange={(e) => update((d) => { d.sections[si].title = e.target.value; })}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-lg font-bold"
                />
                <Button size="sm" variant="ghost" onClick={() => update((d) => move(d.sections, si, -1))}>↑</Button>
                <Button size="sm" variant="ghost" onClick={() => update((d) => move(d.sections, si, 1))}>↓</Button>
                <Button size="sm" variant="danger" onClick={() => confirm("섹션과 그 안의 차시를 모두 지울까요?") && update((d) => { d.sections.splice(si, 1); })}>
                  섹션 삭제
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {s.lessons.map((l, li) => {
                  const v = l.video ?? { provider: "stream" as const };
                  const pct = uploading[l.key];
                  return (
                    <div key={l.key} className="rounded-2xl border border-[var(--border)] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--foreground-subtle)]">{l.key}</span>
                        <input
                          value={l.title}
                          onChange={(e) => updateLesson(si, li, (x) => { x.title = e.target.value; })}
                          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 py-2 font-semibold"
                        />
                        <Button size="sm" variant="ghost" onClick={() => update((d) => move(d.sections[si].lessons, li, -1))}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => update((d) => move(d.sections[si].lessons, li, 1))}>↓</Button>
                        <Button size="sm" variant="danger" onClick={() => confirm("차시를 지울까요?") && update((d) => { d.sections[si].lessons.splice(li, 1); })}>삭제</Button>
                      </div>
                      <input
                        value={l.summary ?? ""}
                        placeholder="한 줄 설명"
                        onChange={(e) => updateLesson(si, li, (x) => { x.summary = e.target.value; })}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          종류
                          <select
                            value={l.type}
                            onChange={(e) =>
                              updateLesson(si, li, (x) => {
                                x.type = e.target.value as Lesson["type"];
                                if (x.type === "audio" && !x.audio) x.audio = { provider: "r2", key: null, durationSec: null };
                                if (x.type === "quiz" && !x.quiz) x.quiz = { passScore: 60, questions: [] };
                                if (x.type === "cards" && !x.cards) x.cards = [];
                                if (x.type === "practice" && !x.blocks) x.blocks = [];
                                if (x.type === "guided" && !x.steps) x.steps = [];
                              })
                            }
                            className="rounded-lg border border-[var(--border)] px-2 py-1"
                          >
                            <option value="video">동영상</option>
                            <option value="text">텍스트</option>
                            <option value="audio">오디오 (팟캐스트)</option>
                            <option value="quiz">퀴즈 (예상문제)</option>
                            <option value="cards">요약카드</option>
                            <option value="practice">쓰기 실습</option>
                            <option value="guided">대화형 레슨</option>
                          </select>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={!!l.isPreview} onChange={(e) => updateLesson(si, li, (x) => { x.isPreview = e.target.checked; })} className="accent-[var(--brand)]" />
                          무료 체험 (누구나 보기 · 로그인하면 기록 저장)
                        </label>
                      </div>

                      {l.type === "video" && (
                        <div className="mt-3 rounded-xl bg-[var(--surface)] p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input type="radio" checked={v.provider === "stream"} onChange={() => updateLesson(si, li, (x) => { x.video = { ...v, provider: "stream" }; })} />
                              Cloudflare Stream
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" checked={v.provider === "youtube"} onChange={() => updateLesson(si, li, (x) => { x.video = { ...v, provider: "youtube" }; })} />
                              YouTube 일부공개 (임시)
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" checked={v.provider === "url"} onChange={() => updateLesson(si, li, (x) => { x.video = { ...v, provider: "url" }; })} />
                              직접 주소 (테스트용)
                            </label>
                            {v.durationSec ? <Badge tone="neutral">{formatDuration(v.durationSec, true)}</Badge> : null}
                            {v.provider === "stream" && v.status && (
                              <Badge tone={v.status === "ready" ? "brand" : v.status === "error" ? "error" : "warning"}>
                                {v.status === "ready" ? "재생 준비됨" : v.status === "error" ? "오류" : "처리 중"}
                              </Badge>
                            )}
                          </div>

                          {v.provider === "stream" ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <input
                                value={v.uid ?? ""}
                                placeholder="동영상 ID (32자리)"
                                onChange={(e) => updateLesson(si, li, (x) => { x.video = { ...v, provider: "stream", uid: e.target.value.trim() || null }; })}
                                className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 font-mono text-xs"
                              />
                              <label className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold ${streamReady ? "cursor-pointer bg-[var(--brand)] text-white" : "cursor-not-allowed bg-[var(--surface-muted)] text-[var(--foreground-subtle)]"}`}>
                                {pct !== undefined ? `업로드 ${pct}%` : "영상 올리기"}
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  disabled={!streamReady || pct !== undefined}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = "";
                                    if (f) upload(si, li, l, f);
                                  }}
                                />
                              </label>
                              {v.uid && streamReady && (
                                <Button size="sm" variant="secondary" onClick={() => checkStatus(si, li, v.uid!)}>상태 확인</Button>
                              )}
                            </div>
                          ) : v.provider === "youtube" ? (
                            <div className="mt-3">
                              <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                                <input
                                  value={v.youtubeId ?? ""}
                                  placeholder="유튜브 주소 붙여넣기 (https://youtu.be/…)"
                                  onChange={(e) => {
                                    const raw = e.target.value.trim();
                                    updateLesson(si, li, (x) => { x.video = { ...v, provider: "youtube", youtubeId: parseYoutubeId(raw) ?? (raw || null) }; });
                                  }}
                                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 font-mono text-xs"
                                />
                                <input
                                  key={`${l.key}-yt-dur-${v.durationSec ?? ""}`}
                                  defaultValue={v.durationSec ? formatDuration(v.durationSec, true) : ""}
                                  placeholder="길이 예: 10:25"
                                  onBlur={(e) => {
                                    const sec = parseDuration(e.target.value);
                                    updateLesson(si, li, (x) => { x.video = { ...v, provider: "youtube", durationSec: sec }; });
                                  }}
                                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs"
                                />
                              </div>
                              {v.youtubeId && parseYoutubeId(v.youtubeId) ? (
                                <div className="mt-2 flex items-center gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="h-14 w-24 rounded-lg object-cover" />
                                  <span className="text-xs text-[var(--foreground-muted)]">영상 ID {v.youtubeId} · 길이를 넣어야 90% 시청 시 자동 완료돼요.</span>
                                </div>
                              ) : v.youtubeId ? (
                                <p className="mt-2 text-xs text-[var(--error)]">유튜브 주소를 알아보지 못했어요. 영상의 [공유] 주소를 그대로 붙여넣어 주세요.</p>
                              ) : null}
                              <p className="mt-2 text-xs text-amber-700">
                                유튜브에 <strong>일부공개</strong>로 올려 주세요(비공개는 재생 안 됨). 주소를 아는 사람은 볼 수 있어서 정식 판매 전에 Stream으로 바꾸는 걸 권해요.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                              <input
                                value={v.url ?? ""}
                                placeholder="https://…/video.mp4"
                                onChange={(e) => updateLesson(si, li, (x) => { x.video = { ...v, provider: "url", url: e.target.value.trim() || null }; })}
                                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs"
                              />
                              <input
                                inputMode="numeric"
                                value={v.durationSec ?? ""}
                                placeholder="길이(초)"
                                onChange={(e) => updateLesson(si, li, (x) => { x.video = { ...v, provider: "url", durationSec: numOrNull(e.target.value) }; })}
                                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {l.type === "audio" && (
                        <AudioEditor
                          key={`${l.key}-audio`}
                          value={l.audio ?? { provider: "r2" }}
                          onChange={(a) => updateLesson(si, li, (x) => { x.audio = a; })}
                          onToast={setToast}
                        />
                      )}
                      {l.type === "quiz" && (
                        <QuizEditor key={`${l.key}-quiz`} value={l.quiz ?? { passScore: 60, questions: [] }} onChange={(q) => updateLesson(si, li, (x) => { x.quiz = q; })} />
                      )}
                      {l.type === "cards" && (
                        <CardsEditor key={`${l.key}-cards`} value={l.cards ?? []} onChange={(c) => updateLesson(si, li, (x) => { x.cards = c; })} />
                      )}
                      {l.type === "practice" && (
                        <div className="mt-3 rounded-xl bg-[var(--surface)] p-3 text-sm">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="w-32">
                              <Input id={`${l.key}-label`} label="머리표" placeholder="예: Day 1" value={l.label ?? ""} onChange={(e) => updateLesson(si, li, (x) => { x.label = e.target.value; })} />
                            </div>
                            <div className="w-28">
                              <Input id={`${l.key}-min`} label="예상(분)" inputMode="numeric" value={l.estMinutes ?? ""} onChange={(e) => updateLesson(si, li, (x) => { x.estMinutes = numOrNull(e.target.value); })} />
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => setOpenPractice((o) => ({ ...o, [l.key]: !o[l.key] }))}>
                              {openPractice[l.key] ? "내용 접기" : `내용 편집 (블록 ${l.blocks?.length ?? 0}개)`}
                            </Button>
                            <Link href={`/learn/${doc.slug}/${l.key}`} target="_blank" className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-xs font-semibold">회원 화면 ↗</Link>
                          </div>
                          {openPractice[l.key] && (
                            <div className="mt-4">
                              <PracticeBlocksEditor
                                blocks={l.blocks ?? []}
                                keyBase={l.key}
                                usedKeys={new Set(doc.sections.flatMap((ss) => ss.lessons.flatMap((ll) => (ll.blocks ?? []).map((b) => b.key))))}
                                onChange={(next) => updateLesson(si, li, (x) => { x.blocks = next; })}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {l.type === "guided" && (
                        <GuidedLessonEditor
                          lessonKey={l.key}
                          steps={l.steps ?? []}
                          check={!!l.check}
                          label={l.label ?? ""}
                          estMinutes={l.estMinutes ?? null}
                          onChangeSteps={(steps) => updateLesson(si, li, (x) => { x.steps = steps; })}
                          onChangeCheck={(v) => updateLesson(si, li, (x) => { x.check = v; })}
                          onChangeLabel={(v) => updateLesson(si, li, (x) => { x.label = v; })}
                          onChangeMin={(v) => updateLesson(si, li, (x) => { x.estMinutes = v; })}
                        />
                      )}

                      {l.type !== "practice" && l.type !== "guided" && <textarea
                        value={l.body ?? ""}
                        placeholder={
                          l.type === "text"
                            ? "본문 (마크다운)"
                            : l.type === "video"
                              ? "영상 아래 설명·자료 (선택, 마크다운)"
                              : l.type === "audio"
                                ? "오디오 아래 설명·요점 (선택, 마크다운)"
                                : "시작 전 안내 (선택, 마크다운)"
                        }
                        onChange={(e) => updateLesson(si, li, (x) => { x.body = e.target.value; })}
                        className="mt-3 min-h-[80px] w-full rounded-xl border border-[var(--border)] px-3 py-2 font-mono text-xs"
                      />}
                    </div>
                  );
                })}
                <Button variant="secondary" onClick={() => addLesson(si)}>+ 차시 추가</Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addSection}>+ 섹션 추가</Button>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GuidedLessonEditor — steps JSON 편집기 + 주차 점검 체크박스 + 읽기형 미리보기
// ─────────────────────────────────────────────────────────────────────────────

import { GuidedReadView } from "@/components/guided/GuidedReadView";
import type { Step } from "@/lib/guided";

interface GuidedLessonEditorProps {
  lessonKey: string;
  steps: unknown[];
  check: boolean;
  label: string;
  estMinutes: number | null;
  onChangeSteps: (steps: unknown[]) => void;
  onChangeCheck: (v: boolean) => void;
  onChangeLabel: (v: string) => void;
  onChangeMin: (v: number | null) => void;
}

function GuidedLessonEditor({
  lessonKey,
  steps,
  check,
  label,
  estMinutes,
  onChangeSteps,
  onChangeCheck,
  onChangeLabel,
  onChangeMin,
}: GuidedLessonEditorProps) {
  const [raw, setRaw] = useState(JSON.stringify(steps, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleRawChange = (v: string) => {
    setRaw(v);
    try {
      const parsed = JSON.parse(v);
      if (!Array.isArray(parsed)) throw new Error("최상위는 배열이어야 해요");
      setParseError(null);
      onChangeSteps(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "JSON 형식 오류");
    }
  };

  // steps 요약
  const summary = (() => {
    const asks = steps.filter((s) => typeof s === "object" && s !== null && "ask" in (s as object));
    const quizzes = steps.filter((s) => typeof s === "object" && s !== null && "quiz" in (s as object));
    return `${steps.length}개 스텝 · 입력 ${asks.length}개 · 퀴즈 ${quizzes.length}개`;
  })();

  const safeSteps = parseError ? [] : (steps as Step[]);

  return (
    <div className="mt-3 rounded-xl bg-[var(--surface)] p-3 text-sm">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Input id={`${lessonKey}-gl-label`} label="머리표" placeholder="예: 입구 1" value={label} onChange={(e) => onChangeLabel(e.target.value)} />
        </div>
        <div className="w-28">
          <Input id={`${lessonKey}-gl-min`} label="예상(분)" inputMode="numeric" value={estMinutes ?? ""} onChange={(e) => onChangeMin(e.target.value.trim() === "" ? null : Number(e.target.value))} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={check}
            onChange={(e) => onChangeCheck(e.target.checked)}
            className="accent-[var(--brand)]"
          />
          주차 점검 (완료 시 햇살 15)
        </label>
        <Button size="sm" variant="secondary" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? "미리보기 닫기" : "읽기형 미리보기"}
        </Button>
      </div>

      <p className="mb-1 text-xs text-[var(--foreground-subtle)]">{summary}</p>
      <textarea
        value={raw}
        onChange={(e) => handleRawChange(e.target.value)}
        rows={16}
        spellCheck={false}
        placeholder='[{ "h": "안녕하세요" }, { "s": "안녕!", "r": true }]'
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none focus-visible:border-[var(--brand)]"
      />
      {parseError && (
        <p className="mt-1 text-xs text-[var(--error)]">JSON 오류: {parseError}</p>
      )}

      {showPreview && safeSteps.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--foreground-subtle)]">읽기형 미리보기 (저장 없음)</p>
          <GuidedReadView
            slug="__preview__"
            lessonKey={lessonKey}
            steps={safeSteps}
            check={check}
            preview
          />
        </div>
      )}
    </div>
  );
}
