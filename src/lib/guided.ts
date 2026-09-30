/**
 * guided 차시 — 타입 정의 및 헬퍼
 * API 약속: docs/MAEUMSUP-DEV.md § 1
 */

// ─── Step 종류 ──────────────────────────────────────────────────────────────

export interface SumiStep {
  s: string;
  st?: string;
  /** 읽기형에서 보여 줄지 여부 (true일 때만 표시) */
  r?: boolean;
}
export interface TeacherStep {
  h: string;
  st?: string;
}
export interface StoryStep {
  story: string;
  who?: string;
}
export interface TipStep {
  tip: string;
}
export interface DeepStep {
  deep: string;
  /** 빈 줄로 문단 구분 */
  md: string;
}
export interface CardStep {
  card: string;
  items?: string[];
  /** [label, ref] 쌍 — 앞서 기록된 답을 채워 넣음 */
  from?: [string, string][];
  tone?: string;
}
export interface TrapsStep {
  /** [이름, 설명, 예문] */
  traps: [string, string, string][];
}
export interface SafetyStep {
  safety: string | true;
}

// ─── ask ────────────────────────────────────────────────────────────────────

interface AskBase {
  ask: string;
  key?: string;
  field?: string;
  q: string;
  save?: boolean;
  id?: string;
  optional?: boolean;
}
export interface AskChoice extends AskBase {
  ask: "choice";
  opts: string[];
  multi?: boolean;
  none?: string;
  other?: boolean;
}
export interface AskText extends AskBase {
  ask: "text";
  ph?: string;
  samples?: string[];
  short?: boolean;
}
export interface AskScale extends AskBase {
  ask: "scale";
  min: number;
  max: number;
  step: number;
  unit?: string;
  lo?: string;
  hi?: string;
}
export interface AskGo extends AskBase {
  ask: "go";
  opts: string[];
}
export interface AskTable extends AskBase {
  ask: "table";
  rows: number;
  cols: { key: string; label: string; kind: "text" | "scale" }[];
}
export interface AskGad7 extends AskBase {
  ask: "gad7";
}
/** 진단지 — practice assessment 블록을 대화형으로 변환할 때 사용 */
export interface AskAssessment extends AskBase {
  ask: "assessment";
  items: string[];
  options: { label: string; score: number }[];
  bands?: { min: number; max: number; label: string; note?: string; alert?: boolean }[];
}

export type AskStep = AskChoice | AskText | AskScale | AskGo | AskTable | AskGad7 | AskAssessment;

// ─── react ──────────────────────────────────────────────────────────────────

export interface ReactCase {
  when: string;
  s?: string;
  h?: string;
  st?: string;
  safety?: boolean;
  counsel?: boolean;
}
export interface ReactStep {
  react: {
    on: string;
    cases: ReactCase[];
  };
}

// ─── quiz ───────────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  kind: "ox" | "mc" | "blank" | "order" | "match";
  q: string;
  opts?: string[];
  ans?: number | boolean;
  items?: string[];
  pairs?: [string, string][];
  why?: string;
}
export interface QuizStep {
  quiz: Quiz;
}

// ─── GAD-7 상수 ─────────────────────────────────────────────────────────────

export interface Gad7Def {
  items: string[];
  options: [string, number][];
}

// ─── 통합 Step 타입 ──────────────────────────────────────────────────────────

/**
 * ExpandStep — practice 텍스트 블록을 대화형으로 변환할 때 쓰는 단계
 * 문단이 3개 초과일 때 첫 2개 버블 → [더 알려줘]/[바로 해 볼래] 칩으로 접힌다.
 * GuidedChatView와 PracticeChatView가 직접 처리한다.
 */
export interface ExpandStep {
  /** 모든 문단(첫 2개 포함) */
  paras: string[];
  /** 원본 마크다운 (테이블·코드 등이 있을 수 있음) */
  md: string;
}

export type Step =
  | SumiStep
  | TeacherStep
  | StoryStep
  | TipStep
  | DeepStep
  | CardStep
  | TrapsStep
  | SafetyStep
  | AskStep
  | ReactStep
  | QuizStep
  | ExpandStep;

// ─── 차시 타입 (API 응답) ────────────────────────────────────────────────────

export interface GuidedLesson {
  key: string;
  title: string;
  label?: string;
  summary?: string;
  type: "guided";
  estMinutes?: number;
  isPreview?: boolean;
  steps: Step[];
  check?: boolean;
  /** 서버가 steps에 gad7이 있을 때 내려주는 문항 정의 */
  gad7?: Gad7Def;
}

/** 저장된 entries (blockKey → value) */
export type Entries = Record<string, unknown>;

// ─── react when 평가 ─────────────────────────────────────────────────────────

/**
 * evalWhen(when, value) — react.cases[].when 조건 평가
 *
 * when 값:
 *   'else'   — 항상 참 (기본/폴백)
 *   'none'   — 선택 없음 (빈 배열 또는 "없음")
 *   'idx:N'  — 단일 선택의 인덱스 N번째
 *   'eq:글자' — 문자열 동일
 *   '>=N'    — 숫자(또는 score)가 N 이상
 *   '<N'     — 숫자(또는 score)가 N 미만
 */
