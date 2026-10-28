"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────
// 관리자 메뉴 (docs/ADMIN-REDESIGN-PLAN.md 3장 — 10/29 확정)
//   오늘 할 일 / 심리검사 / 상담 / 판매·결제 / 학습·콘텐츠 / 회원 / 설정
//   주소는 그대로, 메뉴 이름·위치만 옮김. 배지 = 처리가 필요한 건수(0이면 숨김).
//   휴대폰: 왼쪽 메뉴 대신 아래 탭 4개(오늘·신청·슬롯·더보기), 더보기 = 전체 메뉴.
// ─────────────────────────────────────────────────────────────────

interface Summary {
  safety: number;
  issueWaiting: number;
  reschedule: number;
  failedNotices: number;
  placeNeeded?: number;
  unmatchedMails?: number;
}

interface NavItem {
  label: string;
  href: string;
  badge?: number;
  exact?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
  folded?: boolean; // 처음엔 접힘
}

function groups(s: Summary | null): NavGroup[] {
  const todo = s ? s.safety + s.issueWaiting + s.reschedule + (s.placeNeeded ?? 0) : 0;
  return [
    { label: "", items: [{ label: "오늘 할 일", href: "/admin", badge: todo, exact: true }] },
    {
      label: "심리검사",
      items: [
        { label: "전문 검사 신청", href: "/admin/assessment/applications", badge: s ? s.safety + s.reschedule : 0 },
        { label: "공개 슬롯", href: "/admin/assessment/slots" },
        { label: "코드 발급·수집", href: "/admin/assessment/codes", badge: s ? s.issueWaiting + (s.unmatchedMails ?? 0) : 0 },
        { label: "간이 무료 검사", href: "/admin/tests" },
        { label: "간이 검사 결과", href: "/admin/test-results" },
      ],
    },
    {
      label: "상담",
      items: [
        { label: "고객(CRM)", href: "/admin/shop/kr/customers" },
        { label: "예약 캘린더", href: "/admin/shop/kr/calendar" },
      ],
    },
    {
      label: "판매·결제",
      items: [
        { label: "판매 요약", href: "/admin/sales" },
        { label: "결제·주문", href: "/admin/payments" },
        { label: "쿠폰", href: "/admin/coupons", exact: true },
        { label: "쿠폰 보내기·선물", href: "/admin/coupons/send" },
      ],
    },
    {
      label: "카페24 · 영어몰",
      folded: true,
      items: [
        { label: "카페24 상품", href: "/admin/shop/kr/products" },
        { label: "카페24 주문", href: "/admin/shop/kr/orders" },
        { label: "영어몰 상품 (Polar)", href: "/admin/shop/en/products" },
        { label: "영어몰 주문 (Polar)", href: "/admin/shop/en/orders" },
      ],
    },
    {
      label: "학습·콘텐츠",
      items: [
        { label: "강의", href: "/admin/lms/courses" },
        { label: "과정 (과목 묶음)", href: "/admin/lms/programs" },
        { label: "질문 답변", href: "/admin/questions" },
        { label: "OX 세트", href: "/admin/ox-sets" },
        { label: "아티클", href: "/admin/common/contents" },
      ],
    },
    { label: "회원", items: [{ label: "회원", href: "/admin/users" }] },
    {
      label: "설정",
      items: [
        { label: "카카오 템플릿", href: "/admin/kakao-templates", badge: s?.failedNotices ?? 0 },
        { label: "이메일 템플릿", href: "/admin/email-templates" },
        { label: "일반 설정", href: "/admin/common/settings" },
      ],
    },
  ];
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function CountBadge({ n, red }: { n?: number; red?: boolean }) {
  if (!n) return null;
  return (
    <span className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white ${red ? "bg-red-500" : "bg-[var(--brand)]"}`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

function NavList({ s, onPick }: { s: Summary | null; onPick?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <nav className="flex flex-col" aria-label="관리자 메뉴">
      {groups(s).map((g) => {
        const inside = g.items.some((i) => isActive(pathname, i));
        const shown = !g.folded || open[g.label] || inside;
        return (
          <div key={g.label || "top"}>
            {g.label &&
              (g.folded ? (
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [g.label]: !shown }))}
                  className="mt-5 mb-1 flex w-full cursor-pointer items-center justify-between px-3 text-xs font-semibold text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)]"
                  aria-expanded={shown}
                >
                  <span>{g.label}</span>
                  <span className="text-[10px]">{shown ? "▼" : "▶"}</span>
                </button>
              ) : (
                <p className="mt-5 mb-1 px-3 text-xs font-semibold text-[var(--foreground-subtle)]">{g.label}</p>
              ))}
            {shown &&
              g.items.map((i) => {
                const on = isActive(pathname, i);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      on ? "bg-[var(--brand-light)] font-semibold text-[var(--brand)]" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <span>{i.label}</span>
                    <CountBadge n={i.badge} red={i.href === "/admin/assessment/applications" && !!s?.safety} />
                  </Link>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [s, setS] = useState<Summary | null>(null);
  const [more, setMore] = useState(false);

  // 화면을 옮길 때마다 할 일 건수를 새로 (배지)
  useEffect(() => {
    apiRequest<Summary>("/api/admin/assessment/summary").then((r) => r.ok && r.data && setS(r.data));
  }, [pathname]);

  const todo = s ? s.safety + s.issueWaiting + s.reschedule + (s.placeNeeded ?? 0) : 0;
  const tabs = [
    { label: "오늘", href: "/admin", icon: "☀️", exact: true, dot: todo > 0 },
    { label: "신청", href: "/admin/assessment/applications", icon: "🧾", dot: !!s && s.safety + s.reschedule > 0 },
    { label: "슬롯", href: "/admin/assessment/slots", icon: "🗓️", dot: false },
  ];

  return (
    <>
      {/* 넓은 화면 — 왼쪽 메뉴 */}
      <aside className="hidden shrink-0 border-r border-[var(--border)] px-3 py-8 lg:block lg:w-60">
        <div className="lg:sticky lg:top-24">
          <NavList s={s} />
        </div>
      </aside>

      {/* 휴대폰 — 아래 탭 4개 */}
      <nav aria-label="관리자 빠른 메뉴" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--border-light)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {tabs.map((t) => {
          const on = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${on ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]"}`}>
              <span className="text-lg" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
              {t.dot && <span className="absolute right-[28%] top-1.5 h-2 w-2 rounded-full bg-red-500" aria-label="할 일 있음" />}
            </Link>
          );
        })}
        <button onClick={() => setMore(true)} className="flex cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-[var(--foreground-subtle)]">
          <span className="text-lg" aria-hidden="true">
            ☰
          </span>
          더보기
        </button>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setMore(false)}>
          <div role="dialog" aria-modal="true" aria-label="관리자 전체 메뉴" onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-3 pb-8 pt-4">
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="font-bold">전체 메뉴</p>
              <button onClick={() => setMore(false)} className="cursor-pointer rounded-full px-3 py-1 text-sm text-[var(--foreground-subtle)]">
                닫기
              </button>
            </div>
            <NavList s={s} onPick={() => setMore(false)} />
          </div>
        </div>
      )}
    </>
  );
}
