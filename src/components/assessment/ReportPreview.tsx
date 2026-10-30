"use client";

import { useState } from "react";

// 보고서 미리보기 — 가상 인물 이서윤(가명)의 샘플 보고서 네 장면 (70 상세 시안)
const CHIP = {
  g: "bg-[var(--brand-light)] text-[var(--brand)]",
  s: "bg-[var(--sct-light)] text-[var(--sct-ink)]",
  m: "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]",
  n: "bg-[var(--ivory)] text-[var(--foreground-muted)]",
};

const SCENES: { tab: string; feel: string; h: string; p: string; said?: string; chips: [keyof typeof CHIP, string][] }[] = [
  {
    tab: "1 이런 사람",
    feel: '장면 1 · "어? 나 같다"',
    h: "조심스럽게 살피고, 끝까지 가는 사람",
    p: "문제가 커지기 전에 먼저 보고, 한번 맡은 일은 마무리까지 가져가요. 넓게보다 깊게, 친구 둘과 오래 이어져요.",
    chips: [["g", "TCI 바탕"], ["s", "SCT 내 문장"], ["n", "접수면접지"]],
  },
  {
    tab: "2 강점",
    feel: '장면 2 · "맞아, 이거 잘하지"',
    h: "끝까지 해내는 힘 · 먼저 보는 눈 · 품어 주는 마음",
    p: "'믿고 맡길 수 있다'는 말은 우연이 아니에요. 보상이 바로 없어도 꾸준히 가고, 빈틈을 남보다 먼저 알아채요.",
    said: '서윤 님이 쓴 말 — "한번 맡으면 끝까지 해요."',
    chips: [["g", "TCI 인내력"], ["g", "TCI 위험회피"], ["s", "SCT 내 문장"]],
  },
  {
    tab: "3 이런 상황",
    feel: '장면 3 · "맞아, 그럴 때 있어"',
    h: "부탁이 몰릴 때 · 평가받을 때 · 쉬는 날",
    p: "이럴 때 같은 강점이 조금 과하게 켜져요. 서윤 님이 고장 난 게 아니라, 상황과 요즘 상태의 이야기예요.",
    said: '신호 — "결국 제가 다 해요."',
    chips: [["m", "MMPI-3 요즘 날씨"], ["s", "SCT 내 문장"]],
  },
  {
    tab: "4 다른 방향",
    feel: '장면 4 · "이렇게 해 볼 수 있겠다"',
    h: "푸는 열쇠도 서윤 님 강점 안에 있어요",
    p: "끝까지 가는 힘으로 쉬는 약속도 끝까지 지켜요. 먼저 보는 눈으로 나만의 교대 시간표를 짜요. 새 힘이 아니라 방향만 바꿔요.",
    said: "이번 주 한 가지 — 낮에 충전 장면 하나, 밤 9시 1분 기록",
    chips: [["g", "강점 → 방향"], ["m", "4주 뒤 함께 점검"]],
  },
];

export function ReportPreview() {
  const [cur, setCur] = useState(1);
  const s = SCENES[cur];
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[var(--border-light)] bg-[var(--ivory)] px-4 pt-[18px]" aria-label="보고서 미리보기(가상 인물)">
      <div className="flex justify-between gap-2 text-xs font-bold text-[var(--foreground-subtle)]">
        <span>심리상담실 현 · 해석 보고서</span>
        <span>가상 인물</span>
      </div>
      <h4 className="mb-0.5 mt-2.5 text-xl font-extrabold tracking-tight">서윤 님의 종합심리검사</h4>
      <p className="text-sm font-extrabold text-[var(--coral-ink)]">같은 힘, 다른 방향</p>
      <div role="tablist" aria-label="보고서 장면" className="as-noscroll mt-3.5 flex gap-1.5 overflow-x-auto pb-0.5">
        {SCENES.map((x, i) => (
          <button
            key={x.tab}
            type="button"
            role="tab"
            id={`rp-tab-${i}`}
            aria-selected={i === cur}
            aria-controls="rp-panel"
            onClick={() => setCur(i)}
            className={`min-h-9 shrink-0 cursor-pointer rounded-full px-3 py-[7px] text-[13.5px] font-bold ${i === cur ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--foreground-muted)]"}`}
          >
            {x.tab}
          </button>
        ))}
      </div>
      <div id="rp-panel" role="tabpanel" aria-labelledby={`rp-tab-${cur}`} aria-live="polite" className="relative mt-3 min-h-[220px] rounded-t-2xl bg-white px-4 pb-[34px] pt-4">
        <p className="text-[13px] font-bold text-[var(--foreground-subtle)]">{s.feel}</p>
        <h5 className="mb-2 mt-1 text-lg font-extrabold leading-snug">{s.h}</h5>
        <p className="text-[15.5px] leading-[1.7] text-[var(--foreground-muted)]">{s.p}</p>
        {s.said && <p className="mt-2.5 rounded-[10px] bg-[var(--sct-light)] px-3 py-2 text-[15px] text-[var(--foreground)]">{s.said}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.chips.map(([tone, label]) => (
            <span key={label} className={`rounded-lg px-2 py-0.5 text-[12.5px] font-bold ${CHIP[tone]}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-b from-white/0 to-white" />
    </div>
  );
}
