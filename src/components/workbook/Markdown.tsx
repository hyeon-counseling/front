import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Block } from "@/lib/workbook";

// 워크북 본문 마크다운
export function Markdown({ md, className = "" }: { md: string; className?: string }) {
  return (
    <div className={`prose-ko text-[1rem] ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
}

const TONE: Record<NonNullable<Block["tone"]>, string> = {
  info: "bg-[var(--brand-light)]/60 border-[var(--brand-light)]",
  quote: "bg-[var(--surface)] border-transparent",
  caution: "bg-amber-50 border-amber-200",
};

// 안내 박스 (quote는 오늘의 한 줄 같은 짧은 문장)
export function Callout({ block }: { block: Block }) {
  const tone = block.tone ?? "info";
  if (tone === "quote") {
    return (
      <div className="flex gap-3 rounded-2xl bg-[var(--surface)] px-5 py-4">
        <span className="mt-0.5 text-lg leading-none text-[var(--brand)]" aria-hidden>
          “
        </span>
        <div className="prose-ko text-[0.95rem] font-medium [&_p]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.md ?? ""}</ReactMarkdown>
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border px-5 py-5 sm:px-6 ${TONE[tone]}`}>
      <div className="prose-ko text-[0.95rem] [&>*:last-child]:mb-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.md ?? ""}</ReactMarkdown>
      </div>
    </div>
  );
}
