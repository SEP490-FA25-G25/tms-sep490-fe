## Teacher Request Journey — Swap

### Purpose

- Cho phép teacher xin người khác dạy thay một session (swap).
- Hỗ trợ staff giám sát, override replacement teacher nếu cần trước khi gửi xác nhận.
- Cung cấp quy trình replacement teacher xác nhận/ từ chối, cập nhật teaching slot tương ứng.

### Actors & Roles

- **Teacher (Original)**: tạo request nhờ người dạy thay.
- **Replacement Teacher**: người được đề xuất/được staff gán để dạy thay.
- **Academic Affair Staff**: duyệt request, có thể đổi replacement teacher.

### Preconditions

- Session nằm trong 7 ngày tới (`validateTimeWindow`).
- Teacher đang sở hữu session (`validateTeacherOwnsSession`).
- Replacement teacher (nếu chọn) khác với original teacher.

### Journey Overview

#### Teacher (Original) Flow

1. **Trang: Request / My Requests**  
   **Step:** Teacher xem danh sách request hiện có, có nút “Create Request”  
   **API:** `GET /api/v1/teacher-requests/me`

2. **Trang: Create Request - Select Request Type**  
   **Step:** Chọn loại request `SWAP`  
   **API:** Không (UI action)

3. **Trang: Create Request - Select Session**  
   **Step:** Sau khi chọn SWAP, hệ thống hiển thị danh sách sessions đủ điều kiện để teacher chọn  
   **API:** `GET /api/v1/teacher-requests/my-sessions?date={today}`

   - Trả về danh sách sessions trong 7 ngày tới (hoặc theo filter date)
   - Hiển thị thông tin: sessionId, date, time, class, course, topic
   - Kèm trạng thái request: `requestStatus`, `hasPendingRequest` để biết session đang chờ xử lý request khác
   - Teacher chọn một session từ danh sách

4. **Trang: Create Request - Suggest Replacement** (optional)  
   **Step:** Teacher bấm “Suggest Swap Candidates” để xem danh sách gợi ý  
   **API:** `GET /api/v1/teacher-requests/{sessionId}/swap/candidates`

   - Loại bỏ teacher hiện tại và những teacher đã từng decline (lưu trong note)
   - Trả về danh sách `SwapCandidateDTO` với ưu tiên skill và availability

5. **Trang: Create Request - Request Form**  
   **Step:** Teacher chọn replacement teacher (optional) và nhập lý do  
   **API:** `POST /api/v1/teacher-requests`
   **Request Body ví dụ:**

   ```json
   {
     "sessionId": 117,
     "requestType": "SWAP",
     "replacementTeacherId": 88, // optional
     "reason": "Bận công tác đột xuất, nhờ thầy Minh dạy thay"
   }
   ```

   - Backend validations:
     - Không cho duplicate `PENDING` swap trên session đó
     - Nếu chọn replacement teacher: check tồn tại, khác original teacher
   - Request tạo với status `PENDING`

6. **Trang: My Requests / Request Detail**  
   **Step:** Teacher xem lại request vừa tạo và theo dõi trạng thái  
   **API:** `GET /api/v1/teacher-requests/{id}`
   - Thấy thông tin session và replacement teacher (nếu đã chọn)

#### Academic Affair Staff Flow

7. **Trang: Staff Dashboard / Request Management**  
   **Step:** Staff xem queue request  
   **API:** `GET /api/v1/teacher-requests/staff` (có thể filter `status`)

8. **Trang: Request Detail (Staff View)**  
   **Step:** Staff mở chi tiết để xem thông tin session + teacher đề xuất  
   **API:** `GET /api/v1/teacher-requests/{id}`

9. **Trang: Request Detail / Approval Form**  
   **Step:** Staff approve và quyết định replacement teacher  
   **API:** `PATCH /api/v1/teacher-requests/{id}/approve`

   ```json
   {
     "replacementTeacherId": 95, // staff có thể override hoặc cung cấp nếu teacher không chọn
     "note": "Đã gán thầy Nam dạy thay, chờ xác nhận"
   }
   ```

   **Logic (`approveSwap`):**

   - Lấy replacement teacher từ staff override hoặc từ request; nếu cả hai null → `INVALID_INPUT`
   - Validate replacement teacher không trùng original, không có conflict lịch (`validateTeacherConflict`)
   - Lưu replacement teacher vào request
   - Set status `WAITING_CONFIRM`, ghi `decidedBy`, `decidedAt`, `note`

