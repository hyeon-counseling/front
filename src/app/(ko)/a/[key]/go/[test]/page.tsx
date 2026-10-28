"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest } from "@/lib/assessment";
import { VerifyGate } from "@/components/assessment/VerifyGate";

/**
 * 검사 들어가기 (/a/:key/go/mmpi · tci · sct) — 알림톡 버튼이 여는 곳.
 * 저장된 검사 링크(마음사랑·인싸이트)를 서버에서 받아 그리로 넘긴다. 링크는 알림톡에 실리지 않는다.
 */
const NAME: Record<string, string> = { mmpi: "MMPI 검사", mmpi3: "MMPI 검사", tci: "TCI 검사", sct: "SCT 검사" };

export default function GoTestPage() {
  const { key, test } = useParams<{ key: string; test: string }>();
  const [state, setState] = useState<{ verify?: string; error?: string }>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    assessRequest<{ url: string; needsVerify?: boolean; nameHint?: string }>(key, `/go/${encodeURIComponent(test)}`).then((r) => {
      if (r.ok && r.data?.url) window.location.replace(r.data.url);
      else if (r.status === 403 && r.data?.needsVerify) setState({ verify: r.data.nameHint ?? "" });
      else setState({ error: r.message || "검사를 열지 못했어요." });
    });
  }, [key, test, tick]);

  if (state.verify !== undefined) return <VerifyGate linkKey={key} nameHint={state.verify} onDone={() => (setState({}), setTick((t) => t + 1))} />;
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      {state.error ? (
        <>
          <p className="font-bold text-[var(--foreground)]">{state.error}</p>
          <Link href={`/a/${key}`} className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
            내 진행 상황 보기
          </Link>
        </>
      ) : (
        <p className="text-[var(--foreground-muted)]">{NAME[test] ?? "검사"} 화면으로 이동하고 있어요…</p>
      )}
    </div>
  );
}
