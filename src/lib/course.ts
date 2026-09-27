// 강의(LMS) 타입 — 백엔드 courseController 응답과 같은 모양

export interface CourseListItem {
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  instructor: string;
  price: number | null;
  salePrice: number | null;
  salePriceEffective: number | null;
  accessDays: number | null;
  lessonCount: number;
  totalMinutes: number;
}

export interface CourseEnrollmentSummary {
  active: boolean;
  status: "active" | "revoked";
  source: string;
  startedAt: string;
  expiresAt: string | null;
  progressPct: number;
  completedAt: string | null;
  completedLessons: string[];
  resume: { key: string; title: string } | null;
}

export interface CurriculumLesson {
  key: string;
  title: string;
  summary: string;
  type: "video" | "text";
  isPreview: boolean;
  durationSec: number | null;
  completed: boolean;
  locked: boolean;
}

export interface CourseDetail extends CourseListItem {
  description: string;
  sections: { key: string; title: string; lessons: CurriculumLesson[] }[];
  enrollment: CourseEnrollmentSummary | null;
  canAccess: boolean;
}

export interface LessonResponse {
  course: { slug: string; title: string };
  section: { key: string; title: string };
  lesson: {
    key: string;
    title: string;
    summary: string;
    type: "video" | "text";
    body: string;
    isPreview: boolean;
    durationSec: number | null;
    hasVideo: boolean;
  };
  position: { index: number; total: number };
  progress: { positionSec: number; completed: boolean };
  enrolled: boolean;
  prev: { key: string; title: string; locked: boolean } | null;
  next: { key: string; title: string; locked: boolean } | null;
}

export type Playback = { kind: "url"; url: string } | { kind: "stream"; iframeUrl: string; expiresAt: string };

export interface MyCourse extends CourseListItem {
  enrollment: CourseEnrollmentSummary;
}

/** 초 → "10분" / "9:30" */
export function formatDuration(sec: number | null | undefined, clock = false): string {
  if (!sec) return "";
  if (clock) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return `${Math.max(1, Math.round(sec / 60))}분`;
}
