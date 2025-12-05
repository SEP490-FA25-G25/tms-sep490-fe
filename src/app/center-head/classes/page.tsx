"use client";

import AcademicClassesPage from "@/app/academic/classes/page";

export default function CenterHeadClassesPage() {
  // Center Head chỉ được xem danh sách, không được chỉnh sửa, không được tạo lớp
  return <AcademicClassesPage disableManageActions />;
}
