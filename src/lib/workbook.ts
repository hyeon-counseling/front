// 셀프 워크북 — 프론트 공용 타입 (백엔드 workbookModel / workbookController 응답과 맞춘다)

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
}

export interface WorkbookDay {
  key: string;
  label: string;
  title: string;
  estMinutes?: number;
  blocks: Block[];
}

export interface WorkbookWeek {
  key: string;
  order: number;
  title: string;
  theme?: string;
  days: WorkbookDay[];
}

export interface EnrollmentSummary {
  plan: "free" | "full";
  fullAccess: boolean;
  status: "active" | "revoked";
  startedAt: string;
  expiresAt: string | null;
  completedDays: string[];
  lastDayKey: string | null;
  totalDays: number;
}

export interface WorkbookMeta {
  slug: string;
  title: string;
  subtitle?: string;
  seriesLabel?: string;
  framework?: string;
  durationLabel?: string;
  coverImageUrl?: string | null;
  price: number | null;
  salePrice: number | null;
  accessDays: number | null;
  freeUntilWeek: number;
}

export interface WorkbookListItem extends WorkbookMeta {
  openWeeks: number;
  plannedWeeks: string[];
  dayCount: number;
}

export interface CurriculumDay {
  key: string;
  label: string;
  title: string;
  estMinutes?: number;
  completed: boolean;
  locked: boolean;
}
export interface CurriculumWeek {
  key: string;
  order: number;
  title: string;
  theme?: string;
  free: boolean;
  locked: boolean;
  days: CurriculumDay[];
}
export interface WorkbookDetail extends WorkbookMeta {
  description: string;
  plannedWeeks: string[];
  weeks: CurriculumWeek[];
  enrollment: EnrollmentSummary | null;
}

export interface NavItem {
  key: string;
  label: string;
  title: string;
  locked: boolean;
}
export interface DayResponse {
  workbook: { slug: string; title: string };
  week: { key: string; order: number; title: string; theme?: string };
  day: WorkbookDay;
  position: { index: number; total: number };
  entries: Record<string, unknown>;
  completed: boolean;
  enrollment: EnrollmentSummary | null;
  prev: NavItem | null;
  next: NavItem | null;
}

export interface MyWorkbook extends WorkbookMeta {
  plan: "free" | "full";
  fullAccess: boolean;
  expiresAt: string | null;
  completedCount: number;
  totalDays: number;
  resume: { key: string; label: string; title: string } | null;
  lastActivityAt: string | null;
}

export function formatPrice(p: number | null | undefined) {
  if (p === null || p === undefined) return null;
  return `${p.toLocaleString("ko-KR")}원`;
}
