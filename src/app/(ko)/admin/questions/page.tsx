"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { QuestionItem } from "@/components/course/LessonQA";
import { Badge, Button, EmptyState, PageHeader, Skeleton, Toast, cx } from "@/components/ui";

// 관리자 — 차시 질문 답변. 답변하면 질문한 회원에게 메일로 알려줘요.
interface AdminQuestion extends QuestionItem {
  hidden: boolean;
  course: { title: string; slug: string } | null;
  lessonKey: string;
  lessonTitle: string;
}

const STATUS = [
  ["open", "답변 대기"],
  ["answered", "답변 완료"],
  ["all", "전체"],
] as const;

export default function AdminQuestionsPage() {
  const [status, setStatus] = useState<(typeof STATUS)[number][0]>("open");
  const [data, setData] = useState<{ openCount: number; items: AdminQuestion[] } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest<{ openCount: number; items: AdminQuestion[] }>(`/api/admin/questions?status=${status}`).then((r) => setData(r.ok && r.data ? r.data : { openCount: 0, items: [] }));
  }, [status]);
  useEffect(load, [load]);

  const answer = async (q: AdminQuestion) => {
    setBusy(q.id);
    const r = await apiRequest(`/api/admin/questions/${q.id}/replies`, { method: "POST", body: JSON.stringify({ body: drafts[q.id] ?? "" }) });
    setBusy(null);
    if (r.ok) {
      setDrafts((d) => ({ ...d, [q.id]: "" }));
      setToast("답변을 남겼어요. 질문한 분께 메일로 알려 드려요.");
      load();
    } else setToast(r.message || "답변하지 못했어요.");
  };

  const hide = async (q: AdminQuestion) => {
    const r = await apiRequest(`/api/admin/questions/${q.id}`, { method: "PATCH", body: JSON.stringify({ hidden: !q.hidden }) });
    setToast(r.ok ? (q.hidden ? "다시 보이게 했어요." : "숨겼어요. 회원에게 보이지 않아요.") : r.message);
    load();
  };

  return (
    <div className="px-4 py-8">
      <PageHeader title="질문 답변" description="강의 차시마다 수강생이 남긴 질문이에요. 답변하면 질문한 분께 메일로 알려 드려요." />

      <div className="mb-5 flex gap-2">
        {STATUS.map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} className={cx("h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold", status === k ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
            {l}
            {k === "open" && data ? ` ${data.openCount}` : ""}
          </button>
        ))}
      </div>

      {!data ? (
        <Skeleton className="h-64" />
      ) : data.items.length === 0 ? (
        <EmptyState title={status === "open" ? "답변을 기다리는 질문이 없어요" : "질문이 없어요"} />
      ) : (
        <div className="space-y-4">
          {data.items.map((q) => (
            <div key={q.id} className={cx("card p-5", q.hidden && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-subtle)]">
                {q.course && (
                  <Link href={`/learn/${q.course.slug}/${q.lessonKey}#qa`} target="_blank" className="font-semibold text-[var(--brand)] hover:underline">
                    {q.course.title} · {q.lessonTitle}
                  </Link>
                )}
                <span>{q.author}</span>
                <span>{new Date(q.createdAt).toLocaleString("ko-KR")}</span>
                {q.isPrivate && <Badge>나만 보기</Badge>}
                {q.hidden && <Badge tone="error">숨김</Badge>}
                <Badge tone={q.status === "answered" ? "brand" : "warning"}>{q.status === "answered" ? "답변 완료" : "답변 대기"}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{q.body}</p>
              {q.replies.map((r) => (
                <div key={r.id} className={cx("mt-2 rounded-xl px-4 py-2.5 text-sm", r.byAdmin ? "bg-[var(--brand-light)]" : "bg-[var(--surface)]")}>
                  <p className="text-xs font-semibold text-[var(--foreground-muted)]">{r.author} · {new Date(r.createdAt).toLocaleString("ko-KR")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
              <textarea
                value={drafts[q.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                rows={3}
                placeholder="답변을 적어 주세요"
                className="mt-3 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => hide(q)}>{q.hidden ? "다시 보이기" : "숨기기"}</Button>
                <Button size="sm" onClick={() => answer(q)} loading={busy === q.id} disabled={(drafts[q.id] ?? "").trim().length < 2}>답변하기</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
