// 쓰기 실습(practice) 타입 — 강의의 쓰기 실습 차시 블록·문항 (백엔드 practiceService 와 같은 모양)

export type ExerciseKind = "text" | "scale" | "choice" | "form" | "table" | "assessment";

export interface ChoiceConfig {
  options: string[];
  multiple?: boolean;
  allowOther?: boolean;
}
export interface ScaleConfig {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
}
export interface FormField extends Partial<ChoiceConfig>, ScaleConfig {
  key: string;
  label: string;
  kind: "text" | "textarea" | "date" | "number" | "scale" | "choice";
  placeholder?: string;
}
export interface TableColumn {
  key: string;
  label: string;
  kind: "text" | "number";
}
export interface AssessmentBand {
  min: number;
  max: number;
  label: string;
  note?: string;
  alert?: boolean;
}
export interface AssessmentConfig {
  items: string[];
  options: { label: string; score: number }[];
  bands?: AssessmentBand[];
}

export interface Exercise {
  kind: ExerciseKind;
  prompt: string;
  help?: string;
  optional?: boolean;
  config: Record<string, unknown>;
}

export interface Block {
  key: string;
  type: "text" | "callout" | "exercise";
  md?: string;
  tone?: "info" | "quote" | "caution";
  exercise?: Exercise;
  /** 숨이 한마디 — exercise 블록 입력 칸 앞에 표시 (≤300자) */
  lead?: string;
}

/** 가격 표시 "29,900원" (null이면 null) */
export function formatPrice(p: number | null | undefined) {
  if (p === null || p === undefined) return null;
  return `${p.toLocaleString("ko-KR")}원`;
}
