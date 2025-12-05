# Center Head (Trưởng Chi Nhánh)

## Sidebar

- Bảng điều khiển
- Danh sách lớp học
- Phê duyệt lớp học mới
- Danh sách lịch dạy giáo viên
- Quản lý tài nguyên
- Quản lý khung giờ học
- Danh sách chương trình đào tạo
- Danh sách phản hồi từ học viên
- Báo cáo từ QA

**_-> Lưu ý: Nhớ đảm bảo các trang có table sẽ có hết phần filter, search, sort, phân trang._**

## 1. Dashboard

Dashboard của Center Head - trưởng chi nhánh:

### KPI Cards

- **Hệ thống hiển thị tổng số lớp đang hoạt động trong chi nhánh:**
  - Tổng số lớp active
  - Số lớp dự kiến khai giảng trong tuần
- **Hiển thị tổng số học viên đang theo học tại chi nhánh:**
  - Tổng số Active Students
  - Số lượng học viên mới ghi danh trong tuần
- **Hiển thị tổng số giáo viên thuộc chi nhánh:**
  - Tổng số giáo viên
  - Trạng thái cập nhật lịch dạy (e.g., “All schedules updated”)
- **Hiển thị số lượng báo cáo hoặc yêu cầu đang chờ Center Head xem xét:**
  - Tổng số Pending Reports: Yêu cầu mở lớp từ Academic Affairs, báo cáo từ QA

### Chart/Graph

- **Hiển thị biểu đồ số lớp diễn ra theo ngày trong tuần tại chi nhánh:**
  - Số lớp theo từng ngày
  - Tỷ lệ phòng sử dụng/tổng số phòng -> Giúp Center Head nắm được mức độ bận rộn của chi nhánh theo ngày.
- **Hiển thị phân bố lịch dạy của giáo viên theo tuần:**
  - Tỷ lệ giáo viên đang giảng dạy
  - Tỷ lệ giáo viên rảnh
  - Tổng số giờ dạy/tuần
- **Biểu đồ đề xuất:** Doughnut/Horizontal bar chart
- **Danh sách các lớp chuẩn bị khai giảng trong 7–14 ngày tới:**
  - Tên lớp
  - Ngày bắt đầu
  - Giáo viên dự kiến
  - Phòng học dự kiến
- **Hiển thị tỷ lệ chuyên cần trung bình của chi nhánh trong ngày:**
  - Attendance Rate Today (% tổng)
  - Số lớp có chuyên cần thấp (<70%)

### Quy tắc hiển thị trên Dashboard

- **Giới hạn:** Không xem danh sách học viên vắng → quyền của Academic Affairs.
- Tất cả dữ liệu hiển thị phải được lọc theo chi nhánh của Center Head.
- **Không được phép hiển thị:**
  - Lớp thuộc chi nhánh khác
  - Giáo viên không thuộc chi nhánh
  - Học viên của chi nhánh khác
  - QA reports của chi nhánh khác
- Center Head chỉ được phép xem số liệu, không được chỉnh sửa dữ liệu học thuật hoặc vận hành (phân công GV, syllabus,...).
- Dashboard cần phản ánh cập nhật trong ngày hoặc theo tuần.

## 2. Danh sách lớp học

- Xem danh sách lớp
- Xem chi tiết lớp
- Xem tiến độ buổi
- Xem sĩ số
- **Không chỉnh sửa, không tạo lớp — chỉ xem.**

## 3. Phê duyệt lớp học mới

Center Head có thể làm:

- Xem danh sách lớp do Academic Affairs tạo
- Xem nội dung form lớp (timetable, phòng, giáo viên đề xuất…)
- **Action:**
  - ✔ **Approve** → chuyển lớp sang trạng thái _Approved_
  - ✖ **Reject** → trả lại cho giáo vụ để chỉnh sửa
- **Lưu ý:** Chỉ khi Center Head “Approve” thì khóa học được: Public, Cho phép enroll học viên, Xuất hiện trong UI Student.

## 4. Danh sách lịch dạy giáo viên

- Xem lịch dạy theo tuần
- Xem lịch từng giáo viên
- Xem số giờ dạy

## 5. Quản lý tài nguyên

Chỉ view, không được chỉnh sửa, thêm gì cả.

## 6. Quản lý khung giờ học

Chỉ view, không được chỉnh sửa, thêm gì cả.

## 7. Danh sách chương trình đào tạo

Chỉ view, không được chỉnh sửa, thêm gì cả.

## 8. Danh sách phản hồi từ học viên

Chỉ view, không được chỉnh sửa, thêm gì cả.

## 9. Báo cáo từ QA

(Có thể xem thêm bên phần của QA, Thắng có làm phần này)
(Center Head chỉ được view thôi, không thêm sửa xóa gì hết)

### View QA Report List

Hiển thị danh sách tất cả báo cáo QA thuộc chi nhánh.

- **Dữ liệu hiển thị:**
  - Tên lớp
  - Giáo viên
  - Ngày QA kiểm tra
  - Trạng thái (Pending Review / Reviewed / Requires Action)
  - Mức độ đánh giá (score hoặc rating)

### View QA Report Details

Center Head có thể xem chi tiết:

1. **Thông tin lớp**
   - Tên lớp
   - Giáo viên giảng dạy
   - Buổi dạy được kiểm tra
   - Thời gian kiểm tra
2. **Nội dung đánh giá (QA Criteria)**
   - Ví dụ các tiêu chí QA thường có:
     - Chuẩn bị bài giảng
     - Tương tác với học viên
     - Quản lý lớp học
     - Sử dụng tài liệu/slide
     - Kết thúc buổi học đúng quy trình
     - Tình trạng phòng học
     - Thiết bị
     - Điểm danh hợp lệ
3. **Tổng điểm / đánh giá tổng quan**
   - Score (ví dụ 85/100)
   - Mức độ: Excellent / Good / Average / Poor
4. **Ghi chú của QA**
   - Nhận xét mạnh
   - Nhận xét yếu
   - Các đề xuất khắc phục
