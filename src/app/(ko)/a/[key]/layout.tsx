"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest } from "@/lib/assessment";
import { Skeleton } from "@/components/ui";

// 진행 화면(/a/:key) 공통 — 탈퇴·삭제한 회원의 신청이면 어떤 하위 화면도 열지 않는다.
// 서버가 모든 API에서 410으로 막고, 화면은 그 안내만 보여 준다. 이름·신청 내용은 받지도 보여 주지도 않는다.
export default function AssessmentLinkLayout({ children }: { children: React.ReactNode }) {
  const { key } = useParams<{ key: string }>();
  const [closed, setClosed] = useState<boolean | null>(null);

  useEffect(() => {
    assessRequest(key, "").then((r) => setClosed(r.status === 410));
  }, [key]);

  if (closed === null) return <Skeleton className="mx-auto my-14 h-48 max-w-lg" />;
  if (!closed) return <>{children}</>;

  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-[var(--foreground)]">더 이상 열 수 없는 화면이에요</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">탈퇴한 계정의 신청이라 진행 화면을 열 수 없어요. 궁금한 점은 문의해 주세요.</p>
      <Link href="/contact" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
        문의하기
      </Link>
    </div>
  );
}
