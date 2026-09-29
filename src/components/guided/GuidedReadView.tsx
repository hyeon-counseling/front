"use client";

/**
 * GuidedReadView — guided 차시 읽기형 렌더러
 * 문서 형식(최대 680px).
 * h 줄은 본문 문단, s(r:true)는 숨이 아바타와 함께 표시.
 * ask 입력은 debounce 800ms 자동 저장.
 * react 스텝은 읽기형에서 생략 (대화형 전용).
 */

import { useCallback, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Character } from "@/components/character/Character";
import { GuidedQuiz } from "./GuidedQuiz";
import {
  refOf,
  getEntry,
  buildEntryValue,
  resolveCardFrom,
  gad7Band,
  type Step,
  type AskStep,
  type AskChoice,
  type AskText,
  type AskScale,
  type AskTable,
  type AskGad7,
  type Gad7Def,
  type SunGrant,
  type Entries,
} from "@/lib/guided";

interface Props {
  slug: string;
  lessonKey: string;
  steps: Step[];
  check?: boolean;
  gad7Def?: Gad7Def | null;
  initialEntries?: Entries;
  canSave?: boolean;
  isDone?: boolean;
  /** 미리보기 모드: 완료 버튼·저장 없음 */
  preview?: boolean;
  onCompleted?: (sun: SunGrant | null) => void;
  onNext?: () => void;
}

const SAVE_DELAY = 800;

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand-light)] disabled:bg-[var(--surface)] disabled:text-[var(--foreground-muted)]";

