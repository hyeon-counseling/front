"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// 백엔드 주문 데이터 타입
// productId는 populate되어 상품 정보가 담긴 객체로 옴
interface Order {
  _id: string;
  productId: {
    _id: string;
    title: string;
    price: number;
  } | null;
  channel: "polar" | "cafe24";
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export default function MyPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");

  // 로그인 확인 — 미로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // 주문 목록 조회 (로그인 확인 후 실행)
  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        // GET /api/orders/my — 내 주문 목록 (JWT 토큰은 apiFetch에서 자동 첨부)
        const data = await apiFetch("/api/orders/my");
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "구매 내역을 불러오지 못했습니다."
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // 로그아웃 처리 후 홈으로 이동
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // 인증 로딩 중이거나 로그인 안 된 상태 → 빈 화면 (리다이렉트 처리 중)
  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* 페이지 헤더 */}
        <div className="mb-10">
          <h1 className="mb-1 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            My Page
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            View and download your purchased e-books
          </p>
        </div>

        {/* 구매 내역 섹션 */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Purchase History
          </h2>

          {/* 로딩 중 스켈레톤 */}
          {ordersLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl bg-[var(--surface)]"
                />
              ))}
            </div>
          )}

          {/* 에러 */}
          {!ordersLoading && error && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">{error}</p>
            </div>
          )}

          {/* 구매 내역 없음 */}
          {!ordersLoading && !error && orders.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10 text-center">
              <p className="mb-4 text-[var(--foreground-muted)]">
                No purchases yet.
              </p>
              <Link
                href="/shop"
                className="inline-block rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                Browse E-Books
              </Link>
            </div>
          )}

          {/* 구매 내역 목록 */}
          {!ordersLoading && !error && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* 상품 정보 */}
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {order.productId?.title ?? "Unknown Product"}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      &middot; {order.currency} {order.amount.toFixed(2)}
                    </p>
                  </div>

                  {/* 상태 + 다운로드 버튼 */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-[var(--brand-light)] text-[var(--brand)]"
                          : order.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {order.status === "paid"
                        ? "Delivered"
                        : order.status === "pending"
                          ? "Pending"
                          : "Failed"}
                    </span>
                    {order.status === "paid" && (
                      <button
                        className="rounded-full border border-[var(--brand)] px-4 py-1.5 text-xs font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
                        onClick={() =>
                          alert(
                            "Download link sent to your email. Direct download coming soon."
                          )
                        }
                      >
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 계정 섹션 */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Account
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-sm text-[var(--foreground-muted)]">
              Signed in as{" "}
              <span className="font-medium text-[var(--foreground)]">
                {user.email}
              </span>
            </p>
            <button
              className="mt-3 text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:underline"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
