"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import { StageTracker } from "@/components/assessment/StageTracker";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";
import type { ProgressView } from "@/lib/assessment";

/**
 * 종합심리검사 「내 진행 상황」 — 알림톡 버튼이 여는 화면 (/a/:key)
 * 로그인 없이 휴대폰 뒤 4자리로 열린다. 지금 할 일 카드 + 8단계 + 신청 정보.
 */
function NextAction({ v }: { v: ProgressView }) {
  const key = v.linkKey;
  if (v.closed) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] p-6">
        <p className="font-bold text-[var(--foreground)]">{v.closed === "refunded" ? "환불된 신청이에요." : "취소된 신청이에요."}</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">궁금한 점은 카카오톡 채널 「심리상담실 현」으로 물어봐 주세요.</p>
      </div>
    );
  }
  if (v.hold === "safety") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-bold text-[var(--foreground)]">상담가가 먼저 연락드릴게요</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          김태현 심리상담가가 <b>24시간 안에</b> 직접 연락드려요. 검사 링크는 이야기를 나눈 뒤 편한 때에 보내 드릴게요.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          그 전에라도 힘들면 <b>109</b>(자살예방상담전화)나 <b>1577-0199</b>로 언제든 전화해 주세요. 지금 위험하다면 112·119로 연락해 주세요.
        </p>
      </div>
    );
  }
  if (v.hold === "reschedule") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-bold text-[var(--foreground)]">해석 상담 일정을 새로 골라야 해요</p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">일정 다시 고르기 화면을 준비하고 있어요. 그동안은 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>
      </div>
    );
  }
  if (v.stage === 2 && !v.intakeSubmittedAt) {
    return (
      <div className="rounded-2xl bg-[var(--brand)] p-6 text-white">
        <p className="text-sm font-semibold opacity-80">지금 할 일</p>
        <p className="mt-1 text-xl font-bold">접수면접지를 써 주세요</p>
        <p className="mt-2 text-sm leading-relaxed opacity-90">요즘의 고민과 생활을 미리 알려 주시면 검사 결과를 내 삶에 맞게 풀어 드릴 수 있어요. 15~20분이면 충분해요.</p>
        <Link href={`/a/${key}/intake`} className="mt-5 inline-flex h-12 items-center rounded-xl bg-white px-6 font-bold text-[var(--brand)]">
          접수면접지 쓰기
        </Link>
      </div>
    );
  }
  if (v.stage === 2) {
    return (
      <div className="rounded-2xl bg-[var(--brand-light)] p-6">
        <p className="text-sm font-semibold text-[var(--brand)]">다음 단계</p>
        <p className="mt-1 text-lg font-bold text-[var(--foreground)]">아침 8시에 검사 링크가 와요</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          MMPI-3 · TCI · SCT 링크를 알림톡으로 한 번에 보내 드려요. 검사 마감은 {v.testDeadlineText} 밤 12시예요.
        </p>
      </div>
    );
  }
  if (v.stage === 3) {
    const left = v.tests.filter((t) => !t.done);
    return (
      <div className="rounded-2xl bg-[var(--brand-light)] p-6">
        <p className="text-sm font-semibold text-[var(--brand)]">검사 진행 중 · 마감 {v.testDeadlineText} 밤 12시</p>
        <ul className="mt-3 space-y-2">
          {v.tests.map((t) => (
            <li key={t.key} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="font-semibold text-[var(--foreground)]">{t.label}</span>
              <span className={`text-sm font-semibold ${t.done ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]"}`}>{t.done ? "완료 ✓" : "알림톡의 링크로 검사하기"}</span>
            </li>
          ))}
        </ul>
        {left.length > 0 && <p className="mt-3 text-xs text-[var(--foreground-muted)]">나눠서 해도 괜찮아요. 남은 검사: {left.map((t) => t.label).join(", ")}</p>}
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-[var(--brand-light)] p-6">
      <p className="text-lg font-bold text-[var(--foreground)]">{v.stageLabel}</p>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">다음 안내는 알림톡으로 보내 드려요.</p>
    </div>
  );
}

export default function ProgressPage() {
  const { key } = useParams<{ key: string }>();
  const { view, needsVerify, error, reload } = useProgress(key);

  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
      </div>
    );
  }
  if (!view) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-14">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[var(--foreground-subtle)]">종합심리검사 + 해석 상담 · {view.applicationNo}</p>
        <h1 className="font-display mt-1 text-2xl text-[var(--foreground)] sm:text-3xl">{view.name}님의 진행 상황</h1>
        <p className="mt-2 inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-sm font-semibold text-[var(--foreground)]">
          {view.stage}/8 {view.stageLabel}
          {view.holdLabel && <span className="ml-1 text-[var(--warning)]">· {view.holdLabel}</span>}
        </p>

        <div className="mt-6">
          <NextAction v={view} />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr]">
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]">진행 단계</h2>
            <StageTracker stage={view.stage} hold={view.hold} />
          </section>
          <section className="card h-fit p-6">
            <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]">신청 정보</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--foreground-subtle)]">해석 상담</dt>
                <dd className="font-semibold text-[var(--foreground)]">{view.sessionText}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-subtle)]">방식</dt>
                <dd className="font-semibold text-[var(--foreground)]">
                  {view.methodText}
                  {view.method === "offline" && view.regions[1] && <span className="font-normal text-[var(--foreground-muted)]"> (2순위 {view.regions[1]})</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-subtle)]">검사 마감</dt>
                <dd className="font-semibold text-[var(--foreground)]">{view.testDeadlineText} 밤 12시</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-subtle)]">접수면접지</dt>
                <dd className="font-semibold text-[var(--foreground)]">{view.intakeSubmittedAt ? "제출 완료" : "아직 안 냈어요"}</dd>
              </div>
            </dl>
            {view.method === "offline" && <p className="mt-4 text-xs text-[var(--foreground-subtle)]">정확한 장소는 상담 3일 전에 알림톡으로 알려 드려요.</p>}
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--foreground-subtle)]">알림톡이 오지 않거나 궁금한 점이 있으면 카카오톡 채널 「심리상담실 현」으로 이름을 남겨 주세요.</p>
      </div>
    </div>
  );
}
