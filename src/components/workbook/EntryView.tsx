import type { AssessmentConfig, Exercise, FormField, TableColumn } from "@/lib/workbook";
import { scoreBand } from "./ExerciseInput";

// 내 기록 모아보기 — 문항 답을 읽기 전용으로 보여준다

type Choice = { selected?: string[]; other?: string };

function choiceText(v: unknown) {
  const c = (v ?? {}) as Choice;
  const parts = [...(c.selected ?? [])];
  if (c.other) parts.push(`기타: ${c.other}`);
  return parts.join(", ");
}

function fieldText(f: FormField, v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (f.kind === "choice") return choiceText(v);
  if (f.kind === "scale") return `${v}${f.unit ?? ""}`;
  return String(v);
}

function Empty() {
  return <span className="text-[var(--foreground-subtle)]">—</span>;
}

export function EntryView({ exercise, value }: { exercise: Exercise; value: unknown }) {
  const cfg = exercise.config ?? {};
  switch (exercise.kind) {
    case "text":
      return <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{(value as string) || <Empty />}</p>;
    case "scale":
      return <p className="text-lg font-bold">{typeof value === "number" ? `${value}${(cfg as { unit?: string }).unit ?? ""}` : <Empty />}</p>;
    case "choice":
      return <p className="text-[0.95rem]">{choiceText(value) || <Empty />}</p>;
    case "form": {
      const fields = ((cfg as { fields?: FormField[] }).fields ?? []) as FormField[];
      const obj = (value ?? {}) as Record<string, unknown>;
      return (
        <dl className="grid gap-3">
          {fields.map((f) => {
            const t = fieldText(f, obj[f.key]);
            return (
              <div key={f.key}>
                <dt className="text-xs font-semibold text-[var(--foreground-subtle)]">{f.label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed">{t || <Empty />}</dd>
              </div>
            );
          })}
        </dl>
      );
    }
    case "table": {
      const t = cfg as { rowLabels?: string[]; columns?: TableColumn[] };
      const rows = ((value as { rows?: Record<string, unknown>[] })?.rows ?? []);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-subtle)]">
                <th className="py-1.5 pr-3" />
                {(t.columns ?? []).map((c) => (
                  <th key={c.key} className="py-1.5 pr-3 font-semibold">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(t.rowLabels ?? []).map((label, i) => (
                <tr key={label} className="border-t border-[var(--border-light)] align-top">
                  <td className="py-2 pr-3 text-xs font-bold text-[var(--brand)]">{label}</td>
                  {(t.columns ?? []).map((c) => (
                    <td key={c.key} className="py-2 pr-3">{rows[i]?.[c.key] === null || rows[i]?.[c.key] === undefined || rows[i]?.[c.key] === "" ? <Empty /> : String(rows[i][c.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "assessment": {
      const v = (value ?? {}) as { score?: number | null };
      const band = scoreBand(cfg as unknown as AssessmentConfig, v.score ?? null);
      return v.score === null || v.score === undefined ? (
        <p className="text-sm text-[var(--foreground-subtle)]">아직 모든 문항에 답하지 않았어요.</p>
      ) : (
        <p className="text-lg font-bold">
          {v.score}점 <span className="text-[var(--brand)]">{band?.label}</span>
        </p>
      );
    }
    default:
      return null;
  }
}
