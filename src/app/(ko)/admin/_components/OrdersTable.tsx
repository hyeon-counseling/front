"use client";

import { AdminOrder } from "../_lib/types";

// 주문 목록 표 (프레젠테이션). 채널 필터는 호출 페이지에서 적용해 orders로 전달.
export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">주문이 없습니다.</p>
      </div>
    );
  }

  return (
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
  );
}
