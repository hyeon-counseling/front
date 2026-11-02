"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui";

// 개인 상담 신청 — 고른 옵션으로 주문을 만들고(금액은 서버가 계산) 결제 화면으로 보낸다
function Apply() {
  const router = useRouter();
  const plan = useSearchParams().get("plan") ?? "";
  const { user, loading } = useAuth();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/counseling/individual/apply?plan=${plan}`)}`);
      return;
    }
    if (started.current) return;
    started.current = true;
    apiRequest<{ orderId: string }>("/api/counseling/orders", { method: "POST", body: JSON.stringify({ plan }) }).then((r) => {
      if (r.ok && r.data) router.replace(`/checkout/${r.data.orderId}`);
      else setError(r.message || "신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    });
  }, [loading, user, plan, router]);

  if (!error) return <Skeleton className="mx-auto my-14 h-48 max-w-lg" />;
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <p className="text-[var(--foreground)]">{error}</p>
      <Link href="/counseling/individual" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
        옵션 다시 고르기
      </Link>
    </div>
  );
}

export default function CounselingApplyPage() {
  return (
    <Suspense fallback={null}>
      <Apply />
    </Suspense>
  );
}
