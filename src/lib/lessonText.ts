/**
 * 퀴즈·요약카드 ↔ 글(마크다운) 변환
 *
 * 관리자 편집기와 한양사이버 자료 가져오기(scripts/importHanyang.ts)가 같은 규칙을 쓴다.
 * ※ 원본은 hyeon-back/src/services/lessonText.ts — 이 파일은 복사본 — 규칙을 바꾸면 두 곳을 함께 고친다.
 *
 * [퀴즈 형식] — 한양사이버 `NN주차_예상문제.md` 그대로
 *   ### 1. 문제 줄기
 *   ① 보기  ② 보기 …           (한 줄에 하나 또는 여러 개)
 *   **정답: ③**                (복수 정답 **정답: ②, ④** · 서술형은 **정답** 다음 줄부터 모범답안)
 *   **근거 (어디)**: 근거 글
 *   **해설**: 해설 글
 *   `## N주차 — …` 구역 제목은 건너뛰고, 그 밖의 `## …`(정답 요약표·출제 메모) 뒤는 버린다.
 *
 * [카드 형식] 두 가지를 자동 판별
 *   1) Logseq 요약(`NN주차_요약.md`): `#card`가 붙은 항목 = 앞면, 더 들여쓴 하위 항목 = 뒷면, 맨 바깥 항목 = 묶음 이름
 *   2) 제목 형식: `## 묶음` · `### 앞면` 다음 줄부터 뒷면(마크다운)
 */

export interface TextQuizQuestion {
  key: string;
  kind: "choice" | "ox" | "essay";
  stem: string;
  options: string[];
  answers: number[];
  ground: string;
  where: string;
  explanation: string;
  modelAnswer: string;
}

export interface TextCard {
  front: string;
  back: string;
  group?: string;
}

const MARKS = "①②③④⑤⑥⑦⑧⑨⑩";
const OPT_RE = new RegExp(`^\\s*[${MARKS}]`);
const OPT_SPLIT_RE = new RegExp(`\\s*([${MARKS}])\\s*`);
const ANS_RE = /^\*\*정답\s*(?:[:：]\s*(.*?))?\*\*\s*(.*)$/;
const ANS_SKIP_RE = /^\*\*정답\s*(분포|번호|요약|배분)/;
const GROUND_RE = /^\*\*근거([^*]*)\*\*\s*[:：]?\s*(.*)$/;
const EXPL_RE = /^\*\*해설\*\*\s*[:：]?\s*(.*)$/;
const QHEAD_RE = /^###\s+(\S+?)\.\s*(.*)$/;
const WEEKSEC_RE = /^##\s+(\d{1,2})주차\s*(?:[—\-–]\s*(.*))?$/;
const OX_RE = /^[OXoxＯＸ○×]$/;

const tidy = (lines: string[]) => lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

function splitOptions(line: string): string[] {
  const parts = line.trim().split(OPT_SPLIT_RE); // [앞머리, 기호, 본문, 기호, 본문, …]
  const out: string[] = [];
  for (let i = 1; i + 1 < parts.length; i += 2) out.push(parts[i + 1].trim());
  return out;
}

