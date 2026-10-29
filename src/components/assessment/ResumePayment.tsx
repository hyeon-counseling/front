"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

/**
 * [결제 이어하기] — 신청서를 쓰고 결제 화면에서 나간 신청 (30분 동안 상담 시간을 잡아 둔다)
 * 마이페이지 · 심리검사 진행, 신청 페이지 위에 보인다. 30분이 지나면 서버가 만료시키고 목록에서 빠진다.
 */
interface Resumable {
  applicationNo: string;
  orderId: string;
  sessionText: string;
  methodText: string;
  holdUntil: string;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });

export function ResumePayment({ className = "" }: { className?: string }) {
  const [list, setList] = useState<Resumable[]>([]);

  useEffect(() => {
    apiRequest<Resumable[]>("/api/assessment/my/unpaid").then((r) => setList(r.ok && r.data ? r.data : []));
  }, []);

  if (!list.length) return null;
  return (
    <div className={className}>
      {list.map((x) => (
        <div key={x.applicationNo} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="min-w-0">
            <p className="font-bold text-[var(--foreground)]">결제가 아직 끝나지 않은 신청이 있어요</p>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              해석 상담 {x.sessionText} · {x.methodText} — <b>{hhmm(x.holdUntil)}까지</b> 이 시간을 잡아 둘게요. 지나면 신청이 만료되고 시간이 다시 열려요.
            </p>
          </div>
          <Link href={`/checkout/${x.orderId}`} className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
            결제 이어하기
          </Link>
        </div>
      ))}
    </div>
  );
}