10. **Trang: Request Detail / Rejection Form**  
    **Step:** Staff reject (khi không tìm được người phù hợp, lý do không hợp lệ, ...)  
    **API:** `PATCH /api/v1/teacher-requests/{id}/reject`
    ```json
    {
      "reason": "Không có giáo viên trống ca này"
    }
    ```
    - Status → `REJECTED`, lưu reason

#### Replacement Teacher Flow

11. **Trang: My Requests (Replacement)**  
    **Step:** Replacement teacher xem request đang chờ mình xác nhận  
    **API:** `GET /api/v1/teacher-requests/me`

    - Endpoint này trả về cả requests mà teacher là replacement
    - Status hiển thị `WAITING_CONFIRM`

12. **Trang: Request Detail (Replacement View)**  
    **Step:** Replacement teacher kiểm tra thông tin chi tiết  
    **API:** `GET /api/v1/teacher-requests/{id}`

13. **Trang: Request Detail / Confirm Swap**  
    **Step:** Replacement teacher đồng ý dạy thay  
    **API:** `PATCH /api/v1/teacher-requests/{id}/confirm`

    - Điều kiện: request type = SWAP, status = `WAITING_CONFIRM`, user chính là replacement teacher
    - Logic (`confirmSwap`):
      - Teaching slot của original teacher → `ON_LEAVE`
      - Tạo/cập nhật teaching slot cho replacement teacher → `SUBSTITUTED`
      - Status request → `APPROVED`, lưu `decidedAt`

14. **Trang: Request Detail / Decline Swap**  
    **Step:** Replacement teacher từ chối  
    **API:** `PATCH /api/v1/teacher-requests/{id}/decline`
    ```json
    {
      "reason": "Trùng lịch với lớp khác"
    }
    ```
    - Điều kiện tương tự confirm
    - Logic (`declineSwap`):
      - Set status → `PENDING`
      - Xóa `replacementTeacher`
      - Lưu vào note: `DECLINED_BY_TEACHER_ID_{teacherId}: {reason}` để loại khỏi danh sách gợi ý lần sau

#### Post-Confirmation

15. **Trang: Request Detail (Original Teacher)**  
    **Step:** Original teacher theo dõi kết quả  
    **API:** `GET /api/v1/teacher-requests/{id}`

    - Khi replacement confirm: status `APPROVED`, session vẫn giữ nguyên nhưng teaching slot cập nhật
    - Khi replacement decline: status quay lại `PENDING`, replacement teacher null → teacher/staff phải tìm người khác

16. **Trang: Staff Dashboard**  
    **Step:** Staff kiểm tra lại request sau confirm/decline  
    **API:** `GET /api/v1/teacher-requests/staff?status=WAITING_CONFIRM` (hoặc `PENDING`) để theo dõi

### Key Error Conditions

- `INVALID_INPUT`: thiếu replacement teacher khi approve, replacement trùng original.
- `TEACHER_AVAILABILITY_CONFLICT`: replacement teacher bị trùng lịch.
- `TEACHER_NOT_FOUND`, `SESSION_NOT_FOUND`: không tìm thấy entity liên quan.
- `FORBIDDEN`: user cố xem/confirm request không thuộc về mình.
- `TEACHER_REQUEST_DUPLICATE`: đã có swap pending cùng session.

### Data & Audit Trail

- Request lưu: `replacementTeacher`, `status`, `note` (ghi nhận lý do decline), `submittedBy`, `decidedBy`.
- Log khi approve, confirm, decline swap để hỗ trợ audit.
- Teaching slot cập nhật trạng thái rõ ràng (`ON_LEAVE`, `SUBSTITUTED`).

### Testing Touchpoints

- `TeacherRequestServiceImplSwapTest`: unit test cho create/approve/confirm/decline và validation conflicts.
- `TeacherRequestServiceImplStaffViewTest`: đảm bảo staff view thấy đủ thông tin request kể cả replacement teacher.
