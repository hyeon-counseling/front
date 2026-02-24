"use client";

import Link from "next/link";

// 더미 상품 데이터 (실제 API 연결 전 임시 데이터)
const DUMMY_PRODUCTS = [
  {
    id: "1",
    title: "Understanding Anxiety",
    price: 12.0,
    lang: "EN",
    orders: 14,
    status: "Published",
  },
  {
    id: "2",
    title: "The Self-Compassion Workbook",
    price: 14.0,
    lang: "EN",
    orders: 9,
    status: "Published",
  },
  {
    id: "3",
    title: "Emotional Boundaries",
    price: 11.0,
    lang: "EN",
    orders: 7,
    status: "Published",
  },
];

// 더미 최근 주문 데이터
const DUMMY_ORDERS = [
  {
    id: "order_101",
    customer: "sarah.k@example.com",
    product: "Understanding Anxiety",
    amount: 12.0,
    date: "2026-02-23",
    channel: "Polar",
  },
  {
    id: "order_102",
    customer: "john.m@example.com",
    product: "Emotional Boundaries",
    amount: 11.0,
    date: "2026-02-22",
    channel: "Polar",
  },
  {
    id: "order_103",
    customer: "lee@example.co.kr",
    product: "The Self-Compassion Workbook",
    amount: 14.0,
    date: "2026-02-21",
    channel: "Cafe24",
  },
];

export default function AdminPage() {
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
            onClick={() => alert("Add product functionality coming soon.")}
          >
            + Add Product
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider">
              Total Products
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              {DUMMY_PRODUCTS.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider">
              Total Orders
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              {DUMMY_ORDERS.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider">
              Revenue (dummy)
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              $
              {DUMMY_ORDERS.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* 상품 목록 */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Products
          </h2>
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
                    Orders
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
                {DUMMY_PRODUCTS.map((product) => (
                  <tr key={product.id} className="hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                      <Link
                        href={`/shop/${product.id}`}
                        className="hover:text-[var(--brand)] hover:underline"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      {product.lang}
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      {product.orders}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]">
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        className="mr-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--brand)] hover:underline"
                        onClick={() => alert("Edit functionality coming soon.")}
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
        </section>

        {/* 최근 주문 목록 */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Recent Orders
          </h2>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                {DUMMY_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      {order.customer}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                      {order.product}
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      ${order.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">
                      {order.date}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.channel === "Polar"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {order.channel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
