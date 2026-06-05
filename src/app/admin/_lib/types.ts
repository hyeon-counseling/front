// 어드민 공용 타입 정의 (여러 라우트 페이지에서 공유)

export interface ProductVariant {
  variantCode: string;
  optionName: string;
  additionalAmount: number;
  pdfFiles: { filename: string; r2Key: string; expiryDays?: number | null }[];
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  language: "ko" | "en" | "both";
  isActive: boolean;
  pdfFiles: { filename: string; r2Key: string; expiryDays?: number | null }[];
  coverImageUrl?: string;
  polarProductId?: string;
  cafe24ProductNo?: number;
  channel?: "polar" | "cafe24" | "both";
  kind?: "digital" | "counseling" | "test";
  variants?: ProductVariant[];
  notification?: {
    emailEnabled: boolean;
    emailTemplateId?: string | null;
    kakaoEnabled?: boolean;
    kakaoTemplateId?: string | null;
  };
}

export interface EmailTemplate {
  _id: string;
  name: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  description?: string;
  isActive: boolean;
}

export interface KakaoTemplate {
  _id: string;
  name: string;
  templateId: string;
  isActive: boolean;
}

export interface AdminOrder {
  _id: string;
  userId: { name: string; email: string } | null;
  productId: { title: string; price: number } | null;
  amount: number;
  currency: string;
  channel: "polar" | "cafe24";
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface ContentItem {
  _id: string;
  title: string;
  category: string;
  summary: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Customer {
  _id: string;
  cafe24MemberId?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  kakaoConsent: boolean;
  tags: string[];
  memo: string;
  source: "cafe24" | "polar" | "manual";
  createdAt: string;
}

export type ReservationStatus = "requested" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";

export interface Reservation {
  _id: string;
  customerId?: string | null;
  productId?: string | null;
  externalOrderId: string;
  serviceKind: "counseling" | "test";
  productName: string;
  customerName?: string | null;
  customerPhone?: string | null;
  variantCode?: string | null;
  slotLabel?: string | null;
  scheduledAt?: string | null;
  status: ReservationStatus;
  memo: string;
  createdAt: string;
}

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  requested: "접수",
  confirmed: "확정",
  in_progress: "진행중",
  completed: "완료",
  canceled: "취소",
  no_show: "노쇼",
};
