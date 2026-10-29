import type { Metadata } from "next";
import Link from "next/link";
import { Card, FaqList, GuideFooter, GuidePage, GuideSection, GuideToc, Note, Steps } from "@/components/assessment/GuideBlocks";

export const metadata: Metadata = {
  title: "신청 안내와 자주 묻는 질문 · 종합심리검사",
  description: "종합심리검사 + 해석 상담이 어떻게 진행되는지, 지금 하실 일과 자주 묻는 질문을 모았어요.",
};

/**
 * 종합심리검사 신청 안내 + 신청 FAQ — 알림톡 N1 [신청 안내와 FAQ] 버튼의 고정 주소
 * 원본: 20-카드뉴스-신청안내-v2 · 21-카드뉴스-신청FAQ-v2 (10/30 웹 페이지로 옮김, 운영 기준으로 다듬음)
 */
const STEPS = [
  { title: "신청 · 결제 완료", desc: "결제와 함께 고르신 일정으로 바로 확정돼요" },
  { title: "접수면접지 작성", desc: "나의 이야기를 미리 들려주세요 (15~20분)", tag: "지금 여기" },
  { title: "검사 진행", desc: "접수면접지를 낸 다음 날 아침 8시에 검사 링크가 와요" },
  { title: "검사 완료", desc: "검사 마감은 해석 상담 7일 전이에요" },
  { title: "보고서 준비", desc: "상담가가 결과와 접수면접지를 꼼꼼히 읽고 정리해요" },
  { title: "해석 상담", desc: "약 60분 · 대면 또는 화상" },
  { title: "보고서 · 영상 전달", desc: "내 페이지에서 언제든 다시 봐요" },
  { title: "후기", desc: "상담 다음 날, 짧은 만족도 조사" },
];

const FAQ = [
  {
    q: "병이 있는지 가려내는 검사인가요?",
    a: (
      <>
        <p>아니요. 나를 더 깊이 이해하고 탐색하기 위한 검사예요. 성격, 스트레스를 다루는 방식, 관계에서 반복되는 패턴을 함께 살펴봐요.</p>
        <p>의학적인 판단이 필요해 보이면 병원(의료진)과 상의해 보시도록 따로 안내해 드려요.</p>
      </>
    ),
  },
  {
    q: "결과가 나쁘게 나오면 어떡하죠?",
    a: (
      <>
        <p>이 검사에는 &lsquo;좋은 점수, 나쁜 점수&rsquo;가 없어요. 높거나 낮은 점수는 &ldquo;지금 이쪽에 힘이 많이 들어가 있구나&rdquo; 하는 신호예요.</p>
        <p>해석 상담에서는 내 강점을 먼저 찾고, 힘든 부분은 어떻게 다루면 좋을지 함께 이야기해요. 혼자 결과만 받아 드는 일은 없어요.</p>
      </>
    ),
  },
  { q: "정답이 있나요?", a: <p>없어요. 시험이 아니라서 맞고 틀리는 답이 없어요. 지금의 나에게 가장 가까운 쪽을 고르면 돼요.</p> },
  {
    q: "얼마나 걸려요?",
    a: (
      <>
        <p>사람마다 달라요. 검사별로 나눠서 해도 괜찮아요.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>MMPI-3: 335문항 · 약 35~50분 (가장 길어요)</li>
          <li>TCI-RS: 약 140문항 · 약 15~30분</li>
          <li>SCT: 약 50문장 · 약 20~40분</li>
          <li>해석 상담: 약 60분</li>
        </ul>
      </>
    ),
  },
  {
    q: "중간에 멈춰도 되나요?",
    a: <p>검사별로 나눠서 하는 건 괜찮아요. 다만 한 검사 안에서 이어 하기가 되는지는 출판사 시스템에 따라 달라서, 한 검사는 되도록 한 번에 마쳐 주세요.</p>,
  },
  {
    q: "일정이 바뀌면요?",
    a: (
      <>
        <p>
          카카오톡 채널로 미리 알려 주세요. 일정 재조정 화면에서 열려 있는 시간 중 새 날짜를 고르면, 검사 마감도 새 날짜의 7일 전으로 함께 바뀌어요.
        </p>
        <p>
          일정 변경은 상담 3일 전까지 1회 무료예요. 취소·환불 기준은{" "}
          <Link href="/refund" className="link-underline text-[var(--foreground)]">
            환불 규정
          </Link>
          에 있어요.
        </p>
      </>
    ),
  },
  {
    q: "결과는 누가 보나요?",
    a: (
      <>
        <p>김태현 심리상담가만 봐요. 가족·회사·학교 누구에게도 동의 없이 알리지 않아요.</p>
        <p>응답은 검사 출판사(마음사랑·인싸이트)의 온라인 시스템에서 채점돼요. 기록은 10년 동안 안전하게 보관하고, 지나면 파기해요.</p>
        <p>생명이나 안전이 걱정되는 아주 예외적인 경우의 기준은 신청할 때 동의하신 안내에 적혀 있어요.</p>
      </>
    ),
  },
  {
    q: "왜 세 가지 검사를 같이 하나요?",
    a: (
      <>
        <p>세 검사가 나를 서로 다른 방향에서 비춰 줘요. 겹쳐 보면 &lsquo;어떤지&rsquo;를 넘어 &lsquo;왜 그런지&rsquo;까지 보여요.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>MMPI-3: 지금의 마음 상태 — 스트레스 대처 방식, 관계 패턴</li>
          <li>TCI-RS: 타고난 기질과 키워 온 성격 — 나다운 반응이 어디서 오는지</li>
          <li>SCT: 내 말로 쓴 나의 이야기 — 점수로는 안 보이는 생각과 마음</li>
        </ul>
        <p>
          더 자세한 건{" "}
          <Link href="/guide/tests" className="link-underline text-[var(--foreground)]">
            검사 소개와 FAQ
          </Link>
          에 있어요.
        </p>
      </>
    ),
  },
  {
    q: "대면 상담은 어디서 하나요?",
    a: (
      <>
        <p>서울 다섯 지역(홍대·강남·종로·혜화·사당) 중 신청 때 고르신 1·2순위 지역의 스터디룸에서 만나요.</p>
        <p>조용한 방을 잡아 상담 3일 전에 확정해 알림톡으로 알려 드리고, 하루 전에 한 번 더 알려 드려요. 화상이면 접속 안내가 상담 하루 전에 가요.</p>
      </>
    ),
  },
  {
    q: "보고서는 언제 받나요?",
    a: (
      <>
        <p>상담 중에 보고서를 화면으로 함께 봐요. 끝나면 내 페이지에 종합 해석 보고서와 해석 영상을 올려 드려요. 언제든 다시 볼 수 있어요.</p>
        <p>미리 보내 드리지 않는 건, 점수만 먼저 보면 오해하기 쉬워서예요. 설명을 들으며 보는 게 훨씬 정확하고 편해요.</p>
      </>
    ),
  },
];

