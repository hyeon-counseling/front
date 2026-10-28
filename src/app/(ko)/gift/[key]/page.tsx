"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { clearPendingGift, rememberGift, type GiftView } from "@/lib/gift";
import { Skeleton } from "@/components/ui";

/**
 * 쿠폰 선물 받기 (/gift/:key) — 문자·알림톡 링크로 들어온다.
 * 로그인 전: 선물 소개 + [로그인] [회원가입] (이 기기에 선물을 기억 → 끝나면 여기로 돌아옴)
 * 로그인 후: 자동으로 받기 → "쿠폰 선물이 도착했어요" → [쿠폰 사용하러 가기] (대상 상품 페이지)
 */
export default function GiftPage() {
  const { key } = useParams<{ key: string }>();
  const { user, loading } = useAuth();
  const [gift, setGift] = useState<GiftView | null>(null);
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState<{ targetPath: string; couponName: string } | null>(null);
  const tried = useRef(false);

  useEffect(() => {
    rememberGift(key);
    apiRequest<GiftView>(`/api/gifts/${encodeURIComponent(key)}`).then((r) => {
      if (r.ok && r.data) setGift(r.data);
      else setError(r.message || "선물을 찾을 수 없어요.");
    });
  }, [key]);

  // 로그인돼 있으면 바로 받기 (한 번만)
  useEffect(() => {
    if (loading || !user || !gift || tried.current) return;
    if (gift.state !== "sent" && !(gift.state === "claimed" && gift.mine)) return;
    tried.current = true;
    apiRequest<{ targetPath: string; couponName: string }>(`/api/gifts/${encodeURIComponent(key)}/claim`, { method: "POST" }).then((r) => {
      if (r.ok && r.data) {
        clearPendingGift();
        setClaimed(r.data);
      } else setError(r.message || "선물을 받지 못했어요. 잠시 뒤 다시 열어 주세요.");
    });
  }, [loading, user, gift, key]);

  const next = encodeURIComponent(`/gift/${key}`);
  const shell = (children: React.ReactNode) => (
    <div className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );

  if (error && !claimed) {
    return shell(
      <div className="card p-8 text-center">
        <p className="text-3xl" aria-hidden="true">🎁</p>
        <p className="mt-3 font-bold text-[var(--foreground)]">{error}</p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">궁금한 점은 카카오톡 채널 「심리상담실 현」으로 물어봐 주세요.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-5 text-sm font-semibold">
          홈으로
        </Link>
      </div>
    );
  }
  if (!gift) return shell(<Skeleton className="h-72" />);

  if (claimed) {
    return shell(
      <div className="card overflow-hidden text-center">
        <div className="bg-[var(--brand)] px-8 py-10 text-white">
          <p className="text-4xl" aria-hidden="true">🎁</p>
          <h1 className="mt-3 text-2xl font-bold">쿠폰 선물이 도착했어요</h1>
          <p className="mt-2 text-sm opacity-90">쿠폰함에 넣어 두었어요.</p>
        </div>
        <div className="p-8">
          <p className="text-lg font-bold text-[var(--foreground)]">{claimed.couponName}</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {gift.itemTitle} · {gift.benefit}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{new Date(gift.expiresAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}까지 쓸 수 있어요</p>
          <Link href={claimed.targetPath} className="mt-6 flex h-13 items-center justify-center rounded-xl bg-[var(--brand)] py-3.5 text-base font-bold text-white hover:bg-[var(--brand-hover)]">
            쿠폰 사용하러 가기
          </Link>
          <Link href="/my/coupons" className="mt-3 inline-block text-sm text-[var(--foreground-subtle)] underline underline-offset-2">
            쿠폰함 보기
          </Link>
        </div>
      </div>
    );
  }

  const closed = gift.state === "expired" || gift.state === "canceled" || (gift.state === "claimed" && !gift.mine);
  return shell(
    <div className="card overflow-hidden text-center">
      <div className="bg-[var(--brand-light)] px-8 py-10">
        <p className="text-4xl" aria-hidden="true">🎁</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)]">쿠폰 선물이 왔어요</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">김태현 심리상담가가 보내 드린 쿠폰이에요.</p>
      </div>
      <div className="p-8">
        <p className="text-lg font-bold text-[var(--foreground)]">{gift.couponName}</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          {gift.itemTitle} · <b className="text-[var(--brand)]">{gift.benefit}</b>
        </p>
        {closed ? (
          <p className="mt-6 rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">
            {gift.state === "expired" ? "받을 수 있는 기간이 지났어요." : gift.state === "canceled" ? "취소된 선물이에요." : "이미 다른 계정에서 받은 선물이에요."}
          </p>
        ) : loading || user ? (
          <p className="mt-6 text-sm text-[var(--foreground-muted)]">쿠폰함에 넣는 중…</p>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
              로그인하면 쿠폰함에 바로 들어가요. 처음이면 회원가입을 해 주세요.
              <br />
              {new Date(gift.expiresAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}까지 받을 수 있어요.
            </p>
            <div className="mt-6 grid gap-2">
              <Link href={`/login?next=${next}`} className="flex h-12 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white">
                로그인하고 받기
              </Link>
              <Link href={`/register?next=${next}`} className="flex h-12 items-center justify-center rounded-xl border border-[var(--border)] font-semibold">
                처음이에요 · 회원가입
              </Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">가입 뒤 인증 메일을 다른 브라우저에서 열었다면, 로그인한 다음 이 문자 링크를 한 번 더 눌러 주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}
