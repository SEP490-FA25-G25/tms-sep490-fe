"use client";

import QAStudentFeedbackPage from "@/app/qa/student-feedback/page";

export default function CenterHeadFeedbacksPage() {
  // Tái sử dụng UI từ màn QA Student Feedback
  // Center Head chỉ có quyền xem phản hồi, không được chỉnh sửa
  return <QAStudentFeedbackPage />;
}
