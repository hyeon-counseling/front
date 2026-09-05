"use client";

/**
 * 공용 UI 킷 — 한국어 사이트·관리자에서 공통으로 쓰는 기본 요소.
 * 브랜드 CSS 변수만 사용한다(색상 하드코딩 금지).
 */

import Link from "next/link";
import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ── 유틸 ──
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ── Button ──
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]",
  secondary: "border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-light)]",
  ghost: "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
  danger: "border border-[var(--error)] text-[var(--error)] hover:bg-red-50",
};
const sizeClass: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClass[variant],
        sizeClass[size],
        className
      )}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}
export function LinkButton({ href, variant = "primary", size = "md", className, children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        variantClass[variant],
        sizeClass[size],
        className
      )}
    >
      {children}
    </Link>
  );
}

// ── Card ──
export function Card({ className, children, muted }: { className?: string; children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-[var(--border)]",
        muted ? "bg-[var(--surface)]" : "bg-[var(--background)]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Input / Textarea ──
const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)]";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <input id={id} {...rest} className={cx(fieldClass, error && "border-[var(--error)]", className)} />
      {hint && !error && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}

export function Textarea({ label, hint, error, id, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <textarea id={id} {...rest} className={cx(fieldClass, "min-h-[120px] leading-relaxed", error && "border-[var(--error)]", className)} />
      {hint && !error && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}

// ── Badge ──
type Tone = "brand" | "neutral" | "warning" | "error" | "success";
const toneClass: Record<Tone, string> = {
  brand: "bg-[var(--brand-light)] text-[var(--brand)]",
  neutral: "bg-[var(--surface-muted)] text-[var(--foreground-muted)]",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}

// ── Alert (인라인 메시지) ──
export function Alert({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "bg-red-50 text-red-700"
      : tone === "success"
        ? "bg-[var(--brand-light)] text-[var(--brand-ink)]"
        : "bg-[var(--surface)] text-[var(--foreground-muted)]";
  return <div className={cx("rounded-xl px-4 py-3 text-sm", cls)}>{children}</div>;
}

// ── EmptyState ──
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center">
      <p className="font-display text-lg text-[var(--foreground)]">{title}</p>
      {description && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-[var(--surface)]", className)} />;
}

// ── Modal ──
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(44,36,32,0.45)] p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--background)] p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        {title && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl text-[var(--foreground)]">{title}</h2>
            <button onClick={onClose} aria-label="닫기" className="cursor-pointer rounded-full p-1 text-[var(--foreground-subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── PageHeader (페이지 상단 제목 블록) ──
export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-10 sm:mb-14">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-[var(--foreground-muted)] leading-relaxed">{description}</p>}
      {children}
    </div>
  );
}

// ── Toast (아주 단순한 전역 토스트) ──
export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-[var(--brand-ink)] px-5 py-2.5 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