export function parseQuizText(md: string): { questions: TextQuizQuestion[]; warnings: string[] } {
  interface Draft {
    label: string;
    stem: string[];
    options: string[];
    answers: number[];
    ansRaw: string;
    ansText: string[];
    ground: string[];
    where: string;
    explain: string[];
  }
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  let bucket: "stem" | "answer" | "ground" | "explain" | "dead" | null = null;
  const flush = () => {
    if (cur) drafts.push(cur);
    cur = null;
  };

  for (const ln of md.replace(/\r\n?/g, "\n").split("\n")) {
    if (WEEKSEC_RE.test(ln)) {
      flush();
      bucket = null;
      continue;
    }
    if (ln.startsWith("## ")) {
      flush();
      bucket = "dead";
      continue;
    }
    const h = ln.match(QHEAD_RE);
    if (h && bucket !== "dead") {
      flush();
      cur = { label: h[1], stem: [h[2].trim()], options: [], answers: [], ansRaw: "", ansText: [], ground: [], where: "", explain: [] };
      bucket = "stem";
      continue;
    }
    const c = cur as Draft | null;
    if (!c) continue;
    if (ln.trim() === "---") {
      bucket = "stem";
      continue;
    }
    const a = ln.match(ANS_RE);
    if (a && !ANS_SKIP_RE.test(ln)) {
      const raw = `${a[1] ?? ""} ${a[2] ?? ""}`;
      c.answers = [...raw].filter((ch) => MARKS.includes(ch)).map((ch) => MARKS.indexOf(ch));
      c.ansRaw = raw.replace(/^\s*[:：]\s*/, "").trim();
      bucket = "answer";
      continue;
    }
    const g = ln.match(GROUND_RE);
    if (g) {
      c.ground = [g[2].trim()];
      c.where = g[1].trim().replace(/^[\s(（]+|[\s)）]+$/g, "");
      bucket = "ground";
      continue;
    }
    const e = ln.match(EXPL_RE);
    if (e) {
      c.explain = [e[1].trim()];
      bucket = "explain";
      continue;
    }
    if (bucket === "stem" && OPT_RE.test(ln)) {
      c.options.push(...splitOptions(ln));
      continue;
    }
    if (bucket === "stem") c.stem.push(ln);
    else if (bucket === "ground") c.ground.push(ln);
    else if (bucket === "explain") c.explain.push(ln);
    else if (bucket === "answer") c.ansText.push(ln);
  }
  flush();

  const warnings: string[] = [];
  const questions: TextQuizQuestion[] = [];
  for (const d of drafts) {
    const stem = tidy(d.stem);
    if (!stem && !d.options.length) continue;
    const isOx = d.options.length === 2 && d.options.every((o) => OX_RE.test(o.trim()));
    let answers = d.answers.filter((i) => i < d.options.length);
    // O/X 문항에서 정답을 O·X 글자로만 적은 경우
    if (isOx && !answers.length) {
      const m = d.ansRaw.match(/[OXoxＯＸ○×]/);
      if (m) {
        const want = /[Xx×Ｘ]/.test(m[0]) ? "X" : "O";
        const idx = d.options.findIndex((o) => (/[Xx×Ｘ]/.test(o) ? "X" : "O") === want);
        if (idx >= 0) answers = [idx];
      }
    }
    let kind: TextQuizQuestion["kind"] = !d.options.length ? "essay" : isOx ? "ox" : "choice";
    if (kind !== "essay" && !answers.length) {
      warnings.push(`${d.label}번: 정답 번호를 읽지 못해 서술형(채점 안 함)으로 넣었어요.`);
      kind = "essay";
    }
    const ansText = tidy(d.ansText);
    questions.push({
      key: `q${questions.length + 1}`,
      kind,
      stem,
      options: kind === "essay" ? [] : d.options,
      answers: kind === "essay" ? [] : answers,
      ground: tidy(d.ground),
      where: d.where,
      explanation: tidy(d.explain),
      modelAnswer: kind === "essay" ? ansText || d.ansRaw : "",
    });
  }
  if (!questions.length) warnings.push("문항을 찾지 못했어요. `### 1. 문제` 형식인지 확인해 주세요.");
  return { questions, warnings };
}

export function quizToText(questions: Omit<TextQuizQuestion, "key">[]): string {
  return questions
    .map((q, i) => {
      const out = [`### ${i + 1}. ${q.stem}`, ""];
      if (q.kind !== "essay") {
        q.options.forEach((o, j) => out.push(`${MARKS[j] ?? `${j + 1}.`} ${o}`));
        out.push("", `**정답: ${q.answers.map((a) => MARKS[a]).join(", ")}**`);
      } else {
        out.push("**정답**", q.modelAnswer || "");
      }
      if (q.ground || q.where) out.push("", `**근거${q.where ? ` (${q.where})` : ""}**: ${q.ground}`);
      if (q.explanation) out.push("", `**해설**: ${q.explanation}`);
      return out.join("\n").trim();
    })
    .join("\n\n---\n\n");
}

