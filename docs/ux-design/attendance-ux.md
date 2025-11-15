# 🎨 UX Design - Attendance & Session Reporting

## Nguyên Tắc Áp Dụng

Thiết kế này tuân theo **Modern Minimal Design** với các nguyên tắc:

- **Content-first**: Nội dung là trọng tâm, UI "vô hình" nhưng mạnh mẽ
- **Minimalism thông minh**: Loại bỏ mọi thứ không cần thiết
- **Restraint**: Màu sắc và hiệu ứng tiết chế, có chủ đích
- **Không lạm dụng card**: Sử dụng flat surfaces với separators tinh tế
- **Generous whitespace**: Spacing theo 8px grid system

---

## 🎨 Hệ Thống Thiết Kế

### Màu Sắc

- **Nền chính**: Trắng (#FFFFFF) hoặc xám nhạt (#FAFAFA)
- **Text chính**: Xám đậm (#1A1A1A)
- **Text phụ**: Xám trung bình (#666666)
- **Accent (chỉ cho primary actions)**: Tím (#7C3AED) hoặc màu thương hiệu
- **Borders/Separators**: Xám nhạt (#E5E5E5), 1px
- **Attendance Status colors**:
  - Present: Xanh lá (#10B981)
  - Absent: Đỏ (#EF4444)
  - Excused: Vàng (#F59E0B)
  - Planned/Upcoming: Xám (#6B7280)
- **Session Status colors**:
  - PLANNED: Xám (#6B7280)
  - DONE: Xanh lá (#10B981)
  - CANCELLED: Đỏ (#EF4444)

### Typography

- **Font**: Inter (system font fallback)
- **Heading 1**: 24px, Semibold (600), line-height 1.4
- **Heading 2**: 20px, Semibold (600), line-height 1.4
- **Body**: 16px, Regular (400), line-height 1.6
- **Caption**: 14px, Regular (400), line-height 1.5
- **Small**: 12px, Regular (400), line-height 1.4

### Spacing

- Tất cả spacing theo bội số của 8px: 8, 16, 24, 32, 40, 48, 64px
- Padding section: 24px
- Gap giữa elements: 16px
- Margin giữa sections: 32px

### Components

- **Buttons**: Flat style, không shadow, border radius 6px
- **Inputs**: Border 1px, focus ring 2px accent color
- **Tables**: Không border, chỉ separator giữa rows
- **Status badges**: Pill shape, subtle background, không border
- **Icons**: Lucide React, outlined style, monochromatic

---

## 👨‍🏫 Teacher Flow - Chi Tiết Màn Hình

### 1. Trang: Attendance Dashboard - Today's Sessions

**Mục đích**: Hiển thị các buổi học của ngày hiện tại để giáo viên điểm danh

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh]                          │
│                                                          │
│ Điểm danh hôm nay                                       │
│                                                          │
│ [Date picker: 15/01/2025]                                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Class │ Course │ Time │ Students │ Status │ Actions │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS101 │ OOP    │09:00 │ 25/25    │ D Done │ [Xem]    │ │
│ │       │        │-10:30│          │        │         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS102 │ Data   │14:00 │ 18/20    │ P Pending│[Tiếp tục]│ │
│ │       │ Structure│-15:30│ (Đã kết thúc)│        │         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS103 │ Algorithm│16:00 │ 0/15     │ C Chưa │[Điểm danh]│ │
│ │       │        │-17:30│          │ điểm danh│       │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS104 │ Web Dev │10:00 │ 22/25    │ P Pending│[Tiếp tục]│ │
│ │       │        │-11:30│ (Đang diễn ra)│        │         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Tiêu đề trang**: 24px Semibold, margin-bottom 24px
- **Date picker**:
  - Inline, không background
  - Mặc định: hôm nay
  - Cho phép chọn ngày khác để xem lịch sử
- **Bảng sessions**:
  - Không border ngoài, không background cho rows
  - Separator 1px #E5E5E5 giữa các rows
  - Row height: 64px (padding 16px top/bottom)
  - Hover: Background #FAFAFA (subtle)
  - Click row: Navigate đến detail
- **Cột**:
  - Class: 120px
  - Course: Flexible
  - Time: 120px, format "HH:mm-HH:mm"
    - Nếu session đang diễn ra (đã bắt đầu nhưng chưa kết thúc): Hiển thị text "(Đang diễn ra)" 12px, italic, color #10B981 (xanh lá) bên dưới time
    - Nếu session đã kết thúc (time đã qua) nhưng vẫn trong ngày: Hiển thị text "(Đã kết thúc)" 12px, italic, color #666666 bên dưới time
  - Students: 100px, format "đã điểm danh/tổng"
  - Status: 120px, badge style
    - D Done: Xanh lá, nếu đã submit report (không thể sửa)
    - P Pending: Vàng, nếu đã điểm danh nhưng chưa submit (vẫn có thể sửa)
      - Có thể đang diễn ra hoặc đã kết thúc (phân biệt bằng indicator "(Đang diễn ra)" hoặc "(Đã kết thúc)")
    - C Chưa điểm danh: Vàng, nếu session đã đến giờ (đã bắt đầu hoặc đã kết thúc) nhưng chưa điểm danh (vẫn có thể sửa)
    - S Sắp tới: Xám, nếu session chưa đến giờ (chưa bắt đầu) - chỉ hiển thị, chưa cần điểm danh
  - Actions: 120px, button theo trạng thái:
    - "Điểm danh" (Primary) - cho sessions "Chưa điểm danh" (đã đến giờ nhưng chưa điểm danh)
    - "Tiếp tục" (Primary) - cho sessions đã điểm danh nhưng chưa submit (Pending)
    - "Xem" (Ghost) - cho sessions đã done
    - Không có button cho "Sắp tới" (hoặc disabled button)
    - Click: Navigate đến Attendance Detail
- **Empty state**:
  - Text: "Không có buổi học nào hôm nay"
  - Không icon (theo minimalism)

**API**: `GET /api/v1/attendance/sessions/today`

---

### 2. Trang: Attendance Detail

**Mục đích**: Giáo viên xem danh sách học viên và điểm danh

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh > CS101]                 │
│                                                          │
│ Điểm danh - CS101                        [Pending]     │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Thông tin buổi học                                   │ │
│ │                                                      │ │
│ │ Class: CS101                                         │ │
│ │ Course: Object-Oriented Programming                  │ │
│ │ Date: 15/01/2025                                     │ │
│ │ Time: 09:00 - 10:30 (Đã kết thúc)                    │ │
│ │ Resource: Classroom 101                            │ │
│ │                                                      │ │
│ │ Lưu ý: Buổi học đã kết thúc nhưng vẫn có thể sửa    │ │
│ │ điểm danh cho đến khi gửi báo cáo                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tổng quan                                            │ │
│ │                                                      │ │
│ │ Tổng: 25 | Có mặt: 23 | Vắng: 2                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Tất cả có mặt] [Tất cả vắng]                           │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Học viên │ Điểm danh │ Bài tập │ Ghi chú            │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Nguyễn Văn A│ [Present ▼]│ [Done ▼] │ [Textarea]   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Trần Thị B │ [Present ▼]│ [Done ▼] │ [Textarea]   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Lê Văn C   │ [Absent ▼] │ [---]    │ Xin nghỉ     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│                                                          │
│        [Hủy]  [Lưu điểm danh]  [Nộp báo cáo]           │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Summary section**:
  - Border 1px #E5E5E5, padding 24px
  - Background: #FAFAFA (subtle)
  - Hiển thị số liệu: Tổng | Có mặt | Vắng
  - Format: "Tổng: X | Có mặt: Y | Vắng: Z"
- **Session info section**:
  - Border 1px #E5E5E5, padding 24px
  - Background: #FAFAFA (subtle)
  - Hiển thị time với indicator "(Đã kết thúc)" nếu session đã kết thúc (time đã qua)
  - Helper text: 14px, color #666666, italic, margin-top 8px
  - Message: "Lưu ý: Buổi học đã kết thúc nhưng vẫn có thể sửa điểm danh cho đến khi gửi báo cáo"
  - Chỉ hiển thị message khi session đã kết thúc (time đã qua) và status chưa DONE
  - Nếu session chưa kết thúc hoặc đã DONE: ẩn message này
- **Quick action buttons**:
  - "Tất cả có mặt": Ghost button, border 1px
  - "Tất cả vắng": Ghost button, border 1px
  - Spacing: 16px giữa buttons
  - Click: Preview changes (không lưu), highlight rows
- **Table**:
  - Không border ngoài
  - Separator 1px #E5E5E5 giữa rows
  - Row height: 72px (padding 16px top/bottom)
- **Cột**:
  - Học viên: 200px, font semibold
  - Điểm danh: 140px, dropdown với options: Present, Absent, Excused
  - Bài tập: 120px, dropdown với options: Done, Not Done, null
  - Ghi chú: Flexible, textarea nhỏ (1-2 rows)
- **Dropdowns**:
  - Border 1px, padding 8px 12px
  - Options: Present (xanh), Absent (đỏ), Excused (vàng)
- **Textarea**:
  - Min height: 40px
  - Max height: 80px
  - Placeholder: "Ghi chú..."
- **Buttons**:
  - Tất cả 3 nút trên cùng 1 hàng, right-aligned
  - "Hủy": Ghost button
  - "Lưu điểm danh": Primary button
  - "Nộp báo cáo": Primary button (outline style hoặc secondary)
  - Spacing: 16px giữa các buttons
  - "Nộp báo cáo":
    - Click: Mở modal/drawer để nhập teacher note và submit report
    - Disabled nếu chưa điểm danh (chưa có attendance records)
    - Enabled nếu đã có ít nhất 1 lần lưu điểm danh

**API**:

- `GET /api/v1/attendance/sessions/{sessionId}/students`
- `POST /api/v1/attendance/sessions/{sessionId}/mark-all-present` (preview)
- `POST /api/v1/attendance/sessions/{sessionId}/mark-all-absent` (preview)
- `POST /api/v1/attendance/sessions/{sessionId}/save`
- `POST /api/v1/attendance/sessions/{sessionId}/report`

**Modal: Nộp báo cáo** (khi click nút "Nộp báo cáo"):

- Drawer từ bên phải hoặc modal center
- Width: 480px (desktop), full width (mobile)
- Nội dung tương tự trang Session Report:
  - Thông tin buổi học (read-only)
  - Tổng quan điểm danh (read-only)
  - Textarea "Ghi chú buổi học" (required)
  - Character counter: 0/500
  - Buttons: "Hủy" (Ghost) và "Gửi báo cáo" (Primary)
- Sau khi submit thành công: Đóng modal, hiển thị toast, cập nhật status thành "Done"

---

### 3. Trang: Session Report

**Mục đích**: Giáo viên xem và submit báo cáo buổi học

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh > CS101 > Báo cáo]       │
│                                                          │
│ Báo cáo buổi học - CS101                                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Thông tin buổi học                                   │ │
│ │                                                      │ │
│ │ Class: CS101                                         │ │
│ │ Date: 15/01/2025                                     │ │
│ │ Time: 09:00 - 10:30                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tổng quan điểm danh                                  │ │
│ │                                                      │ │
│ │ Tổng: 25 | Có mặt: 23 | Vắng: 2                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ghi chú buổi học *                                    │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │                                                  │ │ │
│ │ │                                                  │ │ │
│ │ │                                                  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ [0/500 ký tự]                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│                    [Hủy]  [Gửi báo cáo]                 │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Summary section**:
  - Tương tự Attendance Detail
  - Read-only, chỉ hiển thị
- **Textarea**:
  - Min height: 120px (3 rows)
  - Max length: 500 characters
  - Character counter: 12px, color #666666, right-aligned
  - Placeholder: "Ghi chú về buổi học..."
- **Validation**:
  - Error message: 14px, color #EF4444, margin-top 8px
  - Required field indicator: \* màu đỏ
- **Buttons**:
  - "Hủy": Ghost button
  - "Gửi báo cáo": Primary button, disabled nếu note empty
- **Success state**:
  - Sau khi submit thành công, hiển thị toast
  - Status badge đổi thành "Done" (xanh lá)
  - Disable form (read-only)

**API**:

- `GET /api/v1/attendance/sessions/{sessionId}/report`
- `POST /api/v1/attendance/sessions/{sessionId}/report`

---

### 4. Trang: Class Attendance Matrix

**Mục đích**: Giáo viên xem tổng quan attendance của lớp trong suốt khóa

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh > CS101 - Matrix]         │
│                                                          │
│ Ma trận điểm danh - CS101                               │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tổng quan                                            │ │
│ │                                                      │ │
│ │ Tổng buổi: 20 | Tỷ lệ chuyên cần trung bình: 85%    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Học viên │ 15/1 │ 16/1 │ 17/1 │ 18/1 │ ... │ Tỷ lệ │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Nguyễn Văn A│  P  │  P  │  P  │  P  │ ... │ 100% │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Trần Thị B │  P  │  A  │  P  │  P  │ ... │  90% │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Lê Văn C   │  P  │  P  │  A  │  P  │ ... │  85% │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Chú thích: P Có mặt | A Vắng | E Có phép | - Chưa điểm danh│
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Summary section**:
  - Border 1px #E5E5E5, padding 24px
  - Background: #FAFAFA (subtle)
  - Hiển thị số liệu tổng quan
- **Matrix table**:
  - Horizontal scroll nếu nhiều sessions
  - Fixed first column (Học viên) khi scroll
  - Cell height: 48px
  - Cell width: 80px cho date columns
- **Cell colors**:
  - Present (P): Background #D1FAE5 (xanh nhạt), text xanh đậm
  - Absent (A): Background #FEE2E2 (đỏ nhạt), text đỏ đậm
  - Excused (E): Background #FEF3C7 (vàng nhạt), text vàng đậm
  - Planned/Not started (-): Background #F3F4F6 (xám nhạt), text xám
  - Makeup: Border-left 3px accent color
- **Tỷ lệ column**:
  - Right-aligned
  - Color coding: >= 80% xanh, 60-79% vàng, < 60% đỏ
- **Legend**:
  - Bottom của table, 14px, color #666666
  - Chữ cái: P (Có mặt), A (Vắng), E (Có phép), - (Chưa điểm danh)

**API**: `GET /api/v1/attendance/classes/{classId}/matrix`

---

## 👨‍🎓 Student Flow - Chi Tiết Màn Hình

### 5. Trang: Attendance Overview

**Mục đích**: Học viên xem tổng quan chuyên cần theo từng lớp

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh]                          │
│                                                          │
│ Chuyên cần của tôi                                       │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Class      │ Course    │ Tổng │ Có mặt │ Tỷ lệ │ Stt│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS101      │ OOP       │ 20   │ 18     │ 90%  │ G │ │
│ │            │           │      │        │      │   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ CS102      │ Data      │ 15   │ 12     │ 80%  │ W │ │
│ │            │ Structure │      │        │      │   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Tiêu đề trang**: 24px Semibold, margin-bottom 24px
- **Bảng classes**:
  - Không border ngoài, không background cho rows
  - Separator 1px #E5E5E5 giữa các rows
  - Row height: 64px (padding 16px top/bottom)
  - Hover: Background #FAFAFA (subtle)
  - Click row: Navigate đến class report
- **Cột**:
  - Class: 120px
  - Course: Flexible
  - Tổng: 80px, số buổi tổng
  - Có mặt: 100px, số buổi có mặt
  - Tỷ lệ: 100px, percentage với color coding
  - Status: 80px, badge style
    - G Good: >= 80% (xanh)
    - W Warning: 60-79% (vàng)
    - L Low: < 60% (đỏ)
- **Empty state**:
  - Text: "Bạn chưa có lớp nào"
  - Không icon

**API**: `GET /api/v1/students/attendance/overview`

---

### 6. Trang: Attendance Class Report

**Mục đích**: Học viên xem chi tiết attendance của một lớp

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Điểm danh > CS101]                  │
│                                                          │
│ Chuyên cần - CS101                                       │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Thông tin lớp                                         │ │
│ │                                                      │ │
│ │ Class: CS101                                         │ │
│ │ Course: Object-Oriented Programming                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tổng quan                                            │ │
│ │                                                      │ │
│ │ Tổng: 20 | Có mặt: 18 | Vắng: 2 | Tỷ lệ: 90%        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Date      │ Status    │ Điểm danh │ Bài tập │ Ghi chú│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 15/01/2025│ Done      │ Present   │ Done    │ -     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 16/01/2025│ Done      │ Absent    │ -       │ Xin nghỉ│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 17/01/2025│ Done      │ Present   │ Done    │ -     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 18/01/2025│ Planned   │ -         │ -       │ -     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết thiết kế**:

- **Summary section**:
  - Border 1px #E5E5E5, padding 24px
  - Background: #FAFAFA (subtle)
  - Hiển thị: Tổng | Có mặt | Vắng | Tỷ lệ
- **Table**:
  - Không border ngoài
  - Separator 1px #E5E5E5 giữa rows
  - Row height: 56px
- **Cột**:
  - Date: 120px, format "DD/MM/YYYY"
  - Status: 100px, badge (Done/Planned/Cancelled)
  - Điểm danh: 120px, badge (Present/Absent/Excused)
  - Bài tập: 100px, badge (Done/Not Done/-)
  - Ghi chú: Flexible, text hoặc "-"
- **Status colors**:
  - Present: Xanh lá
  - Absent: Đỏ
  - Excused: Vàng
  - Planned: Xám
- **Makeup indicator**:
  - Nếu có makeup session: Icon + text "Học bù: [Date]"
  - Color accent

**API**: `GET /api/v1/students/attendance/report?classId={id}`

---

## 🎯 States & Interactions

### Loading States

- **Skeleton**: Neutral gray bars, không animation
- **Table loading**: 3-5 skeleton rows
- **Button loading**: Spinner nhỏ (16px), inline với text

### Error States

- **Inline errors**: Text đỏ 14px, margin-top 8px
- **API errors**: Banner top của page, background #FEE2E2, border-left 3px #EF4444
- **Empty states**: Text center, không icon, CTA button nếu cần

### Success States

- **Toast notification**: Top-right, 3000ms auto-dismiss
- **Success message**: Text xanh, subtle background
- **Save confirmation**: Inline message "Đã lưu" với checkmark

### Hover & Focus

- **Table rows**: Background #FAFAFA
- **Buttons**: Slight opacity change (0.9)
- **Links**: Underline on hover
- **Focus ring**: 2px accent color, outline-offset 2px

### Keyboard Navigation

- **Tab order**: Logical flow
- **Enter**: Submit form
- **Escape**: Close modal/drawer
- **Arrow keys**: Navigate table rows (optional)

---

## 📱 Responsive Design

### Mobile (< 768px)

- **Table**: Chuyển sang list cards
  - Mỗi row thành một card
  - Border 1px #E5E5E5
  - Padding: 16px
  - Stack information vertically
- **Matrix table**:
  - Horizontal scroll
  - Fixed first column
  - Smaller cell size
- **Buttons**: Full width, stack vertically
- **Typography**:
  - Heading: 20px → 18px
  - Body: 16px → 14px
- **Spacing**: Giảm 25% (24px → 18px, 16px → 12px)

### Tablet (768px - 1024px)

- **Table**: Horizontal scroll nếu cần
- **Matrix**: Optimized cell size
- **Layout**: 2-column cho summary nếu phù hợp

### Desktop (> 1024px)

- **Max width content**: 1200px, centered
- **Table**: Full columns visible
- **Matrix**: Full view với scroll

---

## ✅ Checklist Implementation

- [ ] Colors: Neutral base + accent cho primary actions
- [ ] Typography: Inter, hierarchy rõ ràng, line-height 1.5+
- [ ] Spacing: 8px grid system
- [ ] Components: shadcn/ui, không override styles tùy tiện
- [ ] Tables: Flat design, không card, chỉ separators
- [ ] Forms: Clean inputs, inline validation
- [ ] Status badges: Pill shape, subtle colors
- [ ] Icons: Lucide React, outlined, monochromatic
- [ ] Accessibility: WCAG AA contrast, keyboard nav
- [ ] Responsive: Mobile-first, breakpoints rõ ràng
- [ ] Loading: Skeleton states
- [ ] Errors: Inline + banner
- [ ] Success: Toast notifications
- [ ] Attendance matrix: Color coding rõ ràng, scrollable
- [ ] Quick actions: Preview mode, không lưu ngay

---

## 🚫 Những Điều KHÔNG Nên Làm

- ❌ Không dùng card với shadow cho mọi section
- ❌ Không thêm gradient backgrounds
- ❌ Không overuse animations (chỉ khi cần thiết)
- ❌ Không thay đổi màu text tùy tiện
- ❌ Không dùng quá nhiều màu accent
- ❌ Không bỏ qua whitespace
- ❌ Không dùng custom fonts (trừ khi thực sự cần)
- ❌ Không tạo UI noise với borders/shadows không cần thiết
- ❌ Không làm phức tạp matrix - giữ đơn giản, dễ đọc

---

## 📝 Notes

- Tất cả screens sử dụng cùng design system
- Reusable components: Table, Form sections, Status badges
- Consistent spacing và typography scale
- Focus vào content, UI "vô hình"
- Performance: Lazy load, optimize images/icons
- Accessibility: ARIA labels, keyboard navigation
- **Đặc biệt**:
  - Attendance matrix cần scrollable và fixed column cho UX tốt
  - Quick actions (mark all) chỉ preview, không lưu ngay
  - Status colors cần consistent giữa teacher và student views
  - Makeup sessions cần được highlight rõ ràng
  - **Logic status và sửa điểm danh**:
    - **"S Sắp tới"** (Xám): Session chưa đến giờ (chưa bắt đầu) → Chưa cần điểm danh, không có button hoặc disabled
    - **"C Chưa điểm danh"** (Vàng): Session đã đến giờ (đã bắt đầu hoặc đã kết thúc) nhưng chưa điểm danh → **Có thể điểm danh**, button "Điểm danh"
    - **"P Pending"** (Vàng): Đã điểm danh nhưng chưa submit report → **Vẫn có thể sửa**, button "Tiếp tục"
      - Có thể đang diễn ra (indicator "(Đang diễn ra)" màu xanh) hoặc đã kết thúc (indicator "(Đã kết thúc)" màu xám)
      - Trong cả hai trường hợp đều có thể sửa điểm danh cho đến khi submit report
    - **"D Done"** (Xanh lá): Đã submit report → **Không thể sửa**, chỉ xem, button "Xem"
    - UI cần hiển thị indicator rõ ràng:
      - "(Đang diễn ra)" - màu xanh lá (#10B981) cho sessions đang diễn ra
      - "(Đã kết thúc)" - màu xám (#666666) cho sessions đã kết thúc nhưng vẫn trong ngày
  - **Chữ cái thay vì icon**:
    - Status: D (Done), P (Pending), C (Chưa điểm danh), S (Sắp tới)
    - Attendance: P (Present/Có mặt), A (Absent/Vắng), E (Excused/Có phép), - (Chưa điểm danh)
    - Performance: G (Good), W (Warning), L (Low)
