"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import { Skeleton, cx } from "@/components/ui";

/**
 * 관리자 · 테스터 명단 (54-테스터-프로그램 R1·R2·R5·R8)
 * 등록 → 안내(T1 또는 개인 메시지) → 동의·쿠폰(자동) → 신청 → 진행 → 설문 → 종료 / 철회.
 * 승인된 T 템플릿이 없으면 알림은 나가지 않는다 — 링크를 복사해 개인 메시지로 보낸다.
 */
interface Row {
  id: string;
  code: string;
  name: string;
  phone: string;
  acquaintance: boolean;
  status: string;
  inviteKey: string;
  stopped: boolean;
  createdAt: string;
  t1SentAt: string | null;
  declinedAt: string | null;
  consent: { version: string; at: string; items: Record<string, string> } | null;
  optional: { review?: { agreedAt: string | null; withdrawnAt: string | null }; case?: { agreedAt: string | null; withdrawnAt: string | null } };
  avoid: { topics: string[]; other: string };
  avoidHistory: { topics: string[]; other: string; at: string; by: string }[];
  coupon: { until: string | null; claimed: boolean } | null;
  application: { id: string; applicationNo: string; stage: number; stageLabel: string; closed: string | null; sessionAt: string | null; hasVideo: boolean } | null;
  withdrawnAt: string | null;
  withdrawnStage: string;
  withdrawnBy: string;
  checklist: Record<string, "yes" | "no">;
  checkinDoneAt: string | null;
  supervisionDoneAt: string | null;
  followupDue: boolean;
  notices: { code: string; channel: string; result: string; reason: string | null; at: string }[];
  survey: { id: string; answers: Record<string, string | number>; submittedAt: string; excludedAt: string | null } | null;
  history: { at: string; by: string; note: string }[];
  sendResult?: { sent: boolean; reason?: string };
}

const AVOID_LABEL: Record<string, string> = {
  family: "가족 이야기",
  love: "연애·부부 관계",
  work: "일·학업",
  childhood: "어린 시절 기억",
  body: "몸과 건강",
  mutual: "함께 아는 사람에 대한 이야기",
  counselor: "상담가와의 관계에 대한 이야기",
};

// 03 상담가 가이드 5절 — 하나라도 '아니요'면 진행하지 않거나 슈퍼비전 뒤로 미룬다. 표시만 하고 진행을 막지는 않는다
const CHECKLIST: { title: string; items: [string, string][] }[] = [
  {
    title: "넣어도 되는지",
    items: [
      ["a1", "만 19세 이상이다"],
      ["a2", "지금 큰 어려움을 지나고 있지 않아 보인다"],
      ["a3", "상담이나 치료를 받고 있지 않다 (내가 아는 범위, 안내를 읽고도 하겠다고 함)"],
      ["a4", "가족이나 연인이 아니다 (별도 절차 검토 전까지)"],
      ["a5", "나와 갈등 중이 아니다"],
      ["a6", "함께 아는 사람과 갈등 중이 아니다"],
      ["a7", "돈거래, 동업, 평가 관계가 없다"],
      ["a8", "결과를 알게 되어도 평소 관계를 유지할 자신이 있다"],
    ],
  },
  {
    title: "안내",
    items: [
      ["b1", "거절하기 쉽게 메시지로 물었고, 본인이 먼저 하겠다고 답했다"],
      ["b2", "하겠다는 답을 받은 뒤 명단에 올렸다"],
      ["b3", "동의 페이지를 본인이 직접 완료했다 (쿠폰 발급 확인)"],
      ["b4", "「이 시간에는 상담가로 앉음」을 미리 말했다"],
      ["b5", "돈·선물을 받지 않는다고 말했다"],
    ],
  },
  {
    title: "상담 전",
    items: [
      ["c1", "듣고 싶지 않은 영역을 확인했다"],
      ["c2", "보고서에서 그 영역을 뺐다"],
      ["c3", "보고서 문장 근거를 검사와 접수면접지로 확인했다"],
      ["c4", "상담 전후로 식사나 술자리 약속이 없다"],
      ["c5", "시간과 범위를 정해 말했다"],
      ["c6", "내가 이어 상담하지 않는다고 말했다"],
    ],
  },
];

