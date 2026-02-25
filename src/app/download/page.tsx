"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type DownloadStatus = "loading" | "success" | "expired" | "used" | "error";

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<DownloadStatus>("loading");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const fetchDownload = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/email-download/${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (res.status === 410) {
          setStatus("expired");
          return;
        }
        if (res.status === 403) {
          setStatus("used");
          return;
        }
        if (!res.ok || !data.success) {
          setStatus("error");
          return;
        }

        // 다운로드 시작
        setFilename(data.data.filename ?? "download.pdf");
        setStatus("success");
        window.open(data.data.url, "_blank");
      } catch {
        setStatus("error");
      }
    };

    fetchDownload();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center shadow-sm">

        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
            <p className="text-sm text-[var(--foreground-muted)]">Preparing your download…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)]">
              <svg className="h-6 w-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Download Started</h1>
            <p className="mb-1 text-sm text-[var(--foreground-muted)]">
              Your file <strong>{filename}</strong> is downloading.
            </p>
            <p className="text-xs text-[var(--foreground-subtle)]">
              If the download did not start,{" "}
              <Link href="/mypage" className="text-[var(--brand)] hover:underline">
                visit your account page
              </Link>{" "}
              to download again.
            </p>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Link Expired</h1>
            <p className="mb-4 text-sm text-[var(--foreground-muted)]">
              This download link has expired. Please contact us for assistance.
            </p>
            <Link
              href="/mypage"
              className="inline-block rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]"
            >
              Go to My Page
            </Link>
          </>
        )}

        {status === "used" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50">
              <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Link Already Used</h1>
            <p className="mb-4 text-sm text-[var(--foreground-muted)]">
              This download link has already been used. You can download your file from your account page.
            </p>
            <Link
              href="/mypage"
              className="inline-block rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]"
            >
              Go to My Page
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Something Went Wrong</h1>
            <p className="mb-4 text-sm text-[var(--foreground-muted)]">
              We could not process your download request. Please try again or contact us.
            </p>
            <Link
              href="/mypage"
              className="inline-block rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)]"
            >
              Go to My Page
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
