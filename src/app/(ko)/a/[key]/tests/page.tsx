"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import { TestButtons } from "@/components/assessment/TestButtons";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";

// 검사 이어서 하기 (/a/:key/tests) — N5·N7 버튼. 남은 검사 링크를 모아 보여 준다
export default function TestsPage() {
  const { key } = useParams<{ key: string }>();
  const { view, needsVerify, error, reload } = useProgress(key);
  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!view) return <Skeleton className="mx-auto my-14 h-64 max-w-lg" />;
  const left = view.tests.filter((t) => !t.done);
  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl text-[var(--foreground)]">검사 이어서 하기</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {left.length ? `남은 검사 ${left.length}개 · 마감 ${view.testDeadlineText} 밤 12시` : "세 가지 검사를 모두 마쳤어요. 고마워요!"}
        </p>
        <div className="mt-6 rounded-2xl bg-[var(--brand-light)] p-4">
          {view.stage >= 3 ? <TestButtons v={view} /> : <p className="p-2 text-sm text-[var(--foreground-muted)]">검사 링크는 접수면접지를 낸 다음 날 아침 8시에 알림톡으로 보내 드려요.</p>}
        </div>
        <div className="mt-6 rounded-2xl bg-[var(--surface)] p-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p className="font-semibold text-[var(--foreground)]">원격 검사 수칙</p>
          <ul className="mt-2 space-y-1">
            <li>· 신청하신 본인이 직접, 혼자 응답해 주세요.</li>
            <li>· 조용한 곳에서 집중할 수 있을 때 해 주세요.</li>
            <li>· 검사 화면은 사진·캡처·공유하지 말아 주세요. (검사 문항은 저작권으로 보호돼요)</li>
            <li>· 정답은 없어요. 떠오르는 대로 솔직하게 골라 주세요.</li>
          </ul>
        </div>
        <Link href={`/a/${key}`} className="mt-6 inline-block text-sm text-[var(--brand)]">
          ← 내 진행 상황
        </Link>
      </div>
    </div>
  );
}
