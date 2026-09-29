"use client";

/**
 * ForestCard — 마음숲 햇살·물방울 요약 카드 (내 학습 페이지)
 * GET /api/my/forest 실패 시 조용히 숨김.
 */

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ForestState {
  sun: number;
  drops: number;
  stage: number;
}

const STAGE_LABEL = ["새싹", "잎 하나", "잎 둘", "꽃봉오리", "꽃"];

export function ForestCard() {
  const [data, setData] = useState<ForestState | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiRequest<ForestState>("/api/my/forest")
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []);

  // 서버 오류 시 조용히 숨김
  if (failed) return null;
  if (!data) return null;

  const stageLabel = STAGE_LABEL[Math.min(data.stage, STAGE_LABEL.length - 1)];

  return (
    <section className="card mt-6 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">마음숲</h2>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">앱의 숲에서 친구를 돌볼 수 있어요</p>
        </div>
      </div>

      <div className="mt-4 flex gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>&#9728;&#65039;</span>
          <div>
            <p className="text-xs text-[var(--foreground-subtle)]">햇살</p>
            <p className="text-lg font-bold text-amber-600">{data.sun.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>&#128167;</span>
          <div>
            <p className="text-xs text-[var(--foreground-subtle)]">물방울 · {stageLabel}</p>
            <p className="text-lg font-bold text-[var(--brand)]">{data.drops.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
