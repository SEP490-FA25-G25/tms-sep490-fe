## Teacher Request Journey — Modality Change

### Purpose

- Let a teacher request switching the delivery modality (e.g. classroom ↔ online) for a scheduled session within the next 7 days.
- Ensure academic staff can review, override resource choices, and approve or reject the request.
- Keep session resources synchronized so only one resource is booked for the slot.

### Actors & Roles

- **Teacher** (request owner): initiates the change on their upcoming session.
- **Academic Affair Staff**: reviews and approves/rejects the request, can override resource selection.

### Preconditions

- Session date is within the next 7 days (`TeacherRequestServiceImpl.validateTimeWindow`).
- Teacher owns the session (`validateTeacherOwnsSession`).
- (Optional) Teacher-selected resource is available, matches modality, and has enough capacity.

### Journey Overview

#### Teacher Flow

1. **Trang: Request / My Requests**  
   **Step:** Teacher vào trang Request để xem danh sách requests của mình, có thể chọn "Create Request" để tạo request mới  
   **API:** `GET /api/v1/teacher-requests/me`

   - Trả về tất cả requests (của teacher hoặc nơi teacher là replacement teacher)
   - Sắp xếp theo `submittedAt` DESC
   - Hiển thị thông tin: requestId, requestType, status, session info, submittedAt
   - **UI action:** Nút "Create Request" để chuyển sang flow tạo request mới

2. **Trang: Create Request - Select Request Type**  
   **Step:** Teacher chọn loại request là "MODALITY_CHANGE"  
   **API:** Không có (UI action)

3. **Trang: Create Request - Select Session**  
   **Step:** Sau khi chọn MODALITY_CHANGE, hệ thống hiển thị danh sách sessions để teacher chọn  
   **API:** `GET /api/v1/teacher-requests/my-sessions?date={today}`

   - Trả về danh sách sessions trong 7 ngày tới (hoặc filter theo date)
   - Hiển thị thông tin: sessionId, date, time, class, course, topic
   - Hiển thị trạng thái request nếu có: `requestStatus`, `hasPendingRequest`
   - Teacher chọn một session từ danh sách

4. **Trang: Create Request - Chọn Resource (Optional)**  
   **Step:** Sau khi chọn session, teacher có thể xem danh sách resource gợi ý do backend trả về  
   **API:** `GET /api/v1/teacher-requests/{sessionId}/modality/resources`
   - Backend lọc resource theo branch của class, modality phù hợp, không bị trùng lịch, đủ capacity
   - Response gồm `currentResource = true` cho resource đang gán với session hiện tại giúp UI highlight
   - Teacher có thể bỏ qua bước này (để staff quyết định khi approve)
   - Nếu teacher chọn resource, phải đảm bảo resource tương thích modality, cùng cơ sở và còn capacity
   
5. **Trang: Create Request - Request Form**  
   **Step:** Teacher điền form với thông tin request (chọn resource nếu muốn, nhập reason) và submit  
   **API:** `POST /api/v1/teacher-requests`  
   **Request Body:**

   ```json
   {
     "sessionId": 123,
     "requestType": "MODALITY_CHANGE",
     "newResourceId": 5, // optional - teacher có thể chọn hoặc để trống
     "reason": "Need Zoom room due to remote attendance"
   }
   ```

   **Backend validations** (`TeacherRequestServiceImpl.createRequest`):

   - Reject nếu đã có pending MODALITY_CHANGE cho session này
   - Nếu `newResourceId` được cung cấp: validate availability, type compatibility, capacity
   - Lưu request với status `PENDING`
     **Response:** Trả về `TeacherRequestResponseDTO` với thông tin request vừa tạo

6. **Trang: My Requests / Request List**  
   **Step:** Teacher xem danh sách requests của mình  
   **API:** `GET /api/v1/teacher-requests/me`

   - Trả về tất cả requests (của teacher hoặc nơi teacher là replacement teacher)
   - Sắp xếp theo `submittedAt` DESC

