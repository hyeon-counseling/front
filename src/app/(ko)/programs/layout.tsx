import { HiddenGate } from "@/components/ko/HiddenGate";
import { SHOW_COURSES } from "@/lib/site";

// 당분간 숨김 — 관리자(와 이용권이 있는 회원)만 (lib/site.ts SHOW_COURSES)
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HiddenGate show={SHOW_COURSES} kind="programs">
      {children}
    </HiddenGate>
  );
}
