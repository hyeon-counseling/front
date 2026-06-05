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
