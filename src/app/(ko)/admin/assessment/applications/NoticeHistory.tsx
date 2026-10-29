"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { cx } from "@/components/ui";

/**
 * 신청 상세 · 알림 이력 — 줄을 누르면 펼쳐서
 * 언제 보내는 알림인지 · 채널(알림톡/문자)과 문자로 바뀐 이유 · 받는 번호(가림)·시각 · 본문·버튼 · 결과(메시지 ID·실패 사유) · [다시 보내기]
 * 본문은 보낸 그대로를 보여 준다(관리자만). 원문이 없는 10/29 이전 기록만 지금 신청 정보로 다시 만든 본문을 보여 준다.
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
  /** 솔라피 최종 전달 결과 (접수 뒤 5분마다 확인) */
  delivery?: { status: "pending" | "delivered" | "failed" | "unknown"; code: string | null; reason: string | null; type: string | null; checkedAt: string } | null;
  at: string;
  detail?: {
    label: string;
    when: string;
    subject: string;
    body: string;
    buttons: { label: string; url: string }[];
    /** true = 보낸 그대로의 원문, false = 원문이 없어 다시 만든 본문 */
    original?: boolean;
    templateId?: string | null;
    variables?: Record<string, string> | null;
  } | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const CHANNEL: Record<string, string> = { alimtalk: "알림톡", sms: "문자", none: "—" };
const RESULT: Record<string, string> = { ok: "접수됨", failed: "실패", skipped: "건너뜀", pending: "보내는 중" };
const DELIVERY: Record<string, string> = { pending: "전달 확인 중", delivered: "받음 ✓", failed: "전달 실패", unknown: "결과 모름" };

/** 줄 끝에 보일 한 단어 — 최종 결과가 있으면 그것 */
function shortResult(n: NoticeRow): string {
  if (n.delivery && n.delivery.status !== "pending") return DELIVERY[n.delivery.status];
  if (n.result === "ok") return n.messageId ? "접수됨 · 전달 확인 중" : "접수됨";
  return RESULT[n.result] ?? n.result;
}

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
              <span className={cx("shrink-0 text-xs font-semibold", n.result === "failed" ? "text-[var(--error)]" : n.result === "ok" ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]")}>
                {shortResult(n)} · {fmt(n.at)} {on ? "▲" : "▼"}
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
                    {n.messageId && <span className="font-normal text-[var(--foreground-subtle)]"> · 솔라피 그룹 {n.messageId}</span>}
                  </dd>
                  <dt className="text-[var(--foreground-subtle)]">최종 전달</dt>
                  <dd className={n.delivery?.status === "failed" ? "font-semibold text-[var(--error)]" : ""}>
                    {n.delivery ? (
                      <>
                        {DELIVERY[n.delivery.status]}
                        {n.delivery.code && ` · 상태코드 ${n.delivery.code}`}
                        {n.delivery.reason && ` · ${n.delivery.reason}`}
                        {n.delivery.type && <span className="font-normal text-[var(--foreground-subtle)]"> · {n.delivery.type}</span>}
                        {n.delivery.code === "3113" && <span className="mt-0.5 block font-normal text-[var(--foreground)]">→ 발신번호가 통신사 &lsquo;번호도용문자차단서비스&rsquo;에 가입돼 있어요. 통신사에서 해제해야 문자가 나가요.</span>}
                      </>
                    ) : n.result === "ok" ? (
                      "확인 중 (5분마다 솔라피에 물어봐요)"
                    ) : (
                      "—"
                    )}
                  </dd>
                </dl>
                {n.detail && (
                  <div>
                    <p className="mb-1 font-semibold text-[var(--foreground-subtle)]">
                      {n.detail.original
                        ? n.detail.templateId
                          ? `보낸 그대로 — 알림톡(승인 템플릿 ${n.detail.templateId})이 실패하면 나가는 대체 문자 본문과 같아요`
                          : "보낸 그대로의 본문"
                        : "다시 만든 본문 — 원문을 남기기 전 기록이라 지금 신청 정보로 만들었어요 (보낸 뒤 일정·장소가 바뀌었으면 실제와 다를 수 있어요)"}
                    </p>
                    <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border-light)] bg-white p-3 font-sans text-xs leading-relaxed text-[var(--foreground)]">
                      {n.detail.subject}
                      {"\n\n"}
                      {n.detail.body}
                    </pre>
                    {n.detail.variables && Object.keys(n.detail.variables).length > 0 && (
                      <p className="mt-2 break-all text-[var(--foreground-muted)]">
                        <span className="font-semibold">알림톡 변수</span>{" "}
                        {Object.entries(n.detail.variables)
                          .map(([k, v]) => `${k} = ${v}`)
                          .join(" · ")}
                      </p>
                    )}
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
