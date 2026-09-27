"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { Alert, Badge, Button, Input, PageHeader, Skeleton, Textarea, Toast } from "@/components/ui";

// 관리자 — 방 O/X 퀴즈 문제 세트 (메뉴 연결 없는 모듈: /admin/ox-sets, 진행은 /ox)
interface SetRow {
  id: string;
  slug: string;
  title: string;
  status: "active" | "hidden";
  count: number;
}

const SAMPLE = `## 1막 · 가족체계
### O 보웬은 자아분화를 핵심 개념으로 본다
**맞아요.** 분화는 정서와 사고를 구분하는 능력이에요.
- ? 분화 수준이 낮으면 관계에서 어떤 모습이 나타날까요?

### X 가계도는 2세대만 그린다
**틀렸어요.** 보통 3세대 이상을 그려요.`;

export default function AdminOxSetsPage() {
  const [rows, setRows] = useState<SetRow[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; slug: string; title: string; text: string; status: "active" | "hidden" } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch("/api/admin/ox-sets").then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  const open = async (id: string) => {
    const d = await apiFetch(`/api/admin/ox-sets/${id}`);
    setEditing({ id, slug: d.slug, title: d.title, text: d.text, status: d.status });
    setError("");
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const body = JSON.stringify({ slug: editing.slug, title: editing.title, text: editing.text, status: editing.status });
    const r = editing.id
      ? await apiRequest(`/api/admin/ox-sets/${editing.id}`, { method: "PUT", body })
      : await apiRequest("/api/admin/ox-sets", { method: "POST", body });
    setSaving(false);
    if (!r.ok) return setError(r.message || "저장하지 못했어요.");
    setEditing(null);
    setToast("저장했어요.");
    load();
  };

  return (
    <div className="px-4 py-8">
      <PageHeader title="방 O/X 퀴즈 문제" description="방장이 방에서 고를 문제 세트예요. 퀴즈 진행은 /ox 주소에서 해요(메뉴에는 연결하지 않았어요).">
        <div className="mt-5 flex gap-2">
          <Button onClick={() => setEditing({ id: null, slug: "", title: "", text: SAMPLE, status: "active" })}>새 세트</Button>
          <Link href="/ox" target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">퀴즈 방 열기 ↗</Link>
        </div>
      </PageHeader>

      {editing ? (
        <div className="card max-w-4xl space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input id="t" label="세트 이름" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input id="s" label="주소 이름 (영문)" value={editing.slug} disabled={!!editing.id} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase() })} placeholder="family-basic" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">상태</label>
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as "active" | "hidden" })} className="h-11 w-full rounded-xl border border-[var(--border)] px-3">
                <option value="active">사용</option>
                <option value="hidden">숨김</option>
              </select>
            </div>
          </div>
          <Textarea
            id="text"
            label="문제 (## 묶음 · ### O 문장 / ### X 문장 · 다음 줄부터 해설 · '- ?'로 시작하면 설명자 질문)"
            className="min-h-[420px] font-mono text-sm"
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
          />
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>취소</Button>
            <Button onClick={save} loading={saving}>저장</Button>
          </div>
        </div>
      ) : !rows ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-3 p-5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{r.slug} · {r.count}문항</p>
              </div>
              <Badge tone={r.status === "active" ? "brand" : "neutral"}>{r.status === "active" ? "사용" : "숨김"}</Badge>
              <Button size="sm" variant="secondary" onClick={() => open(r.id)}>편집</Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  if (!window.confirm(`'${r.title}' 세트를 지울까요?`)) return;
                  const x = await apiRequest(`/api/admin/ox-sets/${r.id}`, { method: "DELETE" });
                  setToast(x.ok ? "지웠어요." : x.message);
                  load();
                }}
              >
                삭제
              </Button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-[var(--foreground-muted)]">아직 세트가 없어요.</p>}
        </div>
      )}
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
