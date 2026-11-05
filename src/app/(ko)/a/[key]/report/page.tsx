"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";
import { assessRequest } from "@/lib/assessment";

// 보고서·해석 영상 — N9 버튼이 오는 곳. 본인 확인을 거친 사람에게만 내용을 받아 온다.
// 보고서는 스크립트가 있는 HTML이라, 로그인 정보를 읽지 못하게 격리된 틀에 넣어 보여 준다(allow-same-origin 없음).
// 열람 기간(상담일 + 14일)이 끝나면 서버가 내용을 주지 않는다.
interface ReportState {
  published: boolean;
  expired?: boolean;
  endsAt?: string | null;
  hasReport?: boolean;
  videoId?: string | null;
}

// 틀 바깥의 [PDF로 저장] 버튼이 틀 안의 인쇄를 부를 수 있게 하는 한 줄 (틀이 격리돼 있어 직접 부를 수 없다)
const PRINT_LISTENER = `<script>addEventListener("message",function(e){if(e.data==="hc-print")window.print();});</script>`;
const withPrint = (html: string) => (html.includes("</body>") ? html.replace("</body>", `${PRINT_LISTENER}</body>`) : html + PRINT_LISTENER);

export default function ReportPage() {
  const { key } = useParams<{ key: string }>();
  const { view, needsVerify, error, reload } = useProgress(key);
  const [state, setState] = useState<ReportState | null>(null);
  const [file, setFile] = useState<{ html: string; name: string } | null>(null);
  const [fileError, setFileError] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!view) return;
    assessRequest<ReportState>(key, "/report").then((r) => setState(r.ok && r.data ? r.data : { published: false }));
  }, [view, key]);

  useEffect(() => {
    if (!state?.hasReport) return;
    assessRequest<{ html: string; name: string }>(key, "/report/file").then((r) => {
      if (r.ok && r.data) setFile(r.data);
      else setFileError(r.message || "보고서를 불러오지 못했어요.");
    });
  }, [state?.hasReport, key]);

  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!view || !state) return <Skeleton className="mx-auto my-14 h-48 max-w-lg" />;

  const back = (
    <Link href={`/a/${key}`} className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
      내 진행 상황 보기
    </Link>
  );

  if (!state.published) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">아직 준비 중이에요</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">보고서와 해석 영상은 해석 상담 뒤에 올려 드려요. 준비되면 알림톡으로 알려 드릴게요.</p>
        <div className="mt-6">{back}</div>
      </div>
    );
  }

  if (state.expired) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">볼 수 있는 기간이 끝났어요</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">보고서와 해석 영상은 해석 상담 후 14일 동안 볼 수 있어요. 궁금한 점은 문의해 주세요.</p>
        <Link href="/contact" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
          문의하기
        </Link>
      </div>
    );
  }

  const download = () => {
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl text-[var(--foreground)]">보고서와 해석 영상</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">본인만 볼 수 있는 화면이에요. 링크를 다른 사람에게 보내지 말아 주세요.</p>
      {state.endsAt && (
        <p className="mt-3 rounded-xl bg-[var(--brand-light)] px-4 py-3 text-sm font-semibold text-[var(--brand)]">
          {new Date(state.endsAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })}까지 볼 수 있어요. 보고서는 그 안에 PDF로 저장해 주세요.
        </p>
      )}

      {state.videoId && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-[var(--foreground)]">해석 영상</h2>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--surface)]">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${state.videoId}?rel=0`}
              title="해석 영상"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </section>
      )}

      {state.hasReport && (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--foreground)]">종합 해석 보고서</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => frame.current?.contentWindow?.postMessage("hc-print", "*")} disabled={!file} className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                PDF로 저장
              </button>
              <button type="button" onClick={download} disabled={!file} className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50">
                파일 내려받기
              </button>
            </div>
          </div>
          {fileError ? (
            <p className="rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">{fileError}</p>
          ) : !file ? (
            <Skeleton className="h-96" />
          ) : (
            <iframe ref={frame} title="종합 해석 보고서" srcDoc={withPrint(file.html)} sandbox="allow-scripts allow-modals" className="h-[85vh] w-full rounded-2xl border border-[var(--border-light)] bg-white" />
          )}
          <p className="mt-2 text-xs text-[var(--foreground-subtle)]">인쇄 창이 뜨면 대상을 「PDF로 저장」으로 골라 주세요. 휴대폰에서 창이 뜨지 않으면 파일을 내려받아 브라우저로 연 뒤 인쇄해 주세요. 민감한 내용이니 잘 보관해 주세요.</p>
        </section>
      )}

      {!state.videoId && !state.hasReport && <p className="mt-8 text-[var(--foreground-muted)]">보여 드릴 내용이 없어요. 문의해 주세요.</p>}
      <div className="mt-10">{back}</div>
    </div>
  );
}
