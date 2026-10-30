"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { cx } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 카카오 알림톡 템플릿 관리 (10/30 운영 개편)
//
// 솔라피(알림톡 대행사)에서 카카오 승인을 받은 템플릿을 우리 시스템에 등록하는 곳이다.
//   · 한눈에 보는 현황 — 종합심리검사·쿠폰 선물 알림 16종이 지금 알림톡으로 나가는지, 문자로 나가는지
//   · 용도: 종합심리검사 알림(알림 코드 N1~·CANCEL·REFUND) / 쿠폰 선물(GIFT) / 쇼핑몰 주문(상품에 연결)
//     검사·선물 알림은 서버가 변수를 자동으로 채우고, 주문 알림만 주문 정보 매핑을 쓴다.
//   · 채널은 ID(KA01PF…) 대신 카카오톡 검색 아이디(@…)로 보여 준다.
//   · 솔라피 상태(승인·검수 중·반려 사유)·본문·버튼 미리보기, 예시 값으로 테스트 1건 보내기
// ─────────────────────────────────────────────────────────────────

interface KakaoVariable {
  key: string; // "#{상품명}"
  valueTemplate: string; // "{{상품명}}"
}

interface KakaoTemplate {
  _id: string;
  name: string;
  templateId: string;
  pfId?: string | null;
  variables: KakaoVariable[];
  smsFallbackText?: string;
  description?: string;
  isActive: boolean;
  assessmentCode?: string | null;
}

interface SolapiTemplate {
  templateId: string;
  name: string;
  status?: string;
  channelId?: string;
  channelGroupId?: string;
  sameChannel?: boolean;
  variables: string[];
}

interface NoticeCode {
  code: string;
  label: string;
  when: string;
  variables: string[];
}

interface SolapiDetail {
  templateId: string;
  name: string;
  status: string;
  channelId?: string;
  channelGroupId?: string;
  content: string;
  buttons: { name: string; type: string; link?: string }[];
  rejectReason?: string;
}

interface Overview {
  channels: { channelId: string; searchId: string }[];
  defaultChannelId: string | null;
  solapi: Record<string, SolapiDetail>;
  solapiError: string | null;
  codes: {
    code: string;
    label: string;
    template: { id: string; name: string; templateId: string } | null;
    linkedCount: number;
    status: string | null;
    method: "alimtalk" | "alimtalk_unapproved" | "sms";
    lastSent: { at: string; channel: string; result: string } | null;
  }[];
}

type Purpose = "assessment" | "gift" | "order";

// 주문 정보로 채울 수 있는 치환 변수 (라벨 + 실제 토큰)
const ORDER_VAR_OPTIONS: { value: string; label: string }[] = [
  { value: "{{고객명}}", label: "고객명" },
  { value: "{{상품명}}", label: "상품명" },
  { value: "{{옵션명}}", label: "옵션명" },
  { value: "{{다운로드링크}}", label: "다운로드 링크" },
  { value: "{{만료일수}}", label: "만료일수" },
  { value: "{{주문번호}}", label: "주문번호" },
];
const ORDER_VARS = ORDER_VAR_OPTIONS.map((o) => o.value);

const PURPOSE_LABEL: Record<Purpose, string> = { assessment: "종합심리검사 알림", gift: "쿠폰 선물", order: "쇼핑몰 주문 알림" };
const STATUS: Record<string, { label: string; tone: string }> = {
  APPROVED: { label: "승인", tone: "bg-[var(--brand-light)] text-[var(--brand)]" },
  INSPECTING: { label: "검수 중", tone: "bg-amber-100 text-amber-800" },
  PENDING: { label: "검수 전", tone: "bg-amber-100 text-amber-800" },
  REJECTED: { label: "반려", tone: "bg-red-100 text-red-700" },
};

type FormState = {
  name: string;
  templateId: string;
  pfId: string;
  variables: KakaoVariable[];
  smsFallbackText: string;
  description: string;
  isActive: boolean;
  purpose: Purpose;
  assessmentCode: string;
};
const emptyForm: FormState = { name: "", templateId: "", pfId: "", variables: [], smsFallbackText: "", description: "", isActive: true, purpose: "assessment", assessmentCode: "" };

function purposeOf(code?: string | null): Purpose {
  if (!code) return "order";
  return code === "GIFT" ? "gift" : "assessment";
}

