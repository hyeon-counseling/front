"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Block } from "@/lib/practice";
import { ExerciseInput } from "./ExerciseInput";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * 문항 카드 + 자동 저장 (강의의 쓰기 실습 차시)
 * 입력이 멈추고 0.8초 뒤 saveUrl 로 저장한다. 저장 실패 시 다시 시도 버튼을 보여준다.
 */
export function ExerciseBlock({
  saveUrl,
  block,
  initial,
  canSave,
  onSaved,
}: {
  /** 이 문항의 저장 주소 (PUT { value }) */
  saveUrl: string;
  block: Block;
  initial: unknown;
  canSave: boolean;
  onSaved?: () => void;
}) {
  const ex = block.exercise!;
  const [value, setValue] = useState<unknown>(initial);
  const [state, setState] = useState<SaveState>(initial === undefined || initial === null ? "idle" : "saved");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<unknown>(initial);

  const save = useCallback(async () => {
    setState("saving");
    const res = await apiRequest<{ value: unknown; savedAt: string }>(saveUrl, {
      method: "PUT",
      body: JSON.stringify({ value: latest.current }),
    });
    if (res.ok && res.data) {
      setState("saved");
      setError("");
      setSavedAt(res.data.savedAt);
      // 서버가 계산한 값(예: 진단 점수)으로 맞춘다 — 입력 중이 아니면
      if (!timer.current) setValue(res.data.value);
      onSaved?.();
    } else {
      setState("error");
      setError(res.message || "저장하지 못했어요.");
    }
  }, [saveUrl, onSaved]);

  const handleChange = (v: unknown) => {
    setValue(v);
    latest.current = v;
    if (!canSave) return;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      save();
    }, 800);
  };

  // 페이지를 떠나기 전 저장 안 된 입력이 있으면 바로 저장
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void apiRequest(saveUrl, { method: "PUT", body: JSON.stringify({ value: latest.current }), keepalive: true });
      }
    };
  }, [saveUrl]);

  return (
    <section className="card p-5 sm:p-7" aria-labelledby={`q-${block.key}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 id={`q-${block.key}`} className="text-[1.05rem] font-bold leading-snug text-[var(--foreground)]">
            {ex.prompt}
            {ex.optional && <span className="ml-2 align-middle text-xs font-medium text-[var(--foreground-subtle)]">선택</span>}
          </h3>
          {ex.help && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{ex.help}</p>}
        </div>
        {canSave && <SaveBadge state={state} savedAt={savedAt} />}
      </div>

      <ExerciseInput exercise={ex} value={value} onChange={handleChange} disabled={!canSave} />

      {state === "error" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={save} className="shrink-0 cursor-pointer font-semibold underline">
            다시 저장
          </button>
        </div>
      )}
    </section>
  );
}

function SaveBadge({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  if (state === "idle") return null;
  const label =
    state === "saving" || state === "dirty"
      ? "저장 중…"
      : state === "error"
        ? "저장 실패"
        : savedAt
          ? `저장됨 · ${new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })}`
          : "저장됨";
  const tone = state === "error" ? "text-red-600" : state === "saved" ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]";
  return <span className={`shrink-0 whitespace-nowrap pt-1 text-xs font-medium ${tone}`}>{label}</span>;
}
