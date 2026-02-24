/**
 * API 클라이언트 유틸리티
 *
 * 모든 백엔드 API 호출을 이 함수를 통해 처리합니다.
 * - NEXT_PUBLIC_API_URL 환경변수로 백엔드 주소를 관리
 * - localStorage에서 JWT 토큰을 읽어 Authorization 헤더에 자동으로 첨부
 * - 응답이 { success: false }이면 에러를 throw하여 호출부에서 처리
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  // localStorage는 브라우저에서만 사용 가능 — 서버사이드 렌더링 시 건너뜀
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // 토큰이 있으면 Authorization 헤더 추가 (없으면 헤더 생략)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // 호출부에서 추가로 넘긴 헤더는 위 기본값을 덮어씌울 수 있음
      ...options.headers,
    },
  });

  const data = await res.json();

  // 백엔드 응답이 { success: false, message: "..." } 형태이면 에러 throw
  if (!data.success) {
    throw new Error(data.message || '요청에 실패했습니다.');
  }

  // 성공 시 data.data 반환 (백엔드 응답 형식: { success: true, data: ... })
  return data.data;
}
