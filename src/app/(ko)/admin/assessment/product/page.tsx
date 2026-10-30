"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui";
import { DETAIL_FAQ, DETAIL_FAQ_UPDATED, GUIDES, guideTab } from "@/content/assessmentGuide";

/**
 * 관리자 · 검사 상품 — 「안내·FAQ」 (읽기 전용, 10/30 상담가 결정)
 *   안내 페이지 2개 × 탭: 제목 · 고정 주소(복사) · 새 창으로 보기 · 마지막 수정일
 *   알림 버튼 연결표: 서버 문안(MESSAGES)에서 그대로 만든다 — 어느 알림의 어떤 버튼이 어느 탭으로 가는지
 *   상품 상세 자주 묻는 질문 8개
 * 문안은 src/content/assessmentGuide.ts 한 파일에 있다(고치기는 다음에 따로).
 */
interface Guide {
  code: string;
  label: string;
  buttons: string[];
  buttonLinks?: { label: string; path: string }[];
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="h-8 cursor-pointer rounded-lg bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
    >
      {done ? "복사됨 ✓" : "주소 복사"}
    </button>
  );
}

export default function AssessmentProductAdmin() {
  const [guide, setGuide] = useState<Guide[] | null>(null);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    apiRequest<Guide[]>("/api/admin/assessment/notice-guide").then((r) => {
      setOrigin(window.location.origin);
      if (r.ok && r.data) setGuide(r.data);
      else setError(r.message || "알림 문안을 불러오지 못했어요.");
    });
  }, []);

  // 안내 페이지로 가는 버튼만 모은 표 (주소가 /guide 로 시작)
  const links = (guide ?? []).flatMap((g) =>
    (g.buttonLinks ?? []).filter((b) => b.path.startsWith("/guide")).map((b) => ({ code: g.code, notice: g.label, label: b.label, path: b.path, total: g.buttons.length }))
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">검사 상품 · 안내·FAQ</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
        종합심리검사(150,000원) 고객에게 보이는 안내 페이지와 자주 묻는 질문, 알림톡 버튼이 어느 안내로 가는지 한곳에서 확인해요. 지금은 보기만 할 수 있어요(문안 고치기는 다음에).
      </p>

      {/* 안내 페이지 */}
      <section className="mt-8">
        <h2 className="mb-3 font-bold text-[var(--foreground)]">안내 페이지 (로그인 없이 열림)</h2>
        <div className="space-y-4">
          {GUIDES.map((g) => (
            <div key={g.key} className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white">
              <p className="border-b border-[var(--border-light)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold">{g.title}</p>
              <ul className="divide-y divide-[var(--border-light)]">
                {g.tabs.map((t) => (
                  <li key={t.path} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-semibold text-[var(--foreground)]">
                        [{t.label}] <span className="font-normal text-[var(--foreground-muted)]">{t.title}</span>
                      </span>
                      <span className="block break-all text-xs text-[var(--foreground-subtle)]">
                        {origin}
                        {t.path} · 마지막 수정 {t.updated} · 원본 {t.source}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <CopyButton text={`${origin}${t.path}`} />
                      <a href={t.path} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-lg bg-[var(--brand)] px-2.5 text-xs font-semibold text-white">
                        새 창으로 보기 ↗
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 알림 버튼 연결표 */}
      <section className="mt-10">
        <h2 className="mb-1 font-bold text-[var(--foreground)]">알림 버튼 연결표</h2>
        <p className="mb-3 text-xs text-[var(--foreground-subtle)]">서버의 알림 문안에서 그대로 읽어 와요. 알림톡 템플릿을 등록할 때 이 표와 같게 맞춰 주세요. 문자로 보낼 때는 버튼 대신 주소 줄로 나가요.</p>
        {error ? (
          <p className="text-sm text-[var(--error)]">{error}</p>
        ) : !guide ? (
          <Skeleton className="h-32" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)] bg-white">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">알림</th>
                    <th className="px-4 py-2.5 font-semibold">버튼 이름</th>
                    <th className="px-4 py-2.5 font-semibold">열리는 안내 (탭)</th>
                    <th className="px-4 py-2.5 font-semibold">주소</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => {
                    const tab = guideTab(l.path);
                    return (
                      <tr key={`${l.code}-${l.label}`} className="border-t border-[var(--border-light)]">
                        <td className="px-4 py-2.5">
                          <b>{l.code}</b> <span className="text-[var(--foreground-muted)]">{l.notice}</span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold">[{l.label}]</td>
                        <td className="px-4 py-2.5">{tab ? `${tab.page.title} › ${tab.tab.label}` : <span className="text-[var(--error)]">없는 안내 주소</span>}</td>
                        <td className="px-4 py-2.5 text-xs text-[var(--foreground-subtle)]">{l.path}</td>
                      </tr>
                    );
                  })}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-sm text-[var(--foreground-muted)]">
                        안내 페이지로 가는 버튼이 없어요. (서버가 아직 예전 버전이면 배포 뒤 보여요)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <details className="mt-3 rounded-2xl border border-[var(--border-light)] bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">모든 알림의 버튼 보기</summary>
              <ul className="space-y-1.5 px-4 pb-4 text-xs">
                {guide.map((g) => (
                  <li key={g.code}>
                    <b>{g.code}</b> {g.label} —{" "}
                    {(g.buttonLinks ?? g.buttons.map((label) => ({ label, path: "" }))).map((b) => `[${b.label}]${b.path ? ` ${b.path}` : ""}`).join(" · ")}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>

      {/* 상품 상세 FAQ */}
      <section className="mt-10">
        <h2 className="mb-1 font-bold text-[var(--foreground)]">상품 상세 · 자주 묻는 질문 {DETAIL_FAQ.length}개</h2>
        <p className="mb-3 text-xs text-[var(--foreground-subtle)]">
          /assessment/comprehensive 의 &lsquo;자주 묻는 질문&rsquo; · 마지막 수정 {DETAIL_FAQ_UPDATED}
        </p>
        <ol className="space-y-2">
          {DETAIL_FAQ.map((f, i) => (
            <li key={f.q} className="rounded-2xl border border-[var(--border-light)] bg-white p-4 text-sm">
              <p className="font-semibold text-[var(--foreground)]">
                Q{i + 1}. {f.q}
              </p>
              {f.a.map((a) => (
                <p key={a} className="mt-1 text-[var(--foreground-muted)]">
                  {a}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