// 알림톡 변수 키(#{상품명})에 어울리는 주문 변수({{상품명}})를 추측
function guessMapping(key: string): string {
  const inner = key.replace(/^#\{|\}$/g, "").trim();
  const candidate = `{{${inner}}}`;
  return ORDER_VARS.includes(candidate) ? candidate : "";
}

/** 솔라피 템플릿 이름에서 알림 코드 짐작 — AS_N01 → N1, AS_N08P → N8P, AS_CANCEL → CANCEL */
function guessNoticeCode(name: string, codes: string[]): string {
  const m = /\bAS[_-]?([A-Z]+)?0*(\d+)?([A-Z]?)/i.exec(name);
  if (!m) return "";
  const cand = m[2] ? `N${Number(m[2])}${(m[3] ?? "").toUpperCase()}` : (m[1] ?? "").toUpperCase();
  return codes.includes(cand) ? cand : "";
}

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const PHONE_KEY = "kakao-test-phone";

interface TesterApp {
  applicationNo: string;
  name: string;
  sessionAt?: string | null;
}
const isNoticeCode = (code?: string | null) => !!code && code !== "GIFT";

export default function KakaoTemplatesPage() {
  const [templates, setTemplates] = useState<KakaoTemplate[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [noticeCodes, setNoticeCodes] = useState<NoticeCode[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KakaoTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualPf, setManualPf] = useState(false);

  const [solapiList, setSolapiList] = useState<SolapiTemplate[]>([]);
  const [solapiLoading, setSolapiLoading] = useState(false);
  const [solapiError, setSolapiError] = useState("");
  const [pickedSolapiId, setPickedSolapiId] = useState("");

  const [openPreview, setOpenPreview] = useState<string | null>(null);
  const [testFor, setTestFor] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState(() => {
    try {
      return (typeof window !== "undefined" && localStorage.getItem(PHONE_KEY)) || "";
    } catch {
      return "";
    }
  });
  const [testMsg, setTestMsg] = useState<Record<string, string>>({});
  // 검사 알림 테스트: 테스터 신청(쿠폰 0원)을 고르면 그 신청의 실제 링크로 보내 버튼까지 확인할 수 있다
  const [testerApps, setTesterApps] = useState<TesterApp[] | null>(null);
  const [testApp, setTestApp] = useState("");

  const load = useCallback(async () => {
    try {
      setDataLoading(true);
      const [list, ov] = await Promise.all([apiFetch("/api/admin/kakao-templates"), apiRequest<Overview>("/api/admin/kakao-templates/overview")]);
      setTemplates(list);
      setOverview(ov.ok && ov.data ? ov.data : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    apiFetch("/api/admin/kakao-templates/notice-codes")
      .then((d: NoticeCode[]) => setNoticeCodes(d))
      .catch(() => setNoticeCodes([]));
  }, [load]);

  // 채널 ID → 「@아이디 · …끝 6자리」
  const channelName = useCallback(
    (id?: string | null): string => {
      const named = (cid: string) => {
        const c = overview?.channels.find((x) => x.channelId === cid);
        return c ? `${c.searchId} · …${cid.slice(-6)}` : `…${cid.slice(-6)}`;
      };
      if (!id) return overview?.defaultChannelId ? `서버 기본 채널 (${named(overview.defaultChannelId)})` : "서버 기본 채널";
      return named(id);
    },
    [overview]
  );

  const codeInfo = useMemo(() => noticeCodes.find((c) => c.code === form.assessmentCode) ?? null, [noticeCodes, form.assessmentCode]);
  const codeClash = useMemo(
    () => (form.assessmentCode ? templates.filter((t) => t.isActive && t.assessmentCode === form.assessmentCode && t._id !== editing?._id) : []),
    [templates, form.assessmentCode, editing]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setSolapiError("");
    setPickedSolapiId("");
    setManualPf(false);
    setShowModal(true);
  };

  const openEdit = (t: KakaoTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      templateId: t.templateId,
      pfId: t.pfId ?? "",
      variables: t.variables ?? [],
      smsFallbackText: t.smsFallbackText ?? "",
      description: t.description ?? "",
      isActive: t.isActive,
      purpose: purposeOf(t.assessmentCode),
      assessmentCode: t.assessmentCode ?? "",
    });
    setFormError("");
    setSolapiError("");
    setPickedSolapiId("");
    setManualPf(!!t.pfId && !overview?.channels.some((c) => c.channelId === t.pfId));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    void load();
  };

  const loadSolapiTemplates = async () => {
    setSolapiLoading(true);
    setSolapiError("");
    try {
      const data: SolapiTemplate[] = await apiFetch("/api/admin/kakao-templates/solapi?all=1");
      setSolapiList([...data].sort((a, b) => Number(b.sameChannel !== false) - Number(a.sameChannel !== false)));
    } catch (err) {
      setSolapiError(err instanceof Error ? err.message : "Solapi 템플릿을 불러오지 못했습니다.");
    } finally {
      setSolapiLoading(false);
    }
  };

  const pickSolapiTemplate = (t: SolapiTemplate) => {
    const vars = t.variables ?? [];
    const code = guessNoticeCode(t.name, noticeCodes.map((c) => c.code));
    setForm((prev) => ({
      ...prev,
      name: prev.name || t.name,
      templateId: t.templateId,
      pfId: t.channelId ?? prev.pfId,
      variables: vars.map((k) => ({ key: k, valueTemplate: guessMapping(k) })),
      assessmentCode: prev.assessmentCode || code,
      purpose: prev.assessmentCode || code ? purposeOf(prev.assessmentCode || code) : prev.purpose,
    }));
    setPickedSolapiId(t.templateId);
  };

  const setPurpose = (p: Purpose) => setForm((prev) => ({ ...prev, purpose: p, assessmentCode: p === "gift" ? "GIFT" : p === "order" ? "" : prev.assessmentCode === "GIFT" ? "" : prev.assessmentCode }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.templateId.trim()) {
      setFormError("이름과 템플릿 ID는 꼭 넣어 주세요.");
      return;
    }
    if (form.purpose === "assessment" && !form.assessmentCode) {
      setFormError("종합심리검사 알림이면 알림 코드를 골라 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { purpose, ...rest } = form;
      void purpose;
      const body = JSON.stringify({
        ...rest,
        pfId: form.pfId.trim() || null,
        assessmentCode: form.assessmentCode || null,
        variables: form.variables.filter((v) => v.key.trim()),
      });
      if (editing) await apiFetch(`/api/admin/kakao-templates/${editing._id}`, { method: "PUT", body });
      else await apiFetch("/api/admin/kakao-templates", { method: "POST", body });
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: KakaoTemplate) => {
    if (!confirm(`"${t.name}" 템플릿을 지울까요?`)) return;
    try {
      await apiFetch(`/api/admin/kakao-templates/${t._id}`, { method: "DELETE" });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const sendTest = async (t: KakaoTemplate) => {
    const to = testPhone.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(to)) {
      setTestMsg((m) => ({ ...m, [t._id]: "받을 번호를 010으로 시작하게 적어 주세요." }));
      return;
    }
    const appNo = isNoticeCode(t.assessmentCode) ? testApp : "";
    if (!confirm(`"${t.name}"을 ${appNo ? `테스터 신청 ${appNo} 값` : "예시 값"}으로 ${testPhone}에 1건 보낼까요? (실제 알림톡이 가요)`)) return;
    try {
      localStorage.setItem(PHONE_KEY, testPhone);
    } catch {
      /* 저장 못 해도 보내기는 계속 */
    }
    setTestMsg((m) => ({ ...m, [t._id]: "보내는 중…" }));
    const r = await apiRequest<{ sample?: boolean }>(`/api/admin/kakao-templates/${t._id}/test`, { method: "POST", body: JSON.stringify({ to, applicationNo: appNo || undefined }) });
    const note = r.data?.sample && isNoticeCode(t.assessmentCode) ? " 예시 링크라 버튼을 누르면 「링크를 다시 눌러 주세요」 화면이 떠요." : "";
    setTestMsg((m) => ({ ...m, [t._id]: r.ok ? `보냈어요. 1~2분 안에 도착해요.${note} (결과는 솔라피 메시지 내역에서도 볼 수 있어요)` : r.message || "보내지 못했어요." }));
  };

  const openTest = (t: KakaoTemplate) => {
    const next = testFor === t._id ? null : t._id;
    setTestFor(next);
    if (next && isNoticeCode(t.assessmentCode) && testerApps === null) {
      setTesterApps([]);
      apiRequest<TesterApp[]>("/api/admin/assessment/applications?tester=1").then((r) => setTesterApps(r.ok && r.data ? r.data : []));
    }
  };

  const updateVar = (idx: number, patch: Partial<KakaoVariable>) => setForm((prev) => ({ ...prev, variables: prev.variables.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }));
  const addVar = () => setForm((prev) => ({ ...prev, variables: [...prev.variables, { key: "", valueTemplate: "" }] }));
  const removeVar = (idx: number) => setForm((prev) => ({ ...prev, variables: prev.variables.filter((_, i) => i !== idx) }));

  if (dataLoading && !templates.length) return <div className="p-10 text-sm text-[var(--foreground-muted)]">불러오는 중...</div>;

  const groups: Purpose[] = ["assessment", "gift", "order"];
  const sendingSms = overview?.codes.filter((c) => c.method !== "alimtalk") ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[var(--brand)] hover:underline">
            ← 어드민으로
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--foreground)]">카카오 알림톡 템플릿</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">카카오 승인을 받은 템플릿을 등록하면, 그 알림이 문자 대신 알림톡으로 나가요.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
          + 새 템플릿
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {overview?.solapiError && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          솔라피에서 상태를 불러오지 못했어요({overview.solapiError}). 등록한 템플릿은 그대로 보이지만 승인 상태·채널 이름은 비어 있어요.
        </p>
      )}

      {/* 한눈에 보는 현황 */}
      {overview && (
        <section className="mb-10">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-bold text-[var(--foreground)]">한눈에 보는 현황 — 검사·선물 알림 {overview.codes.length}종</h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {sendingSms.length ? `아직 문자로 나가는 알림 ${sendingSms.length}종` : "모든 알림이 알림톡으로 나가요"}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)] bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">알림</th>
                  <th className="px-3 py-2.5 font-semibold">연결된 템플릿</th>
                  <th className="px-3 py-2.5 font-semibold">카카오 승인</th>
                  <th className="px-3 py-2.5 font-semibold">지금 나가는 방식</th>
                  <th className="px-3 py-2.5 font-semibold">마지막 발송</th>
                </tr>
              </thead>
              <tbody>
                {overview.codes.map((c) => (
                  <tr key={c.code} className="border-t border-[var(--border-light)]">
                    <td className="px-3 py-2">
                      <b>{c.code}</b> <span className="text-[var(--foreground-muted)]">{c.label}</span>
                    </td>
                    <td className="px-3 py-2">
                      {c.template ? c.template.name : <span className="text-[var(--foreground-subtle)]">없음{c.linkedCount ? ` (꺼진 템플릿 ${c.linkedCount}개)` : ""}</span>}
                    </td>
                    <td className="px-3 py-2">
                      {c.status ? <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", STATUS[c.status]?.tone)}>{STATUS[c.status]?.label ?? c.status}</span> : <span className="text-[var(--foreground-subtle)]">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {c.method === "alimtalk" ? (
                        <span className="font-semibold text-[var(--brand)]">알림톡</span>
                      ) : c.method === "alimtalk_unapproved" ? (
                        <span className="font-semibold text-[var(--error)]">알림톡 실패 → 문자</span>
                      ) : (
                        <span className="text-amber-700">문자</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--foreground-muted)]">
                      {c.lastSent ? `${fmt(c.lastSent.at)} · ${c.lastSent.channel === "alimtalk" ? "알림톡" : "문자"}${c.lastSent.result === "failed" ? " · 실패" : ""}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--foreground-subtle)]">
            &lsquo;문자&rsquo;는 연결된 템플릿이 없어 서버 문안이 문자(LMS)로 나가는 알림이에요. 템플릿을 등록해 알림 코드를 붙이면 알림톡으로 바뀌어요.
          </p>
        </section>
      )}

      {/* 등록된 템플릿 — 용도별 */}
      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-subtle)]">아직 등록한 템플릿이 없어요. &quot;+ 새 템플릿&quot;에서 솔라피 템플릿을 불러와 등록하세요.</p>
      ) : (
        groups.map((g) => {
          const list = templates.filter((t) => purposeOf(t.assessmentCode) === g);
          if (!list.length) return null;
          return (
            <section key={g} className="mb-8">
              <h2 className="mb-2 font-bold text-[var(--foreground)]">
                {PURPOSE_LABEL[g]} <span className="text-sm font-normal text-[var(--foreground-subtle)]">{list.length}개</span>
              </h2>
              <div className="space-y-3">
                {list.map((t) => {
                  const sd = overview?.solapi[t.templateId];
                  const warn = t.assessmentCode && (!t.isActive || (sd && sd.status !== "APPROVED"));
                  return (
                    <div key={t._id} className={cx("rounded-xl border p-4", warn ? "border-red-200" : "border-[var(--border)]")}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                            {t.assessmentCode && (
                              <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
                                알림 {t.assessmentCode}
                                {noticeCodes.find((c) => c.code === t.assessmentCode) ? ` · ${noticeCodes.find((c) => c.code === t.assessmentCode)!.label}` : ""}
                              </span>
                            )}
                            {sd && <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", STATUS[sd.status]?.tone)}>{STATUS[sd.status]?.label ?? sd.status}</span>}
                            {!sd && overview && !overview.solapiError && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">솔라피에 없음</span>}
                            {!t.isActive && <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--foreground-subtle)]">꺼짐</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                            채널 {channelName(t.pfId)} · 템플릿 ID {t.templateId}
                          </p>
                          {sd?.rejectReason && <p className="mt-1 text-xs font-semibold text-[var(--error)]">반려 사유: {sd.rejectReason}</p>}
                          {warn && (
                            <p className="mt-1 text-xs font-semibold text-[var(--error)]">
                              ⚠ {!t.isActive ? "꺼진 템플릿이라" : "카카오 승인 전·반려 템플릿이라"} 이 알림은 지금 문자로 나가요.
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
                          {sd && (
                            <button onClick={() => setOpenPreview(openPreview === t._id ? null : t._id)} className="text-[var(--foreground-muted)] hover:underline">
                              {openPreview === t._id ? "미리보기 닫기" : "미리보기"}
                            </button>
                          )}
                          <button onClick={() => openTest(t)} className="text-[var(--foreground-muted)] hover:underline">
                            테스트 발송
                          </button>
                          <button onClick={() => openEdit(t)} className="text-[var(--brand)] hover:underline">
                            수정
                          </button>
                          <button onClick={() => handleDelete(t)} className="text-[var(--error)] hover:underline">
                            삭제
                          </button>
                        </div>
                      </div>
                      {openPreview === t._id && sd && (
                        <div className="mt-3 rounded-xl bg-[var(--surface)] p-3 text-xs">
                          <pre className="whitespace-pre-wrap font-sans leading-relaxed text-[var(--foreground)]">{sd.content || "(본문 없음)"}</pre>
                          {sd.buttons.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-[var(--foreground-muted)]">
                              {sd.buttons.map((b) => (
                                <li key={b.name} className="break-all">
                                  [{b.name}] {b.link ?? b.type}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {testFor === t._id && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--surface)] p-3 text-xs">
                          {isNoticeCode(t.assessmentCode) ? (
                            <>
                              <span className="text-[var(--foreground-muted)]">보낼 값</span>
                              <select value={testApp} onChange={(e) => setTestApp(e.target.value)} className="h-8 rounded-lg border border-[var(--border)] bg-white px-2">
                                <option value="">예시 값 (버튼은 열리지 않아요)</option>
                                {(testerApps ?? []).map((a) => (
                                  <option key={a.applicationNo} value={a.applicationNo}>
                                    테스터 신청 {a.applicationNo} · {a.name}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[var(--foreground-muted)]">받을 번호</span>
                            </>
                          ) : (
                            <span className="text-[var(--foreground-muted)]">예시 값(이름 &lsquo;테스트&rsquo; 등)으로 1건 보내 봐요 — 받을 번호</span>
                          )}
                          <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" className="h-8 w-36 rounded-lg border border-[var(--border)] bg-white px-2" />
                          <button onClick={() => sendTest(t)} className="h-8 rounded-lg bg-[var(--brand)] px-3 font-semibold text-white">
                            보내기
                          </button>
                          {testMsg[t._id] && <span className="text-[var(--foreground)]">{testMsg[t._id]}</span>}
                          {isNoticeCode(t.assessmentCode) && testerApps?.length === 0 && (
                            <span className="w-full text-[var(--foreground-subtle)]">버튼까지 눌러 보려면 쿠폰(100%)으로 검사를 한 번 신청해 테스터 신청을 만들어 두세요. 실제 고객 신청은 고를 수 없어요.</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "템플릿 수정" : "새 템플릿 등록"}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* 솔라피에서 불러오기 */}
              <div className="mb-4 rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--foreground)]">솔라피에서 불러오기</span>
                  <button type="button" onClick={loadSolapiTemplates} disabled={solapiLoading} className="rounded-xl border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--surface)] disabled:opacity-50">
                    {solapiLoading ? "불러오는 중..." : "목록 불러오기"}
                  </button>
                </div>
                {solapiError && <p className="mt-2 text-xs text-red-600">{solapiError}</p>}
                {solapiList.length > 0 && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {solapiList.map((t) => {
                      const selected = t.templateId === pickedSolapiId;
                      return (
                        <button
                          key={t.templateId}
                          type="button"
                          onClick={() => pickSolapiTemplate(t)}
                          className={cx(
                            "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                            selected ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-transparent hover:bg-[var(--surface)]"
                          )}
                        >
                          <span className={selected ? "text-[var(--brand)]" : "text-transparent"}>✓</span>
                          <span className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                            <span className="ml-2 text-[var(--foreground-subtle)]">
                              {STATUS[t.status ?? ""]?.label ?? t.status} · 변수 {(t.variables ?? []).length}개 · {t.channelId ? channelName(t.channelId) : "채널 그룹"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {pickedSolapiId && <p className="mt-2 text-xs text-[var(--brand)]">✓ 골랐어요 — 아래 칸이 채워졌어요.</p>}
              </div>

              <form id="kakao-template-form" onSubmit={handleSubmit} className="space-y-4">
                {/* 용도 */}
                <div>
                  <p className="mb-1 text-sm font-medium text-[var(--foreground)]">어디에 쓰는 템플릿인가요?</p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPurpose(p)}
                        className={cx("h-9 rounded-xl px-3 text-sm font-semibold", form.purpose === p ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
                      >
                        {PURPOSE_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">템플릿 이름 (우리끼리 부르는 이름)</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">솔라피 템플릿 ID</label>
                  <input type="text" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} placeholder="KA01TP…" className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-xs outline-none focus:border-[var(--brand)]" />
                </div>

                {/* 채널 — 이름으로 고르기 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">보낼 카카오 채널</label>
                  {!manualPf ? (
                    <select value={form.pfId} onChange={(e) => setForm({ ...form, pfId: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]">
                      <option value="">{channelName(null)}</option>
                      {(overview?.channels ?? []).map((c) => (
                        <option key={c.channelId} value={c.channelId}>
                          {c.searchId} · …{c.channelId.slice(-6)}
                        </option>
                      ))}
                      {form.pfId && !overview?.channels.some((c) => c.channelId === form.pfId) && <option value={form.pfId}>…{form.pfId.slice(-6)} (목록에 없는 채널)</option>}
                    </select>
                  ) : (
                    <input type="text" value={form.pfId} onChange={(e) => setForm({ ...form, pfId: e.target.value })} placeholder="KA01PF…" className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-xs outline-none focus:border-[var(--brand)]" />
                  )}
                  <button type="button" onClick={() => setManualPf((v) => !v)} className="mt-1 text-[11px] text-[var(--foreground-subtle)] underline underline-offset-2">
                    {manualPf ? "목록에서 고르기" : "채널 ID 직접 입력"}
                  </button>
                  <p className="mt-0.5 text-[11px] text-[var(--foreground-subtle)]">솔라피 템플릿을 불러오면 그 템플릿의 채널이 자동으로 골라져요. 템플릿과 다른 채널로 보내면 실패해요.</p>
                </div>

                {/* 검사·선물 알림 */}
                {form.purpose !== "order" && (
                  <div>
                    {form.purpose === "assessment" && (
                      <>
                        <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">어느 알림인가요? (알림 코드)</label>
                        <select value={form.assessmentCode} onChange={(e) => setForm({ ...form, assessmentCode: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]">
                          <option value="">— 골라 주세요 —</option>
                          {noticeCodes
                            .filter((c) => c.code !== "GIFT")
                            .map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} · {c.label}
                              </option>
                            ))}
                        </select>
                      </>
                    )}
                    {codeInfo && <p className="mt-1 text-xs text-[var(--foreground-muted)]">⏱ {codeInfo.when}</p>}
                    {codeClash.length > 0 && (
                      <p className="mt-1 text-xs font-semibold text-[var(--error)]">
                        ⚠ 같은 알림({form.assessmentCode})에 켜진 템플릿이 이미 있어요: {codeClash.map((t) => t.name).join(", ")} — 서버는 하나만 쓰니 하나만 켜 두세요.
                      </p>
                    )}
                    {codeInfo && (
                      <div className="mt-3 rounded-xl bg-[var(--surface)] p-3">
                        <p className="text-sm font-medium text-[var(--foreground)]">변수는 서버가 자동으로 채워요</p>
                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          {form.purpose === "gift" ? "선물 정보" : "신청 정보"}로 채워요. ⚠가 붙은 변수는 서버에 없는 이름이라 빈칸으로 나가요(템플릿 오타 확인).
                        </p>
                        {form.variables.length === 0 ? (
                          <p className="mt-2 text-xs text-[var(--foreground-subtle)]">위에서 솔라피 템플릿을 불러오면 템플릿의 변수가 여기 보여요.</p>
                        ) : (
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {form.variables.map((v) => {
                              const ok = codeInfo.variables.includes(v.key.trim());
                              return (
                                <li key={v.key} className={cx("rounded-md px-2 py-1 font-mono text-xs", ok ? "bg-white text-[var(--brand)]" : "bg-red-50 font-semibold text-[var(--error)]")}>
                                  {ok ? "✅" : "⚠"} {v.key}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">서버가 채우는 변수: {codeInfo.variables.join(" ")}</p>
                        <p className="mt-1 text-[11px] text-[var(--foreground-subtle)]">알림톡이 실패하면 서버의 같은 문안이 문자로 가요.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 주문 알림 — 주문 정보 매핑 */}
                {form.purpose === "order" && (
                  <>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-[var(--foreground)]">변수에 넣을 주문 정보</label>
                        <button type="button" onClick={addVar} className="text-xs text-[var(--brand)] hover:underline">
                          + 변수 추가
                        </button>
                      </div>
                      {form.variables.length === 0 ? (
                        <p className="text-xs text-[var(--foreground-subtle)]">변수가 없는 템플릿이거나, 위에서 솔라피 템플릿을 불러오면 자동으로 채워져요.</p>
                      ) : (
                        <div className="space-y-2">
                          {form.variables.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="text" value={v.key} onChange={(e) => updateVar(idx, { key: e.target.value })} placeholder="#{상품명}" className="w-2/5 rounded-lg border border-[var(--border)] px-2 py-1.5 font-mono text-xs outline-none focus:border-[var(--brand)]" />
                              <span className="text-xs text-[var(--foreground-subtle)]">→</span>
                              <select value={v.valueTemplate} onChange={(e) => updateVar(idx, { valueTemplate: e.target.value })} className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]">
                                <option value="">— 주문 정보 고르기 —</option>
                                {ORDER_VAR_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label} {o.value}
                                  </option>
                                ))}
                                {v.valueTemplate && !ORDER_VARS.includes(v.valueTemplate) && <option value={v.valueTemplate}>직접입력: {v.valueTemplate}</option>}
                              </select>
                              <button type="button" onClick={() => removeVar(idx)} className="shrink-0 text-xs text-[var(--error)] hover:underline">
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                        알림톡이 안 될 때 보낼 문자 <span className="font-normal text-[var(--foreground-subtle)]">(선택)</span>
                      </label>
                      <textarea value={form.smsFallbackText} onChange={(e) => setForm({ ...form, smsFallbackText: e.target.value })} rows={3} placeholder="[심리상담실 현] {{상품명}} 안내입니다." className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  켜기 (끄면 이 템플릿으로 보내지 않아요)
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </form>
            </div>
            <div className="flex flex-shrink-0 justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button type="button" onClick={closeModal} className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                취소
              </button>
              <button type="submit" form="kakao-template-form" disabled={isSubmitting} className="rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
