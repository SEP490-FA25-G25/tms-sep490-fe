# 🎨 UI/UX Design: Create Syllabus Flow

## 1. Tổng quan Luồng Nghiệp vụ (User Flow)

Luồng tạo Syllabus (Giáo trình) là một quy trình phức tạp, cần được chia nhỏ thành các bước logic để tránh làm người dùng bị choáng ngợp. Chúng ta sẽ sử dụng mô hình **Wizard (Steppers)** cho việc tạo mới Course, và giao diện **Master-Detail** cho việc quản lý Subject/Level.

```mermaid
graph TD
    A[Dashboard] --> B[Quản lý Chương trình (Curriculum)]
    B --> C{Chọn Tab}
    C -->|Môn học (Subjects)| D[Danh sách Subject]
    C -->|Khóa học (Courses)| E[Danh sách Course]
    
    D --> D1[Tạo Subject mới]
    D1 --> D2[Modal: Nhập Tên & Mã]
    D --> D3[Chi tiết Subject]
    D3 --> D4[Quản lý Level]
    D3 --> D5[Quản lý PLO]
    
    E --> E1[Tạo Course mới (Wizard)]
    E1 --> S1[Bước 1: Thông tin chung]
    S1 --> S2[Bước 2: Chuẩn đầu ra (CLO)]
    S2 --> S3[Bước 3: Cấu trúc (Phases & Sessions)]
    S3 --> S4[Bước 4: Đánh giá (Assessments)]
    S4 --> S5[Bước 5: Tài liệu (Materials)]
    S5 --> S6[Bước 6: Review & Submit]
```

## 2. Chi tiết Màn hình

### 2.1. Màn hình Danh sách Subject & Course (Curriculum Management)
**Layout**: Dashboard Layout chuẩn.
- **Header**: Title "Quản lý Chương trình", Breadcrumb, Action Button "Tạo mới".
- **Tabs**: "Môn học (Subjects)" | "Khóa học (Courses)".

#### Tab 1: Môn học (Subjects)
- **Table**:
  - Columns: Mã môn, Tên môn, Số Level, Trạng thái (Draft/Active), Ngày tạo.
  - Actions: Edit, Delete (nếu chưa dùng), View Detail.
- **Interaction**:
  - Click row -> Chuyển sang màn hình Chi tiết Subject.
  - Click "Tạo Subject" -> Mở Dialog nhỏ (Form đơn giản).

#### Tab 2: Khóa học (Courses)
- **Filter Bar**: Search theo tên/mã, Filter theo Subject, Filter theo Status.
- **Table**:
  - Columns: Mã khóa học, Tên khóa học, Subject, Level, Thời lượng (giờ), Trạng thái (Draft/Pending/Active/Rejected).
  - Status Badge: Màu xám (Draft), Vàng (Pending), Xanh lá (Active), Đỏ (Rejected).
- **Action**: Button "Tạo Khóa học" (Primary) -> Chuyển sang trang Create Course Wizard.

---

### 2.2. Màn hình Chi tiết Subject (Subject Detail)
**Mục đích**: Cấu hình các thông tin nền tảng cho Subject trước khi tạo Course.
**Layout**: 2-Column Layout (Left: Info & Levels, Right: PLOs).

- **Left Column (Thông tin & Cấp độ)**:
  - Card "Thông tin chung": Form edit tên/mã.
  - Card "Danh sách Cấp độ (Levels)":
    - Table nhỏ: Mã (A1, A2...), Tên, Thời lượng dự kiến.
    - Action: "Thêm Level" (Dialog).
    - Sortable: Cho phép kéo thả để sắp xếp thứ tự Level.

- **Right Column (Chuẩn đầu ra chương trình - PLOs)**:
  - List các PLO (Program Learning Outcomes).
  - Mỗi item: Mã (PLO1, PLO2...), Mô tả.
  - Action: "Thêm PLO", Edit/Delete inline.

---

