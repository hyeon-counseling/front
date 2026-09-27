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

export type Playback =
  | { kind: "url"; url: string }
  | { kind: "stream"; iframeUrl: string; expiresAt: string }
  | { kind: "youtube"; videoId: string };

/** 유튜브 주소(watch·youtu.be·shorts·embed) 또는 ID → 11자리 영상 ID. 못 찾으면 null */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  const bare = s.match(/^([A-Za-z0-9_-]{11})(?:[?&#]|$)/); // ID 뒤에 &t=30s 등이 붙은 경우
  if (bare) return bare[1];
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** "9:30" · "570" → 초. 형식이 아니면 null */
export function parseDuration(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/^(\d+):([0-5]?\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

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
