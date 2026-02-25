"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  pdfFiles: { filename: string; r2Key: string; expiryDays?: number | null }[];
  coverImageUrl?: string;
  polarProductId?: string;
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

interface ContentItem {
  _id: string;
  title: string;
  category: string;
  summary: string;
  isPublished: boolean;
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

  // 이메일 설정 상태
  const [emailSettings, setEmailSettings] = useState({ emailFromName: "", emailFromLocalPart: "", emailDomain: "hyeon-counseling.com", defaultDownloadExpiryDays: 30 });
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false);
  const [emailSettingsMsg, setEmailSettingsMsg] = useState("");

  // 콘텐츠 관리 상태
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentForm, setContentForm] = useState({ title: "", body: "", summary: "", category: "", isPublished: false });
  const [contentFormError, setContentFormError] = useState("");
  const [isContentSubmitting, setIsContentSubmitting] = useState(false);
  const [contentPreview, setContentPreview] = useState(false);

  // PDF 업로드 상태 (등록 후 연속 업로드용)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 수정 모달 이미지 상태
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

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
      const [productsData, ordersData, contentsData, settingsData] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/orders"),
        apiFetch("/api/admin/contents"),
        apiFetch("/api/admin/settings"),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setContents(contentsData);
      setEmailSettings(settingsData);
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

  // 이미지 파일 선택 핸들러 — 브라우저에서 미리보기 URL 생성
  const handleImageFileChange = (file: File | null, setFile: (f: File | null) => void, setPreview: (url: string | null) => void) => {
    if (!file) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  // 이미지 업로드 실행 (등록 Step 2에서 사용)
  const handleImageUpload = async (productId: string): Promise<boolean> => {
    if (!imageFile) return true; // 이미지 없으면 건너뜀

    setIsUploadingImage(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/image`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "이미지 업로드 실패");
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      return false;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 수정 모달 이미지 업로드 실행
  const handleEditImageUpload = async (productId: string): Promise<boolean> => {
    if (!editImageFile) return true;

    setIsUploadingEditImage(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const formData = new FormData();
      formData.append("image", editImageFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/image`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "이미지 업로드 실패");
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
      return false;
    } finally {
      setIsUploadingEditImage(false);
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

      // 이미지 업로드 (선택한 경우에만)
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

  // ─────────────────────────────────────────────────────────────────
  // Polar 재동기화
  // ─────────────────────────────────────────────────────────────────

  const handlePolarSync = async (product: Product) => {
    const action = product.polarProductId ? "Polar 정보를 업데이트" : "Polar에 새로 연결";
    if (!confirm(`"${product.title}" 상품을 ${action}할까요?`)) return;
    try {
      await apiFetch(`/api/products/${product._id}/polar-sync`, { method: "POST" });
      alert(`${action} 완료! 이제 구매 버튼이 활성화됩니다.`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Polar 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

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
  // 콘텐츠 CRUD
  // ─────────────────────────────────────────────────────────────────

  const openContentModal = (content?: ContentItem) => {
    if (content) {
      setSelectedContent(content);
      setContentForm({
        title: content.title,
        body: "",          // 상세 본문은 목록 API에서 오지 않으므로 편집 시 직접 입력
        summary: content.summary,
        category: content.category,
        isPublished: content.isPublished,
      });
    } else {
      setSelectedContent(null);
      setContentForm({ title: "", body: "", summary: "", category: "", isPublished: false });
    }
    setContentFormError("");
    setContentPreview(false);
    setShowContentModal(true);
  };

  const closeContentModal = () => {
    setShowContentModal(false);
    setSelectedContent(null);
    setContentPreview(false);
    fetchData();
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentFormError("");

    if (!contentForm.title.trim()) {
      setContentFormError("제목을 입력해 주세요.");
      return;
    }
    // 새 글이거나 본문이 입력된 경우 body 검증
    if (!selectedContent && !contentForm.body.trim()) {
      setContentFormError("본문을 입력해 주세요.");
      return;
    }

    setIsContentSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: contentForm.title.trim(),
        summary: contentForm.summary.trim(),
        category: contentForm.category.trim(),
        isPublished: contentForm.isPublished,
      };
      // body는 새 글이거나 수정 시 입력된 경우에만 포함
      if (contentForm.body.trim()) {
        payload.body = contentForm.body.trim();
      }

      if (selectedContent) {
        // 수정: PUT /api/admin/contents/:id
        await apiFetch(`/api/admin/contents/${selectedContent._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // 신규 등록: POST /api/admin/contents
        await apiFetch("/api/admin/contents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeContentModal();
    } catch (err) {
      setContentFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsContentSubmitting(false);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSettingsSaving(true);
    setEmailSettingsMsg("");
    try {
      const data = await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          emailFromName: emailSettings.emailFromName,
          emailFromLocalPart: emailSettings.emailFromLocalPart,
          defaultDownloadExpiryDays: emailSettings.defaultDownloadExpiryDays,
        }),
      });
      setEmailSettings(data);
      setEmailSettingsMsg("저장되었습니다.");
    } catch (err) {
      setEmailSettingsMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setEmailSettingsSaving(false);
    }
  };

  const handleContentDelete = async (content: ContentItem) => {
    if (!confirm(`"${content.title}" 콘텐츠를 삭제할까요?\n삭제하면 복구할 수 없습니다.`)) return;
    try {
      await apiFetch(`/api/admin/contents/${content._id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
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
                            {product.polarProductId ? (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                ✓ 연동됨
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                ✗ 미연동
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              className="mr-2 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            {!product.polarProductId && (
                              <button
                                className="mr-2 cursor-pointer text-xs text-blue-600 hover:underline"
                                onClick={() => handlePolarSync(product)}
                              >
                                Polar 연동
                              </button>
                            )}
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
                </div>
              )}
            </section>

            {/* 최근 주문 목록 */}
            <section className="mb-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Recent Orders</h2>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
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
                </div>
              )}
            </section>

            {/* 콘텐츠 관리 */}
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Contents</h2>
                <button
                  onClick={() => openContentModal()}
                  className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-hover)]"
                >
                  + Add Content
                </button>
              </div>
              {contents.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">No content yet.</p>
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
                              <Link href={`/content/${content._id}`} className="hover:text-[var(--brand)] hover:underline">
                                {content.title}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-[var(--foreground-muted)]">
                              {content.category || <span className="text-[var(--foreground-subtle)]">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${content.isPublished ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground-muted)]"}`}>
                                {content.isPublished ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[var(--foreground-muted)]">
                              {new Date(content.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                className="mr-2 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline"
                                onClick={() => openContentModal(content)}
                              >
                                Edit
                              </button>
                              <button
                                className="cursor-pointer text-xs text-[var(--error)] hover:underline"
                                onClick={() => handleContentDelete(content)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* 이메일 설정 */}
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Email Settings</h2>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
                <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                  {/* 발신자 이름 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      발신자 이름
                    </label>
                    <input
                      type="text"
                      value={emailSettings.emailFromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, emailFromName: e.target.value })}
                      placeholder="Hyeon Counseling"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                    />
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">받는 사람의 메일함에 표시되는 이름입니다.</p>
                  </div>

                  {/* 발신 이메일 주소 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      발신 이메일 주소
                    </label>
                    <div className="flex items-center gap-0">
                      <input
                        type="text"
                        value={emailSettings.emailFromLocalPart}
                        onChange={(e) => setEmailSettings({ ...emailSettings, emailFromLocalPart: e.target.value })}
                        placeholder="no-reply"
                        className="w-40 rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                      />
                      <span className="flex h-[42px] items-center rounded-r-xl border border-[var(--border)] bg-[var(--surface-muted,#f5f5f5)] px-3 text-sm text-[var(--foreground-subtle)]">
                        @{emailSettings.emailDomain}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">영문, 숫자, -, _, . 만 사용 가능합니다.</p>
                  </div>

                  {/* 미리보기 */}
                  {emailSettings.emailFromName && emailSettings.emailFromLocalPart && (
                    <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
                      <p className="text-xs text-[var(--foreground-subtle)]">미리보기</p>
                      <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                        {emailSettings.emailFromName} &lt;{emailSettings.emailFromLocalPart}@{emailSettings.emailDomain}&gt;
                      </p>
                    </div>
                  )}

                  {/* 다운로드 만료일 설정 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      기본 다운로드 만료일 (일)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={emailSettings.defaultDownloadExpiryDays}
                      onChange={(e) => setEmailSettings({ ...emailSettings, defaultDownloadExpiryDays: parseInt(e.target.value, 10) || 0 })}
                      className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                    />
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">구매일로부터 N일간 다운로드 가능합니다. 0을 입력하면 만료 없이 무제한 다운로드됩니다.</p>
                  </div>

                  {emailSettingsMsg && (
                    <p className={`text-sm ${emailSettingsMsg === "저장되었습니다." ? "text-[var(--brand)]" : "text-red-600"}`}>
                      {emailSettingsMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={emailSettingsSaving}
                    className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                  >
                    {emailSettingsSaving ? "저장 중..." : "저장"}
                  </button>
                </form>
              </div>
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

            {/* Step 2: 파일 업로드 (커버 이미지 + PDF) */}
            {createdProductId && !uploadDone && (
              <div className="space-y-5">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Product created successfully! Upload a cover image and/or PDF file(s).
                  You can also skip and upload later via Edit.
                </p>

                {/* 커버 이미지 업로드 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Cover Image <span className="font-normal text-[var(--foreground-subtle)]">(optional — JPEG, PNG, WebP, max 5MB)</span></label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null, setImageFile, setImagePreviewUrl)}
                    className="w-full text-sm text-[var(--foreground-muted)]"
                  />
                  {imagePreviewUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreviewUrl} alt="Cover preview" className="h-32 w-auto rounded-xl object-cover border border-[var(--border)]" />
                    </div>
                  )}
                </div>

                {/* PDF 업로드 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">PDF Files <span className="font-normal text-[var(--foreground-subtle)]">(optional)</span></label>
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

              {/* 기존 PDF 목록 + 삭제 + 만료일 편집 */}
              {selectedProduct.pdfFiles?.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Current PDF Files
                  </label>
                  <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                    {selectedProduct.pdfFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-muted)]">
                          {file.filename}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="기본값"
                            value={file.expiryDays ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                              setSelectedProduct((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      pdfFiles: prev.pdfFiles.map((f, i) =>
                                        i === idx ? { ...f, expiryDays: isNaN(val as number) ? null : val } : f
                                      ),
                                    }
                                  : prev
                              );
                            }}
                            onBlur={async () => {
                              // expiryDays 변경을 서버에 저장
                              const pdfFile = selectedProduct.pdfFiles[idx];
                              try {
                                await apiFetch(`/api/products/${selectedProduct._id}/pdf/${idx}/expiry`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ expiryDays: pdfFile.expiryDays ?? null }),
                                });
                              } catch {
                                // 저장 실패 시 조용히 처리 (폼 제출 시 재시도)
                              }
                            }}
                            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                            title="만료일(일). 비워두면 글로벌 기본값 적용"
                          />
                          <span className="text-xs text-[var(--foreground-subtle)]">일</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(selectedProduct._id, idx, file.filename)}
                          className="shrink-0 text-xs text-[var(--error)] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">만료일 칸을 비워두면 Settings의 기본 만료일이 적용됩니다.</p>
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

              {/* 커버 이미지 업로드/변경 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Cover Image <span className="font-normal text-[var(--foreground-subtle)]">(JPEG, PNG, WebP, max 5MB)</span>
                </label>
                {/* 현재 이미지 미리보기 */}
                {selectedProduct.coverImageUrl && !editImagePreviewUrl && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs text-[var(--foreground-subtle)]">Current image:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedProduct.coverImageUrl} alt="Current cover" className="h-24 w-auto rounded-xl object-cover border border-[var(--border)]" />
                  </div>
                )}
                {/* 새 이미지 미리보기 */}
                {editImagePreviewUrl && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs text-[var(--foreground-subtle)]">New image preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImagePreviewUrl} alt="New cover preview" className="h-24 w-auto rounded-xl object-cover border border-[var(--brand)]" />
                  </div>
                )}
                <input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null, setEditImageFile, setEditImagePreviewUrl)}
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

      {/* ── 콘텐츠 등록/수정 모달 ───────────────────────────────────── */}
      {showContentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeContentModal(); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {selectedContent ? "Edit Content" : "Add New Content"}
              </h2>
            </div>

            {/* 모달 본문 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form onSubmit={handleContentSubmit} id="content-form" className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
                  <input
                    type="text"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="Article title"
                    required
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Category</label>
                  <input
                    type="text"
                    value={contentForm.category}
                    onChange={(e) => setContentForm({ ...contentForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="예: 자기이해, 관계, 감정관리"
                  />
                </div>

                {/* 요약 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    Summary
                    <span className="ml-1 font-normal text-[var(--foreground-subtle)]">(선택사항 — 없으면 본문 앞부분 자동 사용)</span>
                  </label>
                  <textarea
                    value={contentForm.summary}
                    onChange={(e) => setContentForm({ ...contentForm, summary: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="목록 미리보기 텍스트 (선택사항)"
                  />
                </div>

                {/* 본문 — 마크다운 에디터 */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Body (Markdown)
                      {selectedContent && (
                        <span className="ml-1 font-normal text-[var(--foreground-subtle)]">(수정 시 본문 전체 재입력)</span>
                      )}
                    </label>
                    {/* Edit / Preview 토글 */}
                    <div className="flex rounded-lg border border-[var(--border)] text-xs">
                      <button
                        type="button"
                        onClick={() => setContentPreview(false)}
                        className={`px-3 py-1 rounded-l-lg transition-colors ${!contentPreview ? "bg-[var(--brand)] text-white" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentPreview(true)}
                        className={`px-3 py-1 rounded-r-lg transition-colors ${contentPreview ? "bg-[var(--brand)] text-white" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"}`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Edit 모드 */}
                  {!contentPreview && (
                    <textarea
                      value={contentForm.body}
                      onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })}
                      rows={12}
                      className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 font-mono text-sm leading-6 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      placeholder="마크다운으로 작성하세요..."
                    />
                  )}

                  {/* Preview 모드 */}
                  {contentPreview && (
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] px-4 py-3">
                      {contentForm.body.trim() ? (
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
                            code: ({ children }) => (
                              <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs text-[var(--brand)]">{children}</code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="mb-3 border-l-4 border-[var(--brand)] pl-3 italic text-sm text-[var(--foreground-muted)]">{children}</blockquote>
                            ),
                          }}
                        >
                          {contentForm.body}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm text-[var(--foreground-subtle)]">본문을 입력하면 미리보기가 표시됩니다.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 발행 토글 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="content-published"
                    checked={contentForm.isPublished}
                    onChange={(e) => setContentForm({ ...contentForm, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)]"
                  />
                  <label htmlFor="content-published" className="text-sm font-medium text-[var(--foreground)]">
                    Publish immediately
                  </label>
                </div>

                {contentFormError && <p className="text-sm text-red-600">{contentFormError}</p>}
              </form>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex-shrink-0 flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button
                type="button"
                onClick={closeContentModal}
                className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="content-form"
                disabled={isContentSubmitting}
                className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
              >
                {isContentSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
