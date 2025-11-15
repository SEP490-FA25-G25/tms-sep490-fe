## Teacher Request Journey — Reschedule

### Purpose

- Cho phép teacher dời lịch một session sang ngày/khung giờ/resource khác trong vòng 7 ngày tới.
- Đảm bảo Academic Affair staff có thể rà soát, điều chỉnh thông tin và approve/reject.
- Giữ thống nhất dữ liệu: tạo session mới, copy teaching slot & student attendance, hủy session cũ.

### Actors & Roles

- **Teacher** (request owner): đề xuất dời lịch cho session mình phụ trách.
- **Academic Affair Staff**: rà soát, có thể override thông tin (date/time/resource) và quyết định approve hoặc reject.

### Preconditions

- Session nằm trong window 7 ngày tính từ hôm nay (`validateTimeWindow`).
- Teacher đang sở hữu session (`validateTeacherOwnsSession`).
- Khi submit request, teacher cung cấp đầy đủ `newDate`, `newTimeSlotId`, `newResourceId`.

### Journey Overview

#### Teacher Flow

1. **Trang: Request / My Requests**  
   **Step:** Teacher xem danh sách request hiện có, có thể chọn “Create Request”  
   **API:** `GET /api/v1/teacher-requests/me`
   - Trả về toàn bộ requests liên quan teacher
   - Hiển thị thông tin: requestId, requestType, status, session info, submittedAt
   - **UI action:** Nút “Create Request”

2. **Trang: Create Request - Select Request Type**  
   **Step:** Teacher chọn loại request là `RESCHEDULE`  
   **API:** Không (UI action)

3. **Trang: Create Request - Select Session**  
   **Step:** Sau khi chọn RESCHEDULE, hệ thống hiển thị danh sách sessions để teacher chọn  
   **API:** `GET /api/v1/teacher-requests/my-sessions?date={today}`

   - Trả về danh sách sessions trong 7 ngày tới (hoặc filter theo date)
   - Hiển thị thông tin: sessionId, date, time, class, course, topic
   - Hiển thị trạng thái request nếu có: `requestStatus`, `hasPendingRequest`
   - Teacher chọn một session từ danh sách

4. **Trang: Create Request - Pick New Date & Slot**  
   **Step:** Teacher chọn ngày mới (mặc định gợi ý 7 ngày tới)  
   **API:** Không (UI action)

5. **Trang: Create Request - Suggest Time Slots**  
   **Step:** Teacher nhấn “Suggest Slots” để xem khung giờ không conflict  
   **API:** `GET /api/v1/teacher-requests/{sessionId}/reschedule/slots?date={newDate}`
   - Backend validate:
     - `validateTeacherConflict` đảm bảo teacher không bị trùng lịch
     - `ensureNoStudentConflicts` đảm bảo học viên không bị trùng lịch
   - Trả về danh sách `timeSlotId`, `label`

6. **Trang: Create Request - Suggest Resources**  
   **Step:** Sau khi chọn time slot mới, teacher nhấn “Suggest Resources”  
   **API:** `GET /api/v1/teacher-requests/{sessionId}/reschedule/suggestions?date={newDate}&timeSlotId={timeSlotId}`
   - Lọc resource theo branch, modality phù hợp, đủ capacity
   - Check availability (`validateResourceAvailability`)

7. **Trang: Create Request - Request Form**  
   **Step:** Teacher điền lý do và submit  
   **API:** `POST /api/v1/teacher-requests`
   **Request Body (bắt buộc đủ 3 giá trị mới):**
   ```json
   {
     "sessionId": 123,
     "requestType": "RESCHEDULE",
     "newDate": "2025-11-18",
     "newTimeSlotId": 4,
     "newResourceId": 52,
     "reason": "Teacher bận coi thi nội bộ, xin dời sang chiều"
   }
   ```
   - Backend validations:
     - Kiểm tra duplicate `PENDING` RESCHEDULE
     - `newDate` không trong quá khứ và nằm trong 7 ngày
     - `newResourceId` và `newTimeSlotId` tồn tại
   - Request tạo ở trạng thái `PENDING`, lưu thông tin `newDate`, `newTimeSlot`, `newResource`

