"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Input, Modal, Skeleton } from "@/components/ui";

interface Row {
  _id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  price: number | null;
  salePrice: number | null;
  courseCount: number;
  enrollments: number;
  updatedAt: string;
}

const STATUS: Record<Row["status"], { label: string; tone: "brand" | "neutral" | "warning" }> = {
  published: { label: "공개", tone: "brand" },
  draft: { label: "작성 중", tone: "warning" },
  archived: { label: "보관", tone: "neutral" },
};

// 관리자 — 과정(여러 과목 묶음) 목록 + 새로 만들기
export default function AdminProgramsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/programs").then(setRows).catch(() => setRows([]));
  }, []);

  const create = async () => {
    setErr("");
    setSaving(true);
    try {
      const p = await apiFetch("/api/admin/programs", { method: "POST", body: JSON.stringify({ slug, title }) });
      router.push(`/admin/lms/programs/${p._id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "만들지 못했어요.");
      setSaving(false);
    }
  };

  const price = (r: Row) => {
    const p = r.salePrice ?? r.price;
    return p === null ? (r.visibility === "private" ? "초대 전용" : "미정") : `${p.toLocaleString()}원`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">과정 (과목 묶음)</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">강의 여러 개를 하나의 과정으로 묶어 팔거나, 이메일로 한 번에 초대해요.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ 새 과정</Button>
      </div>

      {rows === null ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">아직 과정이 없어요.</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <div key={r._id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{r.title}</h2>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  {r.visibility === "private" && <Badge>비공개</Badge>}
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  /programs/{r.slug} · 과목 {r.courseCount}개 · 가격 {price(r)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">수강생 {r.enrollments}명</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/programs/${r.slug}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  미리보기
                </Link>
                <Link href={`/admin/lms/programs/${r._id}/enrollments`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  수강생·초대
                </Link>
                <Link href={`/admin/lms/programs/${r._id}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
                  편집
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="새 과정">
        <div className="space-y-4">
          <Input id="p-title" label="과정 이름" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 상담심리 입문 3과목" />
          <Input
            id="p-slug"
            label="주소 (영문)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="예: counseling-starter"
            hint={`사이트 주소가 /programs/${slug || "..."} 가 돼요. 만든 뒤엔 바꿀 수 없어요.`}
          />
          <p className="text-xs text-[var(--foreground-subtle)]">처음에는 &lsquo;작성 중·비공개&rsquo;로 만들어져요. 과목을 넣고 공개 여부·가격을 정한 뒤 공개해 주세요.</p>
          {err && <p className="text-sm text-[var(--error)]">{err}</p>}
          <Button onClick={create} loading={saving} className="w-full">
            만들고 편집하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
