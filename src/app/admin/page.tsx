"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  language: "ko" | "en" | "both";
  isActive: boolean;
  pdfFiles: { filename: string; r2Key: string }[];
}

interface AdminOrder {
  _id: string;
  userId: { name: string; email: string } | null;
  productId: { title: string; price: number } | null;
  amount: number;
  currency: string;
  channel: "polar" | "cafe24";
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

// 상품 폼 초기값
const emptyForm = { title: "", description: "", price: "", language: "both" as "ko" | "en" | "both" };

// ─────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 폼 상태
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF 업로드 상태 (등록 후 연속 업로드용)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 접근 권한 확인
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); }
  }, [authLoading, user, router]);

  // 데이터 조회
  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [productsData, ordersData] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/orders"),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchData();
  }, [user]);

  // ─────────────────────────────────────────────────────────────────
  // 상품 등록
  // ─────────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setForm(emptyForm);
    setFormError("");
    setCreatedProductId(null);
    setPdfFiles([]);
    setUploadDone(false);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCreatedProductId(null);
    setPdfFiles([]);
    setUploadDone(false);
    fetchData();
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
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: priceNum,
          language: form.language,
        }),
      });
      setCreatedProductId(created._id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "상품 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF 파일 업로드 (FormData 방식)
  const handlePdfUpload = async () => {
    if (!createdProductId || pdfFiles.length === 0) return;

    setIsUploadingPdf(true);
    setFormError("");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append("pdf", file);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/${createdProductId}/pdf`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "PDF 업로드 실패");
      }
      setUploadDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "PDF 업로드에 실패했습니다.");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 상품 수정
  // ─────────────────────────────────────────────────────────────────

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      language: product.language,
    });
    setFormError("");
    setPdfFiles([]);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    setPdfFiles([]);
    fetchData();
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
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: priceNum,
          language: form.language,
        }),
      });

      // 추가 PDF 파일 업로드
      if (pdfFiles.length > 0) {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        for (const file of pdfFiles) {
          const formData = new FormData();
          formData.append("pdf", file);
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/products/${selectedProduct._id}/pdf`,
            {
              method: "POST",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            }
          );
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "PDF 업로드 실패");
        }
      }

      closeEditModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 상품 삭제
  // ─────────────────────────────────────────────────────────────────

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.title}" 상품을 삭제할까요?\n삭제된 상품은 목록에서 숨겨지며, 기존 구매 기록은 유지됩니다.`)) return;

    try {
      await apiFetch(`/api/products/${product._id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // PDF 삭제
  // ─────────────────────────────────────────────────────────────────

  const handleDeletePdf = async (productId: string, fileIndex: number, filename: string) => {
    if (!confirm(`"${filename}" 파일을 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/products/${productId}/pdf/${fileIndex}`, { method: 'DELETE' });
      // 로컬 상태에서도 즉시 제거
      setSelectedProduct((prev) =>
        prev
          ? { ...prev, pdfFiles: prev.pdfFiles.filter((_, i) => i !== fileIndex) }
          : prev
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'PDF 삭제에 실패했습니다.');
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────────

  if (authLoading || !user || user.role !== "admin") return null;

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* 페이지 헤더 */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Manage products and view orders</p>
          </div>
          <button
            className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            onClick={openAddModal}
          >
            + Add Product
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* 요약 카드 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">Total Products</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{dataLoading ? "—" : products.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">Total Orders</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{dataLoading ? "—" : orders.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">Revenue (paid)</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{dataLoading ? "—" : `$${totalRevenue.toFixed(2)}`}</p>
          </div>
        </div>

        {dataLoading && (
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
            <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
          </div>
        )}

        {!dataLoading && (
          <>
            {/* 상품 목록 */}
            <section className="mb-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Products</h2>
              {products.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">No products yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Title</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Price</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Lang</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">PDFs</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Status</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-[var(--surface)]">
                          <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                            <Link href={`/shop/${product._id}`} className="hover:text-[var(--brand)] hover:underline">
                              {product.title}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">${product.price.toFixed(2)}</td>
                          <td className="px-5 py-3 uppercase text-[var(--foreground-muted)]">{product.language}</td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">{product.pdfFiles?.length ?? 0}</td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">
                              {product.isActive ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              className="mr-2 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            <button
                              className="cursor-pointer text-xs text-[var(--error)] hover:underline"
                              onClick={() => handleDelete(product)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 최근 주문 목록 */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Recent Orders</h2>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Customer</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Product</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Amount</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Date</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Channel</th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-[var(--surface)]">
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">{order.userId?.email ?? "Unknown"}</td>
                          <td className="px-5 py-3 font-medium text-[var(--foreground)]">{order.productId?.title ?? "Unknown"}</td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">{order.currency} {order.amount.toFixed(2)}</td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${order.channel === "polar" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                              {order.channel === "polar" ? "Polar" : "Cafe24"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${order.status === "paid" ? "bg-[var(--brand-light)] text-[var(--brand)]" : order.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── 상품 등록 모달 ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget && !createdProductId) closeAddModal(); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-[var(--foreground)]">
              {createdProductId ? "Upload PDF Files" : "Add New Product"}
            </h2>

            {/* Step 1: 상품 정보 입력 */}
            {!createdProductId && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="E-book title"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="Product description"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      placeholder="19.99"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Language</label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value as "ko" | "en" | "both" })}
                      className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    >
                      <option value="both">Both (KO + EN)</option>
                      <option value="en">English</option>
                      <option value="ko">Korean</option>
                    </select>
                  </div>
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAddModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: PDF 업로드 */}
            {createdProductId && !uploadDone && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Product created successfully! Now upload PDF file(s) for this product.
                  You can also skip this and upload later via Edit.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">PDF Files</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))}
                    className="w-full text-sm text-[var(--foreground-muted)]"
                  />
                  {pdfFiles.length > 0 && (
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                      {pdfFiles.length} file(s) selected: {pdfFiles.map((f) => f.name).join(", ")}
                    </p>
                  )}
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAddModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                    Skip & Close
                  </button>
                  <button
                    type="button"
                    onClick={handlePdfUpload}
                    disabled={pdfFiles.length === 0 || isUploadingPdf}
                    className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                  >
                    {isUploadingPdf ? "Uploading..." : "Upload PDF"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 완료 */}
            {createdProductId && uploadDone && (
              <div className="space-y-4 text-center">
                <p className="text-[var(--brand)] font-medium">PDF uploaded successfully!</p>
                <button onClick={closeAddModal} className="rounded-full bg-[var(--brand)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 상품 수정 모달 ───────────────────────────────────────────── */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-[var(--foreground)]">Edit Product</h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as "ko" | "en" | "both" })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  >
                    <option value="both">Both (KO + EN)</option>
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
              </div>

              {/* 기존 PDF 목록 + 삭제 */}
              {selectedProduct.pdfFiles?.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Current PDF Files
                  </label>
                  <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                    {selectedProduct.pdfFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-[var(--foreground-muted)]">
                          {file.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(selectedProduct._id, idx, file.filename)}
                          className="shrink-0 text-xs text-[var(--error)] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 추가 PDF 업로드 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Add PDF Files
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))}
                  className="w-full text-sm text-[var(--foreground-muted)]"
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEditModal} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