7. **Trang: Request Detail**  
   **Step:** Teacher xem chi tiết một request  
   **API:** `GET /api/v1/teacher-requests/{id}`
   - Trả về đầy đủ thông tin: session info, chosen resource (`newResourceName`), status, reason, timestamps
   - Dành cho teacher tạo request.

#### Staff Flow

8. **Trang: Staff Dashboard / Request Management**  
   **Step:** Staff xem danh sách tất cả requests  
   **API:** `GET /api/v1/teacher-requests/staff`

   - Trả về tất cả requests (bất kể status: PENDING, APPROVED, REJECTED, WAITING_CONFIRM)
   - **Optional filter:** `GET /api/v1/teacher-requests/staff?status=PENDING` để chỉ xem pending requests
   - Sắp xếp theo `submittedAt` DESC

9. **Trang: Request Detail (Staff View)**  
   **Step:** Staff xem chi tiết request để review  
   **API:** `GET /api/v1/teacher-requests/{id}`

   - Staff có thể xem tất cả requests (không giới hạn như teacher)
   - Hiển thị đầy đủ: session info, teacher selection (`newResourceName`), status, reason
   - Staff có thể thấy resource mà teacher đã chọn (nếu có)

10. **Trang: Request Detail / Approval Form**  
    **Step:** Staff approve request  
    **API:** `PATCH /api/v1/teacher-requests/{id}/approve`  
    **Request Body:**

```json
{
  "newResourceId": 52, // optional - staff có thể override resource của teacher
  "note": "Booked online studio 3"
}
```

**Logic** (`approveModalityChange`):

- Priority: staff override > teacher selection; nếu cả hai đều null → `INVALID_INPUT`
- Re-validate availability, type, capacity tại thời điểm approve
- Update `session_resource`: xóa record cũ, tạo record mới cho session
- Set status = `APPROVED`, lưu `decidedBy`, `decidedAt`, `note`

11. **Trang: Request Detail / Rejection Form**  
    **Step:** Staff reject request  
    **API:** `PATCH /api/v1/teacher-requests/{id}/reject`  
    **Request Body:**
    ```json
    {
      "reason": "Resource không phù hợp với class modality"
    }
    ```
    - Set status = `REJECTED`, lưu reason vào `note`

#### Post-Approval

12. **Trang: My Requests / Request Detail**  
    **Step:** Teacher xem lại request sau khi được approve/reject  
    **API:** `GET /api/v1/teacher-requests/me` hoặc `GET /api/v1/teacher-requests/{id}`
    - Session giữ nguyên ID, nhưng `session_resource` đã trỏ đến resource mới (nếu approved)
    - Status hiển thị: `APPROVED` hoặc `REJECTED`
    - Nếu muốn tạo MODALITY_CHANGE mới cho session này, phải pass duplicate check (request cũ không còn `PENDING`)

### Key Error Conditions

- `TEACHER_NOT_FOUND`, `SESSION_NOT_FOUND`: when identity/session mismatch.
- `INVALID_INPUT`: missing resource on approval or staff override for unavailable resource.
- `RESOURCE_NOT_FOUND`, `RESOURCE_CONFLICT`, `CAPACITY_EXCEEDED` (thrown via validation helpers).
- `TEACHER_REQUEST_DUPLICATE`: more than one pending modality change for the same session.

### Data & Audit Trail

- Request metadata: `status`, `submittedBy`, `submittedAt`, optional `decidedBy`, `decidedAt`, `note`.
- Session resource changes logged via `log.info` in approval method.
- All DTO responses standardized via `ResponseObject<T>`.

### Testing Touchpoints

- `TeacherRequestServiceImplModalityTest` covers creation/approval flows and validation errors.
- Integration coverage via `TeacherRequest` controller + repository tests ensures eager loading of related data (resource, time slot) for detail views.
