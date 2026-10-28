"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Skeleton, cx } from "@/components/ui";
import { MaskedName } from "./_components/MaskedName";

/**
 * 관리자 첫 화면 「오늘 할 일」 (docs/ADMIN-REDESIGN-PLAN.md ①, 10/29 확정)
 * 처리가 필요한 것만 카드로 — 누르면 그 목록으로. 예전 숫자 카드는 「판매 요약」(/admin/sales).
 */
interface Summary {
  safety: number;
  intakeWaiting: number;
  issueWaiting: number;
  testing: number;
  reschedule: number;
  failedNotices: number;
  placeNeeded: number;
  unmatchedMails: number;
  doneToday: number;
  sessions: { id: string; applicationNo: string; name: string; sessionText: string; methodText: string; ready: boolean }[];
}

export default function AdminToday() {
  const [s, setS] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Summary>("/api/admin/assessment/summary").then((r) => (r.ok && r.data ? setS(r.data) : setError(r.message || "불러오지 못했어요.")));
  }, []);

  const today = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" });
  const cards = s
    ? [
        { n: s.safety, label: "안전 확인", hint: "24시간 안 직접 연락", href: "/admin/assessment/applications?f=safety", urgent: true },
        { n: s.reschedule, label: "일정 재조정", hint: "고객이 새 일정을 고르는 중", href: "/admin/assessment/applications?f=reschedule" },
        { n: s.placeNeeded, label: "장소 입력 필요", hint: "5일 안 대면 상담", href: "/admin/assessment/applications?f=place" },
        { n: s.issueWaiting, label: "코드 발급 대기", hint: "밤 9시 '검사 업무 5분'", href: "/admin/assessment/codes" },
        { n: s.unmatchedMails, label: "메일 직접 연결", hint: "이름이 안 맞은 검사 메일", href: "/admin/assessment/codes" },
        { n: s.doneToday, label: "검사 완료 확인됨", hint: "내일 아침 완료 안내", href: "/admin/assessment/applications?f=s3" },
        { n: s.failedNotices, label: "알림 실패", hint: "최근 7일", href: "/admin/assessment/applications" },
      ]
    : [];
  const open = cards.filter((c) => c.n > 0);

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-sm text-[var(--foreground-subtle)]">{today}</p>
      <h1 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">오늘 할 일</h1>

      {error && <p className="mt-6 text-sm text-[var(--error)]">{error}</p>}
      {!s && !error ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : s ? (
        <>
          {open.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[var(--brand-light)] p-6 text-[var(--foreground)]">
              <p className="text-lg font-bold">지금 처리할 일이 없어요 🌿</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">새 신청·안전 확인·발급 대기가 생기면 여기와 디스코드에 알려 드려요.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className={cx(
                    "group rounded-2xl border p-5 transition hover:shadow-md",
                    c.urgent ? "border-red-200 bg-red-50 text-red-800" : "border-[var(--border-light)] bg-white text-[var(--foreground)]"
                  )}
                >
                  <p className="text-sm font-semibold opacity-80">{c.label}</p>
                  <p className="mt-1 text-3xl font-extrabold">{c.n}</p>
                  <p className="mt-1 flex items-center justify-between text-xs opacity-70">
                    {c.hint} <span className="font-semibold group-hover:underline">열기 →</span>
                  </p>
                </Link>
              ))}
            </div>
          )}

          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[var(--foreground)]">오늘·내일 해석 상담</h2>
              <Link href="/admin/assessment/slots" className="text-sm text-[var(--brand)]">
                공개 슬롯 →
              </Link>
            </div>
            {s.sessions.length === 0 ? (
              <p className="rounded-2xl bg-[var(--surface)] p-5 text-sm text-[var(--foreground-muted)]">오늘·내일 잡힌 해석 상담이 없어요.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-light)] rounded-2xl border border-[var(--border-light)] bg-white">
                {s.sessions.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="flex items-center gap-3">
                      <b>{x.sessionText}</b>
                      <MaskedName name={x.name} />
                      <span className="text-[var(--foreground-subtle)]">{x.methodText}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      {!x.ready && <span className="text-xs font-semibold text-[var(--warning)]">장소·화상 링크 없음</span>}
                      <Link href={`/admin/assessment/applications?id=${x.id}`} className="font-semibold text-[var(--brand)]">
                        상세
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/admin/assessment/applications", label: "전문 검사 신청", desc: `검사 진행 중 ${s.testing}명 · 접수면접지 미제출 ${s.intakeWaiting}명` },
              { href: "/admin/coupons/send", label: "쿠폰 보내기·선물", desc: "무료 테스터·회원에게 쿠폰" },
              { href: "/admin/sales", label: "판매 요약", desc: "상품·주문·매출 숫자" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="card p-5 transition-colors hover:border-[var(--brand)]">
                <p className="font-semibold text-[var(--foreground)]">{l.label}</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">{l.desc}</p>
              </Link>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
