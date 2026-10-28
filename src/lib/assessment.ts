// 종합심리검사(전문 심리검사) — 타입·호출 도우미 (백엔드 assessmentController 응답과 같은 모양)
import { isTokenExpired } from "./authSession";

export const STAGES = ["신청·결제 완료", "접수면접지 작성", "검사 진행 중", "검사 완료", "보고서 준비", "해석 상담", "보고서·영상 전달", "후기"] as const;

export const PRODUCT_SLUG = "comprehensive";
export const PRODUCT_TITLE = "종합심리검사 TCI + MMPI-3 + SCT";

export interface ProgressView {
  applicationNo: string;
  linkKey: string;
  name: string;
  stage: number;
  stageLabel: string;
  hold: "none" | "reschedule" | "safety";
  holdLabel: string;
  closed: "canceled" | "refunded" | null;
  method: "offline" | "online";
  methodText: string;
  regions: string[];
  sessionAt: string | null;
  sessionText: string;
  testDeadline: string | null;
  testDeadlineText: string;
  intakeSubmittedAt: string | null;
  tests: { key: string; label: string; ready: boolean; done: boolean }[];
  isTester: boolean;
  paidAt: string | null;
}

export interface SlotView {
  id: string;
  startsAt: string;
  methods: ("offline" | "online")[];
  regions: string[];
  available: boolean;
}

const TOKEN_PREFIX = "assess_token:";

function tokenStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveAssessToken(key: string, token: string) {
  try {
    tokenStore()?.setItem(TOKEN_PREFIX + key, token);
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 확인된 상태
  }
}

function readAssessToken(key: string): string | null {
  try {
    return tokenStore()?.getItem(TOKEN_PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

/**
 * 진행 화면(/a/:key) 전용 호출 — 로그인하지 않은 사람도 쓰므로 apiRequest의 '로그인 만료 → 로그인 화면' 처리를 하지 않는다.
 * 사이트 로그인이 살아 있으면 함께 보내고(본인이면 확인 없이 열림), 휴대폰 확인 토큰도 함께 보낸다.
 */
export async function assessRequest<T = unknown>(key: string, path: string, options: RequestInit = {}) {
  const site = typeof window !== "undefined" ? tokenStore()?.getItem("token") ?? null : null;
  const assess = typeof window !== "undefined" ? readAssessToken(key) : null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessment/a/${encodeURIComponent(key)}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(site && !isTokenExpired(site) ? { Authorization: `Bearer ${site}` } : {}),
        ...(assess ? { "x-assess-token": assess } : {}),
        ...options.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && body.success !== false, status: res.status, data: (body.data ?? null) as T | null, message: (body.message as string) ?? "" };
  } catch {
    return { ok: false, status: 0, data: null as T | null, message: "서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }
}

/** 12월 26일(토) 오후 2시 — 브라우저 시간대와 무관하게 한국 시간으로 */
export function kstParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return {
    dateKey: d.toISOString().slice(0, 10),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    dow,
    dayText: `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${dow})`,
    timeText: `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시${m ? ` ${m}분` : ""}`,
    hhmm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    isWeekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
  };
}

/** 상담일 7일 전 날짜 (검사 마감) */
export function deadlineText(sessionIso: string): string {
  const d = new Date(new Date(sessionIso).getTime() - 7 * 86_400_000);
  return kstParts(d.toISOString()).dayText;
}
