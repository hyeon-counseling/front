"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ORDER_STATUS_LABEL, won, type OrderSummary } from "@/lib/payment";
import { Badge, Skeleton } from "@/components/ui";

/** 내 강의·워크북 결제 내역 (사이트 결제) */
export function MyPaymentOrders() {
  const [list, setList] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    apiRequest<OrderSummary[]>("/api/payments/my").then((res) => setList(res.ok && res.data ? res.data : []));
  }, []);

  if (list === null) return <Skeleton className="h-20" />;
  if (list.length === 0) {
    return <p className="rounded-2xl bg-[var(--surface)] px-5 py-4 text-sm text-[var(--foreground-muted)]">강의·워크북 결제 내역이 없어요.</p>;
  }
  return (
    <ul className="space-y-3">
      {list.map((o) => (
        <li key={o.orderId} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone={o.status === "paid" ? "brand" : "neutral"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
              {o.provider === "mock" && <Badge tone="warning">테스트</Badge>}
            </div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{o.itemTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
              {new Date(o.paidAt ?? o.createdAt).toLocaleDateString("ko-KR")} · {won(o.amount)} · {o.orderId}
            </p>
            {o.refund && <p className="mt-1 text-xs text-[var(--foreground-muted)]">환불: {o.refund.reason}</p>}
          </div>
          {o.status === "paid" && (
            <Link href={o.itemPath} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
              바로가기
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