/** md 문자열 → 문단 HTML (빈 줄 기준) — 서버 상수에서 오는 값으로 XSS 위험 없음 */
function mdParagraphs(md: string): string {
  return md
    .split(/\n\n+/)
    .map((p) => `<p class="mb-3 last:mb-0">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function GuidedReadView({
  slug,
  lessonKey,
  steps,
  check,
  gad7Def,
  initialEntries = {},
  canSave = true,
  isDone = false,
  preview = false,
  onCompleted,
  onNext,
}: Props) {
  const [entries, setEntries] = useState<Entries>(initialEntries);
  const [completing, setCompleting] = useState(false);
  const [completedLocal, setCompletedLocal] = useState(isDone);
  const [sun, setSun] = useState<SunGrant | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── 자동 저장 ────────────────────────────────────────────────────────────

  const saveEntry = useCallback(
    (blockKey: string, value: unknown) => {
      if (!canSave || preview) return;
      void apiRequest(`/api/courses/${slug}/lessons/${lessonKey}/entries/${blockKey}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
    },
    [canSave, preview, slug, lessonKey]
  );

  const handleChange = useCallback(
    (ask: AskStep, rawValue: unknown) => {
      const { blockKey, value } = buildEntryValue(ask, rawValue, entries);
      setEntries((prev) => ({ ...prev, [blockKey]: value }));
      if (!canSave || preview) return;
      if (timers.current[blockKey]) clearTimeout(timers.current[blockKey]);
      timers.current[blockKey] = setTimeout(() => {
        delete timers.current[blockKey];
        saveEntry(blockKey, value);
      }, SAVE_DELAY);
    },
    [entries, canSave, preview, saveEntry]
  );

  // ── 완료 ─────────────────────────────────────────────────────────────────

  const complete = useCallback(async () => {
    if (preview) return;
    setCompleting(true);
    const res = await apiRequest<{ completed: boolean; sun?: SunGrant | null }>(
      `/api/courses/${slug}/lessons/${lessonKey}/progress`,
      { method: "PUT", body: JSON.stringify({ completed: true }) }
    );
    setCompleting(false);
    if (res.ok) {
      setCompletedLocal(true);
      const s = res.data?.sun ?? null;
      setSun(s);
      onCompleted?.(s);
    }
  }, [preview, slug, lessonKey, onCompleted]);

  // ── 스텝 렌더링 ──────────────────────────────────────────────────────────

  const renderAsk = (ask: AskStep, i: number): React.ReactNode => {
    if (ask.ask === "go") return null;
    if (ask.save === false) return null;

    const ref = refOf(ask);
    const currentVal = getEntry(entries, ref);
    const fid = `r-${lessonKey}-${i}`;

    if (ask.ask === "text") {
      const a = ask as AskText;
      const v = typeof currentVal === "string" ? currentVal : "";
      return (
        <div key={i} className="my-5">
          <label htmlFor={fid} className="mb-2 block text-[0.95rem] font-medium text-[var(--foreground)]">
            {ask.q}
            {ask.optional && (
              <span className="ml-2 text-xs font-normal text-[var(--foreground-subtle)]">선택</span>
            )}
          </label>
          {a.samples && (
            <div className="mb-2 flex flex-wrap gap-2">
              {a.samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange(ask, s)}
                  className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <textarea
            id={fid}
            rows={a.short ? 1 : 3}
            placeholder={a.ph ?? "여기에 적어요"}
            value={v}
            disabled={!canSave && !preview}
            onChange={(e) => handleChange(ask, e.target.value)}
            className={`${inputCls} min-h-[80px] resize-y leading-relaxed`}
          />
        </div>
      );
    }

    if (ask.ask === "scale") {
      const a = ask as AskScale;
      const v = typeof currentVal === "number" ? currentVal : Math.round((a.min + a.max) / 2);
      return (
        <div key={i} className="my-5">
          <label htmlFor={fid} className="mb-2 flex items-center justify-between text-[0.95rem] font-medium text-[var(--foreground)]">
            <span>
              {ask.q}
              {ask.optional && (
                <span className="ml-2 text-xs font-normal text-[var(--foreground-subtle)]">선택</span>
              )}
            </span>
            <b className="text-[var(--brand)]">
              {v}
              {a.unit && <small className="ml-0.5 font-normal">{a.unit}</small>}
            </b>
          </label>
          <input
            id={fid}
            type="range"
            min={a.min}
            max={a.max}
            step={a.step}
            value={v}
            onChange={(e) => handleChange(ask, Number(e.target.value))}
            className="w-full accent-[var(--brand)]"
            aria-label={ask.q}
          />
          <div className="mt-1 flex justify-between text-xs text-[var(--foreground-subtle)]">
            <span>{a.lo ?? a.min}</span>
            <span>{a.hi ?? a.max}</span>
          </div>
        </div>
      );
    }

    if (ask.ask === "choice") {
      const a = ask as AskChoice;
      const existing =
        currentVal != null && typeof currentVal === "object" && !Array.isArray(currentVal) && "selected" in currentVal
          ? ((currentVal as { selected?: string[] }).selected ?? [])
          : Array.isArray(currentVal)
            ? (currentVal as string[])
            : [];
      return (
        <fieldset key={i} className="my-5 border-0 p-0">
          <legend className="mb-2 text-[0.95rem] font-medium text-[var(--foreground)]">
            {ask.q}
            {ask.optional && (
              <span className="ml-2 text-xs font-normal text-[var(--foreground-subtle)]">선택</span>
            )}
          </legend>
          <div className="space-y-2">
            {a.opts.map((opt, j) => (
              <label
                key={j}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm transition-colors has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-light)]"
              >
                <input
                  type={a.multi ? "checkbox" : "radio"}
                  name={fid}
                  id={`${fid}-${j}`}
                  value={opt}
                  checked={existing.includes(opt)}
                  onChange={(e) => {
                    let newSel: string[];
                    if (a.multi) {
                      newSel = e.target.checked
                        ? [...existing, opt]
                        : existing.filter((x) => x !== opt);
                    } else {
                      newSel = [opt];
                    }
                    handleChange(ask, { selected: newSel });
                  }}
                  className="accent-[var(--brand)]"
                />
                {opt}
              </label>
            ))}
            {a.none && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm transition-colors has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-light)]">
                <input
                  type={a.multi ? "checkbox" : "radio"}
                  name={fid}
                  id={`${fid}-none`}
                  value="__none__"
                  checked={
                    existing.length === 0 &&
                    currentVal != null &&
                    typeof currentVal === "object" &&
                    "selected" in currentVal
                  }
                  onChange={() => handleChange(ask, { selected: [] })}
                  className="accent-[var(--brand)]"
                />
                {a.none}
              </label>
            )}
          </div>
        </fieldset>
      );
    }

    if (ask.ask === "table") {
      const a = ask as AskTable;
      const tableVal =
        currentVal != null && typeof currentVal === "object" && "rows" in currentVal
          ? (currentVal as { rows: { situation: string; level?: number }[] })
          : { rows: [] as { situation: string; level?: number }[] };
      return (
        <div key={i} className="my-5">
          <p className="mb-2 text-[0.95rem] font-medium text-[var(--foreground)]">{ask.q}</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--foreground-subtle)]"></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--foreground-subtle)]">상황</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--foreground-subtle)]">불안 (0~100)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: a.rows }, (_, r) => (
                  <tr key={r} className="border-b border-[var(--border-light)] last:border-0">
                    <td className="px-4 py-2 text-xs text-[var(--foreground-subtle)]">{r + 1}위</td>
                    <td className="px-2 py-1.5">
                      <input
                        id={`${fid}-s${r}`}
                        aria-label={`${r + 1}위 상황`}
                        value={tableVal.rows[r]?.situation ?? ""}
                        onChange={(e) => {
                          const newRows = [...tableVal.rows];
                          while (newRows.length <= r) newRows.push({ situation: "" });
                          newRows[r] = { ...newRows[r], situation: e.target.value };
                          handleChange(ask, { rows: newRows });
                        }}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus-visible:border-[var(--brand)]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        id={`${fid}-l${r}`}
                        aria-label={`${r + 1}위 불안 수준`}
                        type="number"
                        min={0}
                        max={100}
                        value={tableVal.rows[r]?.level ?? ""}
                        onChange={(e) => {
                          const newRows = [...tableVal.rows];
                          while (newRows.length <= r) newRows.push({ situation: "" });
                          newRows[r] = {
                            ...newRows[r],
                            level: e.target.value === "" ? undefined : Number(e.target.value),
                          };
                          handleChange(ask, { rows: newRows });
                        }}
                        className="w-20 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus-visible:border-[var(--brand)]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (ask.ask === "gad7") {
      const G = gad7Def;
      if (!G) return null;
      const gVal =
        currentVal != null && typeof currentVal === "object" && "answers" in currentVal
          ? (currentVal as { answers: (number | null)[]; score?: number; band?: string })
          : { answers: [] as (number | null)[] };
      const score = gVal.score;
      return (
        <div key={i} className="my-5">
          <p className="mb-3 text-[0.95rem] font-medium text-[var(--foreground)]">{ask.q}</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--foreground-subtle)]">문항</th>
                  {G.options.map(([label]) => (
                    <th key={label} className="px-2 py-2 text-center text-xs font-semibold text-[var(--foreground-subtle)]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {G.items.map((item, r) => (
                  <tr key={r} className="border-b border-[var(--border-light)] last:border-0">
                    <td className="px-4 py-2 text-[0.85rem] text-[var(--foreground)]">
                      {r + 1}. {item}
                    </td>
                    {G.options.map(([, val], c) => (
                      <td key={c} className="px-2 py-2 text-center">
                        <input
                          type="radio"
                          name={`${fid}-g${r}`}
                          id={`${fid}-g${r}-${c}`}
                          aria-label={`${item} ${G.options[c][0]}`}
                          value={val}
                          checked={gVal.answers[r] === val}
                          onChange={() => {
                            const newAns = [...(gVal.answers.length > 0 ? gVal.answers : new Array(G.items.length).fill(null) as (number | null)[])];
                            newAns[r] = val;
                            const allFilled = newAns.length === G.items.length && newAns.every((x) => x !== null);
                            if (allFilled) {
                              const newScore = (newAns as number[]).reduce((s, x) => s + x, 0);
                              const band = gad7Band(newScore);
                              handleChange(ask as AskGad7, { answers: newAns, score: newScore, band });
                            } else {
                              handleChange(ask as AskGad7, { answers: newAns });
                            }
                          }}
                          className="accent-[var(--brand)]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {score !== undefined
              ? `점수 ${score}점 · ${gVal.band}${score >= 15 ? " — 전문 상담과 함께하길 권해요 · 109 · 1577-0199" : ""}`
              : "모두 고르면 점수가 나와요"}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderStep = (step: Step, i: number): React.ReactNode => {
    if ("h" in step) {
      return (
        <p key={i} className="mb-4 text-[0.97rem] leading-relaxed text-[var(--foreground)]">
          {step.h}
        </p>
      );
    }
    if ("s" in step) {
      if (!step.r) return null;
      return (
        <p key={i} className="mb-4 flex items-start gap-3 text-[0.95rem] italic leading-relaxed text-[var(--foreground-muted)]">
          <span className="mt-0.5 inline-block w-8 shrink-0">
            <Character kind="sumi" mood="happy" arms={false} live />
          </span>
          {step.s}
        </p>
      );
    }
    if ("story" in step) {
      return (
        <blockquote key={i} className="my-5 rounded-2xl border-l-4 border-[var(--brand-mint)] bg-[var(--surface)] px-5 py-4">
          {step.who && (
            <p className="mb-1 text-xs font-semibold text-[var(--foreground-subtle)]">{step.who}</p>
          )}
          <p className="text-[0.95rem] leading-relaxed text-[var(--foreground)]">{step.story}</p>
        </blockquote>
      );
    }
    if ("tip" in step) {
      return (
        <div key={i} className="my-4 rounded-2xl bg-[var(--brand-light)] px-5 py-4 text-sm text-[var(--brand-ink)]">
          {step.tip}
        </div>
      );
    }
    if ("deep" in step) {
      return (
        <details key={i} className="my-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-[var(--brand)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
            더 알아보기 · {step.deep.replace(/^더 알아보기 — /, "")}
          </summary>
          <div
            className="px-5 pb-4 pt-1 text-sm leading-relaxed text-[var(--foreground-muted)] [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: mdParagraphs(step.md) }}
          />
        </details>
      );
    }
    if ("card" in step) {
      const items: string[] = step.items
        ? step.items
        : (step.from ?? []).map(([label, ref]) => `<b>${label}</b> ${resolveCardFrom(ref, entries)}`);
      return (
        <div key={i} className={`my-5 rounded-2xl bg-[var(--surface)] p-5 ${step.tone ?? ""}`}>
          <h4 className="mb-3 text-sm font-bold text-[var(--brand)]">{step.card}</h4>
          <ul className="space-y-1.5 text-sm">
            {items.map((item, j) => (
              <li
                key={j}
                className="flex items-start gap-2 text-[var(--foreground)]"
                dangerouslySetInnerHTML={{ __html: `<span class="shrink-0 text-[var(--brand)] mt-0.5">·</span> ${item}` }}
              />
            ))}
          </ul>
        </div>
      );
    }
    if ("traps" in step) {
      return (
        <div key={i} className="my-5 space-y-3">
          {step.traps.map(([name, desc, example], j) => (
            <div key={j} className="rounded-2xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                  {j + 1}
                </span>
                <b className="text-sm font-bold text-[var(--foreground)]">{name}</b>
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{desc}</p>
              <em className="mt-1 block text-sm italic text-[var(--foreground-subtle)]">{example}</em>
            </div>
          ))}
        </div>
      );
    }
    if ("safety" in step) {
      return (
        <div key={i} className="my-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">혼자 버티지 않아도 돼요</p>
          <p className="mt-1">
            {typeof step.safety === "string"
              ? step.safety
              : "지금 많이 힘들다면 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)에서 바로 이야기할 수 있어요."}
          </p>
        </div>
      );
    }
    if ("quiz" in step) {
      return (
        <GuidedQuiz
          key={i}
          quiz={step.quiz}
          courseSlug={slug}
          lessonKey={lessonKey}
          canSave={canSave && !preview}
        />
      );
    }
    if ("react" in step) return null;
    if ("ask" in step) return renderAsk(step as AskStep, i);
    return null;
  };

  return (
    <article className="mx-auto max-w-[680px] py-6">
      <div className="space-y-1">
        {steps.map((step, i) => renderStep(step, i))}
      </div>

      {!preview && (
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--border-light)] pt-6">
          <button
            type="button"
            onClick={completedLocal ? undefined : complete}
            disabled={completing || completedLocal}
            className={`inline-flex h-12 items-center rounded-xl px-6 text-sm font-semibold transition-colors ${
              completedLocal
                ? "cursor-default bg-[var(--brand-light)] text-[var(--brand)]"
                : "cursor-pointer bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
            }`}
          >
            {completedLocal ? "✓ 완료했어요" : check ? "점검 완료하기" : "읽었어요 · 완료"}
          </button>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-12 cursor-pointer items-center rounded-xl bg-[var(--surface)] px-6 text-sm font-semibold hover:bg-[var(--surface-muted)]"
            >
              다음 레슨 →
            </button>
          )}
        </div>
      )}

      {sun && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="text-xl">&#9728;&#65039;</span>
          <span>
            <b>햇살 +{sun.granted}</b> · {sun.reason}
            {sun.capped && " (오늘 최대 획득)"}
          </span>
        </div>
      )}
    </article>
  );
}
