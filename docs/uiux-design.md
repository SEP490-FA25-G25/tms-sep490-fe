## 🎨 **Thiết Kế Modern Minimal Cho TMS (Frontend shadcn/ui + Tailwind)** 

Tài liệu này chuẩn hóa UI/UX cho web app quản lý (dashboard) với shadcn/ui. Mục tiêu: nhanh, dễ quét, ít nhiễu, 100% tiếng Việt, ưu tiên hiệu suất và dễ bảo trì. Dark mode sẽ bổ sung sau.

### **1) Nguyên Tắc Cốt Lõi** 
- **Content-first, tối giản có chủ đích**: Chỉ giữ yếu tố phục vụ thao tác/quyết định. 
- **Không lạm dụng card/đổ bóng**: Dùng lưới/spacing để nhóm nội dung; card chỉ khi cần nền riêng. 
- **Truy cập & tốc độ**: WCAG AA, tab-able, lightweight; hạn chế motion, ưu tiên phản hồi nhanh. 
- **Nhất quán component**: Dùng variant mặc định của shadcn/ui, chỉ override khi thật sự cần. 

### **2) Màu Sắc & Token (Light mode)** 
Palette đề xuất (4 màu đã chọn) dùng cho thương hiệu/nhấn. Luôn kết hợp với neutral xám để giữ độ rõ ràng.

**Brand/Accent (A):**
- A100 `#FFF2E0` (rgb(255, 242, 224)) – nền nhấn nhẹ (tag nền, highlight soft). 
- A300 `#C0C9EE` (rgb(192, 201, 238)) – hover cho element nhấn, nền phụ cho stats. 
- A500 `#A2AADB` (rgb(162, 170, 219)) – primary background state (chip/label). 
- A700 `#898AC4` (rgb(137, 138, 196)) – **Primary** (button, link nhấn, focus ring). 

**Neutral (N) đề xuất** (giữ tông xám cho đọc dễ):  
N0 `#FFFFFF`, N50 `#F8FAFC`, N100 `#F1F5F9`, N200 `#E2E8F0`, N300 `#CBD5E1`, N500 `#64748B`, N700 `#334155`, N900 `#0F172A`.

**Ánh xạ CSS variable (light):**
- `--bg`: N0/N50; `--surface`: N50/N100; `--surface-subtle`: A100 5% overlay. 
- `--border`: N200/N300; `--text`: N700/N900; `--muted`: N500. 
- `--primary`: A700; `--primary-foreground`: N0; `--primary-hover`: A500/A700 mix 90%; 
- `--accent`: A500; `--accent-foreground`: N900. 
- `--success`: `#1A9C68`; `--warning`: `#D97706`; `--error`: `#DC2626`; nền state = màu 10% alpha.

**Nguyên tắc dùng màu:**
- Primary chỉ cho CTA chính, link nhấn, focus ring. 
- Trạng thái (success/warning/error) ưu tiên nền nhạt + text đậm, icon đơn sắc. 
- Overlay/hover: tăng độ sâu bằng border/độ sáng, không thêm shadow dày. 
- Giữ contrast AA (≥4.5:1 cho text body); check nhanh bằng plugin/grayscale. 

### **3) Typography & Spacing** 
**Font:** Inter → SF Pro/Roboto fallback; 100% tiếng Việt.  
**Typo scale (desktop / mobile):**
- H1: 28 / 24px, 700, lh 1.2 (dùng cho tiêu đề trang). 
- H2: 24 / 20px, 600, lh 1.25 (tiêu đề section). 
- H3: 20 / 18px, 600, lh 1.3 (nhóm nội dung). 
- H4: 18 / 16px, 600, lh 1.35 (subsection/nhãn nhóm). 
- Body: 16px, lh 1.5 (mặc định). 
- Secondary: 14px, lh 1.5 (mô tả ngắn, label phụ). 
- Caption: 12-13px, lh 1.4 (dùng rất hạn chế, chỉ metadata). 
- Tránh chữ in hoa liên tục; dùng ellipsis cho text thao tác dài; heading ≤ 6 từ, mô tả ≤ 2 câu. 

