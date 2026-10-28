"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Product, AdminOrder } from "../_lib/types";

// 판매 요약 — 예전 대시보드 숫자 카드 (첫 화면은 「오늘 할 일」로 바뀜, 10/29)
// 금액은 원(₩)으로. 영어몰(Polar, 달러) 주문은 따로 작게 보여 준다.

export default function AdminSalesSummary() {
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

  const paid = orders.filter((o) => o.status === "paid");
  const isUsd = (o: AdminOrder) => o.currency === "USD" || o.channel === "polar";
  const totalKrw = paid.filter((o) => !isUsd(o)).reduce((sum, o) => sum + o.amount, 0);
  const totalUsd = paid.filter(isUsd).reduce((sum, o) => sum + o.amount, 0);
  const cafe24Count = products.filter((p) => p.channel === "cafe24").length;
  const cafe24Orders = orders.filter((o) => o.channel === "cafe24").length;

  const quickLinks = [
    { label: "회원", href: "/admin/users", desc: "사이트 계정 · 역할(회원/상담사/관리자)" },
    { label: "콘텐츠(아티클)", href: "/admin/common/contents", desc: "한국어·영어 아티클" },
    { label: "카페24 상품", href: "/admin/shop/kr/products", desc: "동기화·옵션 PDF·주문 알림" },
    { label: "카페24 주문", href: "/admin/shop/kr/orders", desc: "카페24 주문 내역" },
    { label: "고객 (CRM)", href: "/admin/shop/kr/customers", desc: "주문 자동 연결·예약이력·메모" },
    { label: "예약 캘린더", href: "/admin/shop/kr/calendar", desc: "상담·검사 예약 일정" },
    { label: "이메일 템플릿", href: "/admin/email-templates", desc: "주문 이메일 템플릿" },
    { label: "카카오 템플릿", href: "/admin/kakao-templates", desc: "알림톡 템플릿" },
    { label: "설정", href: "/admin/common/settings", desc: "이메일 발신 설정" },
  ];

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">판매 요약</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">상품·주문·매출 숫자 (카페24·영어몰 주문 기준)</p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전체 상품</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : products.length}</p>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">카페24 {loading ? "—" : cafe24Count}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전체 주문</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : orders.length}</p>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">카페24 {loading ? "—" : cafe24Orders}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">결제 완료 매출</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{loading ? "—" : `₩${totalKrw.toLocaleString("ko-KR")}`}</p>
          {!loading && totalUsd > 0 && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">영어몰 ${totalUsd.toFixed(2)} 별도</p>}
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">결제 대기</p>
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
            className="card p-5 transition-colors hover:border-[var(--brand)] hover:bg-[var(--surface)]"
          >
            <p className="font-medium text-[var(--foreground)]">{link.label}</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