export function evalWhen(when: string, value: unknown): boolean {
  if (when === "else") return true;
  if (when === "none") {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value === "없음" || value === "";
    return value == null;
  }
  if (when.startsWith("idx:")) {
    const idx = parseInt(when.slice(4), 10);
    if (value != null && typeof value === "object" && "__idx" in value) {
      return (value as { __idx: number }).__idx === idx;
    }
    return false;
  }
  if (when.startsWith("eq:")) {
    return String(value ?? "") === when.slice(3);
  }
  // 숫자 비교 — choice.score 또는 gad7.score
  const num: number =
    value != null && typeof value === "object" && "score" in value
      ? (value as { score: number }).score
      : Number(value);
  if (when.startsWith(">=")) return num >= Number(when.slice(2));
  if (when.startsWith("<")) return num < Number(when.slice(1));
  return false;
}

// ─── ref 계산 ────────────────────────────────────────────────────────────────

/** ask → 저장 ref (blockKey) */
export function refOf(ask: AskStep): string {
  if (ask.field) return `${ask.key}.${ask.field}`;
  return ask.key ?? ask.id ?? "";
}

// ─── entries에서 값 읽기 ─────────────────────────────────────────────────────

/** entries에서 ref(blockKey) 또는 'key.field' 형태의 값을 읽는다 */
export function getEntry(entries: Entries, ref: string): unknown {
  if (ref.includes(".")) {
    const [key, field] = ref.split(".", 2);
    const obj = entries[key];
    if (obj != null && typeof obj === "object" && !Array.isArray(obj)) {
      return (obj as Record<string, unknown>)[field];
    }
    return undefined;
  }
  return entries[ref];
}

// ─── entries 저장 값 만들기 ───────────────────────────────────────────────────

/**
 * buildEntryValue — UI 입력값을 API PUT body `{ value }` 형태로 변환
 *
 * field가 있는 ask는 같은 key의 기존 entries 값(객체)에 병합한다.
 * 서버는 보낸 칸만 남기므로 전체 객체를 통째로 보내야 한다.
 */
export function buildEntryValue(
  ask: AskStep,
  rawValue: unknown,
  existing: Entries
): { blockKey: string; value: unknown } {
  const blockKey = ask.key ?? ask.id ?? "";

  // field가 있으면 같은 key 아래 다른 field 값과 합쳐서 보낸다
  if (ask.field && ask.key) {
    const prev =
      existing[ask.key] != null &&
      typeof existing[ask.key] === "object" &&
      !Array.isArray(existing[ask.key])
        ? (existing[ask.key] as Record<string, unknown>)
        : {};
    return {
      blockKey: ask.key,
      value: { ...prev, [ask.field]: rawValue },
    };
  }

  // choice: { selected: [...], other? }
  if (ask.ask === "choice") {
    if (ask.multi) {
      const arr = Array.isArray(rawValue) ? (rawValue as string[]) : [];
      return { blockKey, value: { selected: arr } };
    } else {
      const selected = rawValue == null ? [] : [String(rawValue)];
      return { blockKey, value: { selected } };
    }
  }

  // scale: 숫자
  if (ask.ask === "scale") {
    return { blockKey, value: typeof rawValue === "number" ? rawValue : Number(rawValue) };
  }

  // text: 문자열
  if (ask.ask === "text") {
    return { blockKey, value: String(rawValue ?? "") };
  }

  // table: { rows: [...] }
  if (ask.ask === "table") {
    return { blockKey, value: rawValue };
  }

  // gad7: { answers: [...] }
  if (ask.ask === "gad7") {
    return { blockKey, value: rawValue };
  }

  return { blockKey, value: rawValue };
}

// ─── 카드 from 값 읽기 ───────────────────────────────────────────────────────

/** 카드 from 항목 하나의 표시 값을 entries에서 읽어 문자열로 반환 */
export function resolveCardFrom(ref: string, entries: Entries): string {
  let v = getEntry(entries, ref);

  // 테이블의 .rows 형태
  if (ref.endsWith(".rows")) {
    const tableKey = ref.slice(0, -5);
    const tableVal = entries[tableKey];
    if (
      tableVal != null &&
      typeof tableVal === "object" &&
      "rows" in tableVal
    ) {
      const rows = (tableVal as { rows: { situation: string; level?: number }[] }).rows;
      v = rows
        .map((r) => `${r.situation}${r.level !== undefined ? ` (${r.level})` : ""}`)
        .join(" · ");
    }
  }

  if (v == null || v === "") return "—";
  if (typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    if ("__label" in obj) return String(obj.__label);
    if ("score" in obj) return String(obj.score);
    if ("selected" in obj) {
      const sel = obj.selected as string[];
      return sel.length ? sel.join(", ") : "없음";
    }
  }
  if (Array.isArray(v)) return v.length ? (v as string[]).join(", ") : "없음";
  if (ref.endsWith(".level") && typeof v === "number") return `${v}%`;
  return String(v);
}

// ─── GAD-7 점수 밴드 ─────────────────────────────────────────────────────────

export function gad7Band(score: number): string {
  if (score >= 15) return "심한 불안";
  if (score >= 10) return "중간 정도 불안";
  if (score >= 5) return "경미한 불안";
  return "최소 불안";
}

// ─── 보상(sun) 타입 ──────────────────────────────────────────────────────────

export interface SunGrant {
  granted: number;
  balance: number;
  reason: string;
  capped?: boolean;
}
