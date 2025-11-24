## Đề xuất nghiệp vụ cập nhật lớp

1) Điều kiện và vai trò  
- Cho phép Academic chỉnh sửa khi: `status = DRAFT` và `approvalStatus ∈ {null, REJECTED}`.  
- Khi submit: `status = SUBMITTED`, `approvalStatus = PENDING`; không cho sửa nữa. Center Head duyệt/reject → APPROVED/REJECTED.

2) Nhận diện thay đổi và phạm vi ảnh hưởng  
- Metadata không ảnh hưởng lịch: tên lớp, mô tả, mã lớp (nếu không va chạm code), sức chứa (≥ enrolled). Cho phép lưu nhanh, không buộc làm lại step sau.  
- Thay đổi ảnh hưởng lịch/sessions: chi nhánh, khóa học, ngày bắt đầu/kết thúc, ngày học, modality. Khi có thay đổi này:  
  - Bắt buộc cập nhật lại lịch/sessions (không cho “giữ lịch cũ” nếu startDate/scheduleDays đổi, vì lịch cũ sẽ sai).  
  - Lựa chọn “Sinh lại buổi học” (regenerate) hoặc phương án dịch ngày toàn bộ; mặc định regenerate để an toàn.

3) Hành vi từng bước (edit mode)  
- Step 1: Prefill header. Nút “Cập nhật” lưu header. Nút “Tiếp tục” (skip) nếu không muốn đổi header.  
- Step 2: Hiển thị sessions hiện có. Nếu Step 1 đổi dữ liệu ảnh hưởng lịch và chọn “Sinh lại” → regenerate và cập nhật danh sách; nếu giữ nguyên → vẫn dùng sessions cũ.  
- Step 3 (time slots), Step 4 (resource), Step 5 (teacher): Prefill từ assignments hiện có; khi lưu sẽ “ghi đè set cũ” (replace), không append.  
- Step 6: Validate hiện trạng; trả về checklist để biết còn thiếu gì.  
- Step 7: Submit duyệt → chuyển SUBMITTED/PENDING.

4) Trạng thái & hiển thị  
- Badge gộp: PENDING → “Chờ duyệt”; REJECTED → “Bị từ chối”; còn lại theo vận hành: Bản nháp / Đã gửi duyệt / Đã lên lịch / Đang diễn ra / Đã kết thúc / Đã hủy.  
- Nút “Chỉnh sửa” chỉ hiện khi trạng thái cho phép; REJECTED cho sửa lại, PENDING/APPROVED chặn.

5) Luồng đề xuất khi đổi dữ liệu  
- Nếu thay đổi metadata (tên, mã, sức chứa) → PUT header, giữ nguyên assignments; không bắt làm lại step 3–5.  
- Nếu thay đổi lịch/chi nhánh/khóa học/ngày học:  
  - Cho chọn “Giữ lịch cũ” (nếu hợp lệ) hoặc “Sinh lại lịch buổi học” (regenerate).  
  - Nếu sinh lại → làm lại Step 3–5; nếu giữ → cho phép chỉnh từng phần như cũ.

6) Phê duyệt  
- Submit: status → SUBMITTED, approvalStatus → PENDING.  
- Reject: approvalStatus → REJECTED, status → DRAFT; cho phép edit lại.  
- Approve: approvalStatus → APPROVED, status → SCHEDULED (hoặc ONGOING tùy logic).

7) UX tối giản  
- Luôn prefill dữ liệu hiện có ở mọi bước.  
- Nút “Tiếp tục” ở Step 1 để lướt qua nếu không đổi header.  
- Cảnh báo rõ khi thao tác có thể reset lịch/assignments.  
- Badge trạng thái tiếng Việt nhất quán ở list/chi tiết.
