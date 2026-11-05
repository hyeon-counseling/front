// 회원 삭제 안내 — 본인 탈퇴와 관리자 삭제가 같은 내용을 보여 준다 (규칙은 백엔드 memberDeletionService)
export interface DeletionItem {
  label: string;
  count: number;
  note?: string;
}
export interface DeletionBlocker {
  code: "admin" | "assessment" | "counseling";
  message: string;
  applicationNos?: string[];
}
export interface DeletionPreview {
  blockers: DeletionBlocker[];
  deleted: DeletionItem[];
  kept: DeletionItem[];
}

function Items({ items }: { items: DeletionItem[] }) {
  return (
    <ul className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
      {items.map((d) => (
        <li key={d.label} className="px-4 py-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-[var(--foreground)]">{d.label}</span>
            {d.count > 0 && <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">{d.count}건</span>}
          </div>
          {d.note && <p className="mt-0.5 text-xs leading-relaxed text-[var(--foreground-muted)]">{d.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** 건수가 없는 항목은 빼되, 고정 안내(설명이 있고 건수를 세지 않는 항목)는 남긴다 */
const visible = (items: DeletionItem[]) => items.filter((d) => d.count > 0 || d.label.includes("마음숲"));

export function DeletionSummary({ preview }: { preview: DeletionPreview }) {
  const kept = preview.kept.filter((d) => d.count > 0);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-bold text-[var(--foreground)]">지워지는 것</p>
        <Items items={visible(preview.deleted)} />
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-[var(--foreground)]">남는 것</p>
        {kept.length ? <Items items={kept} /> : <p className="rounded-xl border border-[var(--border-light)] px-4 py-3 text-sm text-[var(--foreground-muted)]">보관할 기록이 없어요.</p>}
      </div>
    </div>
  );
}
