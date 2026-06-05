"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────
// 이메일 템플릿 관리 페이지
//
// 운영자가 주문 알림 이메일 템플릿을 만들고 관리한다.
// 상품 수정 화면(Cafe24)에서 이 템플릿을 골라 연결하면 해당 상품 주문 시 이 템플릿으로 발송된다.
// ─────────────────────────────────────────────────────────────────

interface EmailTemplate {
  _id: string;
  name: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  description?: string;
  isActive: boolean;
  updatedAt?: string;
}

const emptyForm = { name: "", subjectTemplate: "", bodyHtmlTemplate: "", description: "", isActive: true };

// 사용 가능한 치환 변수 안내
const PLACEHOLDERS = ["{{고객명}}", "{{상품명}}", "{{옵션명}}", "{{다운로드링크}}", "{{만료일수}}"];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setDataLoading(true);
      const data = await apiFetch("/api/admin/email-templates");
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      subjectTemplate: t.subjectTemplate,
      bodyHtmlTemplate: t.bodyHtmlTemplate,
      description: t.description ?? "",
      isActive: t.isActive,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    fetchTemplates();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.subjectTemplate.trim() || !form.bodyHtmlTemplate.trim()) {
      setFormError("이름, 제목, 본문은 필수입니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/email-templates/${editing._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/api/admin/email-templates", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (t: EmailTemplate) => {
    if (!confirm(`"${t.name}" 템플릿을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/admin/email-templates/${t._id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  if (dataLoading) {
    return <div className="p-10 text-sm text-[var(--foreground-muted)]">불러오는 중...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[var(--brand)] hover:underline">← 어드민으로</Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--foreground)]">이메일 템플릿 관리</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]"
        >
          + 새 템플릿
        </button>
      </div>

      {/* 치환 변수 안내 */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">사용 가능한 치환 변수</p>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <code key={p} className="rounded-md bg-[var(--background)] px-2 py-1 text-xs text-[var(--brand)]">{p}</code>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
          제목·본문에 위 변수를 넣으면 주문 시 실제 값으로 치환됩니다. 파일이 없는 상품(예: 상담 예약)은 다운로드링크가 빈 값으로 처리됩니다.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* 템플릿 목록 */}
      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-subtle)]">
          아직 템플릿이 없습니다. &quot;+ 새 템플릿&quot;으로 만들어 보세요.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                  {!t.isActive && <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--foreground-subtle)]">비활성</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">제목: {t.subjectTemplate}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => openEdit(t)} className="text-sm text-[var(--brand)] hover:underline">수정</button>
                <button onClick={() => handleDelete(t)} className="text-sm text-[var(--error)] hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 생성/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {editing ? "템플릿 수정" : "새 템플릿"}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">템플릿 이름</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 파일 다운로드 안내"
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">이메일 제목</label>
                  <input
                    type="text"
                    value={form.subjectTemplate}
                    onChange={(e) => setForm({ ...form, subjectTemplate: e.target.value })}
                    placeholder="예: [심리상담실 현] {{상품명}} 안내"
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">이메일 본문 (HTML)</label>
                  <textarea
                    value={form.bodyHtmlTemplate}
                    onChange={(e) => setForm({ ...form, bodyHtmlTemplate: e.target.value })}
                    rows={12}
                    placeholder="<p>{{고객명}}님, 구매해 주셔서 감사합니다.</p>"
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-xs outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    required
                  />
                  <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                    치환 변수: {PLACEHOLDERS.join("  ")}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">메모 (선택)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  활성 (상품 선택 목록에 표시)
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </form>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button type="button" onClick={closeModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                취소
              </button>
              <button type="submit" form="template-form" disabled={isSubmitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
