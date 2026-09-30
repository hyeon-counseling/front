/**
 * practiceToSteps — 쓰기 실습(practice) 차시를 대화형 Step[]으로 변환
 * SUMI-STAGES.md §4 2단계 변환 규칙에 따른 순수 함수.
 * GuidedChatView / PracticeChatView에서 사용한다.
 */

import type {
  Step,
  SumiStep,
  ExpandStep,
  AskAssessment,
} from "@/lib/guided";
import type { Block, ChoiceConfig, ScaleConfig, FormField, AssessmentConfig } from "@/lib/practice";

// ─── 마크다운 경량 스트립 ────────────────────────────────────────────────────

/** 말풍선용 마크다운 경량 스트립: **, __ → 제거, # 접두사 제거, > 제거 */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // # 제목 태그
    .replace(/\*\*(.+?)\*\*/g, "$1") // **굵게**
    .replace(/__(.+?)__/g, "$1") // __굵게__
    .replace(/^>\s?/gm, "") // > 인용
    .replace(/`(.+?)`/g, "$1") // `코드`
    .trim();
}

/** 줄이 테이블 행인가 (| 로 시작·끝) */
function isTableLine(line: string): boolean {
  return line.trimStart().startsWith("|");
}

/**
 * 마크다운 문자열을 말풍선용 문단 배열로 분리한다.
 * - 빈 줄로 구분된 문단 기준
 * - --- 구분선 제거
 * - 테이블 블록 전체를 하나의 항목으로 묶어 반환 (isTable 표시)
 */
function parseParagraphs(md: string): { text: string; isTable: boolean }[] {
  const lines = md.split("\n");
  const result: { text: string; isTable: boolean }[] = [];
  let current: string[] = [];
  let inTable = false;

  const flush = () => {
    if (current.length === 0) return;
    const joined = current.join("\n").trim();
    if (joined) result.push({ text: joined, isTable: inTable });
    current = [];
    inTable = false;
  };

  for (const line of lines) {
    if (line.trim() === "---" || line.trim() === "***") {
      flush();
      continue;
    }
    if (isTableLine(line)) {
      if (!inTable) {
        flush();
        inTable = true;
      }
      current.push(line);
    } else if (line.trim() === "") {
      flush();
    } else {
      if (inTable) flush();
      current.push(line);
    }
  }
  flush();
  return result;
}

// ─── 변환 헬퍼 ──────────────────────────────────────────────────────────────

/** 안전 상자가 필요한지: 불안 스케일 레이블·필드명 확인 */
function needsSafetyCheck(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes("불안") || lower.includes("anxiety");
}

// ─── 메인 변환기 ─────────────────────────────────────────────────────────────

export interface PracticeLessonMeta {
  title: string;
  sumi?: { intro?: string; outro?: string } | null;
}

/**
 * practiceToSteps(meta, blocks) → Step[]
 *
 * 변환 규칙 (SUMI-STAGES.md §4 2단계):
 * - 시작: sumi.intro 또는 자동 대사 "{title}이야. 천천히 같이 해 보자."
 * - text 블록: 문단을 숨이 말풍선으로. ≤3개 → 각각 SumiStep. >3개 → ExpandStep
 * - callout → TipStep
 * - exercise:
 *   - lead 있으면 SumiStep 먼저
 *   - text → 텍스트 입력 ask
 *   - choice → 선택 ask
 *   - scale → 척도 ask (불안 레이블이면 안전 안내 포함)
 *   - form → 각 필드별 ask
 *   - table → 행별 ask (상황 + 척도)
 *   - assessment → 문항별 선택 ask → 점수 카드
 * - 끝: sumi.outro 또는 자동 "오늘 기록 잘 남겼어. 물방울 하나 모았어!"
 */
