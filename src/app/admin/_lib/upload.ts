// 파일 업로드 헬퍼 (FormData)
//
// apiFetch는 Content-Type: application/json을 강제하므로 파일 업로드에는 쓸 수 없다.
// 따라서 raw fetch + 수동 Bearer 토큰 + data.success 체크 패턴을 한곳으로 모은다.
// (PDF/이미지/옵션 PDF 업로드 등 여러 핸들러가 공용으로 사용)
//
// 주의: Content-Type 헤더를 설정하지 않는다(브라우저가 multipart 경계 자동 지정).

export async function uploadFile(path: string, field: string, file: File): Promise<unknown> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append(field, file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "업로드에 실패했습니다.");
  return data.data;
}