**Spacing token (8px grid):** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48.  
**Mật độ dashboard:** block cách nhau 16-24px; heading ↔ nội dung 8-12px; nhóm ↔ nhóm 16-24px; row bảng ≥44px cao.  
**Layout:** container max 1280-1366px; dùng Grid/Flex trước, tránh lồng card. 

### **4) Component Guideline (gọn cho shadcn/ui)** 
- **Button:** Primary = A700, hover A500/A700 mix; Secondary = outline N200; Ghost cho icon-only; có trạng thái loading (spinner nhỏ bên trái). Không nhồi icon trang trí. 
- **Form/Input:** Border N200, focus ring A700 2px; error border màu error + text trợ giúp ngắn 1 dòng. Group field theo section, tránh card bao ngoài. 
- **Table/Data Table:** Không bọc card; header nền N50, border N200; zebra nhẹ hoặc divider 1px N200; action trong bảng dùng ghost/inline, không là primary trừ CTA chính. Empty state ngắn gọn + CTA nếu cần. 
- **Toast/Alert/Dialog:** Dùng tiết kiệm; toast ≤2 mỗi flow, auto-dismiss; dialog chỉ cho quyết định lớn. 
- **Nav/Sidebar:** Nền N0/N50; active item dùng A100/A300 với text A700; icon + label ngắn. 
- **Loading:** Skeleton/shimmer nhẹ, tránh overlay toàn trang trừ chờ bắt buộc. Motion tối giản (transition 150–200ms ease-out). 
- **Accordion/Collapsible/Drawer/Sheet/Popover/Dropdown:** Dùng để giảm mật độ; nội dung ngắn gọn, không lồng nhiều lớp; đóng mở phải có focus/esc/ngoài-đóng chuẩn. 
- **Tabs/Navigation Menu:** Tối đa 5-7 tab, label ngắn; dùng khi nội dung cùng cấp; trạng thái active rõ (border dưới hoặc nền A100). 
- **Card/Empty/Error:** Card chỉ cho khối độc lập; Empty/Error một câu + CTA ngắn, không thêm đồ họa nặng. 

### **5) Ngôn Ngữ & Chống Noise** 
- 100% tiếng Việt, câu ngắn, động từ rõ. Heading ≤6 từ, mô tả ≤2 câu. 
- Loại bỏ nhãn thừa; không lặp ngữ cảnh; tooltip chỉ khi thật cần. 
- CTA ngắn: “Lưu”, “Thêm lớp”, “Gửi yêu cầu”. Lỗi/validation đặt sát trường, một câu ngắn. 

### **6) Trạng Thái & Phản Hồi** 
- **Loading**: skeleton/placeholder tại vùng dữ liệu; spinner nhỏ trong nút khi submit. 
- **Empty**: 1 câu + CTA tùy bối cảnh, không card thừa. 
- **Error**: thông điệp rõ, tiếng Việt; gợi ý retry ngay tại vị trí thao tác. 
- **Success**: feedback ngắn (toast nhỏ/inline), không spam. 

### **7) Accessibility & Kiểm Tra Nhanh** 
- Focus ring luôn hiện (A700 trên nền sáng); tab order đúng; component shadcn dùng props mặc định (aria/keyboard). 
- Contrast AA cho text; kiểm tra nhanh với devtools/grayscale. 
- Keyboard: mọi hành động chính có thể tab/enter/space; form có `aria-invalid`, `aria-describedby` cho lỗi. 

### **8) Card, Border, Shadow (nhắc lại chống lạm dụng)** 
- Card khi cần nền riêng (widget độc lập); tối đa 1 cấp lồng. 
- Border 1px N200/N300; ưu tiên divider/spacing. Shadow: none hoặc rất nhẹ (2-4 blur, alpha thấp). 
- Tránh lưới nhiều card giống hệt; ưu tiên một grid rõ với hierarchy bằng typography/spacing. 

