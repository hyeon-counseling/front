"use client";

/**
 * 워크북 문항 입력 — 6종 (text · scale · choice · form · table · assessment)
 * 값 형태는 백엔드 workbookService.sanitizeValue 와 동일하게 맞춘다.
 *   text       string
 *   scale      number | null
 *   choice     { selected: string[], other?: string }
 *   form       { [fieldKey]: 위 값들 }
 *   table      { rows: { [colKey]: string | number | null }[] }
 *   assessment { answers: (number | null)[], score?, band? }
 */

import type {
  AssessmentConfig,
  ChoiceConfig,
  Exercise,
  FormField,
  ScaleConfig,
  TableColumn,
} from "@/lib/practice";

type Choice = { selected: string[]; other?: string };

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] disabled:bg-[var(--surface)] disabled:text-[var(--foreground-muted)]";

// ── 공통 조각 ──────────────────────────────────────────────

function TextArea({ value, onChange, disabled, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className={`${inputCls} min-h-[96px] resize-y leading-relaxed`}
      rows={rows}
      value={value}
      placeholder={placeholder ?? "자유롭게 적어 주세요"}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ScaleInput({ value, onChange, cfg, disabled }: { value: number | null; onChange: (v: number | null) => void; cfg: ScaleConfig; disabled?: boolean }) {
  const min = cfg.min ?? 0;
  const max = cfg.max ?? 100;
  const step = cfg.step ?? 1;
  const has = typeof value === "number";
  const pct = has ? ((value - min) / (max - min)) * 100 : 0;
  // 0~10처럼 칸이 적으면 버튼, 많으면 슬라이더
  const count = Math.floor((max - min) / step) + 1;

  if (count <= 11) {
    const values = Array.from({ length: count }, (_, i) => min + i * step);
    return (
      <div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {values.map((v) => (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value === v ? null : v)}
              className={`h-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                value === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {(cfg.minLabel || cfg.maxLabel) && (
          <div className="mt-1.5 flex justify-between text-xs text-[var(--foreground-subtle)]">
            <span>{cfg.minLabel}</span>
            <span>{cfg.maxLabel}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={has ? value : min}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full accent-[var(--brand)] disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(to right, var(--brand) ${pct}%, var(--surface-muted) ${pct}%)` }}
          aria-label="점수"
        />
        <span className={`w-16 text-right text-lg font-bold tabular-nums ${has ? "text-[var(--foreground)]" : "text-[var(--foreground-subtle)]"}`}>
          {has ? `${value}${cfg.unit ?? ""}` : "—"}
        </span>
      </div>
      {(cfg.minLabel || cfg.maxLabel) && (
        <div className="mt-1.5 flex justify-between pr-20 text-xs text-[var(--foreground-subtle)]">
          <span>{cfg.minLabel}</span>
          <span>{cfg.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

export function ChoiceInput({ value, onChange, cfg, disabled }: { value: Choice | undefined; onChange: (v: Choice) => void; cfg: ChoiceConfig; disabled?: boolean }) {
  const selected = value?.selected ?? [];
  const toggle = (opt: string) => {
    if (cfg.multiple) {
      onChange({ ...value, selected: selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt] });
    } else {
      onChange({ ...value, selected: selected[0] === opt ? [] : [opt] });
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {cfg.options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt)}
              aria-pressed={on}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                on
                  ? "bg-[var(--brand)] font-semibold text-white"
                  : "bg-white text-[var(--foreground-muted)] ring-1 ring-[var(--border)] hover:ring-[var(--brand)]"
              }`}
            >
              {cfg.multiple && <span className="mr-1.5">{on ? "✓" : "+"}</span>}
              {opt}
            </button>
          );
        })}
      </div>
      {cfg.allowOther && (
        <input
          className={`${inputCls} mt-3`}
          placeholder="기타 (직접 적기)"
          value={value?.other ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ selected, other: e.target.value })}
        />
      )}
      {cfg.multiple && <p className="mt-2 text-xs text-[var(--foreground-subtle)]">여러 개 고를 수 있어요.</p>}
    </div>
  );
}

function FieldInput({ field, value, onChange, disabled }: { field: FormField; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  switch (field.kind) {
    case "text":
      return <input className={inputCls} value={(value as string) ?? ""} placeholder={field.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "textarea":
      return <TextArea value={(value as string) ?? ""} placeholder={field.placeholder} disabled={disabled} onChange={onChange} />;
    case "date":
      return <input type="date" className={`${inputCls} max-w-[220px]`} value={(value as string) ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <input
          type="number"
          inputMode="numeric"
          className={`${inputCls} max-w-[160px]`}
          value={value === null || value === undefined ? "" : String(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "scale":
      return <ScaleInput value={(value as number) ?? null} onChange={onChange} cfg={field} disabled={disabled} />;
    case "choice":
      return <ChoiceInput value={value as Choice | undefined} onChange={onChange} cfg={{ options: field.options ?? [], multiple: field.multiple, allowOther: field.allowOther }} disabled={disabled} />;
    default:
      return null;
  }
}

function TableInput({ value, onChange, rowLabels, columns, disabled }: { value: { rows?: Record<string, unknown>[] } | undefined; onChange: (v: unknown) => void; rowLabels: string[]; columns: TableColumn[]; disabled?: boolean }) {
  const rows = rowLabels.map((_, i) => value?.rows?.[i] ?? {});
  const set = (i: number, col: TableColumn, raw: string) => {
    const next = rows.map((r, ri) => (ri === i ? { ...r, [col.key]: col.kind === "number" ? (raw === "" ? null : Number(raw)) : raw } : r));
    onChange({ rows: next });
  };
  return (
    <div className="space-y-3">
      {rowLabels.map((label, i) => (
        <div key={label} className="rounded-xl bg-[var(--surface)] p-3 sm:flex sm:items-start sm:gap-3">
          <span className="mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-white px-2 text-xs font-bold text-[var(--brand)] ring-1 ring-[var(--border)] sm:mb-0 sm:mt-2">
            {label}
          </span>
          <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            {columns.map((col) => (
              <label key={col.key} className={col.kind === "number" ? "sm:max-w-[160px]" : ""}>
                <span className="mb-1 block text-xs text-[var(--foreground-subtle)]">{col.label}</span>
                <input
                  type={col.kind === "number" ? "number" : "text"}
                  inputMode={col.kind === "number" ? "numeric" : undefined}
                  className={`${inputCls} py-2.5`}
                  value={rows[i][col.key] === null || rows[i][col.key] === undefined ? "" : String(rows[i][col.key])}
                  disabled={disabled}
                  onChange={(e) => set(i, col, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function scoreBand(cfg: AssessmentConfig, score: number | null) {
  if (score === null) return null;
  return cfg.bands?.find((b) => score >= b.min && score <= b.max) ?? null;
}

function AssessmentInput({ value, onChange, cfg, disabled }: { value: { answers?: (number | null)[]; score?: number | null } | undefined; onChange: (v: unknown) => void; cfg: AssessmentConfig; disabled?: boolean }) {
  const answers = cfg.items.map((_, i) => value?.answers?.[i] ?? null);
  const complete = answers.every((a) => a !== null);
  const score = complete ? (answers as number[]).reduce((s, a) => s + a, 0) : null;
  const band = scoreBand(cfg, score);
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div>
      <ol className="space-y-4">
        {cfg.items.map((item, i) => (
          <li key={i}>
            <p className="mb-2 text-[0.95rem] font-medium text-[var(--foreground)]">
              <span className="mr-2 text-[var(--brand)]">{i + 1}</span>
              {item}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {cfg.options.map((o) => (
                <button
                  key={o.score}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const next = [...answers];
                    next[i] = answers[i] === o.score ? null : o.score;
                    onChange({ answers: next });
                  }}
                  className={`cursor-pointer rounded-lg px-2 py-2 text-xs transition-colors disabled:cursor-not-allowed sm:text-sm ${
                    answers[i] === o.score ? "bg-[var(--brand)] font-semibold text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {o.label} <span className="opacity-70">({o.score})</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className={`mt-6 rounded-2xl p-5 ${band?.alert ? "bg-amber-50 ring-1 ring-amber-200" : "bg-[var(--brand-light)]/60"}`}>
        {score === null ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            {answered}/{cfg.items.length} 문항 응답 — 모두 답하면 점수가 계산돼요.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--foreground-muted)]">나의 점수</p>
            <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">
              {score}점 <span className="text-lg font-bold text-[var(--brand)]">{band?.label}</span>
            </p>
            {band?.note && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{band.note}</p>}
            {band?.alert && (
              <p className="mt-3 text-sm font-medium text-amber-800">
                혼자 진행하기 어렵게 느껴지면 <a href="/counseling" className="underline">상담 안내</a>를 확인해 주세요. 위급할 땐 109(자살예방상담전화).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 진입점 ──────────────────────────────────────────────

export function ExerciseInput({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const cfg = exercise.config ?? {};
  switch (exercise.kind) {
    case "text":
      return (cfg as { multiline?: boolean }).multiline === false ? (
        <input className={inputCls} value={(value as string) ?? ""} disabled={disabled} placeholder="한 줄로 적어 주세요" onChange={(e) => onChange(e.target.value)} />
      ) : (
        <TextArea value={(value as string) ?? ""} onChange={onChange} disabled={disabled} rows={4} />
      );
    case "scale":
      return <ScaleInput value={(value as number) ?? null} onChange={onChange} cfg={cfg as ScaleConfig} disabled={disabled} />;
    case "choice":
      return <ChoiceInput value={value as Choice | undefined} onChange={onChange} cfg={cfg as unknown as ChoiceConfig} disabled={disabled} />;
    case "form": {
      const fields = ((cfg as { fields?: FormField[] }).fields ?? []) as FormField[];
      const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
      return (
        <div className="space-y-5">
          {fields.map((f) => (
            <div key={f.key}>
              <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">{f.label}</p>
              <FieldInput field={f} value={obj[f.key]} disabled={disabled} onChange={(v) => onChange({ ...obj, [f.key]: v })} />
            </div>
          ))}
        </div>
      );
    }
    case "table": {
      const t = cfg as { rowLabels?: string[]; columns?: TableColumn[] };
      return <TableInput value={value as { rows?: Record<string, unknown>[] } | undefined} onChange={onChange} rowLabels={t.rowLabels ?? ["1"]} columns={t.columns ?? []} disabled={disabled} />;
    }
    case "assessment":
      return <AssessmentInput value={value as { answers?: (number | null)[] } | undefined} onChange={onChange} cfg={cfg as unknown as AssessmentConfig} disabled={disabled} />;
    default:
      return <p className="text-sm text-[var(--foreground-subtle)]">지원하지 않는 문항이에요.</p>;
  }
}