export function practiceToSteps(meta: PracticeLessonMeta, blocks: Block[]): Step[] {
  const steps: Step[] = [];

  // 시작 대사
  const intro = meta.sumi?.intro?.trim();
  const startMsg: SumiStep = {
    s: intro || `오늘은 '${meta.title}'이야. 천천히 같이 해 보자.`,
  };
  steps.push(startMsg);

  for (const block of blocks) {
    if (block.type === "text") {
      const md = block.md ?? "";
      const paras = parseParagraphs(md);
      // 테이블이 아닌 문단만 말풍선 후보
      const textParas = paras.filter((p) => !p.isTable).map((p) => stripMd(p.text)).filter(Boolean);
      const hasTables = paras.some((p) => p.isTable);

      if (textParas.length === 0 && hasTables) {
        // 테이블만 있으면 deep 카드로
        steps.push({ deep: "자세히 읽기", md });
      } else if (textParas.length <= 3 && !hasTables) {
        // ≤3 문단 → 각각 숨이 말풍선
        for (const t of textParas) {
          steps.push({ s: t });
        }
      } else {
        // >3 문단이거나 테이블 혼합 → ExpandStep
        const expandStep: ExpandStep = { paras: textParas, md };
        steps.push(expandStep);
      }
    } else if (block.type === "callout") {
      // callout → 팁 말풍선
      const text = stripMd(block.md ?? "");
      if (text) steps.push({ tip: text });
    } else if (block.type === "exercise" && block.exercise) {
      const ex = block.exercise;
      const cfg = ex.config as Record<string, unknown>;

      // exercise lead가 있으면 먼저 말
      if (block.lead?.trim()) {
        steps.push({ s: block.lead.trim() });
      }

      const baseAsk = {
        key: block.key,
        q: ex.prompt,
        optional: ex.optional,
      } as const;

      if (ex.kind === "text") {
        steps.push({
          ask: "text",
          ...baseAsk,
          ph: ex.help,
          short: !(cfg.multiline as boolean),
        });
      } else if (ex.kind === "scale") {
        const sc = cfg as ScaleConfig;
        const askStep = {
          ask: "scale" as const,
          ...baseAsk,
          min: sc.min ?? 0,
          max: sc.max ?? 10,
          step: sc.step ?? 1,
          unit: sc.unit,
          lo: sc.minLabel,
          hi: sc.maxLabel,
        };
        steps.push(askStep);
        // 불안 레이블이면 안전 상자 (react로 80 이상 판단)
        if (needsSafetyCheck(ex.prompt)) {
          steps.push({
            react: {
              on: block.key,
              cases: [
                { when: ">=80", s: "불안이 많이 높게 나왔어. 힘들 땐 혼자 버티지 않아도 돼.", safety: true },
                { when: "else" },
              ],
            },
          });
        }
      } else if (ex.kind === "choice") {
        const cc = cfg as unknown as ChoiceConfig;
        steps.push({
          ask: "choice",
          ...baseAsk,
          opts: cc.options ?? [],
          multi: !!cc.multiple,
          other: !!cc.allowOther,
          none: "건너뛸래", // 한 페이지 보기처럼 고르지 않고 넘어갈 수 있게
        });
      } else if (ex.kind === "form") {
        // form: 먼저 prompt 말하고 각 필드별로 ask
        steps.push({ s: ex.prompt });
        const fields = (cfg.fields ?? []) as FormField[];
        for (const f of fields) {
          if (f.kind === "text" || f.kind === "textarea") {
            // 양식의 글 칸은 건너뛸 수 있게 (한 페이지 보기처럼 비워 둘 수 있다)
            steps.push({
              ask: "text",
              key: block.key,
              field: f.key,
              q: f.label,
              ph: f.placeholder,
              short: f.kind === "text",
              optional: true,
            });
          } else if (f.kind === "scale") {
            steps.push({
              ask: "scale",
              key: block.key,
              field: f.key,
              q: f.label,
              min: f.min ?? 0,
              max: f.max ?? 100,
              step: f.step ?? 1,
              unit: f.unit,
              lo: f.minLabel,
              hi: f.maxLabel,
              optional: true,
            });
            // 불안 수준 칸이 80 이상이면 도움 연결
            if (needsSafetyCheck(f.label) || f.key === "level") {
              steps.push({
                react: {
                  on: `${block.key}.${f.key}`,
                  cases: [
                    { when: ">=80", s: "불안이 많이 높았구나. 힘들 땐 혼자 버티지 않아도 돼.", safety: true },
                    { when: "else" },
                  ],
                },
              });
            }
          } else if (f.kind === "choice") {
            steps.push({
              ask: "choice",
              key: block.key,
              field: f.key,
              q: f.label,
              opts: f.options ?? [],
              multi: !!f.multiple,
              other: !!f.allowOther,
              none: "건너뛸래",
              optional: !!ex.optional,
            });
          } else if (f.kind === "number") {
            // 0~100 범위면 척도로
            const useScale = (f.min !== undefined && f.max !== undefined) || (f.label && f.label.includes("0~100"));
            if (useScale) {
              steps.push({
                ask: "scale",
                key: block.key,
                field: f.key,
                q: f.label,
                min: f.min ?? 0,
                max: f.max ?? 100,
                step: f.step ?? 1,
                unit: f.unit,
                lo: f.minLabel,
                hi: f.maxLabel,
                optional: !!ex.optional,
              });
            } else {
              steps.push({
                ask: "text",
                key: block.key,
                field: f.key,
                q: f.label,
                ph: f.placeholder ?? "숫자로 입력해요",
                short: true,
                numeric: true,
                optional: true,
              });
            }
          } else if (f.kind === "date") {
            // 날짜는 텍스트로 처리 (오늘 퀵 옵션 포함)
            steps.push({
              ask: "text",
              key: block.key,
              field: f.key,
              q: f.label,
              ph: "날짜 (예: 오늘, 2026-10-01)",
              samples: ["오늘"],
              short: true,
              date: true,
              optional: true,
            });
          }
        }
      } else if (ex.kind === "table") {
        // table: 행별로 상황 + 척도 묻기 (GuidedChatView ask:"table" 처리)
        // 칸은 그대로(저장 key가 같아야 한다). 0~100 숫자 칸은 막대로, 숫자뿐인 줄 이름은 버린다
        const labels = ((cfg.rowLabels as unknown[] | undefined) ?? []).map(String);
        const tableAsk = {
          ask: "table" as const,
          ...baseAsk,
          rows: labels.length || 3,
          rowLabels: labels.every((l) => /^\d+$/.test(l.trim())) ? [] : labels,
          cols: ((cfg.columns ?? []) as { key: string; label: string; kind: string }[]).map((c) => ({
            key: c.key,
            label: c.label ?? c.key,
            kind: (c.kind === "number" ? (String(c.label).includes("0~100") ? "scale" : "number") : "text") as "text" | "scale" | "number",
          })),
        };
        steps.push(tableAsk);
      } else if (ex.kind === "assessment") {
        const ac = cfg as unknown as AssessmentConfig;
        const assessStep: AskAssessment = {
          ask: "assessment",
          ...baseAsk,
          items: ac.items ?? [],
          options: ac.options ?? [],
          bands: ac.bands ?? [],
        };
        steps.push(assessStep);
      }
    }
  }

  // 끝 대사
  const outro = meta.sumi?.outro?.trim();
  steps.push({ s: outro || "오늘 기록 잘 남겼어. 물방울 하나 모았어!" });

  return withQuestions(steps);
}

/**
 * 대화형은 입력 칸의 질문(q)을 따로 말하지 않는다(대화형 원고는 앞 단계에서 묻는다).
 * 쓰기 실습에서 바꾼 글·점수·선택 입력은 질문을 숨이 말로 먼저 넣는다. 표·검사는 스스로 질문을 말한다.
 */
function withQuestions(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const st of steps) {
    if ("ask" in st && (st.ask === "text" || st.ask === "scale" || st.ask === "choice") && st.q?.trim()) {
      out.push({ s: st.q.trim() });
    }
    out.push(st);
  }
  return out;
}
