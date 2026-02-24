"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// 상품 타입
interface Product {
  _id: string;
  title: string;
  price: number;
  language: "ko" | "en" | "both";
  isActive: boolean;
}

// 주문 타입 (populate된 userId, productId 포함)
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

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  // 접근 권한 확인:
  // - 로그인 안 됨 → /login으로 이동
  // - 로그인 됐지만 관리자 아님 → 홈(/)으로 이동
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  // 관리자 데이터 조회
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const fetchData = async () => {
      try {
        // 상품 목록과 전체 주문을 동시에 조회
        const [productsData, ordersData] = await Promise.all([
          apiFetch("/api/products"),
          apiFetch("/api/orders"),
        ]);
        setProducts(productsData);
        setOrders(ordersData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "데이터를 불러오지 못했습니다."
        );
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 인증 로딩 중 또는 권한 없음 → 빈 화면 (리다이렉트 처리 중)
  if (authLoading || !user || user.role !== "admin") {
    return null;
  }

  // paid 상태 주문의 매출 합계
  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* 페이지 헤더 */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Manage products and view orders
            </p>
          </div>
          <button
            className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            onClick={() => alert("Product creation form coming soon.")}
          >
            + Add Product
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 요약 카드 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
              Total Products
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              {dataLoading ? "—" : products.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
              Total Orders
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              {dataLoading ? "—" : orders.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
              Revenue (paid)
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              {dataLoading ? "—" : `$${totalRevenue.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* 로딩 중 스켈레톤 */}
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
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Products
              </h2>
              {products.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    No products yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Title
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Price
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Lang
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Status
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                      {products.map((product) => (
                        <tr
                          key={product._id}
                          className="hover:bg-[var(--surface)]"
                        >
                          <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                            <Link
                              href={`/shop/${product._id}`}
                              className="hover:text-[var(--brand)] hover:underline"
                            >
                              {product.title}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 uppercase text-[var(--foreground-muted)]">
                            {product.language}
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">
                              {product.isActive ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              className="mr-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline"
                              onClick={() =>
                                alert("Edit functionality coming soon.")
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs text-[var(--error)] hover:underline"
                              onClick={() =>
                                alert("Delete functionality coming soon.")
                              }
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
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Recent Orders
              </h2>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    No orders yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Customer
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Product
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Amount
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Date
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Channel
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-[var(--surface)]"
                        >
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">
                            {order.userId?.email ?? "Unknown"}
                          </td>
                          <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                            {order.productId?.title ?? "Unknown"}
                          </td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">
                            {order.currency} {order.amount.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-[var(--foreground-muted)]">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                order.channel === "polar"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {order.channel === "polar" ? "Polar" : "Cafe24"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                order.status === "paid"
                                  ? "bg-[var(--brand-light)] text-[var(--brand)]"
                                  : order.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
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
    </div>
  );
}
