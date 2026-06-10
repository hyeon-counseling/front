"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { uploadFile } from "../../_lib/upload";
import { Product, ProductVariant, EmailTemplate, KakaoTemplate } from "../../_lib/types";

const KIND_LABEL: Record<string, string> = { digital: "전자책", counseling: "상담", test: "심리검사" };

// 한국어 쇼핑몰(카페24) 상품 관리 — 동기화/재인증/옵션PDF/주문 알림 설정.
// 가드는 admin/layout.tsx에서 처리.

export default function KrProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [kakaoTemplates, setKakaoTemplates] = useState<KakaoTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 동기화
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "" });
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [variantPdfFiles, setVariantPdfFiles] = useState<Record<string, File | null>>({});
  const [uploadingVariants, setUploadingVariants] = useState<Record<string, boolean>>({});

  // 알림 설정
  const [notifForm, setNotifForm] = useState<{ emailEnabled: boolean; emailTemplateId: string; kakaoEnabled: boolean; kakaoTemplateId: string }>({ emailEnabled: true, emailTemplateId: "", kakaoEnabled: false, kakaoTemplateId: "" });
  const [kindValue, setKindValue] = useState<"digital" | "counseling" | "test">("digital");
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  // 상태별 그룹 접기/펼치기 (판매중지·삭제됨은 기본 접힘)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ stopped: false, deleted: false });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productsData, emailTpl, kakaoTpl] = await Promise.all([
        apiFetch("/api/products?channel=all&includeInactive=true"),
        apiFetch("/api/admin/email-templates"),
        apiFetch("/api/admin/kakao-templates"),
      ]);
      setProducts(productsData);
      setEmailTemplates(emailTpl);
      setKakaoTemplates(kakaoTpl);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const result = await apiFetch("/api/cafe24/sync", { method: "POST" });
      const { added = 0, updated = 0, deactivated = 0 } = result as { added?: number; updated?: number; deactivated?: number };
      setSyncMsg({ type: "success", text: `Sync complete: ${added} added, ${updated} updated, ${deactivated} deactivated` });
      fetchAll();
    } catch (err) {
      setSyncMsg({ type: "error", text: err instanceof Error ? err.message : "Sync failed. Please try again." });
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditModal = (product: Product) => {
    setSelected(product);
    setEditForm({ title: product.title, price: String(product.price) });
    setPdfFiles([]);
    setFormError("");
    setNotifForm({
      emailEnabled: product.notification?.emailEnabled !== false,
      emailTemplateId: product.notification?.emailTemplateId ? String(product.notification.emailTemplateId) : "",
      kakaoEnabled: product.notification?.kakaoEnabled === true,
      kakaoTemplateId: product.notification?.kakaoTemplateId ? String(product.notification.kakaoTemplateId) : "",
    });
    setKindValue((product.kind as "digital" | "counseling" | "test") ?? "digital");
    setNotifMsg("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelected(null);
    setPdfFiles([]);
    setFormError("");
    setVariantPdfFiles({});
    setUploadingVariants({});
    fetchAll();
  };

  // 알림 설정 저장 (옵션/일반 상품 모두 동작하도록 독립 저장)
  const handleSaveNotification = async () => {
    if (!selected) return;
    setNotifSaving(true);
    setNotifMsg("");
    try {
      await apiFetch(`/api/products/${selected._id}`, {
        method: "PUT",
        body: JSON.stringify({
          kind: kindValue,
          notification: {
            emailEnabled: notifForm.emailEnabled,
            emailTemplateId: notifForm.emailTemplateId || null,
            kakaoEnabled: notifForm.kakaoEnabled,
            kakaoTemplateId: notifForm.kakaoTemplateId || null,
          },
        }),
      });
      setNotifMsg("저장되었습니다.");
    } catch (err) {
      setNotifMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setNotifSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setFormError("");
    const priceNum = parseFloat(editForm.price);
    if (!editForm.title.trim() || isNaN(priceNum) || priceNum < 0) {
      setFormError("상품명과 가격을 올바르게 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/products/${selected._id}`, {
        method: "PUT",
        body: JSON.stringify({ title: editForm.title.trim(), description: selected.description, price: priceNum, language: selected.language }),
      });
      if (pdfFiles.length > 0) {
        setIsUploadingPdf(true);
        for (const file of pdfFiles) {
          await uploadFile(`/api/products/${selected._id}/pdf`, "pdf", file);
        }
        setIsUploadingPdf(false);
      }
      closeEditModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setIsUploadingPdf(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePdf = async (productId: string, fileIndex: number, filename: string) => {
    if (!confirm(`"${filename}" 파일을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/products/${productId}/pdf/${fileIndex}`, { method: "DELETE" });
      setSelected((prev) => (prev ? { ...prev, pdfFiles: prev.pdfFiles.filter((_, i) => i !== fileIndex) } : prev));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 삭제에 실패했습니다.");
    }
  };

  // 옵션(variant)별 PDF 업로드 — 응답의 data.product를 읽으므로 raw fetch 유지
  const handleVariantPdfUpload = async (productId: string, variantCode: string) => {
    const file = variantPdfFiles[variantCode];
    if (!file) return;
    setUploadingVariants((prev) => ({ ...prev, [variantCode]: true }));
    setFormError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/variants/${variantCode}/pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "PDF 업로드 실패");
      setSelected((prev) => {
        if (!prev || !prev.variants) return prev;
        return {
          ...prev,
          variants: prev.variants.map((v) =>
            v.variantCode === variantCode
              ? { ...v, pdfFiles: data.product?.variants?.find((vv: ProductVariant) => vv.variantCode === variantCode)?.pdfFiles ?? v.pdfFiles }
              : v
          ),
        };
      });
      setVariantPdfFiles((prev) => ({ ...prev, [variantCode]: null }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 업로드에 실패했습니다.");
    } finally {
      setUploadingVariants((prev) => ({ ...prev, [variantCode]: false }));
    }
  };

  const handleVariantDeletePdf = async (productId: string, variantCode: string, fileIndex: number, filename: string) => {
    if (!confirm(`"${filename}" 파일을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/products/${productId}/variants/${variantCode}/pdf/${fileIndex}`, { method: "DELETE" });
      setSelected((prev) => {
        if (!prev || !prev.variants) return prev;
        return {
          ...prev,
          variants: prev.variants.map((v) =>
            v.variantCode === variantCode ? { ...v, pdfFiles: v.pdfFiles.filter((_, i) => i !== fileIndex) } : v
          ),
        };
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 삭제에 실패했습니다.");
    }
  };

  const cafe24Products = products.filter((p) => p.channel === "cafe24");

  // 카페24 진열(display)·판매(selling)·삭제(isActive) 상태로 상품을 4개 그룹으로 분류
  const statusOf = (p: Product): "live" | "hidden" | "stopped" | "deleted" => {
    if (!p.isActive) return "deleted";          // 카페24 목록에서 사라짐 = 삭제
    if (p.cafe24Selling === false) return "stopped";  // 판매중지
    return p.cafe24Display === false ? "hidden" : "live"; // 미진열 vs 진열중
  };
  const groupDefs: { key: string; label: string; dotClass: string; collapsible: boolean }[] = [
    { key: "live", label: "진열중 · 판매중", dotClass: "bg-green-500", collapsible: false },
    { key: "hidden", label: "미진열 · 판매중", dotClass: "bg-amber-500", collapsible: false },
    { key: "stopped", label: "판매중지", dotClass: "bg-gray-400", collapsible: true },
    { key: "deleted", label: "삭제됨 (카페24에서 제거)", dotClass: "bg-red-400", collapsible: true },
  ];
  const groups = groupDefs.map((g) => ({ ...g, items: cafe24Products.filter((p) => statusOf(p) === g.key) }));

  // 상품 1건의 행(옵션 하위행 포함) 렌더 — 그룹별 테이블에서 재사용
  const renderProductRow = (product: Product) => {
    // 상담/검사는 옵션이 '예약 슬롯'이므로 전자책 변형처럼 펼쳐 보이지 않는다
    const isService = product.kind === "counseling" || product.kind === "test";
    const hasVariants = product.variants && product.variants.length > 0 && !isService;
    const dimmed = !product.isActive || product.cafe24Selling === false; // 판매중지/삭제는 흐리게
    return (
      <Fragment key={product._id}>
        <tr className={`hover:bg-[var(--surface)] ${dimmed ? "opacity-60" : ""}`}>
          <td className="px-5 py-3 font-medium text-[var(--foreground)]">{product.title}</td>
          <td className="px-5 py-3 text-[var(--foreground-muted)]">{product.cafe24ProductNo ?? <span className="text-[var(--foreground-subtle)]">—</span>}</td>
          <td className="px-5 py-3 text-[var(--foreground-muted)]">{product.price.toLocaleString("ko-KR", { style: "currency", currency: "KRW" })}</td>
          <td className="px-5 py-3">
            {isService ? (
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">{KIND_LABEL[product.kind!]} · 예약</span>
            ) : !hasVariants && (product.pdfFiles?.length > 0 ? (
              <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">{product.pdfFiles.length} file{product.pdfFiles.length > 1 ? "s" : ""}</span>
            ) : (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">None</span>
            ))}
          </td>
          <td className="px-5 py-3">
            <button className="cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline" onClick={() => openEditModal(product)}>Edit</button>
          </td>
        </tr>
        {hasVariants && product.variants!.map((variant) => (
          <tr key={`${product._id}-${variant.variantCode}`} className="bg-[var(--surface)]">
            <td className="py-2 pl-10 pr-5 text-xs text-[var(--foreground-muted)]"><span className="text-[var(--foreground-subtle)] mr-1">└</span>{variant.optionName}</td>
            <td className="px-5 py-2 text-xs text-[var(--foreground-subtle)]"></td>
            <td className="px-5 py-2 text-xs text-[var(--foreground-muted)]">+{variant.additionalAmount.toLocaleString("ko-KR", { style: "currency", currency: "KRW" })}</td>
            <td className="px-5 py-2">
              {variant.pdfFiles?.length > 0 ? (
                <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">{variant.pdfFiles.length} file{variant.pdfFiles.length > 1 ? "s" : ""}</span>
              ) : (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">None</span>
              )}
            </td>
            <td className="px-5 py-2"></td>
          </tr>
        ))}
      </Fragment>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">상품 · 한국어 쇼핑몰 (카페24)</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/cafe24/auth/start`}
            target="_blank"
            rel="noopener noreferrer"
            title="동기화가 invalid_grant 오류로 실패할 때 눌러 토큰을 재발급하세요"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            카페24 재인증
          </a>
          <button onClick={handleSync} disabled={isSyncing} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50">
            <svg className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isSyncing ? "Syncing..." : "Sync from Cafe24"}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${syncMsg.type === "success" ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-red-50 text-red-700"}`}>{syncMsg.text}</div>
      )}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : cafe24Products.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">No Cafe24 products yet. Click &quot;Sync from Cafe24&quot; to import products.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            if (g.items.length === 0) return null;
            const open = g.collapsible ? (openGroups[g.key] ?? false) : true;
            return (
              <div key={g.key} className="overflow-hidden rounded-2xl border border-[var(--border)]">
                <button
                  type="button"
                  onClick={g.collapsible ? () => setOpenGroups((prev) => ({ ...prev, [g.key]: !open })) : undefined}
                  className={`flex w-full items-center justify-between gap-2 bg-[var(--surface)] px-5 py-3 text-left ${g.collapsible ? "cursor-pointer hover:bg-[var(--border)]/40" : "cursor-default"}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <span className={`h-2 w-2 rounded-full ${g.dotClass}`} />
                    {g.label}
                    <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-normal text-[var(--foreground-subtle)]">{g.items.length}</span>
                  </span>
                  {g.collapsible && (
                    <svg className={`h-4 w-4 text-[var(--foreground-subtle)] transition-transform ${open ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {open && (
                  <div className="overflow-x-auto border-t border-[var(--border)]">
                    <table className="w-full min-w-[580px] text-sm">
                      <thead className="bg-[var(--background)]">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Product Name</th>
                          <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Cafe24 No.</th>
                          <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Price</th>
                          <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">PDF</th>
                          <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                        {g.items.map((product) => renderProductRow(product))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cafe24 상품 수정 모달 */}
      {showEditModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Cafe24 Product</h2>
              <p className="mt-1 text-xs text-amber-600">Product name and price will be overwritten on next sync from Cafe24.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {(() => {
                // 상담/검사면 옵션은 예약 슬롯이므로 옵션별 PDF 관리 UI를 숨긴다(드롭다운 즉시 반영)
                const isService = kindValue === "counseling" || kindValue === "test";
                const hasVariants = selected.variants && selected.variants.length > 0 && !isService;
                return (
                  <div className="space-y-5">
                    {/* 상품 기본 정보 (read-only) */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-2">
                      <p className="text-xs text-[var(--foreground-subtle)]">상품 #{selected.cafe24ProductNo}</p>
                      <p className="font-medium text-[var(--foreground)]">{selected.title}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">기본가격: {selected.price.toLocaleString("ko-KR", { style: "currency", currency: "KRW" })}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs text-[var(--foreground-subtle)]">상품 종류</label>
                        <select value={kindValue} onChange={(e) => setKindValue(e.target.value as "digital" | "counseling" | "test")} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs outline-none focus:border-[var(--brand)]">
                          {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <span className="text-[10px] text-[var(--foreground-subtle)]">상담/검사면 주문 시 예약이 생성됩니다 (아래 저장 버튼으로 함께 저장)</span>
                      </div>
                    </div>

                    {/* 주문 알림 설정 */}
                    <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--foreground)]">주문 알림 설정</p>
                        <div className="flex items-center gap-3">
                          <Link href="/admin/email-templates" className="text-xs text-[var(--brand)] hover:underline">이메일 템플릿 →</Link>
                          <Link href="/admin/kakao-templates" className="text-xs text-[var(--brand)] hover:underline">카카오 템플릿 →</Link>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                        <input type="checkbox" checked={notifForm.emailEnabled} onChange={(e) => setNotifForm({ ...notifForm, emailEnabled: e.target.checked })} />
                        주문 시 이메일 발송
                      </label>
                      <div>
                        <label className="mb-1 block text-xs text-[var(--foreground-subtle)]">이메일 템플릿</label>
                        <select value={notifForm.emailTemplateId} disabled={!notifForm.emailEnabled} onChange={(e) => setNotifForm({ ...notifForm, emailTemplateId: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] disabled:opacity-50">
                          <option value="">기본 템플릿 (한국어 안내)</option>
                          {emailTemplates.filter((t) => t.isActive).map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                        </select>
                      </div>

                      <div className="border-t border-[var(--border)] pt-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <input type="checkbox" checked={notifForm.kakaoEnabled} onChange={(e) => setNotifForm({ ...notifForm, kakaoEnabled: e.target.checked })} />
                          주문 시 카카오 알림톡 발송
                        </label>
                        <div className="mt-2">
                          <label className="mb-1 block text-xs text-[var(--foreground-subtle)]">카카오 템플릿</label>
                          <select value={notifForm.kakaoTemplateId} disabled={!notifForm.kakaoEnabled} onChange={(e) => setNotifForm({ ...notifForm, kakaoTemplateId: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] disabled:opacity-50">
                            <option value="">선택하세요</option>
                            {kakaoTemplates.filter((t) => t.isActive).map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button type="button" onClick={handleSaveNotification} disabled={notifSaving} className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{notifSaving ? "저장 중..." : "알림 설정 저장"}</button>
                        {notifMsg && <span className="text-xs text-[var(--foreground-muted)]">{notifMsg}</span>}
                      </div>
                      <p className="text-xs text-[var(--foreground-subtle)]">끄면 이 상품 주문 시 해당 알림이 발송되지 않습니다. 카카오 알림톡은 전화번호가 있을 때만 발송되며, 실패 시 문자로 대체됩니다.</p>
                    </div>

                    {hasVariants ? (
                      <div>
                        <p className="mb-3 text-sm font-medium text-[var(--foreground)]">옵션별 PDF 관리</p>
                        <div className="space-y-4">
                          {selected.variants!.map((variant) => (
                            <div key={variant.variantCode} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--foreground)]">{variant.optionName}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">+{variant.additionalAmount.toLocaleString("ko-KR", { style: "currency", currency: "KRW" })}</span>
                              </div>
                              {variant.pdfFiles?.length > 0 ? (
                                <div className="space-y-1.5">
                                  {variant.pdfFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-1.5">
                                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--foreground-muted)]">{file.filename}</span>
                                      <button type="button" onClick={() => handleVariantDeletePdf(selected._id, variant.variantCode, idx, file.filename)} className="shrink-0 text-xs text-[var(--error)] hover:underline">삭제</button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[var(--foreground-subtle)]">PDF 없음</p>
                              )}
                              <div className="flex items-center gap-2">
                                <input type="file" accept="application/pdf" onChange={(e) => setVariantPdfFiles((prev) => ({ ...prev, [variant.variantCode]: e.target.files?.[0] ?? null }))} className="flex-1 text-xs text-[var(--foreground-muted)]" />
                                <button type="button" disabled={!variantPdfFiles[variant.variantCode] || uploadingVariants[variant.variantCode]} onClick={() => handleVariantPdfUpload(selected._id, variant.variantCode)} className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-40">
                                  {uploadingVariants[variant.variantCode] ? "업로드 중..." : "업로드"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : isService ? (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700">
                        <p className="font-medium">예약형 상품 ({KIND_LABEL[kindValue]})</p>
                        <p className="mt-1 text-xs text-purple-600">이 상품의 옵션은 예약 날짜·시간 슬롯입니다. PDF를 첨부하지 않으며, 주문이 들어오면 <b>예약 캘린더</b>에 자동 등록됩니다. 슬롯은 카페24 상품 옵션에서 관리하세요.</p>
                      </div>
                    ) : (
                      <form id="cafe24-edit-form" onSubmit={handleUpdate} className="space-y-4">
                        {selected.pdfFiles?.length > 0 && (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Current PDF Files</label>
                            <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                              {selected.pdfFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-muted)]">{file.filename}</span>
                                  <button type="button" onClick={() => handleDeletePdf(selected._id, idx, file.filename)} className="shrink-0 text-xs text-[var(--error)] hover:underline">Delete</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Add PDF Files <span className="font-normal text-[var(--foreground-subtle)]">(optional)</span></label>
                          <input type="file" accept="application/pdf" multiple onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))} className="w-full text-sm text-[var(--foreground-muted)]" />
                          {pdfFiles.length > 0 && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{pdfFiles.length} file(s) selected: {pdfFiles.map((f) => f.name).join(", ")}</p>}
                        </div>
                      </form>
                    )}

                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                  </div>
                );
              })()}
            </div>

            <div className="flex-shrink-0 flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button type="button" onClick={closeEditModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                {selected.variants && selected.variants.length > 0 ? "닫기" : "Cancel"}
              </button>
              {(!selected.variants || selected.variants.length === 0) && (
                <button type="submit" form="cafe24-edit-form" disabled={isSubmitting || isUploadingPdf} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {isSubmitting || isUploadingPdf ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
