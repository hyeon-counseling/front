"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * 휴대폰 하단 고정 신청 바 — 첫 화면의 가격·신청 버튼(targetId)이 화면에서 사라졌을 때만 올라온다(겹치지 않게).
 * 넓은 화면(md 이상)에서는 숨긴다.
 */
export function StickyApplyBar({ targetId, href, price, sub }: { targetId: string; href: string; price: string; sub: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    // 바에 푸터 끝이 가려지지 않게 휴대폰에서만 body 아래 여백 (globals.css .as-has-bar)
    document.body.classList.add("as-has-bar");
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      document.body.classList.remove("as-has-bar");
    };
  }, [targetId]);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 shadow-[0_-6px_24px_rgba(31,59,51,0.10)] backdrop-blur-md transition-transform duration-250 md:hidden ${
        show ? "translate-y-0" : "translate-y-[110%]"
      }`}
    >
      <p className="leading-tight">
        <b className="block text-[19px] font-extrabold">{price}</b>
        <small className="text-[12.5px] text-[var(--foreground-muted)]">{sub}</small>
      </p>
      <Link href={href} tabIndex={show ? 0 : -1} className="as-btn ml-auto min-h-[52px]! px-[26px]!">
        신청하기
      </Link>
    </div>
  );
}
