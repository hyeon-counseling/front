"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Alert, Button, Input, Skeleton } from "@/components/ui";
import { DeletionSummary, type DeletionPreview } from "@/components/my/DeletionSummary";

// 내 계정 — 계정 정보와 회원 탈퇴. 탈퇴 규칙은 관리자 삭제와 같다(백엔드 memberDeletionService)
// 구글 등 소셜 가입 회원은 비밀번호가 없으므로 확인 문구로 진행한다
const CONFIRM_WORD = "탈퇴";

export default function MyAccountPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user && !done) router.replace("/login?next=/my/account");
  }, [loading, user, done, router]);

  const openGuide = async () => {
    setOpen(true);
    setError("");
    const r = await apiRequest<DeletionPreview>("/api/auth/me/deletion-preview");
    if (r.ok && r.data) setPreview(r.data);
    else setError(r.message || "안내를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  };

  const withdraw = async () => {
    setDeleting(true);
    setError("");
    const r = await apiRequest<{ blockers?: DeletionPreview["blockers"] }>("/api/auth/me", { method: "DELETE", body: JSON.stringify({ confirm: confirmText }) });
    setDeleting(false);
    if (r.ok) {
      setDone(true);
      logout();
      return;
    }
    if (r.data?.blockers && preview) setPreview({ ...preview, blockers: r.data.blockers });
    setError(r.message || "탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl text-[var(--foreground)]">탈퇴가 끝났어요</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">그동안 함께해 주셔서 고마워요.</p>
        <Link href="/" className="link-underline mt-6 inline-block text-sm text-[var(--foreground)]">처음으로</Link>
      </div>
    );
  }
  if (loading || !user) return null;

  const assessmentBlock = preview?.blockers.find((b) => b.code === "assessment");
  const adminBlock = preview?.blockers.find((b) => b.code === "admin");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl text-[var(--foreground)]">내 계정</h1>

      <section className="card mt-8 p-6">
        <p className="text-xs font-semibold text-[var(--foreground-subtle)]">이름</p>
        <p className="mt-0.5 font-semibold text-[var(--foreground)]">{user.name}</p>
        <p className="mt-4 text-xs font-semibold text-[var(--foreground-subtle)]">이메일</p>
        <p className="mt-0.5 break-all font-semibold text-[var(--foreground)]">{user.email}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-[var(--foreground)]">회원 탈퇴</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">탈퇴하면 계정을 되살릴 수 없어요. 무엇이 지워지고 무엇이 남는지 먼저 확인해 주세요.</p>

        {!open ? (
          <Button variant="secondary" size="md" className="mt-4" onClick={openGuide}>
            탈퇴 안내 보기
          </Button>
        ) : (
          <div className="card mt-4 space-y-5 p-6">
            {error && <Alert>{error}</Alert>}
            {!preview ? (
              !error && <Skeleton className="h-48" />
            ) : (
              <>
                <DeletionSummary preview={preview} />
                {preview.kept.some((k) => k.label.startsWith("종합심리검사") && k.count > 0) && (
                  <Alert tone="info">탈퇴 후에는 검사 진행 화면과 보고서를 볼 수 없어요. 필요하면 탈퇴 전에 내려받아 주세요. 해석 영상은 내려받을 수 없어요.</Alert>
                )}

                {assessmentBlock || adminBlock ? (
                  <div className="rounded-xl bg-[var(--surface)] px-4 py-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    <p className="font-bold text-[var(--foreground)]">지금은 탈퇴할 수 없어요</p>
                    {adminBlock && <p className="mt-1">{adminBlock.message}</p>}
                    {assessmentBlock && (
                      <>
                        <p className="mt-1">{assessmentBlock.message}</p>
                        <p className="mt-1">취소하려면 심리검사 진행 화면에서 [취소 요청]을 눌러 주세요. 환불까지 끝나면 탈퇴할 수 있어요.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href="/my/assessment" className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                            심리검사 진행 보기
                          </Link>
                          <Link href="/contact" className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)]">
                            문의하기
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      id="withdraw-confirm"
                      label={`계속하려면 「${CONFIRM_WORD}」를 입력해 주세요`}
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={CONFIRM_WORD}
                      autoComplete="off"
                    />
                    <Button variant="danger" size="md" className="w-full" loading={deleting} disabled={confirmText.trim() !== CONFIRM_WORD} onClick={withdraw}>
                      회원 탈퇴
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
