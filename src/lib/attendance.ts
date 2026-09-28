// 출석(마음 도장)·수료증 타입 — 백엔드 attendanceController 응답과 같은 모양

export interface AttendanceSettings {
  weeklyGoal: number;
  showStreak: boolean;
}

export interface AttendanceCourse {
  type: "course" | "workbook";
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
}

export interface CertificateInfo {
  serial: string;
  kind: "course" | "workbook";
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

