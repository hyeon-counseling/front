"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import type { Block, Exercise, ExerciseKind, WorkbookWeek } from "@/lib/workbook";
import { Callout, Markdown } from "@/components/workbook/Markdown";
import { ExerciseInput } from "@/components/workbook/ExerciseInput";
import { Button, Input, Skeleton, Textarea, Toast } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 관리자 — 워크북 편집기
//   [기본 정보] 제목·소개·공개 상태·가격·무료 범위
//   [내용 구성] 주차 → 일차 → 블록(본문·안내·문항) 편집, 순서 변경, 미리보기
// 저장 시 서버가 구조를 검사하고, 회원 기록이 있는 문항은 지울 수 없게 막는다.
// ─────────────────────────────────────────────────────────────────

interface WorkbookDoc {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  seriesLabel?: string;
  framework?: string;
  durationLabel?: string;
  description: string;
  status: "draft" | "published" | "archived";
  price: number | null;
  salePrice: number | null;
  accessDays: number | null;
  freeUntilWeek: number;
  plannedWeeks: string[];
  weeks: WorkbookWeek[];
}

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

function uniqueKey(weeks: WorkbookWeek[], base: string) {
  const used = new Set(weeks.flatMap((w) => w.days.flatMap((d) => d.blocks.map((b) => b.key))));
  let i = 1;
  while (used.has(`${base}-b${i}`)) i++;
  return `${base}-b${i}`;
}

