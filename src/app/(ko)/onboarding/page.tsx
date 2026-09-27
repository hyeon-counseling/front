"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { AgreementChecks, ProfileFields, type Gender } from "@/components/ko/ProfileFields";

/**
 * 추가 회원정보 입력 — 구글로 가입했거나, 생년월일·성별이 없는 기존 회원
 * 심리검사 결과를 해석하고 통계를 내는 데 필요해 필수로 받는다.
 */
function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/my";
  const { user, loading, updateUser } = useAuth();
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);
  }, [loading, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!birthDate || !gender) {
      setError("생년월일과 성별을 입력해 주세요.");
      return;
    }
    setSaving(true);
    const res = await apiRequest<{ birthDate: string; gender: Gender; profileComplete: boolean; sensitiveAgreed: boolean }>("/api/auth/me/profile", {
      method: "PUT",
      body: JSON.stringify({ birthDate, gender, agreeTerms: terms, agreePrivacy: privacy }),
    });
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.message || "저장하지 못했어요.");
      return;
    }
    updateUser(res.data);
    router.replace(next.startsWith("/") ? next : "/my");
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3"><span className="eyebrow">추가 정보</span></p>
          <h1 className="font-display text-3xl text-[var(--foreground)]">{user.name}님, 반가워요</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            심리검사 결과를 나이·성별에 맞게 해석하고, 더 나은 프로그램을 만드는 데 쓰여요. 한 번만 입력하면 돼요.
          </p>
        </div>
        <form onSubmit={submit} className="card space-y-5 p-8 shadow-soft">
          {error && <Alert>{error}</Alert>}
          <ProfileFields birthDate={birthDate} gender={gender} onBirthDate={setBirthDate} onGender={setGender} />
          <AgreementChecks terms={terms} privacy={privacy} onTerms={setTerms} onPrivacy={setPrivacy} />
          <p className="text-xs text-[var(--foreground-subtle)]">이미 동의하셨다면 다시 체크하지 않아도 저장돼요.</p>
          <Button type="submit" loading={saving} className="w-full" size="lg">
            저장하고 계속하기
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
