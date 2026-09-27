"use client";

import { useMemo, useState } from "react";
import { formatDuration, parseDuration } from "@/lib/course";
import { cardsToText, parseCardsText, parseQuizText, quizToText, type TextCard, type TextQuizQuestion } from "@/lib/lessonText";
import { Badge } from "@/components/ui";

/**
 * 관리자 강의 편집기 — 오디오·퀴즈·요약카드 차시의 내용 편집 칸
 * 퀴즈·카드는 글(마크다운)로 편집하고 바로 문항·카드로 바꿔 보여준다. (한양사이버 예상문제·Logseq 요약을 그대로 붙여넣기 가능)
 */

export interface AudioValue {
  provider: "r2" | "url";
  key?: string | null;
  url?: string | null;
  durationSec?: number | null;
}
export interface QuizValue {
  passScore: number;
  questions: TextQuizQuestion[];
}

const box = "mt-3 rounded-xl bg-[var(--surface)] p-3 text-sm";
const field = "rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs";
const MAX_AUDIO = 80 * 1024 * 1024;

/** 로컬 파일의 재생 길이(초) — 브라우저가 메타데이터만 읽는다 */
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : null);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    a.src = url;
  });
}

// ── 오디오 ──
export function AudioEditor({ value, onChange, onToast }: { value: AudioValue; onChange: (v: AudioValue) => void; onToast: (m: string) => void }) {
  const [pct, setPct] = useState<number | null>(null);

  const upload = async (file: File) => {
    if (file.size > MAX_AUDIO) {
      onToast("80MB 이하 오디오만 올릴 수 있어요. 128kbps mp3로 바꾸면 25분 기준 약 24MB예요.");
      return;
    }
    const durationSec = await readDuration(file);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const form = new FormData();
    form.append("file", file);
    setPct(0);
    const res = await new Promise<{ ok: boolean; data?: { key: string; durationSec?: number | null }; message?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/audio-upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          resolve({ ok: xhr.status < 300 && body.success, data: body.data, message: body.message });
        } catch {
          resolve({ ok: false, message: "업로드 응답을 읽지 못했어요." });
        }
      };
      xhr.onerror = () => resolve({ ok: false, message: "업로드 중 연결이 끊겼어요." });
      xhr.send(form);
    });
    setPct(null);
    if (!res.ok || !res.data) {
      onToast(res.message || "업로드하지 못했어요.");
      return;
    }
    onChange({ provider: "r2", key: res.data.key, durationSec: durationSec ?? res.data.durationSec ?? value.durationSec ?? null });
    onToast("업로드 완료! 저장을 눌러 주세요.");
  };

  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="radio" checked={value.provider === "r2"} onChange={() => onChange({ ...value, provider: "r2" })} />
          파일 올리기 (R2, 회원만 재생)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={value.provider === "url"} onChange={() => onChange({ ...value, provider: "url" })} />
          직접 주소
        </label>
        {value.durationSec ? <Badge>{formatDuration(value.durationSec, true)}</Badge> : null}
      </div>
      {value.provider === "r2" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--foreground-muted)]">{value.key || "아직 올린 파일이 없어요."}</span>
          <label className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold ${pct === null ? "cursor-pointer bg-[var(--brand)] text-white" : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)]"}`}>
            {pct !== null ? `업로드 ${pct}%` : value.key ? "파일 바꾸기" : "오디오 올리기 (mp3·m4a·aac)"}
            <input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac"
              className="hidden"
              disabled={pct !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
          </label>
        </div>
      ) : (
        <input
          value={value.url ?? ""}
          placeholder="https://…/podcast.mp3"
          onChange={(e) => onChange({ ...value, url: e.target.value.trim() || null })}
          className={`mt-3 w-full ${field}`}
        />
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          key={`dur-${value.durationSec ?? ""}`}
          defaultValue={value.durationSec ? formatDuration(value.durationSec, true) : ""}
          placeholder="길이 예: 25:10"
          onBlur={(e) => onChange({ ...value, durationSec: parseDuration(e.target.value) })}
          className={`w-32 ${field}`}
        />
        <span className="text-xs text-[var(--foreground-muted)]">파일을 올리면 길이를 자동으로 읽어요. 길이가 있어야 90% 들었을 때 자동 완료돼요.</span>
      </div>
    </div>
  );
}

/** 글 편집 칸 + .md 파일 불러오기 */
function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mt-2">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-[220px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs" />
      <label className="mt-1 inline-flex cursor-pointer text-xs font-semibold text-[var(--brand)]">
        .md 파일에서 불러오기
        <input
          type="file"
          accept=".md,.txt,text/markdown,text/plain"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onChange(await f.text());
          }}
        />
      </label>
    </div>
  );
}

// ── 퀴즈 ──
export function QuizEditor({ value, onChange }: { value: QuizValue; onChange: (v: QuizValue) => void }) {
  const [text, setText] = useState(() => quizToText(value.questions));
  const parsed = useMemo(() => (text.trim() ? parseQuizText(text) : { questions: [], warnings: [] }), [text]);
  const counts = parsed.questions.reduce<Record<string, number>>((m, q) => ((m[q.kind] = (m[q.kind] ?? 0) + 1), m), {});

  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          합격 기준
          <input
            inputMode="numeric"
            value={value.passScore}
            onChange={(e) => onChange({ ...value, passScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            className={`w-16 ${field}`}
          />
          점
        </label>
        <Badge tone="brand">{parsed.questions.length}문항</Badge>
        {counts.choice ? <Badge>객관식 {counts.choice}</Badge> : null}
        {counts.ox ? <Badge>O/X {counts.ox}</Badge> : null}
        {counts.essay ? <Badge>서술형 {counts.essay} (채점 안 함)</Badge> : null}
      </div>
      <TextArea
        value={text}
        onChange={(t) => {
          setText(t);
          onChange({ ...value, questions: t.trim() ? parseQuizText(t).questions : [] });
        }}
        placeholder={"### 1. 문제\n\n① 보기\n② 보기\n③ 보기\n④ 보기\n\n**정답: ②**\n\n**근거 (1주차 · 1교시)**: 근거\n\n**해설**: 해설"}
      />
      {parsed.warnings.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
          {parsed.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
      <p className="mt-2 text-xs text-[var(--foreground-muted)]">
        정답·해설은 서버에만 저장되고, 회원이 제출해야 보여요. 한양사이버 예상문제 파일을 그대로 붙여넣어도 돼요.
      </p>
    </div>
  );
}

// ── 요약카드 ──
export function CardsEditor({ value, onChange }: { value: TextCard[]; onChange: (v: TextCard[]) => void }) {
  const [text, setText] = useState(() => cardsToText(value));
  const parsed = useMemo(() => (text.trim() ? parseCardsText(text) : { cards: [], warnings: [] }), [text]);
  const groups = new Set(parsed.cards.map((c) => c.group).filter(Boolean)).size;

  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">카드 {parsed.cards.length}장</Badge>
        {groups > 0 && <Badge>묶음 {groups}개</Badge>}
      </div>
      <TextArea
        value={text}
        onChange={(t) => {
          setText(t);
          onChange(t.trim() ? parseCardsText(t).cards : []);
        }}
        placeholder={"## 묶음 이름 (선택)\n### 카드 앞면\n뒷면 내용 (마크다운)\n\n### 다음 카드\n…\n\n또는 Logseq 요약(#card)을 그대로 붙여넣기"}
      />
      {parsed.warnings.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
          {parsed.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}
