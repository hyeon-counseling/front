"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { won } from "@/lib/payment";
import { Skeleton } from "@/components/ui";

// 관리자 — 결제 통계. 읽기 전용. 사이트 결제(토스)만 센다.

interface Row {
  count: number;
  amount: number;
  refund: number;
  net: number;
}
type Bucket = { count: number; amount: number };
interface Stats {
  unit: "day" | "month";
  total: { count: number; amount: number; refund: number; refundCount: number; net: number };
  byPeriod: (Row & { period: string })[];
  byMethod: (Row & { method: string })[];
  byItem: (Row & { item: string })[];
  excluded: { mock: Bucket; free: Bucket; tester: Bucket; testKey: Bucket; unknownKey: Bucket };
}

const EXCLUDED: { key: keyof Stats["excluded"]; label: string }[] = [
  { key: "testKey", label: "토스 테스트 키 결제" },
  { key: "unknownKey", label: "테스트 키인지 기록이 없는 옛 결제 (10월 30일 이전)" },
  { key: "mock", label: "사이트 테스트 결제" },
  { key: "tester", label: "시험 계정 신청" },
  { key: "free", label: "0원 쿠폰 결제" },
];

const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const addMonths = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
const lastDay = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};
const presets = () => {
  const today = kstToday();
  const ym = today.slice(0, 7);
  const prev = addMonths(ym, -1);
  return [
    { label: "이번 달", from: `${ym}-01`, to: today },
    { label: "지난달", from: `${prev}-01`, to: lastDay(prev) },
    { label: "최근 3개월", from: `${addMonths(ym, -2)}-01`, to: today },
    { label: "올해", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
};

function RowsTable({ head, rows }: { head: string; rows: (Row & { name: string })[] }) {
  if (!rows.length) return <p className="rounded-xl bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">이 기간에는 없어요.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)]">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-[var(--border-light)] bg-[var(--surface)] text-left text-xs text-[var(--foreground-muted)]">
            <th className="px-4 py-2.5 font-semibold">{head}</th>
            <th className="px-4 py-2.5 text-right font-semibold">건수</th>
            <th className="px-4 py-2.5 text-right font-semibold">결제액</th>
            <th className="px-4 py-2.5 text-right font-semibold">환불액</th>
            <th className="px-4 py-2.5 text-right font-semibold">실매출</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-[var(--border-light)] last:border-0">
              <td className="px-4 py-2.5 text-[var(--foreground)]">{r.name}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[var(--foreground-muted)]">{r.count.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[var(--foreground)]">{won(r.amount)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[var(--foreground-muted)]">{r.refund ? `-${won(r.refund)}` : "—"}</td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[var(--foreground)]">{r.net < 0 ? `-${won(-r.net)}` : won(r.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaymentStatsPage() {
  const [from, setFrom] = useState(() => presets()[0].from);
  const [to, setTo] = useState(() => presets()[0].to);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setStats(null);
    setError("");
    apiRequest<Stats>(`/api/admin/payments/stats?from=${from}&to=${to}`).then((r) => {
      if (r.ok && r.data) setStats(r.data);
      else setError(r.message || "불러오지 못했어요.");
    });
  }, [from, to]);
  useEffect(load, [load]);

  const excluded = stats ? EXCLUDED.filter((e) => stats.excluded[e.key].count > 0) : [];
  const dateInput = "h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none";

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-[var(--foreground)]">결제 통계</h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">사이트 결제(토스)만 세요. 카페24·영어몰은 각 쇼핑몰 화면에서 봐 주세요.</p>
          </div>
          <Link href="/admin/payments" className="text-sm font-semibold text-[var(--brand)]">
            결제·주문 목록
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {presets().map((p) => (
            <button key={p.label} type="button" onClick={() => { setFrom(p.from); setTo(p.to); }} className={`h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold ${from === p.from && to === p.to ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]"}`}>
              {p.label}
            </button>
          ))}
          <input type="date" aria-label="시작일" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={dateInput} />
          <span className="text-sm text-[var(--foreground-subtle)]">~</span>
          <input type="date" aria-label="종료일" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className={dateInput} />
        </div>

        {error && <p className="mt-6 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">{error}</p>}
        {!stats && !error && <Skeleton className="mt-6 h-64" />}

        {stats && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "결제액", value: won(stats.total.amount) },
                { label: "결제 건수", value: `${stats.total.count.toLocaleString()}건` },
                { label: "환불액", value: stats.total.refund ? `-${won(stats.total.refund)}` : won(0), sub: stats.total.refundCount ? `${stats.total.refundCount}번 환불` : undefined },
                { label: "실매출", value: stats.total.net < 0 ? `-${won(-stats.total.net)}` : won(stats.total.net), strong: true },
              ].map((c) => (
                <div key={c.label} className="card p-4">
                  <p className="text-xs font-semibold text-[var(--foreground-muted)]">{c.label}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${c.strong ? "text-[var(--brand)]" : "text-[var(--foreground)]"}`}>{c.value}</p>
                  {c.sub && <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">{c.sub}</p>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--foreground-subtle)]">결제액은 결제한 날, 환불액은 환불한 날 기준이에요. 지난달 결제를 이번 달에 환불하면 이번 달 환불액에 잡혀요. 수수료를 빼기 전 금액이라 토스 정산금과는 달라요.</p>

            <section className="mt-8">
              <h2 className="mb-3 text-base font-bold text-[var(--foreground)]">{stats.unit === "day" ? "날짜별" : "월별"}</h2>
              <RowsTable head={stats.unit === "day" ? "날짜" : "월"} rows={stats.byPeriod.map((r) => ({ ...r, name: r.period }))} />
            </section>
            <section className="mt-8">
              <h2 className="mb-3 text-base font-bold text-[var(--foreground)]">결제 수단별</h2>
              <RowsTable head="수단" rows={stats.byMethod.map((r) => ({ ...r, name: r.method }))} />
            </section>
            <section className="mt-8">
              <h2 className="mb-3 text-base font-bold text-[var(--foreground)]">상품별</h2>
              <RowsTable head="상품" rows={stats.byItem.map((r) => ({ ...r, name: r.item }))} />
            </section>

            {excluded.length > 0 && (
              <section className="mt-8 rounded-2xl bg-[var(--surface)] p-4">
                <h2 className="text-sm font-bold text-[var(--foreground)]">위 숫자에서 뺀 결제</h2>
                <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-muted)]">
                  {excluded.map((e) => (
                    <li key={e.key} className="flex justify-between gap-4">
                      <span>{e.label}</span>
                      <span className="shrink-0 tabular-nums">
                        {stats.excluded[e.key].count}건 · {won(stats.excluded[e.key].amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
