"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { Skeleton, cx } from "@/components/ui";
import { StageTracker } from "@/components/assessment/StageTracker";
import { INTAKE_STEPS } from "@/components/assessment/intakeConfig";
import { kstParts } from "@/lib/assessment";
import { PAY_STATE_LABEL, type Row } from "./types";
import { PlaceBox, RefundBox, ResendBox, TestsBox, UnpaidBox, type RefundQuoteView, type TestDetail } from "./PanelActions";
import { NoticeHistory, type NoticeRow } from "./NoticeHistory";

/**
 * 신청 상세 — 오른쪽 패널 (좁은 화면에서는 전체 화면)
 * 진행 트래커 · 안전 확인 처리 · 신청 정보 · 접수면접지(한 번 더 눌러야 열림) · 타임라인 · 알림 이력 · 메모
 */
interface Detail extends Row {
  phoneFull: string;
  gender: string;
  birthYear: number;
  method: "offline" | "online";
  regions: string[];
  reasons: string[];
  linkKey: string;
  amount: number;
  memo: string;
  history: { stage: number; hold: string; at: string; by: string; note: string }[];
  intake: { answers: Record<string, string | string[]>; crisis: boolean; submittedAt: string } | null;
  notices: NoticeRow[];
  testsDetail: Record<string, TestDetail>;
  place: { name: string; address: string; mapUrl: string } | null;
  videoLink: string | null;
  cancelRequestedAt: string | null;
  cancelRequest: { reason: string; quoteAmount: number; quoteTier: string; by: string } | null;
  refund: { amount: number; note: string; processedAt: string } | null;
  refundQuote: RefundQuoteView | null;
}

const GENDER: Record<string, string> = { female: "여성", male: "남성", other: "기타", undisclosed: "밝히지 않음" };
const BY: Record<string, string> = { system: "자동", admin: "상담가", customer: "고객" };
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

// 접수면접지 키 → 문항 이름 (상세 화면용)
const LABELS: Record<string, string> = Object.fromEntries(
  INTAKE_STEPS.flatMap((s) =>
    s.questions.flatMap((q) => {
      const out: [string, string][] = [[q.key, q.label]];
      if ("more" in q && q.more) out.push([q.more.key, `${q.label} — 자세히`]);
      return out;
    })
  )
);
LABELS.callback_time = "연락 받기 편한 시간";

