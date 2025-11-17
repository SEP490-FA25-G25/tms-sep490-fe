## Teacher Journey — Attendance & Session Reporting

### Purpose

- Hỗ trợ giáo viên điểm danh và ghi chú buổi học trong ngày.
- Đảm bảo thông tin điểm danh chính xác, cập nhật trạng thái buổi học (`SessionStatus`) và teacher note.
- Cung cấp chế độ xem tổng quan theo lớp (attendance matrix) để theo dõi tiến độ học viên.

### Actors & Roles

- **Teacher**: sở hữu buổi học, thực hiện điểm danh và gửi báo cáo buổi học.

### Preconditions

- Giáo viên được gán vào session thông qua `teaching_slot` với trạng thái `SCHEDULED` hoặc `SUBSTITUTED`.
- Session ở trạng thái `PLANNED` trong ngày (hoặc ngày được chọn).
- Học viên đã được enroll, tạo `student_session` tương ứng (trạng thái `PLANNED`).

### Journey Overview

#### 1. Trang: Attendance Dashboard / Today’s Sessions

- **Step:** Giáo viên truy cập màn hình điểm danh, hệ thống hiển thị các buổi của **ngày hiện tại**.
- **API:** `GET /api/v1/attendance/sessions/today`
  - Backend luôn dùng `LocalDate.now()` cho truy vấn.
  - Response gồm: sessionId, class/course info, time slot, tổng số học viên, số đã điểm danh, `attendanceSubmitted`.
- **UI action:** Liệt kê card/row cho từng buổi, highlight buổi chưa điểm danh.

#### 2. Trang: Attendance Detail

- **Step:** Giáo viên chọn session → xem danh sách học viên và trạng thái điểm danh.
- **API:** `GET /api/v1/attendance/sessions/{sessionId}/students`
  - Trả về dữ liệu chi tiết: thông tin lớp, `summary`, danh sách học viên (`attendanceStatus`, `homeworkStatus`, `note`, `makeupSessionId` nếu học bù).
  - Backend kiểm tra quyền sở hữu (`AccessDeniedException` nếu không phải giáo viên của session).

#### 3. (Optional) Quick Actions

- **Mark All Present:** `POST /api/v1/attendance/sessions/{sessionId}/mark-all-present`
- **Mark All Absent:** `POST /api/v1/attendance/sessions/{sessionId}/mark-all-absent`
  - Cả hai endpoint chỉ trả về `summary` giả lập, **không** lưu DB. UI dùng để gợi ý “tất cả có mặt/vắng” trước khi chỉnh sửa từng học viên.

#### 4. Trang: Attendance Detail — Save

- **Step:** Giáo viên chỉnh sửa từng học viên và nhấn “Lưu”.
- **API:** `POST /api/v1/attendance/sessions/{sessionId}/save`

```json
{
  "records": [
    {
      "studentId": 501,
      "attendanceStatus": "PRESENT",
      "homeworkStatus": "COMPLETED",
      "note": "Đã nộp bài"
    },
    {
      "studentId": 502,
      "attendanceStatus": "ABSENT",
      "homeworkStatus": null,
      "note": "Xin nghỉ có phép"
    }
  ]
}
```

- Validation:
  - `records` bắt buộc, không được rỗng.
  - Mỗi `studentId` phải thuộc session; vi phạm → `ResourceNotFoundException`.
  - Sau khi lưu, backend cập nhật `attendanceStatus`, `homeworkStatus`, `note`, `recordedAt`.
- Response trả về `summary` cập nhật (total/present/absent) giúp UI refresh thống kê.

#### 5. Trang: Session Report

- **View report:** `GET /api/v1/attendance/sessions/{sessionId}/report`
  - Cho phép review thông tin đã lưu và teacher note hiện tại.
- **Submit report:** `POST /api/v1/attendance/sessions/{sessionId}/report`

```json
{
  "teacherNote": "Lớp học tiến bộ tốt, giao bài tập 15 phút."
}
```

- Khi submit:
  - Backend cập nhật `session.teacherNote`.
  - Chuyển `session.status` → `DONE`.
  - Response trả về note + `summary` để UI hiển thị trạng thái sau khi hoàn tất.
- Điểm danh có thể lưu nhiều lần, nhưng báo cáo gửi xong coi như chốt buổi (status = DONE).

#### 6. Trang: Class Attendance Matrix (History)

- **Step:** Giáo viên xem tổng quan attendance của lớp trong suốt khóa.
- **API:** `GET /api/v1/attendance/classes/{classId}/matrix`
  - Backend đảm bảo giáo viên có ít nhất một session trong lớp (`AccessDeniedException` nếu không).
  - Response gồm:
    - `sessions`: thông tin từng session (date, time slot, status).
    - `students`: mỗi học viên có danh sách cell theo session (`attendanceStatus`, `makeup` flag).
  - Dùng để render bảng matrix (học viên × buổi), highlight học viên hay vắng.

