import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 검색엔진 안내 — 개인 화면(관리자·마이페이지·검사 진행·결제·선물)은 수집하지 않게
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/my", "/a/", "/checkout", "/gift/", "/learn/", "/auth/", "/reset-password"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
