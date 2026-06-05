"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ContentItem } from "../../_lib/types";

// 콘텐츠 관리 페이지 (칼럼/뉴스레터 CRUD). 가드는 admin/layout.tsx에서 처리.
export default function ContentsPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ title: "", body: "", summary: "", category: "", isPublished: false });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/contents");
      setContents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "콘텐츠를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const openModal = (content?: ContentItem) => {
    if (content) {
      setSelected(content);
      setForm({ title: content.title, body: "", summary: content.summary, category: content.category, isPublished: content.isPublished });
    } else {
      setSelected(null);
      setForm({ title: "", body: "", summary: "", category: "", isPublished: false });
    }
    setFormError("");
    setPreview(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setPreview(false);
    fetchContents();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) {
      setFormError("제목을 입력해 주세요.");
      return;
    }
    if (!selected && !form.body.trim()) {
      setFormError("본문을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        category: form.category.trim(),
        isPublished: form.isPublished,
      };
      if (form.body.trim()) payload.body = form.body.trim();

      if (selected) {
        await apiFetch(`/api/admin/contents/${selected._id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/contents", { method: "POST", body: JSON.stringify(payload) });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (content: ContentItem) => {
    if (!confirm(`"${content.title}" 콘텐츠를 삭제할까요?\n삭제하면 복구할 수 없습니다.`)) return;
    try {
      await apiFetch(`/api/admin/contents/${content._id}`, { method: "DELETE" });
      fetchContents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">콘텐츠 관리</h1>
        <button onClick={() => openModal()} className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
          + 콘텐츠 추가
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : contents.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">아직 콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[var(--surface)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Title</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Category</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                {contents.map((content) => (
                  <tr key={content._id} className="hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                      <Link href={`/content/${content._id}`} className="hover:text-[var(--brand)] hover:underline">{content.title}</Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{content.category || <span className="text-[var(--foreground-subtle)]">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${content.isPublished ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground-muted)]"}`}>
                        {content.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{new Date(content.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button className="mr-2 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline" onClick={() => openModal(content)}>Edit</button>
                      <button className="cursor-pointer text-xs text-[var(--error)] hover:underline" onClick={() => handleDelete(content)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 콘텐츠 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selected ? "Edit Content" : "Add New Content"}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit} id="content-form" className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="Article title" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Category</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="예: 자기이해, 관계, 감정관리" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Summary <span className="ml-1 font-normal text-[var(--foreground-subtle)]">(선택사항 — 없으면 본문 앞부분 자동 사용)</span></label>
                  <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="목록 미리보기 텍스트 (선택사항)" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--foreground)]">Body (Markdown){selected && <span className="ml-1 font-normal text-[var(--foreground-subtle)]">(수정 시 본문 전체 재입력)</span>}</label>
                    <div className="flex rounded-lg border border-[var(--border)] text-xs">
                      <button type="button" onClick={() => setPreview(false)} className={`px-3 py-1 rounded-l-lg transition-colors ${!preview ? "bg-[var(--brand)] text-white" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"}`}>Edit</button>
                      <button type="button" onClick={() => setPreview(true)} className={`px-3 py-1 rounded-r-lg transition-colors ${preview ? "bg-[var(--brand)] text-white" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"}`}>Preview</button>
                    </div>
                  </div>
                  {!preview && (
                    <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={12} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-sm leading-6 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="마크다운으로 작성하세요..." />
                  )}
                  {preview && (
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] px-4 py-3">
                      {form.body.trim() ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold text-[var(--foreground)]">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-bold text-[var(--foreground)]">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-[var(--foreground)]">{children}</h3>,
                            p: ({ children }) => <p className="mb-3 text-sm leading-6 text-[var(--foreground)]">{children}</p>,
                            ul: ({ children }) => <ul className="mb-3 list-disc pl-5 text-sm text-[var(--foreground)]">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 text-sm text-[var(--foreground)]">{children}</ol>,
                            li: ({ children }) => <li className="mb-1 leading-6">{children}</li>,
                            code: ({ children }) => <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs text-[var(--brand)]">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="mb-3 border-l-4 border-[var(--brand)] pl-3 italic text-sm text-[var(--foreground-muted)]">{children}</blockquote>,
                          }}
                        >
                          {form.body}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm text-[var(--foreground-subtle)]">본문을 입력하면 미리보기가 표시됩니다.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="content-published" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)]" />
                  <label htmlFor="content-published" className="text-sm font-medium text-[var(--foreground)]">Publish immediately</label>
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </form>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button type="button" onClick={closeModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">Cancel</button>
              <button type="submit" form="content-form" disabled={submitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{submitting ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
