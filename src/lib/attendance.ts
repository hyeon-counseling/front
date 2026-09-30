// 출석(마음 도장)·수료증 타입 — 백엔드 attendanceController 응답과 같은 모양

export interface AttendanceSettings {
  weeklyGoal: number;
  showStreak: boolean;
  /** 숨이 이름 (기본 '숨이') */
  buddyName?: string;
  /** 조용히 모드 */
  quiet?: boolean;
  /** 하루 목표 분 (3·5·10) */
  dailyMinutes?: number;
  /** 첫 만남 완료 여부 */
  onboarded?: boolean;
}

/** 숨이 성장 정보 */
export interface SumiStatus {
  drops: number;
  /** 0 새싹 · 1 잎 하나 · 2 잎 둘 · 3 꽃봉오리 · 4 꽃 */
  stage: number;
  /** 다음 단계까지 필요한 물방울 수 (꽃이면 null) */
  nextStageAt: number | null;
  dropsToday: number;
}

/** 단계별 이름 */
export const STAGE_NAMES = ["새싹", "잎 하나", "잎 둘", "꽃봉오리", "꽃"] as const;
/** 단계별 필요 물방울 수 */
export const STAGE_DROPS = [0, 5, 15, 30, 60] as const;

/** 단계 이름 반환 */
export function stageName(stage: number): string {
  return STAGE_NAMES[Math.max(0, Math.min(4, stage))] ?? "새싹";
}

export interface AttendanceCourse {
  type: "course";
  title: string;
  href: string;
  attendedDays: number;
  periodDays: number | null;
  startedAt: string;
  expiresAt: string | null;
  finished: boolean;
}

export interface Attendance {
  today: string;
  stampedToday: boolean;
  week: { day: string; stamped: boolean; future: boolean }[];
  weekCount: number;
  weeklyGoal: number;
  weekGoalMet: boolean;
  total: number;
  streak: { days: number; restUsed: number; restAvailableThisWeek: boolean } | null;
  settings: AttendanceSettings;
  courses: AttendanceCourse[];
  /** 숨이 성장 정보 (서버가 내려줄 때만) */
  sumi?: SumiStatus;
}

export interface CertificateInfo {
  serial: string;
  kind: "course" | "workbook" | "program";
  title: string;
  name: string;
  minutes: number | null;
  periodLabel: string;
  startedAt: string | null;
  completedAt: string;
  issuedAt: string;
  own?: boolean;
}

export const WEEKDAY = ["월", "화", "수", "목", "금", "토", "일"];

/** 120 → "2시간", 95 → "1시간 35분", 40 → "40분" */
export function hoursLabel(min: number | null | undefined): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ""}` : `${m}분`;
}

export const krDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "";

/** 받침에 따라 을/를 — "불안과 함께 살기" → 를, "가족상담" → 을 (한글이 아니면 을(를)) */
export function eulReul(word: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "을(를)";
  return code % 28 ? "을" : "를";
}

