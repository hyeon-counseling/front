"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui";

/**
 * 관리자 · 검사 알림 안내표 — N1~N11 · N8P/A/B · CANCEL · REFUND 를 언제, 무엇을 보내는지
 * 서버 문안(notices.ts MESSAGES)을 그대로 읽어 온다. 알림톡 승인 템플릿이 없으면 같은 내용이 문자로 간다.
 */
interface Guide {
  code: string;
  label: string;
  when: string;
  subject: string;
  buttons: string[];
  buttonLinks?: { label: string; path: string }[];
}

export default function AssessmentNoticeGuidePage() {
  const [list, setList] = useState<Guide[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Guide[]>("/api/admin/assessment/notice-guide").then((r) => (r.ok && r.data ? setList(r.data) : setError(r.message || "불러오지 못했어요.")));
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">알림 안내표</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        고객에게 가는 알림톡을 언제, 무엇을 보내는지 정리했어요. 승인된 알림톡 템플릿(카카오 템플릿에 코드를 붙인 것)이 없으면 같은 내용이 문자로 가요. 정기 알림(아침 8시)은 같은 날 두 번 가지 않아요.
      </p>

      {error && <p className="mt-6 text-sm text-[var(--error)]">{error}</p>}
      {!list && !error ? (
        <Skeleton className="mt-6 h-64" />
      ) : list ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-light)] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-4 py-3 font-semibold">코드</th>
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">언제 보내나요</th>
                <th className="px-4 py-3 font-semibold">제목 · 버튼</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.code} className="border-t border-[var(--border-light)] align-top">
                  <td className="px-4 py-3 font-bold text-[var(--foreground)]">{g.code}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{g.label}</td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">{g.when}</td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--foreground)]">{g.subject}</p>
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{(g.buttonLinks ?? g.buttons.map((label) => ({ label, path: "" }))).map((b) => `[${b.label}]${b.path.startsWith("/guide") ? ` → ${b.path}` : ""}`).join(" ")}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
