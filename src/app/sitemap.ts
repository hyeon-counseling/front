import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 사이트맵 — 로그인 없이 보이는 고정 페이지 (강의·아티클 개별 주소는 나중에 DB 에서 더한다)
const PAGES = [
  "/",
  "/courses",
  "/assessment",
  "/assessment/comprehensive",
  "/guide/apply",
  "/guide/apply/faq",
  "/guide/tests",
  "/guide/tests/method",
  "/guide/tests/faq",
  "/counseling",
  "/articles",
  "/tests",
  "/about",
  "/faq",
  "/contact",
  "/terms",
  "/privacy",
  "/refund",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.6 }));
}
