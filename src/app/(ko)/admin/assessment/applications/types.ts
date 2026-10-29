// 관리자 신청 목록 한 줄 (adminAssessmentController row)
export interface Row {
  id: string;
  applicationNo: string;
  name: string;
  phone: string;
  methodText: string;
  sessionAt: string | null;
  sessionText: string;
  testDeadline: string | null;
  stage: number;
  stageLabel: string;
  hold: "none" | "safety" | "reschedule";
  holdLabel: string;
  closed: string | null;
  isTester: boolean;
  intakeSubmitted: boolean;
  tests: Record<string, { collected: boolean; done: boolean }>;
  paidAt: string | null;
  createdAt: string;
  cancelRequested?: boolean;
  /** 결제 전 신청: 결제 중(10분 안) · 결제 화면에서 나감 · 결제 미완료(10분 지나 자동 취소) · 관리자가 취소 */
  payState?: PayState | null;
}

export type PayState = "paying" | "left" | "expired" | "canceled";
export const PAY_STATE_LABEL: Record<PayState, string> = {
  paying: "결제 중",
  left: "결제 안 하고 나감 · 취소",
  expired: "결제 미완료 · 자동 취소",
  canceled: "결제 전 취소(관리자)",
};
