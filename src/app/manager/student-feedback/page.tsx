"use client";

import QAStudentFeedbackPage from "@/app/qa/student-feedback/page";

export default function ManagerStudentFeedbackPage() {
  // Tạm thời tái sử dụng toàn bộ UI & logic của màn QA Student Feedback,
  // backend đã mở quyền MANAGER cho các API feedback nên Manager chỉ có quyền xem.
  return <QAStudentFeedbackPage />;
}


