import type { Metadata } from "next";

// 테스터 초대 화면 — 메뉴·사이트맵에 없고 검색에 나오지 않는다
export const metadata: Metadata = {
  title: "종합심리검사 테스트 안내",
  robots: { index: false, follow: false },
};

export default function TesterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