8. **Trang: My Requests / Request List**  
   **Step:** Teacher quay lại xem danh sách request (bao gồm request vừa tạo)  
   **API:** `GET /api/v1/teacher-requests/me`

9. **Trang: Request Detail**  
   **Step:** Teacher xem chi tiết request, gồm thông tin ngày/slot/resource mới  
   **API:** `GET /api/v1/teacher-requests/{id}`
   - Chỉ teacher tạo request (hoặc replacement teacher — không áp dụng với RESCHEDULE) mới xem được

#### Staff Flow

10. **Trang: Staff Dashboard / Request Management**  
    **Step:** Staff xem queue tất cả request  
    **API:** `GET /api/v1/teacher-requests/staff`
    - Có thể filter bằng `status` nếu cần

11. **Trang: Request Detail (Staff View)**  
    **Step:** Staff mở chi tiết để review  
    **API:** `GET /api/v1/teacher-requests/{id}`
    - Thấy rõ `newDate`, `newTimeSlotName`, `newResourceName`
    - Có thể so sánh với session gốc

12. **Trang: Request Detail / Approval Form**  
    **Step:** Staff approve  
    **API:** `PATCH /api/v1/teacher-requests/{id}/approve`
    **Request Body (override optional):**
    ```json
    {
      "newDate": "2025-11-19",
      "newTimeSlotId": 5,
      "newResourceId": 60,
      "note": "Dời sang slot chiều, phòng Lab 2"
    }
    ```
    **Logic khi approve (`approveReschedule`):**
    - Dùng thông tin override nếu staff cung cấp, ngược lại dùng dữ liệu từ request
    - Re-validate conflicts: teacher availability & resource availability
    - Tạo session mới:
      - copy class/courseSession/time slot mới/date mới
      - `status = PLANNED`, set `createdAt`, `updatedAt`
    - Copy teaching slot & student sessions (chỉ những attendance `PLANNED`)
    - Tạo `session_resource` cho resource mới
    - Set session cũ `status = CANCELLED`
    - Gán `newSession` vào request, set status `APPROVED`, lưu `decidedBy`, `decidedAt`, `note`

13. **Trang: Request Detail / Rejection Form**  
    **Step:** Staff reject  
    **API:** `PATCH /api/v1/teacher-requests/{id}/reject`
    ```json
    {
      "reason": "Không còn slot trống trong tuần"
    }
    ```
    - Request sang trạng thái `REJECTED`, lưu reason vào note

#### Post-Approval

14. **Trang: My Requests / Request Detail**  
    **Step:** Teacher xem kết quả  
    **API:** `GET /api/v1/teacher-requests/{id}`
    - Nếu approved: hiển thị `newSessionId` (session mới), session cũ đã CANCELLED
    - Nếu rejected: status `REJECTED`, hiển thị note từ staff
    - Có thể xem lại trong danh sách `GET /me`

### Key Error Conditions

- `INVALID_INPUT`: thiếu dữ liệu mới hoặc ngày mới không hợp lệ.
- `SESSION_NOT_IN_TIME_WINDOW`: session vượt quá 7 ngày.
- `TEACHER_AVAILABILITY_CONFLICT`: teacher bị trùng lịch ở slot mới.
- `RESOURCE_NOT_AVAILABLE`, `TIMESLOT_NOT_FOUND`, `RESOURCE_NOT_FOUND`.
- `TEACHER_REQUEST_DUPLICATE`: đã có request RESCHEDULE pending.

### Data & Audit Trail

- Request lưu: `newDate`, `newTimeSlot`, `newResource`, `status`, `submittedBy`, `decidedBy`, `note`.
- Khi approve: log tạo session mới và hủy session cũ.
- DTO response thống nhất qua `ResponseObject<T>`, hiển thị đủ thông tin cho UI.

### Testing Touchpoints

- `TeacherRequestServiceImplRescheduleTest`: unit test cho tạo request, approve logic, validations.
- `TeacherRequestRescheduleIT`: integration test đảm bảo lazy loading/new session creation hoạt động đúng.


