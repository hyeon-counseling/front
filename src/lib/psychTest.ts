// 무료 심리검사 타입 — 백엔드 psychTestController 응답과 같은 모양

export interface TestCard {
  slug: string;
  title: string;
  engTitle?: string;
  emoji?: string;
  color?: string;
  summary: string;
  estMinutes: number;
  questionCount: number;
}

export interface TestDetail extends TestCard {
  intro: string;
  orientation: string;
  instruction?: string;
  credit?: string;
  answerLabels: string[];
  questions: string[];
}

export type Tone = "good" | "mild" | "caution" | "severe";

export interface Recommendation {
  bandKeys: string[];
  title: string;
  desc: string;
  url: string;
  tag?: string;
  emoji?: string;
  cta?: string;
}

export interface TestResult {
  id: string;
  createdAt: string;
  test: Partial<TestCard> & { slug: string; title: string };
  credit: string;
  score: number;
  maxScore: number;
  band: { key: string; label: string; subtitle: string; tone: Tone; analysis: string; solution: string; alert: boolean };
  scales: { key: string; label: string; score: number; max: number; level: "low" | "mid" | "high"; levelLabel: string; analysis: string; tip: string }[];
  crisis: boolean;
  recommendations: Recommendation[];
}

export interface MyTestItem {
  id: string;
  testSlug: string;
  testTitle: string;
  score: number;
  maxScore: number;
  bandLabel: string;
  scaleScores: { key: string; label: string; score: number; max: number; level: string }[];
  createdAt: string;
}

export const TONE_STYLE: Record<Tone, { ring: string; bg: string; text: string }> = {
  good: { ring: "#3d6b5e", bg: "bg-[var(--brand-light)]", text: "text-[var(--brand)]" },
  mild: { ring: "#c99a2e", bg: "bg-amber-50", text: "text-amber-700" },
  caution: { ring: "#e0782f", bg: "bg-orange-50", text: "text-orange-700" },
  severe: { ring: "#d64545", bg: "bg-red-50", text: "text-red-700" },
};

/** 점수 표시: 평균형(소수)은 소수 둘째 자리까지 */
export function scoreText(score: number, max: number) {
  const s = Number.isInteger(score) ? String(score) : score.toFixed(2);
  return `${s} / ${max}`;
}

/** 외부 링크면 새 창 */
export function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}
