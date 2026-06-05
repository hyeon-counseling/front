"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { uploadFile } from "../../_lib/upload";
import { Product } from "../../_lib/types";

// 영어 쇼핑몰(Polar) 상품 관리 — 당분간 비활성 채널.
// 가드는 admin/layout.tsx에서 처리.

const emptyForm = { title: "", description: "", price: "", language: "both" as "ko" | "en" | "both" };

export default function EnProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 등록/수정 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 파일 업로드 (등록)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 수정 모달 이미지
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/products?channel=all");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── 등록 ──
  const openAddModal = () => {
    setForm(emptyForm);
    setFormError("");
    setCreatedProductId(null);
    setPdfFiles([]);
    setUploadDone(false);
    setImageFile(null);
    setImagePreviewUrl(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCreatedProductId(null);
    setPdfFiles([]);
    setUploadDone(false);
    setImageFile(null);
    setImagePreviewUrl(null);
    fetchProducts();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const priceNum = parseFloat(form.price);
    if (!form.title.trim() || !form.description.trim() || isNaN(priceNum) || priceNum < 0) {
      setFormError("모든 필드를 올바르게 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim(), price: priceNum, language: form.language }),
      });
      setCreatedProductId(created._id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "상품 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!createdProductId || pdfFiles.length === 0) return;
    setIsUploadingPdf(true);
    setFormError("");
    try {
      for (const file of pdfFiles) {
        await uploadFile(`/api/products/${createdProductId}/pdf`, "pdf", file);
      }
      setUploadDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 업로드에 실패했습니다.");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleImageFileChange = (file: File | null, setFile: (f: File | null) => void, setPreview: (url: string | null) => void) => {
    if (!file) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async (productId: string): Promise<boolean> => {
    if (!imageFile) return true;
    setIsUploadingImage(true);
    try {
      await uploadFile(`/api/products/${productId}/image`, "image", imageFile);
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      return false;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditImageUpload = async (productId: string): Promise<boolean> => {
    if (!editImageFile) return true;
    try {
      await uploadFile(`/api/products/${productId}/image`, "image", editImageFile);
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      return false;
    }
  };

  // ── 수정 ──
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setForm({ title: product.title, description: product.description, price: String(product.price), language: product.language });
    setFormError("");
    setPdfFiles([]);
    setEditImageFile(null);
    setEditImagePreviewUrl(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    setPdfFiles([]);
    setEditImageFile(null);
    setEditImagePreviewUrl(null);
    fetchProducts();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setFormError("");
    const priceNum = parseFloat(form.price);
    if (!form.title.trim() || !form.description.trim() || isNaN(priceNum) || priceNum < 0) {
      setFormError("모든 필드를 올바르게 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/products/${selectedProduct._id}`, {
        method: "PUT",
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim(), price: priceNum, language: form.language }),
      });
      if (pdfFiles.length > 0) {
        for (const file of pdfFiles) {
          await uploadFile(`/api/products/${selectedProduct._id}/pdf`, "pdf", file);
        }
      }
      if (editImageFile) {
        const imageOk = await handleEditImageUpload(selectedProduct._id);
        if (!imageOk) return;
      }
      closeEditModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePolarSync = async (product: Product) => {
    const action = product.polarProductId ? "Polar 정보를 업데이트" : "Polar에 새로 연결";
    if (!confirm(`"${product.title}" 상품을 ${action}할까요?`)) return;
    try {
      await apiFetch(`/api/products/${product._id}/polar-sync`, { method: "POST" });
      alert(`${action} 완료! 이제 구매 버튼이 활성화됩니다.`);
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Polar 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.title}" 상품을 삭제할까요?\n삭제된 상품은 목록에서 숨겨지며, 기존 구매 기록은 유지됩니다.`)) return;
    try {
      await apiFetch(`/api/products/${product._id}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleDeletePdf = async (productId: string, fileIndex: number, filename: string) => {
    if (!confirm(`"${filename}" 파일을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/products/${productId}/pdf/${fileIndex}`, { method: "DELETE" });
      setSelectedProduct((prev) => (prev ? { ...prev, pdfFiles: prev.pdfFiles.filter((_, i) => i !== fileIndex) } : prev));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 삭제에 실패했습니다.");
    }
  };

  const visible = products.filter((p) => p.channel !== "cafe24");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">상품 · 영어 쇼핑몰 (Polar)</h1>
          <p className="mt-1 text-xs text-amber-600">이 채널은 당분간 비활성입니다.</p>
        </div>
        <button onClick={openAddModal} className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
          + Add Product
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">No products yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[var(--surface)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Title</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Price</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Lang</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">PDFs</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Polar</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                {visible.map((product) => (
                  <tr key={product._id} className="hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                      <Link href={`/shop/${product._id}`} className="hover:text-[var(--brand)] hover:underline">{product.title}</Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-3 uppercase text-[var(--foreground-muted)]">{product.language}</td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{product.pdfFiles?.length ?? 0}</td>
                    <td className="px-5 py-3">
                      {product.polarProductId ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">✓ 연동됨</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">✗ 미연동</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button className="mr-2 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline" onClick={() => openEditModal(product)}>Edit</button>
                      {!product.polarProductId && (
                        <button className="mr-2 cursor-pointer text-xs text-blue-600 hover:underline" onClick={() => handlePolarSync(product)}>Polar 연동</button>
                      )}
                      <button className="cursor-pointer text-xs text-[var(--error)] hover:underline" onClick={() => handleDelete(product)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 상품 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget && !createdProductId) closeAddModal(); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-[var(--foreground)]">{createdProductId ? "Upload PDF Files" : "Add New Product"}</h2>

            {!createdProductId && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="E-book title" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="Product description" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price (USD)</label>
                    <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" placeholder="19.99" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Language</label>
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as "ko" | "en" | "both" })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]">
                      <option value="both">Both (KO + EN)</option>
                      <option value="en">English</option>
                      <option value="ko">Korean</option>
                    </select>
                  </div>
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAddModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{isSubmitting ? "Creating..." : "Create Product"}</button>
                </div>
              </form>
            )}

            {createdProductId && !uploadDone && (
              <div className="space-y-5">
                <p className="text-sm text-[var(--foreground-muted)]">Product created successfully! Upload a cover image and/or PDF file(s). You can also skip and upload later via Edit.</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Cover Image <span className="font-normal text-[var(--foreground-subtle)]">(optional — JPEG, PNG, WebP, max 5MB)</span></label>
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null, setImageFile, setImagePreviewUrl)} className="w-full text-sm text-[var(--foreground-muted)]" />
                  {imagePreviewUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreviewUrl} alt="Cover preview" className="h-32 w-auto rounded-xl object-cover border border-[var(--border)]" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">PDF Files <span className="font-normal text-[var(--foreground-subtle)]">(optional)</span></label>
                  <input ref={fileInputRef} type="file" accept="application/pdf" multiple onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))} className="w-full text-sm text-[var(--foreground-muted)]" />
                  {pdfFiles.length > 0 && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{pdfFiles.length} file(s) selected: {pdfFiles.map((f) => f.name).join(", ")}</p>}
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAddModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">Skip & Close</button>
                  <button
                    type="button"
                    disabled={(pdfFiles.length === 0 && !imageFile) || isUploadingPdf || isUploadingImage}
                    onClick={async () => {
                      setFormError("");
                      if (imageFile) {
                        const ok = await handleImageUpload(createdProductId);
                        if (!ok) return;
                      }
                      if (pdfFiles.length > 0) {
                        await handlePdfUpload();
                      } else {
                        setUploadDone(true);
                      }
                    }}
                    className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                  >
                    {isUploadingPdf || isUploadingImage ? "Uploading..." : "Upload Files"}
                  </button>
                </div>
              </div>
            )}

            {createdProductId && uploadDone && (
              <div className="space-y-4 text-center">
                <p className="text-[var(--brand)] font-medium">PDF uploaded successfully!</p>
                <button onClick={closeAddModal} className="rounded-full bg-[var(--brand)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상품 수정 모달 */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-[var(--foreground)]">Edit Product</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price (USD)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Language</label>
                  <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as "ko" | "en" | "both" })} className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]">
                    <option value="both">Both (KO + EN)</option>
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
              </div>

              {selectedProduct.pdfFiles?.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Current PDF Files</label>
                  <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                    {selectedProduct.pdfFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-muted)]">{file.filename}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="기본값"
                            value={file.expiryDays ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                              setSelectedProduct((prev) => prev ? { ...prev, pdfFiles: prev.pdfFiles.map((f, i) => i === idx ? { ...f, expiryDays: isNaN(val as number) ? null : val } : f) } : prev);
                            }}
                            onBlur={async () => {
                              const pdfFile = selectedProduct.pdfFiles[idx];
                              try {
                                await apiFetch(`/api/products/${selectedProduct._id}/pdf/${idx}/expiry`, { method: "PATCH", body: JSON.stringify({ expiryDays: pdfFile.expiryDays ?? null }) });
                              } catch {
                                // 저장 실패 시 조용히 처리
                              }
                            }}
                            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                            title="만료일(일). 비워두면 글로벌 기본값 적용"
                          />
                          <span className="text-xs text-[var(--foreground-subtle)]">일</span>
                        </div>
                        <button type="button" onClick={() => handleDeletePdf(selectedProduct._id, idx, file.filename)} className="shrink-0 text-xs text-[var(--error)] hover:underline">Delete</button>
                      </div>
                    ))}
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">만료일 칸을 비워두면 Settings의 기본 만료일이 적용됩니다.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Add PDF Files</label>
                <input type="file" accept="application/pdf" multiple onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))} className="w-full text-sm text-[var(--foreground-muted)]" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Cover Image <span className="font-normal text-[var(--foreground-subtle)]">(JPEG, PNG, WebP, max 5MB)</span></label>
                {selectedProduct.coverImageUrl && !editImagePreviewUrl && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs text-[var(--foreground-subtle)]">Current image:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedProduct.coverImageUrl} alt="Current cover" className="h-24 w-auto rounded-xl object-cover border border-[var(--border)]" />
                  </div>
                )}
                {editImagePreviewUrl && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs text-[var(--foreground-subtle)]">New image preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImagePreviewUrl} alt="New cover preview" className="h-24 w-auto rounded-xl object-cover border border-[var(--brand)]" />
                  </div>
                )}
                <input ref={editImageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null, setEditImageFile, setEditImagePreviewUrl)} className="w-full text-sm text-[var(--foreground-muted)]" />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEditModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{isSubmitting ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
