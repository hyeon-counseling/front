/**
 * 로그인 기한(토큰 만료) 처리
 *
 * 로그인 토큰(JWT)은 7일이 지나면 서버가 받지 않는다(401).
 * 그때 화면에 "유효하지 않은 토큰입니다."만 남지 않도록, 저장된 로그인을 지우고
 * 로그인 화면으로 보낸 뒤 로그인하면 원래 보던 페이지로 돌아오게 한다.
 * - 403(권한 없음·잠금)은 여기서 다루지 않는다 — 401만.
 */

export const EXPIRED_MESSAGE = '로그인 시간이 지나 다시 로그인해 주세요.';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

// 로그인·가입·비밀번호 찾기처럼 "로그인하려고 부르는" API — 401(비밀번호 틀림 등)이어도 로그인 화면으로 보내지 않는다
const AUTH_ENTRY_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
  '/api/auth/verify-email',
];

export function isAuthEntryPath(path: string): boolean {
  return AUTH_ENTRY_PATHS.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`));
}

// 토큰 안의 만료 시각(exp)만 읽는다 — 서명은 서버가 확인하므로 여기선 읽기만
export function tokenExpiresAt(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const exp = tokenExpiresAt(token);
  return exp !== null && exp <= now;
}

// 로그인 뒤 돌아갈 주소 — 같은 사이트 안의 경로만 (//다른사이트, /\다른사이트 로 빠져나가지 않게)
export function safeNext(next: string | null | undefined, fallback = '/my'): string {
  const v = String(next ?? '');
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return fallback;
  if (v.startsWith('/login')) return fallback; // 로그인 화면으로 다시 돌아가는 고리 방지
  return v;
}

// 로그인이 있어야 보이는 화면 — 페이지를 열 때 토큰이 이미 지났으면 바로 로그인으로
const PROTECTED_PREFIXES = ['/admin', '/my', '/onboarding', '/checkout', '/tests/result'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function loginUrl(next: string): string {
  return `/login?expired=1&next=${encodeURIComponent(safeNext(next))}`;
}

let redirecting = false;

// 저장된 로그인을 지우고(화면의 로그인 상태도 함께) 로그인 화면으로 보낸다
export function expireSession(opts: { redirect?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // 저장소를 못 쓰는 브라우저 — 무시
  }
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  if (opts.redirect === false || redirecting) return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login')) return;
  redirecting = true;
  window.location.assign(loginUrl(pathname + search));
}

// 응답이 401 이고, 로그인한 채로 보낸 요청이며, 로그인용 API 가 아니면 → 기한 지남으로 처리
export function shouldExpire(status: number, hadToken: boolean, path: string): boolean {
  return status === 401 && hadToken && !isAuthEntryPath(path);
}
