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
  /** 결제 전 신청: 결제 중(30분 안) · 결제 미완료(만료) · 결제 전 취소 */
  payState?: "paying" | "expired" | "canceled" | null;
}

export const PAY_STATE_LABEL: Record<"paying" | "expired" | "canceled", string> = { paying: "결제 중", expired: "결제 미완료(만료)", canceled: "결제 전 취소" };
