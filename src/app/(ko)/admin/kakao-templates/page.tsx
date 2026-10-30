"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────
// 카카오 알림톡 템플릿 관리 페이지
//
// Solapi에 승인된 알림톡 템플릿을 우리 시스템에 등록하고, 변수 매핑·문자 대체발송을 설정한다.
// 상품 수정 화면(Cafe24)에서 이 템플릿을 골라 연결하면 해당 상품 주문 시 알림톡이 발송된다.
// 종합심리검사·쿠폰 선물 알림은 「알림 코드」(N1~·CANCEL·REFUND·GIFT)를 붙이면 서버가 그 코드로 이 템플릿을 찾아 보내고,
// 변수(#{이름} 등)는 서버가 신청·선물 정보로 자동으로 채운다(주문 변수 매핑을 쓰지 않음).
// ─────────────────────────────────────────────────────────────────

interface KakaoVariable {
  key: string;          // "#{상품명}"
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

// 서버가 실제로 찾는 알림 코드와, 서버가 자동으로 채우는 변수 (GET /api/admin/kakao-templates/notice-codes)
interface NoticeCode {
  code: string;
  label: string;
  when: string;
  variables: string[];
}

interface SolapiTemplate {
  templateId: string;
  name: string;
  status?: string;
  channelId?: string;
  channelGroupId?: string;
  /** 서버 기본 채널(SOLAPI_PFID) 템플릿인지 — 아니면 고를 때 그 채널 ID를 함께 채운다 */
  sameChannel?: boolean;
  variables: string[]; // ["#{상품명}", ...]
}

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

const emptyForm: {
  name: string;
  templateId: string;
  pfId: string;
  variables: KakaoVariable[];
  smsFallbackText: string;
  description: string;
  isActive: boolean;
  assessmentCode: string;
} = { name: "", templateId: "", pfId: "", variables: [], smsFallbackText: "", description: "", isActive: true, assessmentCode: "" };

/** 솔라피 템플릿 이름에서 알림 코드 짐작 — AS_N01 → N1, AS_N08P → N8P, AS_CANCEL → CANCEL */
function guessNoticeCode(name: string, codes: string[]): string {
  const m = /\bAS[_-]?([A-Z]+)?0*(\d+)?([A-Z]?)/i.exec(name);
  if (!m) return "";
  const cand = m[2] ? `N${Number(m[2])}${(m[3] ?? "").toUpperCase()}` : (m[1] ?? "").toUpperCase();
  return codes.includes(cand) ? cand : "";
}

// 알림톡 변수 키(#{상품명})에 어울리는 주문 변수({{상품명}})를 추측
function guessMapping(key: string): string {
  const inner = key.replace(/^#\{|\}$/g, "").trim(); // "상품명"
  const candidate = `{{${inner}}}`;
  return ORDER_VARS.includes(candidate) ? candidate : "";
}

export default function KakaoTemplatesPage() {
  const [templates, setTemplates] = useState<KakaoTemplate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KakaoTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solapi 불러오기 상태
  const [solapiList, setSolapiList] = useState<SolapiTemplate[]>([]);
  const [solapiLoading, setSolapiLoading] = useState(false);
  const [solapiError, setSolapiError] = useState("");
  const [pickedSolapiId, setPickedSolapiId] = useState(""); // 선택 하이라이트용
  const [noticeCodes, setNoticeCodes] = useState<NoticeCode[]>([]);
  const codeInfo = useMemo(() => noticeCodes.find((c) => c.code === form.assessmentCode) ?? null, [noticeCodes, form.assessmentCode]);
  // 같은 코드를 쓰는 다른 활성 템플릿 — 서버는 그중 하나만 찾으므로 하나만 켜 두어야 한다
  const codeClash = useMemo(
    () => (form.assessmentCode ? templates.filter((t) => t.isActive && t.assessmentCode === form.assessmentCode && t._id !== editing?._id) : []),
    [templates, form.assessmentCode, editing]
  );

  const fetchTemplates = async () => {
    try {
      setDataLoading(true);
      const data = await apiFetch("/api/admin/kakao-templates");
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    apiFetch("/api/admin/kakao-templates/notice-codes")
      .then((d: NoticeCode[]) => setNoticeCodes(d))
      .catch(() => setNoticeCodes([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setSolapiError("");
    setPickedSolapiId("");
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
      assessmentCode: t.assessmentCode ?? "",
    });
    setFormError("");
    setSolapiError("");
    setPickedSolapiId("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setSolapiList([]);
    setPickedSolapiId("");
    fetchTemplates();
  };

  // Solapi 승인 템플릿 목록 불러오기
  const loadSolapiTemplates = async () => {
    setSolapiLoading(true);
    setSolapiError("");
    try {
      // all=1 — 다른 카카오 채널·채널 그룹에 등록한 템플릿도 (기본 채널 것이 위)
      const data: SolapiTemplate[] = await apiFetch("/api/admin/kakao-templates/solapi?all=1");
      setSolapiList([...data].sort((a, b) => Number(b.sameChannel !== false) - Number(a.sameChannel !== false)));
    } catch (err) {
      setSolapiError(err instanceof Error ? err.message : "Solapi 템플릿을 불러오지 못했습니다.");
    } finally {
      setSolapiLoading(false);
    }
  };

  // Solapi 템플릿 선택 → 폼에 채우기 (변수 키 자동 매핑)
  const pickSolapiTemplate = (t: SolapiTemplate) => {
    const vars = t.variables ?? [];
    setForm((prev) => ({
      ...prev,
      name: prev.name || t.name,
      templateId: t.templateId,
      // 기본 채널이 아닌 템플릿은 그 채널로 보내야 하므로 채널 ID도 채운다
      pfId: t.sameChannel === false && t.channelId ? t.channelId : prev.pfId,
      variables: vars.map((k) => ({ key: k, valueTemplate: guessMapping(k) })),
      // 이름이 AS_N01 처럼 검사 알림이면 알림 코드도 미리 채움
      assessmentCode: prev.assessmentCode || guessNoticeCode(t.name, noticeCodes.map((c) => c.code)),
    }));
    setPickedSolapiId(t.templateId); // 선택 표시
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.templateId.trim()) {
      setFormError("이름과 템플릿 ID는 필수입니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      const body = JSON.stringify({
        ...form,
        pfId: form.pfId.trim() || null,
        assessmentCode: form.assessmentCode || null,
        variables: form.variables.filter((v) => v.key.trim()),
      });
      if (editing) {
        await apiFetch(`/api/admin/kakao-templates/${editing._id}`, { method: "PUT", body });
      } else {
        await apiFetch("/api/admin/kakao-templates", { method: "POST", body });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: KakaoTemplate) => {
    if (!confirm(`"${t.name}" 템플릿을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/admin/kakao-templates/${t._id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  // 변수 행 편집 헬퍼
  const updateVar = (idx: number, patch: Partial<KakaoVariable>) => {
    setForm((prev) => ({ ...prev, variables: prev.variables.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }));
  };
  const addVar = () => setForm((prev) => ({ ...prev, variables: [...prev.variables, { key: "", valueTemplate: "" }] }));
  const removeVar = (idx: number) => setForm((prev) => ({ ...prev, variables: prev.variables.filter((_, i) => i !== idx) }));

  if (dataLoading) {
    return <div className="p-10 text-sm text-[var(--foreground-muted)]">불러오는 중...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[var(--brand)] hover:underline">← 어드민으로</Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--foreground)]">카카오 알림톡 템플릿 관리</h1>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
          + 새 템플릿
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          알림톡 본문은 Solapi에 <b>승인된 템플릿</b>으로 고정됩니다. 여기서는 템플릿의 변수(<code>{"#{...}"}</code>)에
          주문 정보를 매핑하고, 실패 시 보낼 문자 대체 본문을 설정합니다. 변수 값에는 <code>{"{{상품명}}"}</code> 같은 주문 치환 변수를 사용하세요.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ORDER_VARS.map((p) => (
            <code key={p} className="rounded-md bg-[var(--background)] px-2 py-1 text-xs text-[var(--brand)]">{p}</code>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-subtle)]">
          아직 등록된 카카오 템플릿이 없습니다. &quot;+ 새 템플릿&quot;에서 Solapi 템플릿을 불러와 등록하세요.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                  {t.assessmentCode && (
                    <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
                      알림 {t.assessmentCode}
                      {noticeCodes.find((c) => c.code === t.assessmentCode) ? ` · ${noticeCodes.find((c) => c.code === t.assessmentCode)!.label}` : ""}
                    </span>
                  )}
                  {!t.isActive && <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--foreground-subtle)]">비활성</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">templateId: {t.templateId}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => openEdit(t)} className="text-sm text-[var(--brand)] hover:underline">수정</button>
                <button onClick={() => handleDelete(t)} className="text-sm text-[var(--error)] hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "카카오 템플릿 수정" : "새 카카오 템플릿"}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Solapi 불러오기 */}
              <div className="mb-4 rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--foreground)]">Solapi 승인 템플릿 불러오기</span>
                  <button type="button" onClick={loadSolapiTemplates} disabled={solapiLoading} className="rounded-xl border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--surface)] disabled:opacity-50">
                    {solapiLoading ? "불러오는 중..." : "목록 불러오기"}
                  </button>
                </div>
                {solapiError && <p className="mt-2 text-xs text-red-600">{solapiError}</p>}
                {solapiList.length > 0 && (
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {solapiList.map((t) => {
                      const selected = t.templateId === pickedSolapiId;
                      return (
                        <button
                          key={t.templateId}
                          type="button"
                          onClick={() => pickSolapiTemplate(t)}
                          className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors ${
                            selected
                              ? "border-[var(--brand)] bg-[var(--brand-light)]"
                              : "border-transparent hover:bg-[var(--surface)]"
                          }`}
                        >
                          <span className={`shrink-0 ${selected ? "text-[var(--brand)]" : "text-transparent"}`}>✓</span>
                          <span className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                            <span className="ml-2 text-[var(--foreground-subtle)]">{t.status} · 변수 {(t.variables ?? []).length}개</span>
                            {t.sameChannel === false && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                {t.channelId ? `다른 채널 ${t.channelId.slice(-6)}` : "채널 그룹"}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {solapiList.some((t) => t.sameChannel === false) && (
                  <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">
                    &lsquo;다른 채널&rsquo; 템플릿은 서버 기본 채널(SOLAPI_PFID)과 다른 카카오 채널에 등록된 거예요. 고르면 그 채널 ID가 아래 칸에 함께 채워져 그 채널로 보내요. &lsquo;채널 그룹&rsquo; 템플릿은 보낼 채널 ID를 직접 넣어 주세요.
                  </p>
                )}
                {pickedSolapiId && (
                  <p className="mt-2 text-xs text-[var(--brand)]">✓ 선택됨 — 아래 폼에 템플릿 ID와 변수가 채워졌습니다.</p>
                )}
              </div>

              <form id="kakao-template-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">템플릿 이름</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 상담 예약 안내" className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Solapi 템플릿 ID</label>
                  <input type="text" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} placeholder="KA01TP..." className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-xs outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">채널 ID (pfId) <span className="font-normal text-[var(--foreground-subtle)]">(선택 — 비우면 기본 채널)</span></label>
                  <input type="text" value={form.pfId} onChange={(e) => setForm({ ...form, pfId: e.target.value })} placeholder="KA01PF..." className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-xs outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" />
                </div>

                {/* 알림 코드 — 종합심리검사·쿠폰 선물 알림에 쓰는 템플릿이면 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    알림 코드 <span className="font-normal text-[var(--foreground-subtle)]">(종합심리검사·쿠폰 선물 알림이면 — 주문 알림이면 비워 두기)</span>
                  </label>
                  <select
                    value={form.assessmentCode}
                    onChange={(e) => setForm({ ...form, assessmentCode: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                  >
                    <option value="">— 주문 알림 (코드 없음) —</option>
                    {noticeCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                  {codeInfo && <p className="mt-1 text-xs text-[var(--foreground-muted)]">⏱ {codeInfo.when}</p>}
                  {codeClash.length > 0 && (
                    <p className="mt-1 text-xs font-semibold text-[var(--error)]">
                      ⚠ 같은 코드({form.assessmentCode})를 쓰는 활성 템플릿이 있어요: {codeClash.map((t) => t.name).join(", ")} — 서버는 하나만 쓰니, 하나만 켜 두세요.
                    </p>
                  )}
                </div>

                {/* 변수 — 알림 코드가 있으면 서버가 자동으로 채움, 없으면 주문 변수 매핑 */}
                {codeInfo ? (
                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <p className="text-sm font-medium text-[var(--foreground)]">변수는 서버가 자동으로 채워요</p>
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                      {form.assessmentCode === "GIFT" ? "선물 정보" : "신청 정보"}로 채워요. 아래에 ⚠ 가 있으면 템플릿 변수 이름이 서버와 달라 빈칸으로 나가요(오타 확인).
                    </p>
                    {form.variables.length === 0 ? (
                      <p className="mt-2 text-xs text-[var(--foreground-subtle)]">위에서 Solapi 템플릿을 불러오면 템플릿의 변수가 여기 보여요.</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {form.variables.map((v) => {
                          const ok = codeInfo.variables.includes(v.key.trim());
                          return (
                            <li key={v.key} className={`rounded-md px-2 py-1 font-mono text-xs ${ok ? "bg-white text-[var(--brand)]" : "bg-red-50 font-semibold text-[var(--error)]"}`}>
                              {ok ? "✅" : "⚠"} {v.key}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">서버가 채우는 변수: {codeInfo.variables.join(" ")}</p>
                    <p className="mt-1 text-[11px] text-[var(--foreground-subtle)]">알림톡이 실패하면 서버의 같은 문안이 문자로 가요(아래 문자 대체 본문은 쓰지 않아요).</p>
                  </div>
                ) : (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-[var(--foreground)]">변수 매핑</label>
                    <button type="button" onClick={addVar} className="text-xs text-[var(--brand)] hover:underline">+ 변수 추가</button>
                  </div>
                  {form.variables.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">변수가 없는 템플릿이거나, 위에서 Solapi 템플릿을 불러오면 자동으로 채워집니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {form.variables.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="text" value={v.key} onChange={(e) => updateVar(idx, { key: e.target.value })} placeholder="#{상품명}" className="w-2/5 rounded-lg border border-[var(--border)] px-2 py-1.5 font-mono text-xs outline-none focus:border-[var(--brand)]" />
                          <span className="text-xs text-[var(--foreground-subtle)]">→</span>
                          {/* 매핑 값: 사용 가능한 주문 변수 드롭다운에서 선택 */}
                          <select
                            value={v.valueTemplate}
                            onChange={(e) => updateVar(idx, { valueTemplate: e.target.value })}
                            className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                          >
                            <option value="">— 변수 선택 —</option>
                            {ORDER_VAR_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label} {o.value}</option>
                            ))}
                            {/* 기존에 직접 입력해 둔 값(프리셋에 없는 값)은 잃지 않도록 보존 */}
                            {v.valueTemplate && !ORDER_VARS.includes(v.valueTemplate) && (
                              <option value={v.valueTemplate}>직접입력: {v.valueTemplate}</option>
                            )}
                          </select>
                          <button type="button" onClick={() => removeVar(idx)} className="shrink-0 text-xs text-[var(--error)] hover:underline">삭제</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">문자 대체발송 본문 <span className="font-normal text-[var(--foreground-subtle)]">(선택 — 알림톡 실패 시 문자로 발송)</span></label>
                  <textarea value={form.smsFallbackText} onChange={(e) => setForm({ ...form, smsFallbackText: e.target.value })} rows={3} placeholder="[심리상담실 현] {{상품명}} 안내입니다." className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" />
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  활성 (상품 선택 목록에 표시)
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </form>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button type="button" onClick={closeModal} className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">취소</button>
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
