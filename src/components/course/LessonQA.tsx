"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Badge, Button, cx } from "@/components/ui";

/**
 * 차시별 질문 게시판 — 수강 중인 회원만.
 * 공개 질문은 같은 과정 수강생에게 보이고(이름 일부 가림), '나만 보기'는 운영자와 본인만.
 * 운영자가 답하면 메일로 알려주고, 질문한 사람은 이어서 물을 수 있다.
 */
export interface QuestionItem {
  id: string;
  body: string;
  isPrivate: boolean;
  status: "open" | "answered";
  mine: boolean;
  author: string;
  createdAt: string;
  replies: { id: string; body: string; byAdmin: boolean; author: string; createdAt: string }[];
}

const when = (v: string) => new Date(v).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export function LessonQA({ slug, lessonKey }: { slug: string; lessonKey: string }) {
  const base = `/api/courses/${slug}/lessons/${lessonKey}/questions`;
  const [items, setItems] = useState<QuestionItem[] | null>(null);
  const [body, setBody] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    apiRequest<QuestionItem[]>(base).then((r) => setItems(r.ok && r.data ? r.data : []));
  }, [base]);
  useEffect(load, [load]);

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await apiRequest<QuestionItem>(base, { method: "POST", body: JSON.stringify({ body, isPrivate }) });
    setBusy(false);
    if (!r.ok || !r.data) {
      setError(r.message || "질문을 남기지 못했어요.");
      return;
    }
    setBody("");
    setIsPrivate(false);
    setItems((list) => [r.data!, ...(list ?? [])]);
  };

  const replace = (q: QuestionItem) => setItems((list) => list?.map((x) => (x.id === q.id ? q : x)) ?? null);
  const remove = async (id: string) => {
    if (!window.confirm("질문을 지울까요?")) return;
    const r = await apiRequest(`${base}/${id}`, { method: "DELETE" });
    if (r.ok) setItems((list) => list?.filter((x) => x.id !== id) ?? null);
    else window.alert(r.message);
  };

  const count = items?.length ?? 0;

  return (
    <section id="qa" className="mt-12 scroll-mt-24 border-t border-[var(--border-light)] pt-8">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full cursor-pointer items-center justify-between text-left">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          질문 게시판 <span className="text-sm font-semibold text-[var(--foreground-subtle)]">{items ? count : ""}</span>
        </h2>
        <span className="text-sm font-semibold text-[var(--brand)]">{open ? "접기 ▲" : "열기 ▼"}</span>
      </button>

      {open && (
        <div className="mt-5">
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="공부하다 궁금한 점을 남겨 주세요. 운영자가 답변드려요."
              className="w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[0.95rem] focus:border-[var(--brand)] focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                나만 보기 (운영자에게만 보여요)
              </label>
              <Button size="sm" onClick={submit} loading={busy} disabled={body.trim().length < 2}>질문 남기기</Button>
            </div>
            {error && <p className="mt-2 text-sm text-[var(--error)]">{error}</p>}
            <p className="mt-2 text-xs text-[var(--foreground-subtle)]">개인적인 사연이나 다른 사람의 정보는 &lsquo;나만 보기&rsquo;로 남겨 주세요.</p>
          </div>

          <ul className="mt-5 space-y-4">
            {items === null && <li className="text-sm text-[var(--foreground-muted)]">불러오는 중…</li>}
            {items?.length === 0 && <li className="text-sm text-[var(--foreground-muted)]">아직 질문이 없어요. 첫 질문을 남겨 보세요.</li>}
            {items?.map((q) => (
              <QuestionCard key={q.id} q={q} base={base} onChange={replace} onDelete={() => remove(q.id)} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function QuestionCard({ q, base, onChange, onDelete }: { q: QuestionItem; base: string; onChange: (q: QuestionItem) => void; onDelete: () => void }) {
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    const r = await apiRequest<QuestionItem>(`${base}/${q.id}/replies`, { method: "POST", body: JSON.stringify({ body: reply }) });
    setBusy(false);
    if (r.ok && r.data) {
      onChange(r.data);
      setReply("");
      setReplying(false);
    } else window.alert(r.message);
  };

  return (
    <li className="rounded-2xl border border-[var(--border-light)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-subtle)]">
        <span className="font-semibold text-[var(--foreground)]">{q.author}</span>
        <span>{when(q.createdAt)}</span>
        {q.isPrivate && <Badge>나만 보기</Badge>}
        <Badge tone={q.status === "answered" ? "brand" : "warning"}>{q.status === "answered" ? "답변 완료" : "답변 대기"}</Badge>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-[var(--foreground)]">{q.body}</p>

      {q.replies.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.replies.map((r) => (
            <li key={r.id} className={cx("rounded-xl px-4 py-3 text-sm", r.byAdmin ? "bg-[var(--brand-light)]" : "bg-[var(--surface)]")}>
              <p className="text-xs font-semibold text-[var(--foreground-muted)]">
                {r.byAdmin ? "💬 " : "↳ "}
                {r.author} · {when(r.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {q.mine && (
        <div className="mt-3 flex gap-3 text-sm">
          <button onClick={() => setReplying((v) => !v)} className="cursor-pointer font-semibold text-[var(--brand)]">{replying ? "취소" : "이어서 묻기"}</button>
          {!q.replies.some((r) => r.byAdmin) && (
            <button onClick={onDelete} className="cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--error)]">삭제</button>
          )}
        </div>
      )}
      {replying && (
        <div className="mt-2 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={2000}
            placeholder="더 궁금한 점"
            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm"
          />
          <Button size="sm" onClick={send} loading={busy} disabled={reply.trim().length < 2}>보내기</Button>
        </div>
      )}
    </li>
  );
}
