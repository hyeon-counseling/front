"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Product, AdminOrder } from "./_lib/types";

// 어드민 대시보드 — 요약 카드 + 주요 메뉴 바로가기.
// 인증 가드/사이드바는 admin/layout.tsx에서 처리.

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, o] = await Promise.all([apiFetch("/api/products?channel=all"), apiFetch("/api/orders")]);
        setProducts(p);
        setOrders(o);
      } catch {
        // 무시
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0);
  const cafe24Count = products.filter((p) => p.channel === "cafe24").length;
  const cafe24Orders = orders.filter((o) => o.channel === "cafe24").length;

  const quickLinks = [
    { label: "한국어 상품 (카페24)", href: "/admin/kr/products", desc: "동기화·옵션 PDF·주문 알림" },
    { label: "한국어 주문", href: "/admin/kr/orders", desc: "카페24 주문 내역" },
    { label: "고객 (CRM)", href: "/admin/kr/customers", desc: "주문 자동 연결·예약이력·메모" },
    { label: "예약 캘린더", href: "/admin/kr/calendar", desc: "상담·검사 예약 일정" },
    { label: "콘텐츠", href: "/admin/common/contents", desc: "칼럼·뉴스레터" },
    { label: "이메일 템플릿", href: "/admin/email-templates", desc: "주문 이메일 템플릿" },
    { label: "카카오 템플릿", href: "/admin/kakao-templates", desc: "알림톡 템플릿" },
    { label: "설정", href: "/admin/common/settings", desc: "이메일 발신 설정" },
  ];

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">대시보드</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">한눈에 보는 운영 현황</p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">전체 상품</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : products.length}</p>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">카페24 {loading ? "—" : cafe24Count}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">전체 주문</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : orders.length}</p>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">카페24 {loading ? "—" : cafe24Orders}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">결제 완료 매출</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : `$${totalRevenue.toFixed(2)}`}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">결제 대기</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : orders.filter((o) => o.status === "pending").length}</p>
        </div>
      </div>

      {/* 바로가기 */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">바로가기</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--brand)] hover:bg-[var(--surface)]"
          >
            <p className="font-medium text-[var(--foreground)]">{link.label}</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
