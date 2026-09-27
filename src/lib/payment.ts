// 사이트 결제 타입·헬퍼 — 백엔드 paymentController 응답과 같은 모양
import { apiRequest } from "./api";

export type ItemType = "course" | "workbook";

export interface OrderSummary {
  orderId: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: "mock" | "toss";
  itemType: ItemType;
  itemTitle: string;
  itemSlug: string;
  itemPath: string;
  amount: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  failure: { code: string; message: string } | null;
  refund: { amount: number; reason: string; at: string } | null;
}

export interface CheckoutOrder extends OrderSummary {
  checkout: { mode: "mock"; methods: string[] } | { mode: "toss"; clientKey: string; customerKey: string; orderName: string };
}

export const METHOD_LABEL: Record<string, string> = {
  card: "신용·체크카드",
  transfer: "계좌이체",
  easy: "간편결제",
  simulator: "관리자 시뮬레이터",
};

export const ORDER_STATUS_LABEL: Record<OrderSummary["status"], string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  refunded: "환불 완료",
};

/**
 * 구매 시작 — 주문을 만들고 결제 페이지 주소를 돌려준다.
 * 이미 이용 중이면 { owned: 이동할 경로 }.
 */
export async function startPurchase(itemType: ItemType, slug: string): Promise<{ checkoutUrl?: string; owned?: string; error?: string }> {
  const res = await apiRequest<CheckoutOrder & { alreadyOwned?: boolean }>("/api/payments/orders", {
    method: "POST",
    body: JSON.stringify({ itemType, slug }),
  });
  if (res.ok && res.data) return { checkoutUrl: `/checkout/${res.data.orderId}` };
  if (res.status === 409 && res.data?.itemPath) return { owned: res.data.itemPath };
  return { error: res.message || "주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
}

export function won(n: number | null | undefined): string {
  return typeof n === "number" ? `${n.toLocaleString("ko-KR")}원` : "";
}
