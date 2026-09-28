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
  visibility?: "public" | "private";
  price: number | null;
  salePrice: number | null;
  sectionCount: number;
  lessonCount: number;
  enrollments: number;
  updatedAt: string;
}

const STATUS: Record<Row["status"], { label: string; tone: "brand" | "neutral" | "warning" }> = {
  published: { label: "운영 중", tone: "brand" },
  draft: { label: "작성 중", tone: "warning" },
  archived: { label: "보관", tone: "neutral" },
};

// 관리자 — 강의 목록 + 새로 만들기
export default function AdminCoursesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/courses").then(setRows).catch(() => setRows([]));
  }, []);

  const create = async () => {
    setErr("");
    setSaving(true);
    try {
      const c = await apiFetch("/api/admin/courses", { method: "POST", body: JSON.stringify({ slug, title }) });
      router.push(`/admin/lms/courses/${c._id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "만들지 못했어요.");
      setSaving(false);
    }
  };

  const price = (r: Row) => {
    const p = r.salePrice ?? r.price;
    return p === null ? "미정" : `${p.toLocaleString()}원${r.salePrice !== null && r.price ? ` (정가 ${r.price.toLocaleString()}원)` : ""}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">강의 (LMS)</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">영상 강의의 차시·동영상·판매 정보·수강생을 관리해요.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ 새 강의</Button>
      </div>

      {rows === null ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">아직 강의가 없어요.</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <div key={r._id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{r.title}</h2>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  {r.visibility === "private" && <Badge>비공개 · 초대 전용</Badge>}
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  /{r.slug} · 섹션 {r.sectionCount} · 차시 {r.lessonCount} · 가격 {price(r)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">수강생 {r.enrollments}명</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${r.slug}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  미리보기
                </Link>
                <Link href={`/admin/lms/courses/${r._id}/enrollments`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                  수강생
                </Link>
                <Link href={`/admin/lms/courses/${r._id}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">
                  편집
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="새 강의">
        <div className="space-y-4">
          <Input id="c-title" label="제목" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 불안 다루기 기초" />
          <Input
            id="c-slug"
            label="주소 (영문)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="예: anxiety-basics"
            hint={`사이트 주소가 /courses/${slug || "..."} 가 돼요. 만든 뒤엔 바꾸지 않는 게 좋아요.`}
          />
          {err && <p className="text-sm text-[var(--error)]">{err}</p>}
          <Button onClick={create} loading={saving} className="w-full">
            만들고 편집하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
