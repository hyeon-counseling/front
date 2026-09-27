"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { eulReul, hoursLabel, krDate, type CertificateInfo } from "@/lib/attendance";
import { Skeleton } from "@/components/ui";

/**
 * 수료증 — 본인은 전체 이름 + [인쇄·PDF 저장], 다른 사람에게는 진위 확인(이름 일부 가림).
 * 인쇄하면 사이트 머리·꼬리는 숨기고 수료증만 A4 가로로 나온다.
 */
export default function CertificatePage() {
  const { serial } = useParams<{ serial: string }>();
  const { loading } = useAuth();
  const [cert, setCert] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    apiRequest<CertificateInfo>(`/api/certificates/${encodeURIComponent(serial)}`).then((r) =>
      r.ok && r.data ? setCert(r.data) : setError(r.message || "확인되지 않는 수료증이에요.")
    );
  }, [loading, serial]);

  if (error) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold">{error}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">번호를 다시 확인해 주세요. ({serial})</p>
      </div>
    );
  }
  if (!cert) return <div className="mx-auto max-w-3xl px-4 py-16"><Skeleton className="aspect-[1.414] w-full" /></div>;

  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/certificates/${cert.serial}` : "";

  return (
    <div className="px-4 py-10 sm:py-14">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          body * { visibility: hidden !important; }
          #certificate, #certificate * { visibility: visible !important; }
          #certificate { position: fixed; inset: 0; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; width: 100vw; height: 100vh; }
        }
      `}</style>

      <div className="mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
        {cert.own ? (
          <Link href="/my/certificates" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← 내 수료증</Link>
        ) : (
          <p className="rounded-xl bg-[var(--brand-light)] px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]">✓ 심리상담실 현에서 발급한 수료증이 맞아요</p>
        )}
        {cert.own && (
          <button onClick={() => window.print()} className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
            인쇄 · PDF로 저장
          </button>
        )}
      </div>

      <div id="certificate" className="relative mx-auto flex aspect-[1.414] max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgb(0_0_0/0.08)]">
        <div className="absolute inset-3 rounded-xl border-2 border-[var(--brand)]/70 sm:inset-5" />
        <div className="absolute inset-5 rounded-lg border border-[var(--brand)]/30 sm:inset-7" />
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center sm:px-16">
          <p className="text-[0.6rem] font-semibold tracking-[0.4em] text-[var(--brand)] sm:text-xs">CERTIFICATE OF COMPLETION</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[0.3em] text-[var(--foreground)] sm:mt-4 sm:text-5xl">수 료 증</h1>
          <p className="mt-4 text-lg font-bold text-[var(--foreground)] sm:mt-10 sm:text-3xl">{cert.name} 님</p>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-[var(--foreground-muted)] sm:mt-6 sm:text-base">
            위 사람은 심리상담실 현의 {cert.kind === "workbook" ? "셀프 워크북" : "교육 과정"}
            <br />
            <strong className="text-[var(--foreground)]">「{cert.title}」</strong>
            <br />
            {eulReul(cert.title)} 성실히 {cert.kind === "workbook" ? "완주하였기에" : "이수하였기에"} 이 증서를 드립니다.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[0.6rem] text-[var(--foreground-muted)] sm:mt-8 sm:text-sm">
            {cert.startedAt && (
              <>
                <dt className="text-right">학습 기간</dt>
                <dd className="text-left">{krDate(cert.startedAt)} ~ {krDate(cert.completedAt)}</dd>
              </>
            )}
            {cert.minutes ? (
              <>
                <dt className="text-right">이수 시간</dt>
                <dd className="text-left">{hoursLabel(cert.minutes)}</dd>
              </>
            ) : null}
            {cert.periodLabel && (
              <>
                <dt className="text-right">과정</dt>
                <dd className="text-left">{cert.periodLabel}</dd>
              </>
            )}
          </dl>
          <p className="mt-4 text-xs font-semibold text-[var(--foreground)] sm:mt-10 sm:text-lg">{krDate(cert.issuedAt)}</p>
          <p className="mt-1 text-sm font-extrabold text-[var(--brand-ink)] sm:mt-2 sm:text-2xl">심리상담실 현</p>
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-2 px-8 pb-7 text-[0.5rem] text-[var(--foreground-subtle)] sm:px-12 sm:pb-10 sm:text-[0.7rem]">
          <span>
            수료증 번호 {cert.serial}
            {verifyUrl && <> · 확인 {verifyUrl}</>}
          </span>
          <span>이 수료증은 학회 수련시간·보수교육 인정과 관련이 없어요.</span>
        </div>
      </div>
    </div>
  );
}
