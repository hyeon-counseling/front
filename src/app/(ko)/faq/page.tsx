"use client";

import { useState } from "react";
import Link from "next/link";
import { SHOW_COURSES } from "@/lib/site";

const COURSE_FAQS = [
  {
    q: "강의는 어떻게 듣나요?",
    a: "회원가입 후 강의를 구매하면 '내 학습'에서 바로 수강할 수 있습니다. 동영상은 사이트 안에서 재생되며, 보던 위치가 자동으로 저장되어 다음에 이어서 볼 수 있어요.",
  },
  {
    q: "수강 기간이 있나요?",
    a: "강의마다 수강 기간이 정해져 있고 강의 소개 페이지에 표시됩니다. 기간이 지나면 다시 볼 수 없지만, 학습 기록과 진도는 보존됩니다.",
  },
  {
    q: "셀프 워크북은 무엇인가요?",
    a: "인지행동치료(CBT) 같은 검증된 방법을 하루 단위로 나눠, 매일 10분씩 질문에 답하고 기록하는 웹 프로그램입니다. 1주차는 누구나 무료로 시작할 수 있고, 기록은 내 계정에만 저장됩니다.",
  },
  {
    q: "기록은 누가 볼 수 있나요?",
    a: "워크북 기록과 학습 내역은 본인만 볼 수 있습니다. 운영자는 서비스 운영을 위해 필요한 최소한의 정보만 확인하며, 개인정보처리방침에 따라 관리합니다.",
  },
  {
    q: "환불이 되나요?",
    a: "디지털 콘텐츠 특성상 수강·수행을 시작한 뒤에는 환불이 제한됩니다. 결제 후 7일 이내이고 진도가 10% 미만이면 전액 환불해 드립니다. 자세한 기준은 환불 규정을 확인해 주세요.",
  },
  {
    q: "상담은 어떻게 신청하나요?",
    a: "상담·심리검사 페이지에서 안내를 보고 쇼핑몰에서 신청·결제하면 예약이 확정됩니다. 화상(Google Meet) 또는 서울 대면으로 진행합니다.",
  },
  {
    q: "심각한 어려움이 있어도 이용해도 되나요?",
    a: "이곳의 강의와 워크북은 심리 교육 자료입니다. 정신과 진료나 전문 치료를 대체하지 않습니다. 심한 불안·우울·트라우마, 자해나 자살 생각이 있다면 전문가의 도움을 먼저 받으세요.",
  },
  {
    q: "결제 수단은 무엇이 있나요?",
    a: "카드·계좌이체·간편결제를 준비하고 있습니다. 결제 정보는 결제 대행사가 처리하며 저희 서버에는 카드 정보가 저장되지 않습니다.",
  },
  {
    q: "문의는 어디로 하나요?",
    a: "support@hyeon-counseling.com 으로 보내 주세요. 영업일 기준 1~2일 안에 답변드립니다.",
  },
];

// 강의를 숨긴 동안(lib/site.ts) — 지금 파는 서비스(종합심리검사·간이 검사·아티클) 기준
const ASSESS_FAQS = [
  {
    q: "종합심리검사는 어떻게 진행되나요?",
    a: "신청할 때 해석 상담 날짜를 직접 고르고 결제하면 바로 확정돼요. 접수면접지 작성 → 온라인 검사(TCI·MMPI-3·SCT, 해석 상담 7일 전까지) → 해석 상담(화상 또는 서울 대면 50분) 순서로 진행하고, 단계마다 알림톡으로 안내해 드려요.",
  },
  {
    q: "간이 무료 심리검사는 무엇인가요?",
    a: "2~3분이면 끝나는 자가 검사예요. 진단이 아니라 지금 마음을 살펴보는 거울이에요. 로그인하고 하면 결과가 내 검사 기록에 남아요.",
  },
  {
    q: "기록은 누가 볼 수 있나요?",
    a: "검사 응답과 결과는 본인과 김태현 심리상담가만 봅니다. 운영자는 서비스 운영을 위해 필요한 최소한의 정보만 확인하며, 개인정보처리방침에 따라 관리합니다.",
  },
  {
    q: "환불이 되나요?",
    a: "종합심리검사는 검사를 시작하기 전이면 전액, 시작한 뒤에는 이미 들어간 비용만큼 빼고 돌려드립니다. 마이페이지 → 심리검사 진행에서 바로 취소를 요청할 수 있어요. 자세한 기준은 환불 규정을 확인해 주세요.",
  },
  {
    q: "심각한 어려움이 있어도 이용해도 되나요?",
    a: "심리검사와 해석 상담은 나를 이해하도록 돕는 서비스입니다. 정신과 진료나 전문 치료를 대체하지 않습니다. 심한 불안·우울·트라우마, 자해나 자살 생각이 있다면 전문가의 도움을 먼저 받으세요.",
  },
  // 결제 수단·문의는 같은 답
  ...COURSE_FAQS.slice(-2),
];
const FAQS = SHOW_COURSES ? COURSE_FAQS : ASSESS_FAQS;

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)]">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left" aria-expanded={open}>
        <span className="font-display text-lg text-[var(--foreground)]">{q}</span>
        <span className={`text-[var(--brand)] transition-transform ${open ? "rotate-45" : ""}`} aria-hidden>
          +
        </span>
      </button>
      {open && <p className="pb-6 text-sm leading-relaxed text-[var(--foreground-muted)]">{a}</p>}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4"><span className="eyebrow">자주 묻는 질문</span></p>
        <h1 className="font-display text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">궁금한 것들</h1>
        <div className="mt-10 border-t border-[var(--border)]">
          {FAQS.map((f) => <Item key={f.q} {...f} />)}
        </div>
        <div className="mt-10 rounded-2xl bg-[var(--surface)] p-5">
          <p className="font-semibold text-[var(--foreground)]">종합심리검사를 신청하셨다면</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">진행 순서·검사 마감·검사 요령은 따로 모아 두었어요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/guide/apply" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm">
              종합심리검사 신청 안내 →
            </Link>
            <Link href="/guide/tests" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm">
              검사 안내 →
            </Link>
          </div>
        </div>
        <p className="mt-10 text-sm text-[var(--foreground-muted)]">
          찾는 답이 없다면{" "}
          <Link href="/contact" className="link-underline text-[var(--foreground)]">
            문의하기
          </Link>
          로 알려 주세요.
        </p>
      </div>
    </div>
  );
}
