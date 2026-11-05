// 테스터 프로그램 — 초대 링크(/tester/:key) 화면용. 로그인 없이 휴대폰 뒤 4자리로 연다.
import { isTokenExpired } from "@/lib/authSession";

const TOKEN_PREFIX = "tester_token:";
const PENDING = "pending_tester";
const KEEP_MS = 7 * 86_400_000;
const KEY_RE = /^[A-Za-z0-9_-]{22}$/;

export interface TesterView {
  name: string;
  acquaintance: boolean;
  version: string;
  consent: { version: string; at: string; items: Record<string, string> } | null;
  optional: { review: { agreedAt: string | null; withdrawnAt: string | null }; case: { agreedAt: string | null; withdrawnAt: string | null } };
  avoid: { topics: string[]; other: string };
  declinedAt: string | null;
  withdrawnAt: string | null;
  coupon: { name: string; until: string | null; untilText: string } | null;
  claimed: boolean;
  applied: boolean;
  linkKey: string | null;
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveTesterToken(key: string, token: string) {
  try {
    store()?.setItem(TOKEN_PREFIX + key, token);
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 확인된 상태
  }
}

/** 초대 링크 전용 호출 — apiRequest의 '로그인 만료 → 로그인 화면' 처리를 타지 않는다 */
export async function testerRequest<T = unknown>(key: string, path: string, options: RequestInit = {}) {
  const s = typeof window !== "undefined" ? store() : null;
  const site = s?.getItem("token") ?? null;
  const token = s?.getItem(TOKEN_PREFIX + key) ?? null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tester/${encodeURIComponent(key)}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(site && !isTokenExpired(site) ? { Authorization: `Bearer ${site}` } : {}),
        ...(token ? { "x-tester-token": token } : {}),
        ...options.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && body.success !== false, status: res.status, data: (body.data ?? null) as T | null, message: (body.message as string) ?? "" };
  } catch {
    return { ok: false, status: 0, data: null as T | null, message: "서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }
}

// ── 가입·인증·로그인을 거쳐 돌아올 곳 ─────────────────────
export const testerApplyPath = (key: string) => `/tester/${key}/apply`;

/** 인증 메일·로그인 뒤 돌아올 주소로 받아도 되는지 — 테스터 신청 주소 형식만 */
export function isTesterApplyPath(v: string | null | undefined): v is string {
  return !!v && /^\/tester\/[A-Za-z0-9_-]{22}\/apply$/.test(v);
}

export function rememberTester(key: string) {
  try {
    store()?.setItem(PENDING, JSON.stringify({ k: key, at: Date.now() }));
  } catch {
    // 저장소를 못 쓰면 알림톡 버튼을 다시 누르면 된다
  }
}

export function pendingTesterPath(): string | null {
  try {
    const raw = store()?.getItem(PENDING);
    if (!raw) return null;
    const v = JSON.parse(raw) as { k?: string; at?: number };
    if (!v.k || !KEY_RE.test(v.k) || !v.at || Date.now() - v.at > KEEP_MS) return null;
    return testerApplyPath(v.k);
  } catch {
    return null;
  }
}

export function clearPendingTester() {
  try {
    store()?.removeItem(PENDING);
  } catch {
    // 무시
  }
}
