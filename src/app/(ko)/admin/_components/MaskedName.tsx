"use client";

import { useState } from "react";

/** 이름 가운데 가림 (김태현 → 김*현) — 누르면 그 자리에서 보임 (관리자 개편 확정 ③) */
export function maskName(name: string): string {
  const c = [...(name ?? "")];
  if (c.length <= 1) return "*";
  if (c.length === 2) return `${c[0]}*`;
  return `${c[0]}${"*".repeat(c.length - 2)}${c[c.length - 1]}`;
}

export function MaskedName({ name, className }: { name: string; className?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setShown((v) => !v);
      }}
      title={shown ? "가리기" : "이름 보기"}
      aria-label={shown ? `${name} — 가리기` : "이름 보기"}
      className={`cursor-pointer rounded px-0.5 text-left hover:bg-[var(--surface-muted)] ${className ?? ""}`}
    >
      {shown ? name : maskName(name)}
    </button>
  );
}
