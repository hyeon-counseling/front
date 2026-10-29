"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { cx } from "@/components/ui";

/**
 * 신청 상세 · 알림 이력 — 줄을 누르면 펼쳐서
 * 언제 보내는 알림인지 · 채널(알림톡/문자)과 문자로 바뀐 이유 · 받는 번호(가림)·시각 · 본문·버튼 · 결과(메시지 ID·실패 사유) · [다시 보내기]
 * 본문은 서버에 저장하지 않아서(이름·일정이 들어감) 지금 신청 정보로 다시 만든 것을 보여 준다.
 */
export interface NoticeRow {
  id: string;
  code: string;
  dateKey: string;
  channel: string;
  fallbackReason: string | null;
  to: string;
  result: string;
  reason: string | null;
  messageId: string | null;
  at: string;
  detail?: { label: string; when: string; subject: string; body: string; buttons: { label: string; url: string }[] } | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const CHANNEL: Record<string, string> = { alimtalk: "알림톡", sms: "문자", none: "—" };
const RESULT: Record<string, string> = { ok: "보냄", failed: "실패", skipped: "건너뜀", pending: "보내는 중" };

export function NoticeHistory({ id, notices, closed, onChanged }: { id: string; notices: NoticeRow[]; closed: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  const resend = async (n: NoticeRow) => {
    if (!window.confirm(`${n.code} ${n.detail?.label ?? ""} 알림을 지금 다시 보낼까요? (고객에게 실제로 가요)`)) return;
    const r = await apiRequest<{ sent: boolean; reason?: string }>(`/api/admin/assessment/applications/${id}/notice`, { method: "POST", body: JSON.stringify({ code: n.code }) });
    setMsg((m) => ({ ...m, [n.id]: r.ok && r.data?.sent ? "보냈어요." : `보내지 못했어요${r.data?.reason ? ` (${r.data.reason})` : ""}.` }));
    onChanged();
  };

  if (notices.length === 0) return <p className="text-sm text-[var(--foreground-subtle)]">보낸 알림이 없어요.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {notices.map((n) => {
        const on = open === n.id;
        return (
          <li key={n.id} className="rounded-lg bg-[var(--surface)]">
            <button onClick={() => setOpen(on ? null : n.id)} aria-expanded={on} className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left">
              <span className="min-w-0">
                <b>{n.code}</b> <span className="text-[var(--foreground-muted)]">{n.detail?.label ?? ""}</span>{" "}
                <span className="text-xs text-[var(--foreground-subtle)]">{CHANNEL[n.channel] ?? n.channel}</span>
              </span>
              <span className={cx("shrink-0 text-xs font-semibold", n.result === "ok" ? "text-[var(--brand)]" : n.result === "failed" ? "text-[var(--error)]" : "text-[var(--foreground-subtle)]")}>
                {RESULT[n.result] ?? n.result} · {fmt(n.at)} {on ? "▲" : "▼"}
              </span>
            </button>
            {on && (
              <div className="space-y-3 border-t border-[var(--border-light)] px-3 py-3 text-xs">
                {n.detail && <p className="text-[var(--foreground-muted)]">⏱ {n.detail.when}</p>}
                <dl className="grid grid-cols-[72px_1fr] gap-y-1">
                  <dt className="text-[var(--foreground-subtle)]">채널</dt>
                  <dd>
                    {CHANNEL[n.channel] ?? n.channel}
                    {n.fallbackReason && <span className="text-[var(--foreground-muted)]"> · {n.fallbackReason}</span>}
                  </dd>
                  <dt className="text-[var(--foreground-subtle)]">받는 번호</dt>
                  <dd>{n.to || "—"}</dd>
                  <dt className="text-[var(--foreground-subtle)]">시각</dt>
                  <dd>
                    {fmt(n.at)} <span className="text-[var(--foreground-subtle)]">({n.dateKey === "once" ? "즉시 발송" : n.dateKey.startsWith("manual") ? "관리자가 다시 보냄" : `${n.dateKey} 정기 발송`})</span>
                  </dd>
                  <dt className="text-[var(--foreground-subtle)]">결과</dt>
                  <dd className={n.result === "failed" ? "font-semibold text-[var(--error)]" : ""}>
                    {RESULT[n.result] ?? n.result}
                    {n.reason && ` · 사유 ${n.reason}`}
                    {n.messageId && <span className="text-[var(--foreground-subtle)]"> · 솔라피 ID {n.messageId}</span>}
                  </dd>
                </dl>
                {n.detail && (
                  <div>
                    <p className="mb-1 font-semibold text-[var(--foreground-subtle)]">본문 — 지금 신청 정보로 다시 만든 내용 (보낸 뒤 일정·장소가 바뀌었으면 실제와 다를 수 있어요)</p>
                    <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border-light)] bg-white p-3 font-sans text-xs leading-relaxed text-[var(--foreground)]">
                      {n.detail.subject}
                      {"\n\n"}
                      {n.detail.body}
                    </pre>
                    {n.detail.buttons.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {n.detail.buttons.map((b) => (
                          <li key={b.label} className="break-all">
                            <span className="font-semibold">[{b.label}]</span>{" "}
                            <a href={b.url} target="_blank" rel="noreferrer" className="link-underline text-[var(--foreground-muted)]">
                              {b.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {/* 끝난 신청에는 취소·환불 안내만 다시 보낼 수 있다 */}
                {(!closed || n.code === "REFUND" || n.code === "CANCEL") && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => resend(n)} className="h-8 cursor-pointer rounded-lg bg-white px-3 text-xs font-semibold shadow-sm">
                      다시 보내기
                    </button>
                    {msg[n.id] && <span className="text-[var(--foreground-muted)]">{msg[n.id]}</span>}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
