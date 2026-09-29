"use client";

/**
 * Character 컴포넌트 — 숨이·토리·달이·현 선생님 SVG 렌더링
 *
 * SVG는 chars.ts에서 문자열로 생성한 뒤 dangerouslySetInnerHTML로 주입한다.
 * 모든 SVG 콘텐츠는 코드 상수이므로 XSS 위험이 없다.
 *
 * .live 클래스를 부모에 달면 숨쉬기·눈 깜박임 애니메이션이 켜진다.
 * prefers-reduced-motion: reduce 환경에서는 stickers.css가 animation을 none으로 끈다.
 */

import type { CharKind } from "./chars";
import { drawChar, drawSticker } from "./chars";

interface CharacterProps {
  /** 캐릭터 종류 */
  kind?: CharKind;
  /** 표정 */
  mood?: "happy" | "calm" | "sleepy" | "worried" | "wow" | "wink" | "serious" | "idle";
  /** 팔 표시 여부 (기본 true) */
  arms?: boolean;
  /** 새싹 단계 (숨이만, 0~4) */
  stage?: number;
  /** 접근성 레이블 */
  label?: string;
  /** 추가 SVG 요소 (이모티콘 효과) */
  extra?: string;
  /** 애니메이션 활성화 (.live 래퍼) */
  live?: boolean;
  /** Tailwind 크기 클래스 (기본 w-full) */
  className?: string;
}

export function Character({
  kind = "sumi",
  mood = "idle",
  arms = true,
  stage = 2,
  label,
  extra,
  live = false,
  className = "w-full",
}: CharacterProps) {
  const svg = drawChar(kind, { mood, arms, stage, label, extra });
  return (
    <span
      className={`${live ? "live " : ""}inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

interface StickerProps {
  /** STICKERS 키 (예: "sumi-hi") */
  name: string;
  className?: string;
}

/**
 * Sticker 컴포넌트 — 이모티콘 SVG + 움직임 클래스
 * stickers.css 애니메이션이 적용된다. prefers-reduced-motion 존중.
 */
export function Sticker({ name, className = "inline-block h-24 w-24" }: StickerProps) {
  const html = drawSticker(name);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
