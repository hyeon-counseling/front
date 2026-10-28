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
}