export default function GuideApplyPage() {
  return (
    <GuidePage
      chip="종합심리검사 · 신청 안내"
      title={
        <>
          신청 안내와
          <br />
          자주 묻는 질문
        </>
      }
      lead="신청부터 후기까지 여덟 단계의 흐름과 지금 하실 일, 신청하신 분들이 자주 묻는 질문을 모았어요."
    >
      <GuideToc
        items={[
          { id: "flow", label: "진행 순서" },
          { id: "intake", label: "접수면접지" },
          { id: "tests", label: "검사 링크·준비" },
          { id: "deadline", label: "검사 마감" },
          { id: "session", label: "해석 상담" },
          { id: "faq", label: "자주 묻는 질문" },
        ]}
      />

      <GuideSection id="flow" chip="전체 흐름" title="여덟 단계로 진행돼요">
        <Steps items={STEPS} />
        <p className="text-[15px]">
          지금 어디까지 왔는지는{" "}
          <Link href="/my/assessment" className="link-underline text-[var(--foreground)]">
            마이페이지 → 심리검사 진행
          </Link>
          이나 알림톡의 [내 진행 상황 보기]에서 볼 수 있어요.
        </p>
      </GuideSection>

      <GuideSection id="intake" chip="2단계 · 접수면접지" tone="coral" title="&lsquo;나의 이야기&rsquo;를 미리 들려주세요">
        <Steps
          items={[
            { title: "요즘 고민, 검사로 알고 싶은 것", desc: "“관계에서 내 패턴이 궁금해”처럼요" },
            { title: "짧게, 키워드만 써도 괜찮아요", desc: "15~20분이면 충분하고, 중간 저장도 돼요" },
            { title: "쓰기 어려운 질문은 비워 두세요", desc: "해석 상담 때 말로 이야기해도 괜찮아요" },
            { title: "제출하면 검사 링크가 와요", desc: "다음 날 아침 8시, 알림톡으로 보내 드려요" },
          ]}
        />
        <Note title="왜 쓰나요?">같은 점수라도 사람마다 뜻이 달라요. 접수면접지는 결과를 &lsquo;나에게 맞게&rsquo; 읽는 열쇠예요.</Note>
        <p className="text-[15px]">접수면접지는 신청 완료 알림톡의 [접수면접지 쓰기] 버튼이나 마이페이지 → 심리검사 진행에서 열 수 있어요.</p>
      </GuideSection>

      <GuideSection id="tests" chip="3단계 · 검사 링크" tone="mmpi" title="접수면접지를 낸 다음 날 아침 8시에 와요">
        <Card>
          <p className="font-bold text-[var(--foreground)]">알림톡 [MMPI 검사] · [TCI 검사] · [SCT 검사]</p>
          <p className="mt-1 text-[15px] leading-relaxed">
            검사마다 버튼이 따로 있고, 누르면 인증코드가 자동으로 들어가요. MMPI·TCI는 마음사랑, SCT는 인싸이트 사이트에서 해요.
          </p>
        </Card>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">미리 준비할 것, 이 세 가지만</h3>
        <Steps
          items={[
            { title: "조용한 시간, 넉넉하게", desc: "가장 긴 건 MMPI-3(335문항, 약 35~50분)이에요. 검사별로 나눠서 해도 괜찮아요" },
            { title: "PC나 노트북 (권장)", desc: "휴대폰도 되지만, 문항이 많아서 큰 화면이 훨씬 편해요" },
            { title: "끊기지 않는 인터넷", desc: "와이파이가 안정적인 곳에서 해 주세요" },
          ]}
        />
        <Note title="꼭 지켜 주세요" tone="coral">
          신청하신 본인이 혼자 응답해요. 검사 화면은 촬영·캡처·공유하지 않아요 (저작권·검사 보안).
        </Note>
      </GuideSection>

      <GuideSection id="deadline" chip="검사 마감" title="검사 마감은 해석 상담 7일 전이에요">
        <p>링크를 받은 날부터 마감까지가 검사하는 기간이고, 마감 뒤 7일은 상담가가 보고서를 준비하는 시간이에요.</p>
        <Card>
          <p className="text-[15px] leading-relaxed">
            예를 들면 해석 상담이 <b className="text-[var(--foreground)]">11월 20일(금)</b>이라면, 검사 마감은 <b className="text-[var(--foreground)]">11월 13일(금) 밤 12시</b>예요.
          </p>
        </Card>
        <p>아직 남은 검사가 있으면 매일 아침 8시에 한 번, 남은 검사만 알림톡으로 알려 드려요.</p>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">마감을 놓치면 해석 상담 일정을 새로 잡아요</h3>
        <Steps
          items={[
            { title: "마감일이 지나요", desc: "검사가 아직 끝나지 않은 상태" },
            { title: "일정 재조정 알림톡이 가요", desc: "[새 일정 고르기] 버튼이 함께 가요" },
            { title: "열려 있는 시간 중 새 날짜를 골라요", desc: "새 날짜의 7일 전이 새 마감 · 이미 마친 검사는 그대로 인정돼요" },
          ]}
        />
        <Note title="벌칙이 아니에요">보고서를 제대로 준비하기 위한 시간이에요. 바쁜 일이 생기면 마감 전에 미리 말씀해 주세요.</Note>
        <p className="text-[15px]">
          일정 변경은 상담 3일 전까지 1회 무료예요. 취소·환불 기준은{" "}
          <Link href="/refund" className="link-underline text-[var(--foreground)]">
            환불 규정
          </Link>
          에 있어요.
        </p>
      </GuideSection>

      <GuideSection id="session" chip="6단계 · 해석 상담" tone="coral" title="신청하신 방식으로 약 60분 만나요">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Card>
            <p className="font-bold text-[var(--foreground)]">대면 <span className="ml-1 text-sm text-[var(--sct-ink)]">추천</span></p>
            <p className="mt-1 text-[15px] leading-relaxed">고르신 지역 스터디룸에서 만나요. 표정·몸짓까지 읽어 해석이 풍성해요.</p>
          </Card>
          <Card>
            <p className="font-bold text-[var(--foreground)]">화상 (온라인)</p>
            <p className="mt-1 text-[15px] leading-relaxed">이동 없이 편한 곳에서 가볍게 만나요. 혼자 있는 조용한 곳이면 돼요.</p>
          </Card>
        </div>
        <p>대면 장소는 상담 3일 전에 확정해 알려 드리고, 하루 전에 한 번 더 알려 드려요. 화상 접속 안내는 하루 전에 가요.</p>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">상담 뒤에 받는 것</h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Card>
            <p className="font-bold text-[var(--foreground)]">종합 해석 보고서</p>
            <p className="mt-1 text-[15px] leading-relaxed">김태현 심리상담가가 직접 써요. 상담에서 함께 본 뒤 내 페이지에 올려 드려요.</p>
          </Card>
          <Card>
            <p className="font-bold text-[var(--foreground)]">해석 영상</p>
            <p className="mt-1 text-[15px] leading-relaxed">내 결과를 영상으로 언제든 다시 꺼내 봐요.</p>
          </Card>
        </div>
        <Note title="비밀은 지켜요">결과와 접수면접지는 상담가만 봐요. 기록은 10년 동안 안전하게 보관하고, 지나면 파기해요.</Note>
      </GuideSection>

      <GuideSection id="faq" chip="자주 묻는 질문" tone="mmpi" title="신청하신 분들이 자주 묻는 10가지">
        <FaqList items={FAQ} />
      </GuideSection>

      <GuideFooter
        links={[
          { href: "/guide/tests", label: "검사 소개와 FAQ", sub: "세 검사는 무엇이고, 어떻게 하면 편한지" },
          { href: "/my/assessment", label: "내 진행 상황 보기", sub: "로그인 후 마이페이지 → 심리검사 진행" },
          { href: "/assessment/comprehensive", label: "종합심리검사 상세", sub: "150,000원 · 보고서·해석 상담·영상 포함" },
          { href: "/refund", label: "환불 규정", sub: "단계별 취소·환불 기준" },
        ]}
      />
    </GuidePage>
  );
}
