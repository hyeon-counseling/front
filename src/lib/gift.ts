// 쿠폰 선물 — 받으러 온 선물을 이 기기에 잠깐 기억해 두고, 가입·인증·로그인 뒤 그 선물로 돌려보낸다
const KEY = "pending_gift";
const KEEP_MS = 7 * 86_400_000;

export interface GiftView {
  state: "sent" | "claimed" | "expired" | "canceled";
  itemTitle: string;
  couponName: string;
  benefit: string;
  expiresAt: string;
  targetPath: string;
  mine: boolean;
}

export function rememberGift(giftKey: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ k: giftKey, at: Date.now() }));
  } catch {
    // 저장소를 못 쓰면 문자 링크를 다시 누르면 된다
  }
}

/** 기억해 둔 선물 주소 (없거나 오래됐으면 null) */
export function pendingGiftPath(): string | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { k?: string; at?: number };
    if (!v.k || !/^[A-Za-z0-9_-]{22}$/.test(v.k) || !v.at || Date.now() - v.at > KEEP_MS) return null;
    return `/gift/${v.k}`;
  } catch {
    return null;
  }
}

export function clearPendingGift() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

/** 로그인 화면 주소 — 받을 선물이 있으면 끝난 뒤 그 선물로 */
export function loginHrefWithGift(): string {
  const p = typeof window !== "undefined" ? pendingGiftPath() : null;
  return p ? `/login?next=${encodeURIComponent(p)}` : "/login";
}
