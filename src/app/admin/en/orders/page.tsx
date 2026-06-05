"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import OrdersTable from "../../_components/OrdersTable";
import { AdminOrder } from "../../_lib/types";

// 영어 쇼핑몰(Polar) 주문 목록 — 당분간 비활성 채널
export default function EnOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/orders");
        setOrders(data);
      } catch {
        // 무시
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = orders.filter((o) => o.channel === "polar");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-[var(--foreground)]">주문 · 영어 쇼핑몰 (Polar)</h1>
      {loading ? <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" /> : <OrdersTable orders={filtered} />}
    </div>
  );
}
