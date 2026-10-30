import { HiddenGate } from "@/components/ko/HiddenGate";
import { SHOW_COUNSELING } from "@/lib/site";

// 당분간 숨김 — 관리자(와 이용권이 있는 회원)만 (lib/site.ts SHOW_COUNSELING)
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HiddenGate show={SHOW_COUNSELING} kind="counseling">
      {children}
    </HiddenGate>
  );
}
