"use client";

import { createContext, useContext, useState } from "react";
import { Icon } from "@/components/assessment/Icon";
import { StickyApplyBar } from "@/components/assessment/StickyApplyBar";
import { MULTI_NOTE, PLANS, shopUrl, type PlanKey } from "./CounselingRules";

/**
 * 개인 상담 상세 — 옵션(회기) 고르기. 첫 화면·가격 박스·휴대폰 하단 바가 같은 선택을 함께 쓴다.
 * 신청은 카페24로 보낸다 (옵션별 상품 주소: CounselingRules SHOP_URLS)
 */
type Plan = (typeof PLANS)[number];
const Ctx = createContext<{ plan: Plan; setKey: (k: PlanKey) => void } | null>(null);

export function CounselingOptionsProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<PlanKey>("single");
  const plan = PLANS.find((p) => p.key === key) ?? PLANS[0];
  return <Ctx.Provider value={{ plan, setKey }}>{children}</Ctx.Provider>;
}

function usePlan() {
  const v = useContext(Ctx);
  if (!v) throw new Error("CounselingOptionsProvider 안에서 써야 해요");
  return v;
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const perSession = (p: Plan) => Math.round(p.total / p.sessions);

/** 옵션 선택 — 라디오 카드 */
export function OptionCards({ name }: { name: string }) {
  const { plan, setKey } = usePlan();
  return (
    <fieldset>
      <legend className="mb-2.5 text-[15px] font-extrabold text-[var(--foreground)]">옵션 선택</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {PLANS.map((p) => {
          const on = p.key === plan.key;
          return (
            <label
              key={p.key}
              className={`relative flex cursor-pointer items-start gap-3 rounded-[18px] bg-white p-4 transition-shadow ${
                on ? "shadow-[inset_0_0_0_2px_var(--brand),var(--shadow-sm)]" : "shadow-[inset_0_0_0_1.5px_var(--border)] hover:shadow-[inset_0_0_0_1.5px_var(--brand-mint)]"
              }`}
            >
              <input type="radio" name={name} value={p.key} checked={on} onChange={() => setKey(p.key)} className="sr-only" />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${on ? "bg-[var(--brand)] text-white" : "bg-white shadow-[inset_0_0_0_1.5px_var(--border)]"}`}
              >
                {on && <Icon name="check" className="h-4 w-4" strokeWidth={2.8} />}
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                <span className="flex flex-wrap items-center gap-1.5">
                  <b className="text-[16.5px]">{p.name}</b>
                  {p.key === "first" && <span className="rounded-full bg-[var(--coral)] px-2 py-px text-[12px] font-extrabold text-white">처음이라면</span>}
                  {p.sessions > 2 && <span className="rounded-full bg-[var(--brand-light)] px-2 py-px text-[12px] font-extrabold text-[var(--brand)]">{p.note}</span>}
                </span>
                <span className="mt-1 block text-[18px] font-extrabold tracking-[-0.01em]">{won(p.total)}</span>
                <span className="mt-0.5 block text-[13px] text-[var(--foreground-muted)]">
                  {p.sessions > 1 ? `${p.sessions}회기 · 회당 ${won(perSession(p))}` : "1회기 50분"}
                </span>
                {(p.valid || p.key === "first") && (
                  <span className="block text-[13px] text-[var(--foreground-subtle)]">
                    {[p.key === "first" ? "첫 상담 때만" : "", p.valid ? `유효기간 ${p.valid}` : ""].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {plan.sessions > 1 && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--brand-light)] px-4 py-3 text-[15px] font-semibold leading-relaxed text-[var(--brand-ink)]">
          <Icon name="calendar" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
          {MULTI_NOTE}
        </p>
      )}
    </fieldset>
  );
}

/** 고른 옵션의 가격 한 줄 (첫 화면) */
export function SelectedPrice() {
  const { plan } = usePlan();
  return (
    <p className="text-[28px] font-extrabold tracking-[-0.02em]">
      {won(plan.total)}
      <small className="block text-[13.5px] font-semibold tracking-normal text-[var(--foreground-muted)]">
        {plan.name}
        {plan.sessions > 1 ? ` · ${plan.sessions}회기 · 회당 ${won(perSession(plan))}` : " · 50분"}
        {plan.valid && ` · 유효기간 ${plan.valid}`}
      </small>
    </p>
  );
}

/** 가격 박스 머리 (초록 띠) */
export function PriceBoxHead() {
  const { plan } = usePlan();
  return (
    <>
      <p className="text-[15px] opacity-90">개인 상담 · {plan.name}</p>
      <p className="mt-1 text-[40px] font-extrabold leading-[1.2] tracking-[-0.03em]">{won(plan.total)}</p>
      <p className="text-[14px] opacity-90">
        {plan.sessions > 1 ? `${plan.sessions}회기 · 회당 ${won(perSession(plan))}` : "1회기 50분"}
        {plan.valid && ` · 유효기간 ${plan.valid}`}
      </p>
    </>
  );
}

/** 신청 버튼 — 고른 옵션을 보여 주고 카페24로 */
export function ApplyButton({ className = "" }: { className?: string }) {
  const { plan } = usePlan();
  return (
    <a href={shopUrl(plan.key)} target="_blank" rel="noopener noreferrer" className={`as-btn ${className}`}>
      {plan.name} · {won(plan.total)} 신청하기 <Icon name="arrow" className="h-5 w-5" />
    </a>
  );
}

/** 휴대폰 하단 고정 바 */
export function CounselingStickyBar({ targetId }: { targetId: string }) {
  const { plan } = usePlan();
  return <StickyApplyBar targetId={targetId} href={shopUrl(plan.key)} price={won(plan.total)} sub={`개인 상담 · ${plan.name}`} />;
}
