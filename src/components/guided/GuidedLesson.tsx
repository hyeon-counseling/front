"use client";

/**
 * GuidedLesson — 읽기형 / 대화형 전환 래퍼
 * 선택값은 localStorage에 저장 (try/catch로 실패를 무시).
 */

import { useState } from "react";
import { GuidedReadView } from "./GuidedReadView";
import { GuidedChatView } from "./GuidedChatView";
import type { Step, Gad7Def, SunGrant, Entries } from "@/lib/guided";

const LS_KEY = "guided-view-mode";

type ViewMode = "read" | "chat";

interface Props {
  slug: string;
  lessonKey: string;
  lessonTitle: string;
  lessonLabel?: string;
  lessonMin?: number;
  steps: Step[];
  check?: boolean;
  gad7Def?: Gad7Def | null;
  initialEntries?: Entries;
  canSave?: boolean;
  isDone?: boolean;
  onCompleted?: (sun: SunGrant | null) => void;
  onNext?: () => void;
}

function loadMode(): ViewMode {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "chat" || v === "read") return v;
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
  return "read";
}

function saveMode(mode: ViewMode): void {
  try {
    localStorage.setItem(LS_KEY, mode);
  } catch {
    // ignore
  }
}

export function GuidedLesson(props: Props) {
  // lazy initializer: localStorage는 브라우저 전용이므로 typeof window 확인
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "read";
    return loadMode();
  });

  const switchMode = (next: ViewMode) => {
    saveMode(next);
    setMode(next);
  };

  return (
    <div>
      {/* 보기 전환 탭 */}
      <div className="mb-6 flex items-center gap-1 rounded-2xl bg-[var(--surface)] p-1">
        <button
          type="button"
          onClick={() => switchMode("read")}
          className={`flex-1 cursor-pointer rounded-xl py-2 text-sm font-semibold transition-colors ${
            mode === "read"
              ? "bg-white text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
          }`}
        >
          읽기형
        </button>
        <button
          type="button"
          onClick={() => switchMode("chat")}
          className={`flex-1 cursor-pointer rounded-xl py-2 text-sm font-semibold transition-colors ${
            mode === "chat"
              ? "bg-white text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
          }`}
        >
          대화형
        </button>
      </div>

      {mode === "read" ? (
        <GuidedReadView
          slug={props.slug}
          lessonKey={props.lessonKey}
          steps={props.steps}
          check={props.check}
          gad7Def={props.gad7Def}
          initialEntries={props.initialEntries}
          canSave={props.canSave}
          isDone={props.isDone}
          onCompleted={props.onCompleted}
          onNext={props.onNext}
        />
      ) : (
        <GuidedChatView
          key={`chat-${props.lessonKey}`}
          slug={props.slug}
          lessonKey={props.lessonKey}
          lessonTitle={props.lessonTitle}
          lessonLabel={props.lessonLabel}
          lessonMin={props.lessonMin ?? props.steps.length}
          steps={props.steps}
          check={props.check}
          gad7Def={props.gad7Def}
          initialEntries={props.initialEntries}
          canSave={props.canSave}
          isDone={props.isDone}
          onCompleted={props.onCompleted}
          onNext={props.onNext}
        />
      )}
    </div>
  );
}