const SURVEY_LABEL: [string, string][] = [
  ["q1", "1. 동선 막힘 (1~5)"],
  ["q2", "2. 가장 오래 멈춘 곳"],
  ["q3", "3. 안내 글 (1~5)"],
  ["q4", "4. 헷갈린 말"],
  ["q5", "5. 알림 횟수"],
  ["q6", "6. 맞지 않은 알림"],
  ["q7", "7. 보고서 쓰인 방식 (1~5)"],
  ["q8", "8. 다시 본 것"],
  ["q8note", "8. 의견"],
  ["q9", "9. 말하기 편했나요 (1~5, 0 말하고 싶지 않음)"],
  ["q9time", "9. 상담 시간"],
  ["q10", "10. 불편한 점"],
];

const STATUS_TONE: Record<string, string> = {
  철회: "bg-red-50 text-red-700",
  종료: "bg-[var(--surface)] text-[var(--foreground-muted)]",
  넘어감: "bg-[var(--surface)] text-[var(--foreground-muted)]",
  "진행 중": "bg-[var(--brand)] text-white",
  신청: "bg-[var(--brand-light)] text-[var(--brand)]",
};

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const NOTICE_REASON: Record<string, string> = { no_template: "승인 템플릿 없음 → 개인 메시지로" };

export default function TestersPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [acquaintance, setAcquaintance] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest<Row[]>("/api/admin/assessment/testers").then((r) => (r.ok && r.data ? setRows(r.data) : setErr(r.message || "불러오지 못했어요.")));
  }, []);
  useEffect(load, [load]);

  const say = (m: string, e = "") => {
    setMsg(m);
    setErr(e);
  };

  const call = async (path: string, method: string, body?: unknown, done?: (r: Row) => string) => {
    setBusy(true);
    say("");
    const r = await apiRequest<Row>(`/api/admin/assessment/testers${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
    setBusy(false);
    if (r.ok && r.data) {
      say(done?.(r.data) ?? "처리했어요.");
      load();
      return true;
    }
    say("", r.message || "처리하지 못했어요.");
    return false;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call("", "POST", { name, phone, acquaintance }, (r) => `${r.code}로 등록했어요.`)) {
      setName("");
      setPhone("");
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say(`${label}를 복사했어요.`);
    } catch {
      say("", `복사하지 못했어요: ${text}`);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">테스터 명단</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">하겠다고 답한 사람만 올려 주세요. 승인된 T 템플릿이 없으면 알림은 나가지 않아요. 그때는 링크를 복사해 개인 메시지로 보내 주세요.</p>

      <form onSubmit={create} className="card mt-5 flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm font-semibold">
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className="mt-1 block h-10 w-40 rounded-lg border border-[var(--border)] px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          휴대폰 번호
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" required placeholder="01012345678" className="mt-1 block h-10 w-44 rounded-lg border border-[var(--border)] px-3 font-normal" />
        </label>
        <label className="flex h-10 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={acquaintance} onChange={(e) => setAcquaintance(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" /> 아는 사이
        </label>
        <button disabled={busy} className="h-10 cursor-pointer rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white disabled:opacity-50">
          명단에 올리기
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p>}
      {err && <p className="mt-3 text-sm text-[var(--error)]">{err}</p>}

      <div className="mt-5 space-y-3">
        {!rows && <Skeleton className="h-40" />}
        {rows?.length === 0 && <p className="rounded-2xl bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">아직 명단이 없어요.</p>}
        {rows?.map((r) => {
          const open = openId === r.id;
          const link = `${SITE_URL}/tester/${r.inviteKey}`;
          return (
            <section key={r.id} className="card overflow-hidden">
              <button onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open} className="flex w-full cursor-pointer flex-wrap items-center gap-2 p-4 text-left">
                <span className="font-bold text-[var(--foreground)]">{r.code}</span>
                <span className="text-[var(--foreground)]">{r.name}</span>
                {r.acquaintance && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-800">아는 사이</span>}
                <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_TONE[r.status] ?? "bg-[var(--surface)] text-[var(--foreground)]")}>{r.status}</span>
                {r.stopped && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">링크 중지</span>}
                {r.followupDue && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs font-bold text-violet-700">안부·슈퍼비전</span>}
                {r.withdrawnAt && r.application?.hasVideo && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">유튜브 영상 정리</span>}
                <span className="ml-auto text-xs text-[var(--foreground-subtle)]">{new Date(r.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
              </button>

              {open && (
                <div className="space-y-5 border-t border-[var(--border-light)] p-4 text-sm">
                  {(r.avoid.topics.length > 0 || r.avoid.other) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="font-bold text-red-800">듣고 싶지 않은 영역</p>
                      <p className="mt-1 text-red-800">{[...r.avoid.topics.map((t) => AVOID_LABEL[t] ?? t), r.avoid.other].filter(Boolean).join(" · ")}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!r.withdrawnAt && (
                      <>
                        <button onClick={() => copy(link, "안내 링크")} className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 font-semibold">
                          안내 링크 복사
                        </button>
                        {!r.consent && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => call(`/${r.id}/send-t1`, "POST", undefined, (x) => (x.sendResult?.sent ? "T1 안내를 보냈어요." : x.sendResult?.reason === "no_template" ? "T1 템플릿이 아직 승인·연결되지 않아 보내지 않았어요. 링크를 복사해 개인 메시지로 보내 주세요." : x.sendResult?.reason === "duplicate" ? "이 링크로 이미 보냈어요." : "보내지 못했어요. 알림 기록을 확인해 주세요."))}
                              className="h-9 cursor-pointer rounded-lg bg-[var(--brand)] px-3 font-semibold text-white disabled:opacity-50"
                            >
                              T1 안내 보내기
                            </button>
                            <button disabled={busy} onClick={() => call(`/${r.id}/mark-sent`, "POST")} className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 font-semibold disabled:opacity-50">
                              개인 메시지로 보냈어요
                            </button>
                          </>
                        )}
                        {r.consent && !r.coupon && (
                          <button disabled={busy} onClick={() => call(`/${r.id}/retry-coupon`, "POST")} className="h-9 cursor-pointer rounded-lg bg-[var(--brand)] px-3 font-semibold text-white disabled:opacity-50">
                            쿠폰 다시 발급
                          </button>
                        )}
                        <button disabled={busy} onClick={() => call(`/${r.id}/stop`, "POST", { stopped: !r.stopped })} className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 font-semibold disabled:opacity-50">
                          {r.stopped ? "링크 다시 켜기" : "링크 중지"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (!confirm("링크를 새로 만들까요? 예전 링크는 바로 열리지 않아요.")) return;
                            const release = !!r.coupon?.claimed && !r.application && confirm("쿠폰이 붙은 계정 연결도 풀까요? 다른 사람이 받아 간 경우에만 풀어 주세요.");
                            void call(`/${r.id}/reissue`, "POST", { releaseCoupon: release }, () => "링크를 새로 만들었어요. 새 링크를 복사해 보내 주세요.");
                          }}
                          className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 font-semibold disabled:opacity-50"
                        >
                          링크 재발급
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (!confirm(`${r.code} 철회를 처리할까요? 쿠폰 회수, 신청 취소, 일정 풀기, 보고서 닫기까지 바로 처리돼요. 되돌릴 수 없어요.`)) return;
                            void call(`/${r.id}/withdraw`, "POST", undefined, (x) => (x.sendResult?.sent ? "철회를 처리하고 T5를 보냈어요." : "철회를 처리했어요. T5가 나가지 않았으니 개인 메시지로 알려 주세요."));
                          }}
                          className="h-9 cursor-pointer rounded-lg px-3 font-semibold text-[var(--error)] hover:bg-red-50 disabled:opacity-50"
                        >
                          철회 대신 처리
                        </button>
                      </>
                    )}
                  </div>

                  <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    <Info k="휴대폰" v={r.phone} />
                    <Info k="안내" v={r.t1SentAt ? fmt(r.t1SentAt) : "아직"} />
                    <Info k="동의" v={r.consent ? `${fmt(r.consent.at)} · 문안 ${r.consent.version}` : r.declinedAt ? `넘어감 ${fmt(r.declinedAt)}` : "아직"} />
                    <Info k="쿠폰" v={r.coupon ? `${fmt(r.coupon.until)}까지 · ${r.coupon.claimed ? "계정에 붙음" : "받기 전"}` : "없음"} />
                    <Info k="선택 동의" v={`후기 ${on(r.optional.review)} · 사례 ${on(r.optional.case)}`} />
                    <Info k="신청" v={r.application ? `${r.application.applicationNo} · ${r.application.stageLabel}${r.application.closed ? " · 닫힘" : ""}` : "없음"} />
                    {r.withdrawnAt && <Info k="철회" v={`${fmt(r.withdrawnAt)} · ${r.withdrawnStage} · ${r.withdrawnBy === "admin" ? "상담가 처리" : "본인"}`} />}
                  </dl>

                  {r.application && (
                    <a href={`/admin/assessment/applications?id=${r.application.id}`} className="inline-flex h-9 items-center rounded-lg bg-[var(--surface)] px-3 font-semibold">
                      신청 상세 열기
                    </a>
                  )}

                  {r.withdrawnAt && r.application?.hasVideo && <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">유튜브에서 영상을 비공개·삭제한 뒤 신청 상세에서 링크를 지워 주세요.</p>}

                  {r.application?.sessionAt && !r.withdrawnAt && (
                    <div className="flex flex-wrap gap-4">
                      <Toggle label="며칠 뒤 안부를 했어요" on={!!r.checkinDoneAt} onChange={(v) => call(`/${r.id}`, "PATCH", { checkinDone: v })} />
                      <Toggle label="슈퍼비전에서 점검했어요" on={!!r.supervisionDoneAt} onChange={(v) => call(`/${r.id}`, "PATCH", { supervisionDone: v })} />
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-[var(--foreground)]">알림 기록</p>
                    {r.notices.length === 0 ? (
                      <p className="mt-1 text-[var(--foreground-subtle)]">아직 없어요.</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5 text-[var(--foreground-muted)]">
                        {r.notices.map((n) => (
                          <li key={`${n.code}${n.at}`}>
                            {n.code} · {fmt(n.at)} · {n.result === "ok" ? "보냄" : n.result === "skipped" ? NOTICE_REASON[n.reason ?? ""] ?? "보내지 않음" : n.result === "failed" ? `실패 ${n.reason ?? ""}` : "처리 중"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <details>
                    <summary className="cursor-pointer font-bold text-[var(--foreground)]">시작 전 체크리스트 ({r.code})</summary>
                    <p className="mt-2 text-xs text-[var(--foreground-subtle)]">하나라도 &apos;아니요&apos;면 진행하지 않거나 슈퍼비전 뒤로 미뤄요. 다 채우지 않아도 진행은 막지 않아요.</p>
                    {CHECKLIST.map((g) => (
                      <div key={g.title} className="mt-3">
                        <p className="font-semibold text-[var(--foreground)]">{g.title}</p>
                        <ul className="mt-1 space-y-1">
                          {g.items.map(([k, label]) => (
                            <li key={k} className="flex items-start gap-2">
                              <span className="flex flex-none gap-1">
                                {(["yes", "no"] as const).map((v) => (
                                  <button
                                    key={v}
                                    disabled={busy}
                                    aria-pressed={r.checklist?.[k] === v}
                                    onClick={() => {
                                      const next = { ...r.checklist };
                                      if (next[k] === v) delete next[k];
                                      else next[k] = v;
                                      void call(`/${r.id}`, "PATCH", { checklist: next }, () => "저장했어요.");
                                    }}
                                    className={cx("h-7 cursor-pointer rounded px-2 text-xs font-bold", r.checklist?.[k] === v ? (v === "yes" ? "bg-[var(--brand)] text-white" : "bg-red-600 text-white") : "bg-[var(--surface)]")}
                                  >
                                    {v === "yes" ? "예" : "아니요"}
                                  </button>
                                ))}
                              </span>
                              <span className="text-[var(--foreground-muted)]">{label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </details>

                  {r.survey && (
                    <details>
                      <summary className="cursor-pointer font-bold text-[var(--foreground)]">
                        설문 응답 · {fmt(r.survey.submittedAt)}
                        {r.survey.excludedAt && " · 점검 자료에서 뺌"}
                      </summary>
                      <p className="mt-2 text-xs text-[var(--foreground-subtle)]">답을 받아 상대에게 다시 묻거나 설명하지 않아요. 평소 대화에 꺼내지도 않아요. 안전이 걱정되는 말이 보이면 가이드의 위기 대응을 따라요.</p>
                      <dl className="mt-2 space-y-2">
                        {SURVEY_LABEL.filter(([k]) => r.survey!.answers[k] !== undefined).map(([k, label]) => (
                          <div key={k}>
                            <dt className="text-xs font-semibold text-[var(--foreground-subtle)]">{label}</dt>
                            <dd className="whitespace-pre-wrap break-words text-[var(--foreground)]">{String(r.survey!.answers[k])}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          const excluded = !r.survey!.excludedAt;
                          const x = await apiRequest(`/api/admin/assessment/testers/surveys/${r.survey!.id}`, { method: "PATCH", body: JSON.stringify({ excluded }) });
                          if (x.ok) load();
                          else say("", x.message || "바꾸지 못했어요.");
                        }}
                        className="mt-3 h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 font-semibold disabled:opacity-50"
                      >
                        {r.survey.excludedAt ? "점검 자료에 다시 넣기" : "점검 자료에서 빼기"}
                      </button>
                    </details>
                  )}

                  {r.avoidHistory.length > 0 && (
                    <details>
                      <summary className="cursor-pointer font-bold text-[var(--foreground)]">듣고 싶지 않은 영역 변경 기록</summary>
                      <ul className="mt-2 space-y-0.5 text-[var(--foreground-muted)]">
                        {r.avoidHistory.map((h) => (
                          <li key={String(h.at)}>
                            {fmt(h.at)} · {h.by === "admin" ? "상담가" : "본인"} · {[...h.topics.map((t) => AVOID_LABEL[t] ?? t), h.other].filter(Boolean).join(", ") || "없음"}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <details>
                    <summary className="cursor-pointer font-bold text-[var(--foreground)]">진행 기록</summary>
                    <ul className="mt-2 space-y-0.5 text-[var(--foreground-muted)]">
                      {r.history.map((h, i) => (
                        <li key={i}>
                          {fmt(h.at)} · {h.note}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function on(o?: { agreedAt: string | null; withdrawnAt: string | null }): string {
  if (!o?.agreedAt) return "안 함";
  return o.withdrawnAt ? "철회" : "동의";
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 flex-none text-[var(--foreground-subtle)]">{k}</dt>
      <dd className="min-w-0 break-words text-[var(--foreground)]">{v}</dd>
    </div>
  );
}

function Toggle({ label, on: checked, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
      {label}
    </label>
  );
}
