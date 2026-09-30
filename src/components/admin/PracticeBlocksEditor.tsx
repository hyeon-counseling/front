"use client";

import { useMemo, useState } from "react";
import type { Block, Exercise, ExerciseKind } from "@/lib/practice";
import { Callout, Markdown } from "@/components/practice/Markdown";
import { ExerciseInput } from "@/components/practice/ExerciseInput";
import { Button, Input, Textarea } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 쓰기 실습 블록 편집기 — 관리자 강의 편집의 '쓰기 실습' 차시
//   본문(마크다운) · 안내 박스 · 문항(서술형·척도·선택·폼·표·진단지) 추가·순서 변경·미리보기
//   블록 key는 강의 전체에서 유일해야 하고, 회원이 답을 적은 문항은 저장할 때 지울 수 없게 막힌다.
// ─────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<ExerciseKind, string> = {
  text: "서술형",
  scale: "척도(점수)",
  choice: "선택",
  form: "여러 칸 입력(폼)",
  table: "표",
  assessment: "진단지(자동 채점)",
};

const DEFAULT_CONFIG: Record<ExerciseKind, Record<string, unknown>> = {
  text: { multiline: true },
  scale: { min: 0, max: 10, step: 1, minLabel: "전혀", maxLabel: "매우" },
  choice: { options: ["선택지 1", "선택지 2"], multiple: false },
  form: { fields: [{ key: "f1", label: "질문", kind: "textarea" }] },
  table: { rowLabels: ["1", "2", "3"], columns: [{ key: "c1", label: "항목", kind: "text" }] },
  assessment: { items: ["문항 1"], options: [{ label: "아니다", score: 0 }, { label: "그렇다", score: 1 }], bands: [] },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** 강의 안에서 겹치지 않는 블록 key (예: d01-b3) */
function uniqueKey(used: Set<string>, base: string) {
  let i = 1;
  while (used.has(`${base}-b${i}`)) i++;
  return `${base}-b${i}`;
}

export function PracticeBlocksEditor({
  blocks,
  keyBase,
  usedKeys,
  onChange,
}: {
  blocks: Block[];
  /** 새 블록 key 앞부분 (보통 차시 key) */
  keyBase: string;
  /** 강의 전체에서 이미 쓰는 블록 key */
  usedKeys: Set<string>;
  onChange: (next: Block[]) => void;
}) {
  const edit = (fn: (list: Block[]) => void) => {
    const next = clone(blocks);
    fn(next);
    onChange(next);
  };
  const addBlock = (type: Block["type"], kind?: ExerciseKind) => {
    const key = uniqueKey(usedKeys, keyBase);
    const block: Block =
      type === "exercise"
        ? { key, type, exercise: { kind: kind!, prompt: "질문을 적어 주세요", config: clone(DEFAULT_CONFIG[kind!]) } }
        : type === "callout"
          ? { key, type, tone: "info", md: "안내 문구" }
          : { key, type, md: "## 제목\n\n본문을 적어 주세요." };
    edit((l) => { l.push(block); });
  };

  return (
    <div className="space-y-4">
      {blocks.map((b, bi) => (
        <BlockEditor
          key={b.key}
          block={b}
          first={bi === 0}
          last={bi === blocks.length - 1}
          onChange={(fn) => edit((l) => fn(l[bi]))}
          onMove={(dir) => edit((l) => { const [x] = l.splice(bi, 1); l.splice(bi + dir, 0, x); })}
          onDelete={() => {
            if (confirm("이 블록을 지울까요? (회원이 답을 적은 문항은 저장할 때 막혀요)")) edit((l) => { l.splice(bi, 1); });
          }}
        />
      ))}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] p-4">
        <span className="mr-1 text-sm font-semibold text-[var(--foreground-muted)]">블록 추가</span>
        <Button size="sm" variant="secondary" onClick={() => addBlock("text")}>본문</Button>
        <Button size="sm" variant="secondary" onClick={() => addBlock("callout")}>안내 박스</Button>
        {(Object.keys(KIND_LABEL) as ExerciseKind[]).map((k) => (
          <Button key={k} size="sm" variant="secondary" onClick={() => addBlock("exercise", k)}>문항·{KIND_LABEL[k]}</Button>
        ))}
      </div>
    </div>
  );
}

