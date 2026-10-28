import { redirect } from "next/navigation";

// /admin/assessment → 신청·진행 현황
export default function AssessmentAdminIndex() {
  redirect("/admin/assessment/applications");
}
