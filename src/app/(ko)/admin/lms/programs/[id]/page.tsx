"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import { Alert, Badge, Button, Input, Skeleton, Textarea, Toast } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/course";
import { CoverImageField } from "@/components/admin/CoverImageField";

interface CourseRow {
  _id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  price?: number | null;
  salePrice?: number | null;
}

interface ProgramForm {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  instructor: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  price: string;
  salePrice: string;
  accessDays: string;
  courseIds: string[];
}

const toNum = (s: string) => (s.trim() === "" ? null : Number(s.replace(/[^\d]/g, "")));

// 관리자 — 과정 편집 (정보·판매·과목 구성)
export default function AdminProgramEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<ProgramForm | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [adding, setAdding] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([apiFetch(`/api/admin/programs/${id}`), apiFetch("/api/admin/courses")])
      .then(([p, list]) => {
        setCourses(list);
        setInitialIds(p.courseIds.map(String));
        setForm({
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle ?? "",
          description: p.description ?? "",
          coverImageUrl: p.coverImageUrl ?? "",
          instructor: p.instructor ?? "",
          status: p.status,
          visibility: p.visibility,
          price: p.price === null || p.price === undefined ? "" : String(p.price),
          salePrice: p.salePrice === null || p.salePrice === undefined ? "" : String(p.salePrice),
          accessDays: p.accessDays ? String(p.accessDays) : "",
          courseIds: p.courseIds.map(String),
        });
      })
      .catch(() => setError("과정을 불러오지 못했어요."));
  }, [id]);
  useEffect(load, [load]);

  const byId = useMemo(() => new Map(courses.map((c) => [c._id, c])), [courses]);
  if (!form) return <div className="mx-auto max-w-4xl px-4 py-10">{error ? <Alert>{error}</Alert> : <Skeleton className="h-96" />}</div>;

  const set = <K extends keyof ProgramForm>(k: K, v: ProgramForm[K]) => setForm({ ...form, [k]: v });
  const move = (i: number, d: -1 | 1) => {
    const ids = [...form.courseIds];
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set("courseIds", ids);
  };
  const removed = initialIds.filter((x) => !form.courseIds.includes(x));
  const remaining = courses.filter((c) => !form.courseIds.includes(c._id) && c.status !== "archived");
  const separate = form.courseIds.reduce<number | null>((s, cid) => {
    const c = byId.get(cid);
    const p = c ? c.salePrice ?? c.price ?? null : null;
    return s === null || p === null ? null : s + p;
  }, 0);

  const save = async () => {
    setError("");
    if (removed.length && !window.confirm(`과목 ${removed.length}개를 뺄까요? 이 과정으로만 듣던 회원은 그 과목을 더 볼 수 없어요. (진도 기록은 남아요)`)) return;
    setSaving(true);
    const r = await apiRequest(`/api/admin/programs/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        coverImageUrl: form.coverImageUrl.trim() || null,
        instructor: form.instructor,
        status: form.status,
        visibility: form.visibility,
        price: toNum(form.price),
        salePrice: toNum(form.salePrice),
        accessDays: toNum(form.accessDays),
        courseIds: form.courseIds,
      }),
    });
    setSaving(false);
    if (!r.ok) return setError(r.message || "저장하지 못했어요.");
    setInitialIds(form.courseIds);
    setToast("저장했어요. 과목을 바꿨다면 이미 수강 중인 회원에게도 반영됐어요.");
  };

  const remove = async () => {
    if (!window.confirm(`'${form.title}' 과정을 지울까요?`)) return;
    const r = await apiRequest(`/api/admin/programs/${id}`, { method: "DELETE" });
    if (!r.ok) return setToast(r.message || "지우지 못했어요.");
    router.push("/admin/lms/programs");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/lms/programs" className="text-sm text-[var(--foreground-subtle)]">← 과정 목록</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">{form.title || "과정"}</h1>
        <div className="flex gap-2">
          <Link href={`/programs/${form.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">미리보기 ↗</Link>
          <Link href={`/admin/lms/programs/${id}/enrollments`} className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">수강생·초대</Link>
        </div>
      </div>

      {/* 과목 구성 */}
      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">과목 {form.courseIds.length}개</h2>
          {separate !== null && form.courseIds.length > 0 && (
            <p className="text-sm text-[var(--foreground-muted)]">따로 사면 합계 {separate.toLocaleString()}원</p>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">위에서부터 과정 화면에 보이는 순서예요. 한 과목을 여러 과정에 넣어도 돼요.</p>
        <ol className="mt-4 divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)]">
          {form.courseIds.map((cid, i) => {
            const c = byId.get(cid);
            return (
              <li key={cid} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-center text-sm font-bold text-[var(--foreground-subtle)]">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c?.title ?? "(지워진 강의)"}</span>
                  {c && c.status !== "published" && <Badge tone="warning">{STATUS_LABEL[c.status]} — 수강생에게 안 보여요</Badge>}
                </span>
                <Button size="sm" variant="secondary" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">↑</Button>
                <Button size="sm" variant="secondary" onClick={() => move(i, 1)} disabled={i === form.courseIds.length - 1} aria-label="아래로">↓</Button>
                <Button size="sm" variant="danger" onClick={() => set("courseIds", form.courseIds.filter((x) => x !== cid))}>빼기</Button>
              </li>
            );
          })}
          {form.courseIds.length === 0 && <li className="px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">아래에서 과목을 넣어 주세요.</li>}
        </ol>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select value={adding} onChange={(e) => setAdding(e.target.value)} className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
            <option value="">과목 고르기…</option>
            {remaining.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
                {c.status !== "published" ? ` (${STATUS_LABEL[c.status]})` : ""}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            disabled={!adding}
            onClick={() => {
              set("courseIds", [...form.courseIds, adding]);
              setAdding("");
            }}
          >
            + 넣기
          </Button>
        </div>
      </section>

      {/* 정보·판매 */}
      <section className="card mt-6 space-y-4 p-6">
        <h2 className="text-lg font-bold">정보·판매</h2>
        <Input id="title" label="과정 이름" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <Input id="subtitle" label="한 줄 소개" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        <Textarea id="desc" label="소개 (마크다운)" className="min-h-[180px]" value={form.description} onChange={(e) => set("description", e.target.value)} />
        <Input id="instructor" label="강사·운영" value={form.instructor} onChange={(e) => set("instructor", e.target.value)} />
        <CoverImageField value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url ?? "")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">운영 상태</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as ProgramForm["status"])} className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3">
              <option value="draft">작성 중 (관리자만 보임)</option>
              <option value="published">운영 중</option>
              <option value="archived">보관 (새 판매·노출 중지)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">공개 범위</label>
            <select value={form.visibility} onChange={(e) => set("visibility", e.target.value as ProgramForm["visibility"])} className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3">
              <option value="public">누구나 (강의 목록에 보이고 판매)</option>
              <option value="private">초대 전용 (초대받은 회원만 보임, 판매 안 함)</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="price" label="정가 (원)" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="비우면 판매 준비 중" />
          <Input id="sale" label="할인가 (원, 선택)" inputMode="numeric" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
          <Input id="days" label="이용 기간 (일)" inputMode="numeric" value={form.accessDays} onChange={(e) => set("accessDays", e.target.value)} placeholder="비우면 무제한" />
        </div>
        {form.visibility === "private" && (form.price || form.salePrice) && (
          <p className="text-sm text-[var(--foreground-muted)]">초대 전용 과정은 가격이 있어도 판매하지 않아요. 팔려면 공개 범위를 &lsquo;누구나&rsquo;로 바꿔 주세요.</p>
        )}
      </section>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button variant="danger" onClick={remove}>과정 지우기</Button>
        <Button onClick={save} loading={saving}>저장</Button>
      </div>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
