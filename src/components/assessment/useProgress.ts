"use client";

import { useCallback, useEffect, useState } from "react";
import { assessRequest, type ProgressView } from "@/lib/assessment";

/** 진행 화면 데이터 — 본인 확인이 필요하면 needsVerify(이름 일부 포함) */
export function useProgress(linkKey: string) {
  const [view, setView] = useState<ProgressView | null>(null);
  const [needsVerify, setNeedsVerify] = useState<string | null>(null);
  const [error, setError] = useState("");

  const apply = useCallback((r: Awaited<ReturnType<typeof assessRequest<ProgressView & { needsVerify?: boolean; nameHint?: string }>>>) => {
    if (r.ok && r.data) {
      setView(r.data);
      setNeedsVerify(null);
    } else if (r.status === 403 && r.data?.needsVerify) {
      setNeedsVerify(r.data.nameHint ?? "");
    } else {
      setError(r.message || "진행 상황을 불러오지 못했어요.");
    }
  }, []);

  const load = useCallback(() => {
    void assessRequest<ProgressView & { needsVerify?: boolean; nameHint?: string }>(linkKey, "").then(apply);
  }, [linkKey, apply]);

  useEffect(() => {
    assessRequest<ProgressView & { needsVerify?: boolean; nameHint?: string }>(linkKey, "").then(apply);
  }, [linkKey, apply]);

  return { view, setView, needsVerify, error, reload: load };
}