### Key Error Conditions

- `AccessDeniedException`: giáo viên không sở hữu session/lớp.
- `ResourceNotFoundException`: session hoặc học viên không tồn tại trong buổi.
- `IllegalArgumentException`: body lưu điểm danh không chứa record nào.
- Khi submit report, session đã `DONE` vẫn có thể xem nhưng nên hạn chế sửa (bên UI).

### Data & Audit Trail

- `student_session` cập nhật `attendance_status`, `homework_status`, `note`, `recorded_at`.
- `session` cập nhật `teacher_note`, `status`.
- Attendance summary được tính toán động dựa trên bảng `student_session`.
- Các endpoint trả về `ResponseObject<T>` thống nhất (`success`, `message`, `data`).

### Testing Touchpoints

- `AttendanceServiceImplTest` / `AttendanceControllerIT` (nếu có) kiểm tra logic lưu điểm danh, quyền truy cập.
- `TeacherContextHelper` và `StudentContextHelper` unit tests đảm bảo lấy đúng teacher/student từ `UserPrincipal`.
- Integration tests chạy qua `mvn clean verify` để xác nhận quyền, logic submit report, và matrix hoạt động đúng.

---

## Student Journey — Attendance Tracking

### Purpose

- Giúp học viên xem nhanh tỷ lệ chuyên cần theo từng lớp và chi tiết từng buổi (điểm danh, làm bài tập, học bù).

### Actors & Roles

- **Student**: học viên đã enroll lớp, đăng nhập hệ thống.

### Preconditions

- Học viên đã có `student_session` tương ứng với các buổi học trong class.
- Tài khoản đăng nhập map tới `student` thông qua `StudentContextHelper`.

### Journey Overview

#### 1. Trang: Attendance (Tab Overview)

- **Step:** Học viên mở tab Attendance để xem tổng quan chuyên cần theo từng lớp.
- **API:** `GET /api/v1/students/attendance/overview`
  - Response: `StudentAttendanceOverviewResponseDTO` chứa `classes` (danh sách `StudentAttendanceOverviewItemDTO`).
  - Mỗi item có: `classId`, `classCode`, thông tin khoá học (`courseId`, `courseCode`, `courseName`), `totalSessions`, `attended`, `absent`, `excused`, `upcoming`, `attendanceRate`, `status`, `lastUpdated`.
- **UI action:** Hiển thị card/list theo lớp. Cho phép nhấp vào từng card để đi đến báo cáo chi tiết lớp đó.

#### 2. Trang: Attendance (Class Report)

- **Step:** Học viên chọn một lớp trong tab Attendance để xem tất cả buổi học.
- **API:** `GET /api/v1/students/attendance/report?classId={id}`
  - Response: `StudentAttendanceReportResponseDTO` gồm:
    - Thông tin lớp/khoá học: `classId`, `classCode`, `courseId`, `courseCode`, `courseName`.
    - `summary`: số liệu tổng (`totalSessions`, `attended`, `absent`, `excused`, `upcoming`, `attendanceRate`).
    - `sessions`: danh sách `StudentAttendanceReportSessionDTO`.
  - Mỗi `StudentAttendanceReportSessionDTO` có: `sessionId`, `date`, `status`, `attendanceStatus`, `homeworkStatus`, `isMakeup`, `note`, `makeupSessionInfo` (session học bù liên quan, có `attended` để biết đã tham gia hay chưa).
- **UI action:** Render bảng/chronological list thể hiện buổi học nào `PRESENT`, `ABSENT`, `PLANNED`, đồng thời hiển thị ghi chú và thông tin học bù.

#### 3. (Optional) Weekly Schedule Cross-check

- **Step:** Học viên có thể mở trang lịch học để đối chiếu buổi sắp tới.
- **API:** `GET /api/v1/students/me/schedule?weekStart=YYYY-MM-DD`
  - Response: `WeeklyScheduleResponseDTO` với `schedule` → `SessionSummaryDTO` (bao gồm `attendanceStatus`, `isMakeup`, location).
- **UI action:** Dùng để xem lịch trong tuần, highlight buổi cần học bù hoặc buổi đã vắng.

### Key Error Conditions (Student)

- `AccessDeniedException`: học viên cố truy cập session/lớp không thuộc về mình.
- `ResourceNotFoundException`: buổi học không tồn tại hoặc chưa tạo record attendance.

### Additional Notes

- Student Attendance APIs sử dụng `StudentContextHelper` để map JWT → student; log cảnh báo khi thiếu `UserPrincipal` hoặc sai student ID.
- Khi giáo viên submit report và chuyển session sang `DONE`, dữ liệu trong report và lịch sẽ phản ánh `attendanceStatus`, `teacherNote`, `makeupSessionInfo`.
