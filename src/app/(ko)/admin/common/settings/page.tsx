"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// 이메일 발신 설정 페이지 (관리자)
// 가드는 admin/layout.tsx에서 처리하므로 여기서는 데이터만 다룬다.

const EMAIL_DOMAIN = "hyeon-counseling.com";

interface EmailSettings {
  emailFromName: string;
  emailFromLocalPart: string;
  defaultDownloadExpiryDays: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    emailFromName: "",
    emailFromLocalPart: "",
    defaultDownloadExpiryDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/settings");
      setSettings({
        emailFromName: data.emailFromName ?? "",
        emailFromLocalPart: data.emailFromLocalPart ?? "",
        defaultDownloadExpiryDays: data.defaultDownloadExpiryDays ?? 30,
      });
    } catch {
      // 조용히 무시 — 저장 시 다시 시도
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const data = await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          emailFromName: settings.emailFromName,
          emailFromLocalPart: settings.emailFromLocalPart,
          defaultDownloadExpiryDays: settings.defaultDownloadExpiryDays,
        }),
      });
      setSettings({
        emailFromName: data.emailFromName ?? "",
        emailFromLocalPart: data.emailFromLocalPart ?? "",
        defaultDownloadExpiryDays: data.defaultDownloadExpiryDays ?? 30,
      });
      setMsg("저장되었습니다.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-[var(--foreground)]">설정 · 이메일 발신</h1>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
          <form onSubmit={handleSave} className="space-y-4">
            {/* 발신자 이름 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">발신자 이름</label>
              <input
                type="text"
                value={settings.emailFromName}
                onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                placeholder="Hyeon Counseling"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
              />
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">받는 사람의 메일함에 표시되는 이름입니다.</p>
            </div>

            {/* 발신 이메일 주소 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">발신 이메일 주소</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={settings.emailFromLocalPart}
                  onChange={(e) => setSettings({ ...settings, emailFromLocalPart: e.target.value })}
                  placeholder="no-reply"
                  className="w-40 rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
                />
                <span className="flex h-[42px] items-center rounded-r-xl border border-[var(--border)] bg-[var(--surface-muted,#f5f5f5)] px-3 text-sm text-[var(--foreground-subtle)]">
                  @{EMAIL_DOMAIN}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">영문, 숫자, -, _, . 만 사용 가능합니다.</p>
            </div>

            {/* 미리보기 */}
            {settings.emailFromName && settings.emailFromLocalPart && (
              <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
                <p className="text-xs text-[var(--foreground-subtle)]">미리보기</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                  {settings.emailFromName} &lt;{settings.emailFromLocalPart}@{EMAIL_DOMAIN}&gt;
                </p>
              </div>
            )}

            {/* 다운로드 만료일 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">기본 다운로드 만료일 (일)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.defaultDownloadExpiryDays}
                onChange={(e) => setSettings({ ...settings, defaultDownloadExpiryDays: parseInt(e.target.value, 10) || 0 })}
                className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
              />
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">구매일로부터 N일간 다운로드 가능합니다. 0을 입력하면 만료 없이 무제한 다운로드됩니다.</p>
            </div>

            {msg && (
              <p className={`text-sm ${msg === "저장되었습니다." ? "text-[var(--brand)]" : "text-red-600"}`}>{msg}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
