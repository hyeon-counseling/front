"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ORDER_STATUS_LABEL, won, type OrderSummary } from "@/lib/payment";
import { Badge, Skeleton, cx } from "@/components/ui";

/** 환불·취소 상태 배지 — 환불 완료 / 부분 환불 / 취소(환불 없음) / 취소 요청됨 */
function refundTag(o: OrderSummary): { label: string; tone: "brand" | "neutral" | "warning" | "error" } {
  if (o.status === "refunded" && o.refund) return o.refund.amount < o.amount ? { label: "부분 환불", tone: "neutral" } : { label: "환불 완료", tone: "neutral" };
  if (o.refund && o.refund.amount === 0) return { label: "취소 완료 (환불 없음)", tone: "neutral" };
  if (o.cancelRequested) return { label: "취소 요청됨", tone: "warning" };
  return { label: ORDER_STATUS_LABEL[o.status], tone: o.status === "paid" ? "brand" : "neutral" };
}

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
      {list.map((o) => {
        const tag = refundTag(o);
        const ended = o.status === "refunded" || !!o.refund;
        return (
        <li key={o.orderId} className={cx("card flex flex-wrap items-center justify-between gap-3 p-5", ended && "bg-[var(--surface)]")}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone={tag.tone}>{tag.label}</Badge>
              {o.provider === "mock" && <Badge tone="warning">테스트</Badge>}
            </div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{o.itemTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
              {new Date(o.paidAt ?? o.createdAt).toLocaleDateString("ko-KR")} · {won(o.amount)} · {o.orderId}
            </p>
            {o.refund && (
              <p className="mt-1 text-xs font-semibold text-[var(--foreground-muted)]">
                {o.refund.amount > 0 ? `환불 ${won(o.refund.amount)}` : "환불 없음"} · {new Date(o.refund.at).toLocaleDateString("ko-KR")}
                {o.refund.reason && <span className="font-normal"> · {o.refund.reason}</span>}
              </p>
            )}
          </div>
          {o.status === "paid" && !o.refund && (
            <Link href={o.itemPath} className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
              바로가기
            </Link>
          )}
        </li>
        );
      })}
    </ul>
  );
}