// ── 블록 편집 ──────────────────────────────────────────────
function BlockEditor({
  block,
  first,
  last,
  onChange,
  onMove,
  onDelete,
}: {
  block: Block;
  first: boolean;
  last: boolean;
  onChange: (fn: (b: Block) => void) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const typeLabel = block.type === "text" ? "본문" : block.type === "callout" ? "안내 박스" : `문항 · ${KIND_LABEL[block.exercise!.kind]}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-light)] bg-[var(--surface)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-[var(--brand)] ring-1 ring-[var(--border)]">{typeLabel}</span>
          <span className="truncate text-xs text-[var(--foreground-subtle)]">{block.key}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <button onClick={() => setPreview((v) => !v)} className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white">{preview ? "편집" : "미리보기"}</button>
          <button disabled={first} onClick={() => onMove(-1)} className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white disabled:opacity-30">↑</button>
          <button disabled={last} onClick={() => onMove(1)} className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white disabled:opacity-30">↓</button>
          <button onClick={onDelete} className="cursor-pointer rounded-lg px-2 py-1 text-[var(--error)] hover:bg-white">삭제</button>
        </div>
      </div>
      <div className="p-4">
        {preview ? (
          <BlockPreview block={block} />
        ) : block.type === "exercise" ? (
          <div className="space-y-4">
            {/* 숨이 한마디 — 입력 칸 앞 말 (lead, ≤300자) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--foreground-muted)]">
                입력 칸 앞 숨이 한마디(lead) — 선택, {(block.lead ?? "").length}/300
              </label>
              <input
                type="text"
                value={block.lead ?? ""}
                maxLength={300}
                placeholder="비워 두면 바로 입력 칸이 나와요. 예: 어떤 상황이 가장 힘들었어?"
                onChange={(e) => onChange((b) => { b.lead = e.target.value || undefined; })}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[var(--brand)]"
              />
            </div>
            <ExerciseEditor ex={block.exercise!} onChange={(fn) => onChange((b) => fn(b.exercise!))} />
          </div>
        ) : (
          <div className="space-y-3">
            {block.type === "callout" && (
              <select value={block.tone ?? "info"} onChange={(e) => onChange((b) => { b.tone = e.target.value as Block["tone"]; })} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm">
                <option value="info">안내 (초록)</option>
                <option value="quote">한 줄 인용 (회색)</option>
                <option value="caution">주의 (노랑)</option>
              </select>
            )}
            <textarea
              value={block.md ?? ""}
              onChange={(e) => onChange((b) => { b.md = e.target.value; })}
              rows={Math.min(24, Math.max(4, (block.md ?? "").split("\n").length + 1))}
              className="w-full rounded-xl border border-[var(--border)] bg-white p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-[var(--brand)]"
            />
            <p className="text-xs text-[var(--foreground-subtle)]">마크다운: ## 제목, **굵게**, - 목록, &gt; 인용, 표(| a | b |)</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  const [v, setV] = useState<unknown>(undefined);
  if (block.type === "text") return <Markdown md={block.md ?? ""} />;
  if (block.type === "callout") return <Callout block={block} />;
  return (
    <div>
      <p className="mb-3 font-bold">{block.exercise!.prompt}</p>
      <ExerciseInput exercise={block.exercise!} value={v} onChange={setV} />
    </div>
  );
}

function ExerciseEditor({ ex, onChange }: { ex: Exercise; onChange: (fn: (e: Exercise) => void) => void }) {
  const cfg = ex.config as Record<string, unknown>;
  const setCfg = (k: string, v: unknown) => onChange((e) => { (e.config as Record<string, unknown>)[k] = v; });
  const structured = ex.kind === "form" || ex.kind === "table" || ex.kind === "assessment";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label>
          <span className="mb-1.5 block text-sm font-medium">문항 종류</span>
          <select
            value={ex.kind}
            onChange={(e) => {
              const kind = e.target.value as ExerciseKind;
              if (!confirm("종류를 바꾸면 설정이 기본값으로 바뀌어요. 계속할까요?")) return;
              onChange((x) => { x.kind = kind; x.config = clone(DEFAULT_CONFIG[kind]); });
            }}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm"
          >
            {(Object.keys(KIND_LABEL) as ExerciseKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <Input id={`p-${ex.prompt.length}`} label="질문" value={ex.prompt} onChange={(e) => onChange((x) => { x.prompt = e.target.value; })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input id="help" label="도움말 (선택)" value={ex.help ?? ""} onChange={(e) => onChange((x) => { x.help = e.target.value || undefined; })} />
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={!!ex.optional} onChange={(e) => onChange((x) => { x.optional = e.target.checked || undefined; })} className="accent-[var(--brand)]" />
          선택 문항
        </label>
      </div>

      {ex.kind === "text" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.multiline !== false} onChange={(e) => setCfg("multiline", e.target.checked)} className="accent-[var(--brand)]" />
          여러 줄 입력
        </label>
      )}

      {ex.kind === "scale" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {(["min", "max", "step"] as const).map((k) => (
            <Input key={k} id={`s-${k}`} type="number" label={{ min: "최소", max: "최대", step: "간격" }[k]} value={String(cfg[k] ?? "")} onChange={(e) => setCfg(k, Number(e.target.value))} />
          ))}
          <Input id="s-unit" label="단위" value={String(cfg.unit ?? "")} onChange={(e) => setCfg("unit", e.target.value)} />
          <Input id="s-minl" label="왼쪽 설명" value={String(cfg.minLabel ?? "")} onChange={(e) => setCfg("minLabel", e.target.value)} />
          <Input id="s-maxl" label="오른쪽 설명" value={String(cfg.maxLabel ?? "")} onChange={(e) => setCfg("maxLabel", e.target.value)} />
        </div>
      )}

      {ex.kind === "choice" && (
        <div className="space-y-3">
          <Textarea
            id="c-opts"
            label="선택지 (한 줄에 하나)"
            rows={Math.max(3, ((cfg.options as string[]) ?? []).length + 1)}
            value={((cfg.options as string[]) ?? []).join("\n")}
            onChange={(e) => setCfg("options", e.target.value.split("\n").filter((s) => s.trim()))}
          />
          <div className="flex gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!cfg.multiple} onChange={(e) => setCfg("multiple", e.target.checked)} className="accent-[var(--brand)]" />
              여러 개 선택
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!cfg.allowOther} onChange={(e) => setCfg("allowOther", e.target.checked)} className="accent-[var(--brand)]" />
              기타(직접 입력) 허용
            </label>
          </div>
        </div>
      )}

      {structured && <JsonConfig value={cfg} onChange={(v) => onChange((x) => { x.config = v; })} kind={ex.kind} />}
    </div>
  );
}

const JSON_HELP: Partial<Record<ExerciseKind, string>> = {
  form: 'fields: [{ key, label, kind: "text"|"textarea"|"date"|"number"|"scale"|"choice", placeholder?, min?, max?, step?, unit?, options?, multiple?, allowOther? }]',
  table: 'rowLabels: ["1위","2위"], columns: [{ key, label, kind: "text"|"number" }]',
  assessment: 'items: ["문항"], options: [{ label, score }], bands: [{ min, max, label, note?, alert? }]',
};

function JsonConfig({ value, onChange, kind }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; kind: ExerciseKind }) {
  const initial = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const [text, setText] = useState(initial);
  const [err, setErr] = useState("");
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">설정 (JSON)</span>
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setErr("");
            onChange(parsed);
          } catch {
            setErr("JSON 형식이 올바르지 않아요 — 고칠 때까지 저장되지 않아요.");
          }
        }}
        rows={Math.min(28, text.split("\n").length + 1)}
        className="w-full rounded-xl border border-[var(--border)] bg-[#0f1614] p-3 font-mono text-[12px] leading-relaxed text-[#d7eee6] outline-none"
      />
      <p className={`mt-1 text-xs ${err ? "text-[var(--error)]" : "text-[var(--foreground-subtle)]"}`}>{err || JSON_HELP[kind]}</p>
    </div>
  );
}