### **9) Checklist Nhanh Cho Mỗi Màn Hình** 
1. Màu: Nền neutral, primary = A700, accent không tràn; state màu nhạt + text rõ. 
2. Text: Tiếng Việt ngắn gọn; heading ≤6 từ; không mô tả dài; có ellipsis khi cần. 
3. Spacing/Layout: 8px grid; block 16-24px; không bọc card thừa; row bảng ≥44px. 
4. Component: Button đúng variant; form border N200 + focus rõ; table không card, header N50. 
5. Feedback: Loading = skeleton; toast ≤2/flow; error/success ngắn, tại chỗ. 
6. Access: Focus ring rõ; tab-able; contrast AA. 
7. Hiệu suất: Tránh animation nặng; ảnh/icon tối ưu; không render thừa. 

### **10) UX Flow Tối Thiểu (mỗi tính năng phải có)** 
- **Trạng thái bắt buộc**: idle → loading (skeleton tại vùng) → success (hiển thị dữ liệu) → empty (1 câu + CTA nếu cần) → error (thông điệp + retry tại chỗ). 
- **Form**: label/placeholder rõ, hint ngắn, validation inline, disabled khi đang submit, spinner trong nút. 
- **Tìm kiếm/Lọc/Phân trang**: trạng thái “không kết quả” riêng, lưu tiêu chí lọc đã chọn, nút reset rõ. 
- **Hành động phá hủy/quan trọng**: dialog xác nhận ngắn, 2 nút rõ ràng; CTA chính mang màu primary, phụ là ghost/outline. 
- **Điều hướng**: breadcrumb hoặc header ngắn; trạng thái active trong sidebar/nav dùng A100/A300 + text A700; không nhảy context đột ngột (giữ tiêu đề/trạng thái filter nếu quay lại). 

### **Agent Guardrails (khi implement)** 
- Luôn dùng token màu ở mục 2; không chèn mã màu tự do. 
- Spacing theo 8px grid, nhưng **tiết chế**: block 16-24px là giới hạn điển hình; tránh padding >24px cho khối nhỏ để không tạo khoảng trắng thừa. 
- Typography đúng scale H1–H4 + body/secondary; heading ≤6 từ; mô tả ≤2 câu; ellipsis cho text dài. 
- Bắt buộc đủ 5 trạng thái (idle/loading/success/empty/error) cho màn hình dữ liệu. Skeleton trong vùng, không overlay toàn trang trừ khi cần. 
- Form: focus ring A700, validation inline, nút có loading, disable khi submit. 
- Card: chỉ khi cần surface riêng; table/list/form mặc định không bọc card; border 1px N200, shadow rất nhẹ hoặc none. 
- Toast/Dialog: toast ≤2/flow; dialog chỉ cho hành động quan trọng, CTA chính = primary, phụ = ghost/outline. 
- Navigation: breadcrumb/heading ngắn; sidebar active dùng A100/A300 + text A700; giữ state filter khi quay lại. 
- Motion: chỉ transition 150–200ms ease-out; không thêm animation khác nếu không được yêu cầu. 

### **11) Danh Mục Component shadcn/ui (áp dụng chuẩn trên)** 
Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Drawer, Dropdown Menu, Empty, Field, Form, Hover Card, Input Group, Input OTP, Input, Item, Kbd, Label, Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle Group, Toggle, Tooltip, Typography. 

**Áp dụng chung**: 
- Dùng variant mặc định, màu theo token ở mục 2; focus ring A700; hover nhẹ (border/độ sáng), shadow rất thấp hoặc none. 
- Icon chỉ khi tăng khả năng quét; tránh icon trang trí. 
- Không bọc card nếu surface đã đủ rõ; ưu tiên layout Grid/Flex và spacing. 
