"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest } from "@/lib/assessment";
import { Skeleton } from "@/components/ui";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";

/**
 * 알림톡 버튼 주소 중 나머지 — place(지도·장소) · video-room(화상 입장) · report·survey·review·who5(3차, 준비 중)
 * 모르는 주소는 진행 화면으로 안내.
 */
const SOON: Record<string, string> = {
  report: "보고서·해석 영상",
  survey: "만족도 조사",
  review: "후기 남기기",
  who5: "1주 뒤 마음 체크",
};

function VideoRoom({ linkKey }: { linkKey: string }) {
  const [err, setErr] = useState("");
  useEffect(() => {
    assessRequest<{ url: string }>(linkKey, "/video").then((r) => (r.ok && r.data?.url ? window.location.replace(r.data.url) : setErr(r.message || "화상 상담 링크를 열지 못했어요.")));
  }, [linkKey]);
  return <p className="text-[var(--foreground-muted)]">{err || "화상 상담으로 들어가고 있어요…"}</p>;
}

export default function SectionPage() {
  const { key, section } = useParams<{ key: string; section: string }>();
  const { view, needsVerify, error, reload } = useProgress(key);
  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!view) return <Skeleton className="mx-auto my-14 h-48 max-w-lg" />;

  const back = (
    <Link href={`/a/${key}`} className="mt-8 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
      내 진행 상황 보기
    </Link>
  );

  if (section === "place") {
    const p = view.place;
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-display text-2xl text-[var(--foreground)]">해석 상담 장소</h1>
        {p ? (
          <div className="card mt-6 p-6">
            <p className="text-sm text-[var(--foreground-subtle)]">{view.sessionText} · 약 60분</p>
            <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{p.name}</p>
            <p className="mt-1 text-[var(--foreground-muted)]">{p.address}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.mapUrl && (
                <a href={p.mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
                  지도 열기
                </a>
              )}
              <a href={`https://map.naver.com/p/search/${encodeURIComponent(p.address || p.name)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-xl bg-[var(--surface)] px-5 text-sm font-semibold">
                네이버 지도에서 찾기
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--foreground-subtle)]">시작 5분 전쯤 도착하면 돼요. 일정 변경은 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-[var(--surface)] p-5 text-sm text-[var(--foreground-muted)]">장소는 상담 3일 전에 정해 알림톡으로 알려 드려요.</p>
        )}
        {back}
      </div>
    );
  }

  if (section === "video-room") {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <VideoRoom linkKey={key} />
        {back}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <p className="text-3xl" aria-hidden="true">
        🌱
      </p>
      <h1 className="mt-3 text-xl font-bold text-[var(--foreground)]">{SOON[section] ?? "이 화면"}은 곧 열려요</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">준비되면 알림톡으로 알려 드릴게요.</p>
      {back}
    </div>
  );
}