export default function AdminWorkbookEditor() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<WorkbookDoc | null>(null);
  const [tab, setTab] = useState<"meta" | "content">("content");
  const [sel, setSel] = useState<{ w: number; d: number }>({ w: 0, d: 0 });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/admin/workbooks/${id}`).then((d: WorkbookDoc) => {
      d.weeks.sort((a, b) => a.order - b.order);
      setDoc(d);
    });
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (d: WorkbookDoc) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    setErrors([]);
    const body = {
      title: doc.title,
      subtitle: doc.subtitle,
      seriesLabel: doc.seriesLabel,
      framework: doc.framework,
      durationLabel: doc.durationLabel,
      description: doc.description,
      status: doc.status,
      price: doc.price,
      salePrice: doc.salePrice,
      accessDays: doc.accessDays,
      freeUntilWeek: doc.freeUntilWeek,
      plannedWeeks: doc.plannedWeeks,
      weeks: doc.weeks,
    };
    const res = await apiRequest<{ errors?: string[] }>(`/api/admin/workbooks/${id}`, { method: "PUT", body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setToast("저장했어요.");
    } else {
      setErrors(res.data?.errors ?? [res.message]);
    }
  };

  const week = doc?.weeks[sel.w];
  const day = week?.days[sel.d];

  if (!doc) return <div className="p-10"><Skeleton className="h-96" /></div>;

  return (
    <div className="px-4 py-8">
      {/* 상단 바 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/workbooks" className="text-sm text-[var(--foreground-subtle)]">← 워크북 목록</Link>
          <h1 className="font-display mt-1 text-2xl">{doc.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-[var(--warning)]">저장 안 된 변경 있음</span>}
          <Link href={`/workbooks/${doc.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">
            사이트에서 보기 ↗
          </Link>
          <Button onClick={save} loading={saving} disabled={!dirty}>저장</Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">저장하지 못했어요</p>
          <ul className="mt-1 list-disc pl-5">{errors.map((e, i) => <li key={i} className="whitespace-pre-wrap">{e}</li>)}</ul>
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-xl bg-[var(--surface)] p-1 text-sm font-semibold sm:w-fit">
        {(["content", "meta"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 cursor-pointer rounded-lg px-4 py-2 sm:flex-none ${tab === t ? "bg-white shadow-sm" : "text-[var(--foreground-muted)]"}`}>
            {t === "content" ? "내용 구성" : "기본 정보·판매"}
          </button>
        ))}
      </div>

      {tab === "meta" ? (
        <MetaEditor doc={doc} update={update} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* 주차·일차 트리 */}
          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            {doc.weeks.map((w, wi) => (
              <div key={w.key} className="card p-3">
                <input
                  value={w.title}
                  onChange={(e) => update((d) => { d.weeks[wi].title = e.target.value; })}
                  className="w-full rounded-lg px-2 py-1 text-sm font-bold outline-none focus:bg-[var(--surface)]"
                />
                <p className="px-2 text-[11px] text-[var(--foreground-subtle)]">
                  {w.key} · order {w.order} {w.order <= doc.freeUntilWeek ? "· 무료" : "· 이용권"}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {w.days.map((d, di) => (
                    <li key={d.key}>
                      <button
                        onClick={() => setSel({ w: wi, d: di })}
                        className={`w-full cursor-pointer truncate rounded-lg px-2 py-1.5 text-left text-sm ${sel.w === wi && sel.d === di ? "bg-[var(--brand-light)] font-semibold text-[var(--brand)]" : "hover:bg-[var(--surface)]"}`}
                      >
                        <span className="mr-1.5 text-xs text-[var(--foreground-subtle)]">{d.label}</span>
                        {d.title}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    const n = doc.weeks.reduce((s, x) => s + x.days.length, 0) + 1;
                    let key = `d${String(n).padStart(2, "0")}`;
                    const used = new Set(doc.weeks.flatMap((x) => x.days.map((y) => y.key)));
                    while (used.has(key)) key = `${key}x`;
                    update((d) => { d.weeks[wi].days.push({ key, label: `Day ${n}`, title: "새 일차", estMinutes: 10, blocks: [] }); });
                    setSel({ w: wi, d: w.days.length });
                  }}
                  className="mt-2 w-full cursor-pointer rounded-lg border border-dashed border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-muted)] hover:border-[var(--brand)]"
                >
                  + 일차 추가
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const order = (doc.weeks[doc.weeks.length - 1]?.order ?? -1) + 1;
                update((d) => { d.weeks.push({ key: `w${order}`, order, title: `Week ${order}`, theme: "", days: [] }); });
              }}
              className="w-full cursor-pointer rounded-xl border border-dashed border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground-muted)] hover:border-[var(--brand)]"
            >
              + 주차 추가
            </button>
          </aside>

          {/* 일차 편집 */}
          {week && day ? (
            <DayEditor
              key={`${week.key}-${day.key}`}
              week={week}
              dayIndex={sel.d}
              weeks={doc.weeks}
              onChange={(fn) => update((d) => fn(d.weeks[sel.w]))}
              onDeleteDay={() => {
                if (!confirm(`'${day.title}' 일차를 지울까요? (저장해야 반영돼요)`)) return;
                update((d) => { d.weeks[sel.w].days.splice(sel.d, 1); });
                setSel({ w: sel.w, d: Math.max(0, sel.d - 1) });
              }}
              slug={doc.slug}
            />
          ) : (
            <div className="card p-10 text-center text-sm text-[var(--foreground-muted)]">왼쪽에서 일차를 고르거나 추가해 주세요.</div>
          )}
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ── 기본 정보 ──────────────────────────────────────────────
function MetaEditor({ doc, update }: { doc: WorkbookDoc; update: (fn: (d: WorkbookDoc) => void) => void }) {
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h2 className="font-bold">소개</h2>
        <Input id="m-title" label="제목" value={doc.title} onChange={(e) => update((d) => { d.title = e.target.value; })} />
        <Input id="m-sub" label="부제" value={doc.subtitle ?? ""} onChange={(e) => update((d) => { d.subtitle = e.target.value; })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="m-series" label="시리즈" value={doc.seriesLabel ?? ""} onChange={(e) => update((d) => { d.seriesLabel = e.target.value; })} />
          <Input id="m-fw" label="치료 기법" value={doc.framework ?? ""} onChange={(e) => update((d) => { d.framework = e.target.value; })} />
          <Input id="m-dur" label="기간 표시" value={doc.durationLabel ?? ""} onChange={(e) => update((d) => { d.durationLabel = e.target.value; })} />
        </div>
        <Textarea id="m-desc" label="소개글 (마크다운)" rows={12} value={doc.description} onChange={(e) => update((d) => { d.description = e.target.value; })} />
        <Textarea
          id="m-planned"
          label="전체 커리큘럼 (한 줄에 한 단계, 미공개 주차는 '공개 예정'으로 보여요)"
          rows={9}
          value={doc.plannedWeeks.join("\n")}
          onChange={(e) => update((d) => { d.plannedWeeks = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean); })}
        />
      </div>
      <div className="card h-fit space-y-4 p-6">
        <h2 className="font-bold">운영·판매</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">운영 상태</span>
          <select value={doc.status} onChange={(e) => update((d) => { d.status = e.target.value as WorkbookDoc["status"]; })} className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
            <option value="draft">작성 중 (관리자만 보임)</option>
            <option value="published">운영 중</option>
            <option value="archived">보관 (목록에서 숨김)</option>
          </select>
        </label>
        <Input id="m-free" type="number" label="무료 범위 — 이 주차(order)까지 무료" value={String(doc.freeUntilWeek)} onChange={(e) => update((d) => { d.freeUntilWeek = Number(e.target.value || 0); })} hint="0 = 시작하기까지, 1 = 1주차까지 무료" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="m-price" type="number" label="정가 (원)" value={doc.price ?? ""} onChange={(e) => update((d) => { d.price = numOrNull(e.target.value); })} hint="비워 두면 '구매 준비 중'" />
          <Input id="m-sale" type="number" label="할인가 (원)" value={doc.salePrice ?? ""} onChange={(e) => update((d) => { d.salePrice = numOrNull(e.target.value); })} />
        </div>
        <Input id="m-days" type="number" label="이용 기간 (일)" value={doc.accessDays ?? ""} onChange={(e) => update((d) => { d.accessDays = numOrNull(e.target.value); })} hint="비워 두면 무제한. 결제·수동 부여 시 적용" />
        <p className="rounded-xl bg-[var(--surface)] p-3 text-xs text-[var(--foreground-muted)]">
          결제 기능(S3)이 붙기 전까지는 &lsquo;이용자&rsquo; 화면에서 이메일로 전체 이용권을 직접 부여해 테스트할 수 있어요.
        </p>
      </div>
    </div>
  );
}

// ── 일차 편집 ──────────────────────────────────────────────
function DayEditor({
  week,
  dayIndex,
  weeks,
  onChange,
  onDeleteDay,
  slug,
}: {
  week: WorkbookWeek;
  dayIndex: number;
  weeks: WorkbookWeek[];
  onChange: (fn: (w: WorkbookWeek) => void) => void;
  onDeleteDay: () => void;
  slug: string;
}) {
  const day = week.days[dayIndex];
  const setDay = (fn: (d: typeof day) => void) => onChange((w) => fn(w.days[dayIndex]));

  const addBlock = (type: Block["type"], kind?: ExerciseKind) => {
    const key = uniqueKey(weeks, day.key);
    const block: Block =
      type === "exercise"
        ? { key, type, exercise: { kind: kind!, prompt: "질문을 적어 주세요", config: clone(DEFAULT_CONFIG[kind!]) } }
        : type === "callout"
          ? { key, type, tone: "info", md: "안내 문구" }
          : { key, type, md: "## 제목\n\n본문을 적어 주세요." };
    setDay((d) => { d.blocks.push(block); });
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="card space-y-4 p-5">
        <Input id="d-title" label="일차 제목" value={day.title} onChange={(e) => setDay((d) => { d.title = e.target.value; })} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32"><Input id="d-label" label="라벨" value={day.label} onChange={(e) => setDay((d) => { d.label = e.target.value; })} /></div>
          <div className="w-28"><Input id="d-min" type="number" label="예상(분)" value={String(day.estMinutes ?? 10)} onChange={(e) => setDay((d) => { d.estMinutes = Number(e.target.value || 0); })} /></div>
          <div className="ml-auto flex gap-2">
            <Link href={`/workbook/${slug}/${day.key}`} target="_blank" className="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">회원 화면 ↗</Link>
            <Button variant="danger" onClick={onDeleteDay}>일차 삭제</Button>
          </div>
        </div>
        <p className="text-xs text-[var(--foreground-subtle)]">일차 key: {day.key} (회원 진행 기록이 이 key로 저장돼요)</p>
      </div>

      {day.blocks.map((b, bi) => (
        <BlockEditor
          key={b.key}
          block={b}
          first={bi === 0}
          last={bi === day.blocks.length - 1}
          onChange={(fn) => setDay((d) => fn(d.blocks[bi]))}
          onMove={(dir) => setDay((d) => { const [x] = d.blocks.splice(bi, 1); d.blocks.splice(bi + dir, 0, x); })}
          onDelete={() => {
            if (confirm("이 블록을 지울까요? (회원 기록이 있는 문항은 저장 시 막혀요)")) setDay((d) => { d.blocks.splice(bi, 1); });
          }}
        />
      ))}

      <div className="card flex flex-wrap items-center gap-2 p-4">
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
          <ExerciseEditor ex={block.exercise!} onChange={(fn) => onChange((b) => fn(b.exercise!))} />
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
