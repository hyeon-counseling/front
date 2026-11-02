// 개인 상담 — 화면 공용 타입과 이름
export type SessionStatus = "scheduled" | "done" | "no_show" | "canceled";
export type CounselingMethod = "offline" | "online";

export const SESSION_STATUS: Record<SessionStatus, string> = { scheduled: "예약됨", done: "상담 완료", no_show: "노쇼", canceled: "취소" };
export const METHOD_LABEL: Record<CounselingMethod, string> = { offline: "대면", online: "화상" };
export const REGIONS = ["홍대", "강남", "종로", "혜화", "사당"];

export interface MyPass {
  id: string;
  planKey: string;
  planName: string;
  sessions: number;
  used: number;
  remaining: number;
  scheduled: number;
  status: "active" | "refunded";
  expired: boolean;
  paidAt: string | null;
  validUntil: string | null;
  needsIntake: boolean;
  log: { id: string; startsAt: string; text: string; method: CounselingMethod; place: string; videoLink: string; status: SessionStatus; counts: boolean }[];
  refund: { amount: number; at: string } | null;
}

export interface CounselingSlot {
  id: string;
  startsAt: string;
  text: string;
  methods: CounselingMethod[];
  regions: string[];
}
