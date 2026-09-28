// 과정(여러 과목 묶음) 타입 — 백엔드 programController 응답과 같은 모양

export interface ProgramListItem {
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  instructor: string;
  visibility: "public" | "private";
  price: number | null;
  salePrice: number | null;
  salePriceEffective: number | null;
  accessDays: number | null;
  courseCount: number;
  lessonCount: number;
  totalMinutes: number;
  /** 과목을 따로 살 때 합계 (모든 과목에 가격이 있을 때만) */
  separateTotal: number | null;
}

export interface ProgramEnrollmentView {
  active: boolean;
  status: "active" | "revoked";
  source: "payment" | "manual";
  startedAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  progressPct: number;
  completedCourses: number;
}

export interface ProgramCourse {
  slug: string;
  title: string;
  subtitle: string;
  /** 비공개 과목은 과정 수강권이 생기기 전에는 열어 볼 수 없다 */
  visibility: "public" | "private";
  coverImageUrl: string | null;
  lessonCount: number;
  totalMinutes: number;
  salePriceEffective: number | null;
  progressPct: number;
  completed: boolean;
  resume: { key: string; title: string } | null;
}

export interface ProgramDetail extends ProgramListItem {
  description: string;
  courses: ProgramCourse[];
  enrollment: ProgramEnrollmentView | null;
  canAccess: boolean;
}

export interface MyProgram extends ProgramListItem {
  enrollment: ProgramEnrollmentView;
  courses: { slug: string; title: string; progressPct: number; completed: boolean }[];
  nextCourse: { slug: string; title: string } | null;
}

/** "총 12시간 30분" · "총 45분" */
export function totalTimeLabel(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `총 ${h ? `${h}시간` : ""}${h && m ? " " : ""}${m ? `${m}분` : ""}`;
}