// ── 카드 ──

const PROP_RE = /^[\w-]+::\s/; // Logseq 속성 줄(id:: · card-last-score:: 등)

function indentOf(line: string): number {
  const m = line.match(/^[\t ]*/)![0];
  let n = 0;
  let spaces = 0;
  for (const ch of m) {
    if (ch === "\t") n++;
    else if (++spaces === 2) {
      n++;
      spaces = 0;
    }
  }
  return n;
}

function parseLogseqCards(md: string): TextCard[] {
  const cards: TextCard[] = [];
  let group = "";
  let card: { front: string; level: number; back: string[]; group: string } | null = null;
  const close = () => {
    if (card) cards.push({ front: card.front, back: tidy(card.back), ...(card.group ? { group: card.group } : {}) });
    card = null;
  };
  for (const raw of md.replace(/\r\n?/g, "\n").split("\n")) {
    if (!raw.trim()) continue;
    const level = indentOf(raw);
    const body = raw.trim();
    const bullet = body.startsWith("- ") ? body.slice(2) : null;
    if (PROP_RE.test(bullet ?? body)) continue;
    const c = card as { front: string; level: number; back: string[]; group: string } | null;
    if (c && level > c.level) {
      const depth = level - c.level - 1;
      c.back.push(bullet !== null ? `${"  ".repeat(depth)}- ${bullet}` : `${"  ".repeat(depth)}  ${body}`);
      continue;
    }
    if (bullet === null) continue;
    if (/(^|\s)#card\b/.test(bullet)) {
      close();
      card = { front: bullet.replace(/(^|\s)#card\b/g, "").trim(), level, back: [], group };
    } else {
      close();
      if (level === 0) group = bullet.trim();
    }
  }
  close();
  return cards;
}

function parseHeadingCards(md: string): TextCard[] {
  const cards: TextCard[] = [];
  let group = "";
  let cur: { front: string; back: string[]; group: string } | null = null;
  const close = () => {
    if (cur) cards.push({ front: cur.front, back: tidy(cur.back), ...(cur.group ? { group: cur.group } : {}) });
    cur = null;
  };
  for (const ln of md.replace(/\r\n?/g, "\n").split("\n")) {
    const g = ln.match(/^##\s+(.*)$/);
    const f = ln.match(/^###\s+(.*)$/);
    if (f) {
      close();
      cur = { front: f[1].trim(), back: [], group };
    } else if (g) {
      close();
      group = g[1].trim();
    } else if (cur) cur.back.push(ln);
  }
  close();
  return cards;
}

export function parseCardsText(md: string): { cards: TextCard[]; warnings: string[] } {
  const cards = (/(^|\s)#card\b/m.test(md) ? parseLogseqCards(md) : parseHeadingCards(md)).filter((c) => c.front);
  const warnings: string[] = [];
  const empty = cards.filter((c) => !c.back).length;
  if (empty) warnings.push(`뒷면이 빈 카드가 ${empty}장 있어요.`);
  if (!cards.length) warnings.push("카드를 찾지 못했어요. `### 앞면` 다음 줄에 뒷면을 쓰거나, Logseq `#card` 형식을 붙여넣어 주세요.");
  return { cards, warnings };
}

export function cardsToText(cards: TextCard[]): string {
  const out: string[] = [];
  let group: string | undefined;
  for (const c of cards) {
    if ((c.group ?? "") !== (group ?? "")) {
      group = c.group ?? "";
      if (group) out.push(`## ${group}`, "");
    }
    out.push(`### ${c.front}`, c.back, "");
  }
  return out.join("\n").trim();
}