### 2.3. Wizard Tạo Khóa học (Create Course Wizard)
**Layout**: Full-screen focus mode hoặc Standard Layout với Stepper ở trên cùng.
**Stepper**: 1. Thông tin -> 2. CLO -> 3. Cấu trúc -> 4. Đánh giá -> 5. Tài liệu -> 6. Xác nhận.

#### Bước 1: Thông tin chung (Basic Info)
- **Form Layout**: Grid 2 cột.
- **Fields**:
  - Subject (Select - required): Chọn từ danh sách Subject active.
  - Level (Select - required): Filter theo Subject đã chọn.
  - Tên khóa học (Auto-suggest từ Subject + Level, cho phép edit).
  - Mã khóa học (Auto-generate, cho phép edit).
  - Thời lượng: Tổng giờ, Số tuần, Số buổi/tuần, Giờ/buổi (Tự động tính toán logic).
  - Mô tả (Textarea).
  - Điều kiện tiên quyết (Textarea).

#### Bước 2: Chuẩn đầu ra (Learning Outcomes)
- **Layout**: Split View.
- **Left**: Danh sách CLO (Course Learning Outcomes).
  - Button "Thêm CLO".
  - Form nhập: Mã (CLO1...), Mô tả.
- **Right**: Mapping PLO (Khi chọn 1 CLO bên trái).
  - Hiển thị danh sách PLO của Subject.
  - Checkbox để map CLO đang chọn với các PLO tương ứng.
  - *Validation*: Mỗi CLO phải map ít nhất 1 PLO.

#### Bước 3: Cấu trúc chương trình (Curriculum Structure) - **QUAN TRỌNG NHẤT**
Đây là màn hình phức tạp nhất. Sử dụng mô hình **Accordion** hoặc **Tree View** kết hợp Table.

- **Hierarchy**:
  - **Phase 1** (Accordion Header - Editable Name/Duration)
    - **Session 1** (Row)
      - Cột 1: Thứ tự (Seq).
      - Cột 2: Chủ đề (Topic) - Input text.
      - Cột 3: Hoạt động/Task - Input text.
      - Cột 4: Mapping CLO - Multi-select Dropdown (chọn từ CLO đã tạo ở B2).
      - Action: Delete, Drag-drop to reorder.
    - Button "+ Thêm Session" (cuối Phase).
  - Button "+ Thêm Phase" (cuối danh sách).

- **Interaction**:
  - Kéo thả Session giữa các Phase.
  - Inline editing cho nhanh.

#### Bước 4: Đánh giá (Assessments)
- **Table**: Danh sách bài kiểm tra.
- **Columns**: Tên (Quiz 1, Midterm...), Loại (Quiz/Exam/Project), Trọng số (%), Thời lượng (phút).
- **Mapping**: Khi expand row hoặc mở modal, cho phép map Assessment với CLO.
- **Validation**: Tổng trọng số có thể check (nhưng thường không bắt buộc 100% ở bước này nếu chưa chốt).

#### Bước 5: Tài liệu (Materials)
- **Upload Component**: Drag & drop file area.
- **List**: Danh sách file đã upload.
- **Metadata**: Với mỗi file, chọn Scope (Toàn khóa học / Phase cụ thể / Session cụ thể).

#### Bước 6: Review & Submit
- **Summary View**: Hiển thị tóm tắt toàn bộ thông tin dạng Read-only.
- **Validation Report**:
  - Checklist xanh/đỏ: "Đã có CLO?", "Đã map PLO?", "Đã có Session?", "Tổng giờ khớp?".
- **Action**:
  - "Lưu nháp" (Save Draft).
  - "Gửi duyệt" (Submit for Approval).

## 3. Design Guidelines áp dụng
- **Màu sắc**:
  - Primary: Tím đậm (Brand color).
  - Background: Trắng/Xám nhạt (#F9FAFB).
  - Border: #E5E7EB (Neutral-200).
- **Typography**: Inter font. Heading bold, Label medium.
- **Spacing**: Padding 24px cho container chính, Gap 16px giữa các field.
- **Feedback**:
  - Toast notification khi Save/Update thành công.
  - Inline validation error màu đỏ nhẹ.
