// 사이트 결제 타입·헬퍼 — 백엔드 paymentController 응답과 같은 모양
import { apiRequest } from "./api";

export type ItemType = "course" | "workbook" | "program";

/** 상품 종류 이름 — 결제·주문·쿠폰 화면 공통 */
export const ITEM_TYPE_LABEL: Record<ItemType, string> = { course: "강의", workbook: "워크북", program: "과정" };

export interface OrderSummary {
  orderId: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: "mock" | "toss";
  itemType: ItemType;
  itemTitle: string;
  itemSlug: string;
  itemPath: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  coupon?: { code: string } | null;
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
  coupon: "쿠폰(0원)",
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

// ── 쿠폰 ──
export interface CouponView {
  id: string;
  code: string;
  name: string;
  discountType: "percent" | "amount";
  discountValue: number;
  maxDiscount: number | null;
  minAmount: number;
  itemTypes: ItemType[];
  validUntil: string | null;
  personal: boolean;
}

export interface OrderCoupon extends CouponView {
  usable: boolean;
  discount: number;
  reason: string | null;
}

export interface MyCoupon extends CouponView {
  state: "available" | "used" | "expired" | "disabled";
}

/** "10% 할인 (최대 5,000원)" · "5,000원 할인" */
export function couponBenefit(c: Pick<CouponView, "discountType" | "discountValue" | "maxDiscount">): string {
  if (c.discountType === "amount") return `${won(c.discountValue)} 할인`;
  return `${c.discountValue}% 할인${c.maxDiscount ? ` (최대 ${won(c.maxDiscount)})` : ""}`;
}

/** 쿠폰 조건 한 줄 — 대상·최소 금액·기한 */
export function couponConditions(c: Pick<CouponView, "itemTypes" | "minAmount" | "validUntil">): string {
  const parts: string[] = [];
  if (c.itemTypes.length && c.itemTypes.length < 3) parts.push(`${c.itemTypes.map((t) => ITEM_TYPE_LABEL[t]).join("·")} 전용`);
  if (c.minAmount) parts.push(`${won(c.minAmount)} 이상`);
  if (c.validUntil) parts.push(`${new Date(c.validUntil).toLocaleDateString("ko-KR")}까지`);
  return parts.join(" · ");
}
