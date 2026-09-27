"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";
import { SocialLoginButtons } from "@/components/ko/SocialLoginButtons";
import { AgreementChecks, ProfileFields, type Gender } from "@/components/ko/ProfileFields";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!birthDate || !gender) {
      setError("생년월일과 성별을 입력해 주세요.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("필수 약관에 동의해 주세요.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, birthDate, gender, agreeTerms, agreePrivacy }) });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md card p-10 text-center">
          <p className="mb-3"><span className="eyebrow">거의 다 됐어요</span></p>
          <h2 className="font-display text-2xl text-[var(--foreground)]">메일함을 확인해 주세요</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
            <span className="font-medium text-[var(--foreground)]">{email}</span> 로 인증 링크를 보냈어요. 링크를 누르면 계정이 활성화됩니다. 메일이 안 보이면 스팸함도 확인해 주세요.
          </p>
          <Link href="/login" className="mt-6 inline-flex items-center rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
            로그인으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3"><span className="eyebrow">회원가입</span></p>
          <h1 className="font-display text-3xl text-[var(--foreground)]">이메일 하나면 충분해요</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">워크북 1주차는 가입만 하면 무료로 시작할 수 있어요.</p>
        </div>

        <div className="card p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Input id="name" label="이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 또는 닉네임" required autoComplete="name" />
            <Input id="email" type="email" label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            <Input
              id="password"
              type="password"
              label="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상, 영문과 숫자"
              required
              minLength={8}
              autoComplete="new-password"
              hint="8자 이상, 영문과 숫자를 함께 써 주세요."
            />
            <ProfileFields birthDate={birthDate} gender={gender} onBirthDate={setBirthDate} onGender={setGender} />
            <AgreementChecks terms={agreeTerms} privacy={agreePrivacy} onTerms={setAgreeTerms} onPrivacy={setAgreePrivacy} />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              가입하기
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--foreground-subtle)]">또는</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <SocialLoginButtons disabled={loading} />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