export function ApplicationPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [showIntake, setShowIntake] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 다른 신청을 열면 목록 쪽에서 key로 새로 그린다
  const [ver, setVer] = useState(0);
  useEffect(() => {
    apiFetch(`/api/admin/assessment/applications/${id}`)
      .then((x: Detail) => {
        setD(x);
        setMemo(x.memo ?? "");
      })
      .catch((e) => setError(e.message));
  }, [id, ver]);
  const refresh = () => {
    setVer((v) => v + 1);
    onChanged();
  };

  const patch = async (body: Record<string, unknown>, done: string) => {
    setSaving(true);
    setMsg("");
    const r = await apiRequest<{ hold: string; memo: string; isTester: boolean }>(`/api/admin/assessment/applications/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setSaving(false);
    if (!r.ok || !r.data) {
      setMsg(r.message || "저장하지 못했어요.");
      return;
    }
    setD((x) => (x ? { ...x, hold: r.data!.hold as Detail["hold"], memo: r.data!.memo, isTester: r.data!.isTester } : x));
    setMsg(done);
    onChanged();
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-white xl:sticky xl:top-16 xl:z-0 xl:h-[calc(100vh-4rem)] xl:w-[440px] xl:shrink-0 xl:border-l xl:border-[var(--border-light)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-light)] bg-white px-5 py-3">
        <span className="text-sm font-semibold text-[var(--foreground-subtle)]">{d?.applicationNo ?? "신청 상세"}</span>
        <button onClick={onClose} aria-label="닫기" className="cursor-pointer rounded-full p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error ? (
        <p className="p-6 text-sm text-[var(--error)]">{error}</p>
      ) : !d ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-6 p-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {d.name}
              {d.isTester && <span className="ml-2 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs font-bold text-[var(--foreground-muted)]">테스터</span>}
            </h2>
            <button
              disabled={saving}
              onClick={() => {
                const next = !d.isTester;
                if (!confirm(next ? "이 신청을 테스터로 표시할까요? (실제 고객과 구분돼요. 변경 기록이 남아요)" : "테스터 표시를 해제할까요? (실제 고객 신청으로 바뀌어요)")) return;
                void patch({ isTester: next }, next ? "테스터로 표시했어요." : "테스터 표시를 해제했어요.");
              }}
              className="mt-1 cursor-pointer text-xs font-semibold text-[var(--foreground-subtle)] underline-offset-2 hover:text-[var(--foreground)] hover:underline disabled:opacity-40"
            >
              {d.isTester ? "테스터 표시 해제" : "테스터로 표시"}
            </button>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {d.sessionText} · {d.methodText}
              {d.method === "offline" && d.regions[1] && ` (2순위 ${d.regions[1]})`}
            </p>
          </div>

          {d.hold === "safety" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-700">● 안전 확인 필요</p>
              <p className="mt-1 text-sm text-red-700/80">접수면접지 안전 문항에 &lsquo;예&rsquo;로 답했어요. 24시간 안에 직접 연락하고, 괜찮으면 검사를 진행해 주세요. 그 전까지 검사 링크 발급 목록에서 빠져 있어요.</p>
              <p className="mt-2 text-sm text-red-700">
                연락처 <b>{d.phoneFull.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}</b>
                {typeof d.intake?.answers.callback_time === "string" && ` · 편한 시간: ${d.intake.answers.callback_time}`}
              </p>
              <button
                disabled={saving}
                onClick={() => patch({ releaseSafety: true }, "안전 확인 완료 — 발급 대기로 옮겼어요.")}
                className="mt-3 h-10 cursor-pointer rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                연락 완료 · 검사 진행
              </button>
            </div>
          )}

          <section>
            <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">진행</h3>
            {d.payState ? (
              <p className="text-sm font-semibold text-[var(--warning)]">{PAY_STATE_LABEL[d.payState]}</p>
            ) : d.closed ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                {d.closed === "refunded" ? `환불 완료${d.refund ? ` · ${d.refund.amount.toLocaleString("ko-KR")}원 · ${fmt(d.refund.processedAt)}` : ""}` : "취소됨"}
              </p>
            ) : (
              <StageTracker stage={d.stage} hold={d.hold} compact />
            )}
            {!d.payState && (
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {d.stage}/8 {d.stageLabel}
                {d.holdLabel && <span className="ml-1 font-semibold text-[var(--warning)]">· {d.holdLabel}</span>}
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-[var(--surface)] p-4">
            <dl className="grid grid-cols-[88px_1fr] gap-y-2 text-sm">
              <dt className="text-[var(--foreground-subtle)]">연락처</dt>
              <dd>{d.phoneFull.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}</dd>
              <dt className="text-[var(--foreground-subtle)]">성별 · 출생</dt>
              <dd>
                {GENDER[d.gender] ?? d.gender} · {d.birthYear}년
              </dd>
              <dt className="text-[var(--foreground-subtle)]">검사 마감</dt>
              <dd>{d.testDeadline ? `${kstParts(`${d.testDeadline}T03:00:00Z`).dayText} 밤 12시` : "—"}</dd>
              <dt className="text-[var(--foreground-subtle)]">결제</dt>
              <dd>
                {d.amount.toLocaleString("ko-KR")}원 {d.paidAt && `· ${fmt(d.paidAt)}`}
              </dd>
              <dt className="text-[var(--foreground-subtle)]">검사 이유</dt>
              <dd>{d.reasons.length ? d.reasons.join(" / ") : "—"}</dd>
              <dt className="text-[var(--foreground-subtle)]">고객 화면</dt>
              <dd>
                <a href={`/a/${d.linkKey}`} target="_blank" rel="noreferrer" className="link-underline">
                  진행 화면 열기 ↗
                </a>
              </dd>
            </dl>
          </section>

          {d.payState && <UnpaidBox id={d.id} payState={d.payState} onChanged={refresh} />}
          {!d.closed && !d.payState && <TestsBox id={d.id} tests={d.testsDetail} onChanged={refresh} />}
          {!d.closed && !d.payState && <PlaceBox key={`${d.place?.name ?? ""}|${d.videoLink ?? ""}`} id={d.id} method={d.method} place={d.place} videoLink={d.videoLink} onChanged={refresh} />}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)]">접수면접지</h3>
              {d.intake && <span className="text-xs text-[var(--foreground-subtle)]">{fmt(d.intake.submittedAt)} 제출</span>}
            </div>
            {!d.intake ? (
              <p className="text-sm text-[var(--foreground-subtle)]">아직 제출하지 않았어요.</p>
            ) : !showIntake ? (
              <button onClick={() => setShowIntake(true)} className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--surface)]">
                접수면접지 내용 보기 (민감정보)
              </button>
            ) : (
              <dl className="space-y-3 rounded-2xl border border-[var(--border-light)] p-4 text-sm">
                {Object.entries(d.intake.answers)
                  .filter(([k]) => k !== "pledge")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className={cx("text-xs font-semibold", k === "safety" && v === "예" ? "text-red-600" : "text-[var(--foreground-subtle)]")}>{LABELS[k] ?? k}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-[var(--foreground)]">{Array.isArray(v) ? v.map((x, i) => (k === "hope" || k === "area" ? `${i + 1}. ${x}` : x)).join(k === "hope" || k === "area" ? "  " : ", ") : v}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-bold text-[var(--foreground)]">메모 (상담가만)</h3>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} maxLength={4000} className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none" />
            <button disabled={saving || memo === d.memo} onClick={() => patch({ memo }, "메모를 저장했어요.")} className="mt-2 h-9 cursor-pointer rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white disabled:opacity-40">
              메모 저장
            </button>
            {msg && <p className="mt-2 text-sm text-[var(--brand)]">{msg}</p>}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">타임라인</h3>
            <ol className="space-y-2 border-l-2 border-[var(--border-light)] pl-4">
              {[...d.history].reverse().map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="text-[var(--foreground)]">{h.note || `${h.stage}단계`}</p>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {fmt(h.at)} · {BY[h.by] ?? h.by}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">알림 이력</h3>
            <NoticeHistory id={d.id} notices={d.notices} closed={!!d.closed} onChanged={refresh} />
            {!d.closed && !d.payState && <ResendBox id={d.id} onChanged={refresh} />}
            <a href="/admin/assessment/notices" className="mt-2 inline-block text-xs text-[var(--foreground-subtle)] underline underline-offset-2">
              알림 종류 · 언제 무엇을 보내는지 보기
            </a>
          </section>

          {!d.payState && <RefundBox id={d.id} closed={d.closed} request={d.cancelRequest} requestedAt={d.cancelRequestedAt} quote={d.refundQuote} refund={d.refund} onChanged={refresh} />}
        </div>
      )}
    </aside>
  );
}
