import SiteHeader from "@/components/ko/SiteHeader";
import SiteFooter from "@/components/ko/SiteFooter";

// 한국어 사이트(기본) 레이아웃 — 헤더·푸터·종이 질감
export default function KoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
