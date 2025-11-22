# 🎨 Thiết Kế Modern Minimal Cho TMS (Frontend shadcn/ui + Tailwind)

Tài liệu này chuẩn hóa UI/UX cho web app quản lý (dashboard) với shadcn/ui. Mục tiêu: **ship nhanh, dễ quét, ít nhiễu**, 100% tiếng Việt, ưu tiên hiệu suất và dễ bảo trì.

---

## **🚀 Nguyên Tắc Áp Dụng: Ship Fast, Refine Later**

Guideline này được thiết kế theo phases:

**Phase 1 - POC/Spike (Week 1-2):**
- ✅ Inline components OK
- ✅ Simple states (loading/success/error)
- ✅ Focus: Ship & validate concept
- ✅ Apply: Typography + basic spacing only

**Phase 2 - Production Ready (Week 3-4):**
- ✅ Extract components khi thấy pattern lặp (≥2 uses)
- ✅ Full states cho main screens
- ✅ Apply: Card guidelines, component structure

**Phase 3 - Stable/Scale (Month 2+):**
- ✅ Enforce consistency across codebase
- ✅ Accessibility compliance
- ✅ Apply: All guidelines

**Rule of thumb:** Khi nghi ngờ → chọn simple, refactor sau khi pattern rõ.

---

## **1) Nguyên Tắc Cốt Lõi**

- **Content-first, tối giản có chủ đích**: Chỉ giữ yếu tố phục vụ thao tác/quyết định
- **Default: No card**: Dùng spacing/dividers trước, cards chỉ khi cần visual separation rõ ràng
- **Truy cập & tốc độ**: WCAG AA, tab-able, lightweight; hạn chế motion, ưu tiên phản hồi nhanh
- **Nhất quán component**: Dùng variant mặc định của shadcn/ui, chỉ override khi thật sự cần
- **Inline first, extract later**: Không extract component sớm; đợi pattern lặp lại

---

## **2) Màu Sắc & Token (Simplified)**

### Primary Color

- **Primary:** `#3C467B` (rgb(60, 70, 123)) - Brand color cho buttons, links, focus rings
- **Hover/Active:** Dùng Tailwind opacity modifiers: `bg-primary/90`, `bg-primary/80`
- **Subtle backgrounds:** `bg-primary/10`, `bg-primary/5`

### Neutral Colors

- **N0** `#FFFFFF` - Background
- **N50** `#F8FAFC` - Surface subtle
- **N100** `#F1F5F9` - Surface
- **N200** `#E2E8F0` - Border
- **N500** `#64748B` - Muted text
- **N700** `#334155` - Primary text
- **N900** `#0F172A` - Headings

### State Colors

- **Success:** `#1A9C68` - bg với `bg-success/10` cho subtle
- **Warning:** `#D97706` - bg với `bg-warning/10`
- **Error:** `#DC2626` - bg với `bg-destructive/10`

### CSS Variables (shadcn defaults)

Dùng shadcn/ui CSS variables có sẵn:
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--background`, `--foreground`
- `--destructive`, `--success`, `--warning`

**Không cần custom tokens.** Dùng Tailwind modifiers (`/90`, `/80`, `/10`) cho variations.

### Nguyên Tắc Dùng Màu

- Primary chỉ cho CTA chính, links, focus rings
- State colors: nền nhạt (`/10`) + text đậm
- Hover: dùng opacity (`/90`) thay vì màu mới
- Contrast ≥4.5:1 (WCAG AA)

---

## **3) Typography & Spacing**

### Font

**Inter → SF Pro/Roboto fallback; 100% tiếng Việt**

### Typography Scale (Tailwind Standard)

| Element | Class | Desktop | Mobile | Weight | Use |
|---------|-------|---------|--------|--------|-----|
| **H1** | `text-3xl` | 30px | `text-2xl md:text-3xl` | `font-bold` | Page title |
| **H2** | `text-2xl` | 24px | `text-xl md:text-2xl` | `font-semibold` | Section |
| **H3** | `text-xl` | 20px | `text-lg md:text-xl` | `font-semibold` | Subsection |
| **Body** | `text-base` | 16px | 16px | `font-normal` | Default |
| **Secondary** | `text-sm` | 14px | 14px | `font-normal` | Meta/labels |
| **Caption** | `text-xs` | 12px | 12px | `font-normal` | Timestamps |

### Quick Examples

```tsx
// Page header
<h1 className="text-3xl font-bold tracking-tight">Quản lý Lớp học</h1>
<p className="text-base text-muted-foreground">Mô tả ngắn gọn</p>

// Info block
<div className="space-y-1">
  <span className="text-sm text-muted-foreground">Giáo viên</span>
  <p className="text-base font-semibold">Nguyễn Văn A</p>
</div>
```

### Quy Tắc

- Heading ≤ 6 từ
- Description ≤ 2 câu
- Dùng `truncate` hoặc `line-clamp-2` cho text dài

### Spacing (Core Rules Only)

| Context | Class | Size | Use |
|---------|-------|------|-----|
| **Sections** | `gap-6` | 24px | Between major blocks |
| **Groups** | `gap-4` | 16px | Filters, form groups |
| **Items** | `gap-3` | 12px | List items |
| **Page padding** | `px-4 lg:px-6` | 16px → 24px | Horizontal margins |
| **Page padding** | `py-6 md:py-8` | 24px → 32px | Vertical spacing |

**Rule:** Dùng `gap-6` cho most cases. Chỉ giảm xuống `gap-4` khi cần tight spacing. Container max: `max-w-7xl mx-auto`.

---

## **4) Cards: Simple Decision Tree**

### Core Principle: Avoid "Card-ception" (Lồng Card quá nhiều)

Chúng ta vẫn sử dụng Card để group nội dung, nhưng **hạn chế lồng nhau** để tránh giao diện bị "nặng" (too many borders).

**Rules:**
1.  **Max Depth = 1:** Chỉ dùng 1 lớp Card chính bao ngoài.
2.  **Nested Content:** Bên trong Card, dùng `Separator`, `bg-muted/50`, hoặc `spacing` để phân chia. **Tránh** dùng thêm `border` hoặc lồng `<Card>` con.
3.  **Depth 2 (Exception):** Chỉ chấp nhận lồng cấp 2 nếu thật sự cần thiết (VD: highlight một item đặc biệt), nhưng nên dùng style nhẹ (`bg-muted` thay vì border).

### When to Use Cards

**1. Table/Section Container** (visual boundary)

```tsx
<div className="rounded-lg border overflow-hidden">
  <Table>...</Table>
</div>
```

**Khi nào:** Table hoặc section cần tách khỏi background

**2. Independent Grid Items** (clickable, self-contained)

```tsx
<Card className="cursor-pointer hover:shadow-sm">
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content + actions</CardContent>
</Card>
```

**Khi nào:** Class cards, course cards, dashboard widgets trong grid.
**Exception:** Dashboard KPI Blocks (Metrics) luôn dùng Card để tạo focal point.

**3. Info Display Blocks** (subtle separation)

```tsx
<div className="rounded-lg border border-border/70 bg-muted/10 p-4">
  <div className="flex items-center gap-2 text-muted-foreground">
    <Icon className="h-4 w-4" />
    <span className="text-sm">Label</span>
  </div>
  <p className="text-base font-semibold">Value</p>
</div>
```

**Khi nào:** Header info cards (teacher, schedule, location)

### Decision Flow

```
Cần visual separation?
├─ Yes → Là container chính (Table, Form, Grid Item)?
│   ├─ Yes → Dùng Card (Depth 1)
│   └─ No → Đang ở trong Card rồi?
│       ├─ Yes → Dùng Spacing / Divider / bg-muted (No Border)
│       └─ No → Dùng Card được (Depth 1)
└─ No → Spacing only
```

**Rule:** Khi nghi ngờ → Bỏ bớt border.

---

## **5) Component Architecture**

### Extraction Rules (Revised)

**Extract component khi:**
1. **Pattern lặp thực tế** (≥2 nơi với logic tương tự)
2. **Logic phức tạp cần test** (calculations, validations)
3. **Feature đã ổn định** (không còn thay đổi requirements)

**Inline OK khi:**
- POC/spike features
- First iteration của feature mới
- Logic đơn giản, chỉ render data
- Page đang experiment

**Rule:** Inline first → Extract when pattern emerges.

### Component Structure

```tsx
// src/components/[domain]/ComponentName.tsx
export interface ComponentNameProps {
  data: DataType
  onAction?: (id: number) => void
}

export function ComponentName({ data, onAction }: ComponentNameProps) {
  return <div>{/* Component */}</div>
}
```

### Layout Wrapper Pattern

**Preferred: DashboardLayout**

```tsx
export default function ClassListPage() {
  return (
    <DashboardLayout
      title="Quản lý Lớp học"
      description="Quản lý các lớp học"
    >
      <div className="space-y-6">
        <FilterSection />
        <DataSection />
      </div>
    </DashboardLayout>
  )
}
```

**Inline layout OK** trong POC phase, refactor sau khi pattern stable.

### Code Organization

```
src/
├── app/[role]/[feature]/
│   ├── page.tsx              # Main page (delegate to components)
│   └── components/           # Page-specific (if needed)
├── components/
│   ├── ui/                   # shadcn/ui (don't edit)
│   └── [domain]/             # Shared components (extract when ≥2 uses)
└── lib/utils.ts
```

---

## **6) Component Guidelines**

### Button

```tsx
<Button>Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost" size="icon"><Icon /></Button>

// Loading
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Lưu
</Button>
```

### Form/Input

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Tên lớp</Label>
  <Input id="name" placeholder="Nhập tên..." />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

**Rules:** Focus ring visible, validation inline, disabled khi submit.

### Table

```tsx
<div className="rounded-lg border overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead>Column</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-muted/50">
        <TableCell>Data</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

**Rules:**
- No `<Card>` wrapper (trừ khi trong Dashboard)
- Header `bg-muted/50` + **Sticky** (`sticky top-0`) nếu list dài
- Rows ≥44px
- **Sortable:** Icon mũi tên mờ bên cạnh header text
- **Actions:** Cột cuối cùng, dùng `<DropdownMenu>` cho >2 actions

### Filter & Search Bar

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
  <div className="flex gap-2 w-full sm:w-auto">
    <Input placeholder="Tìm kiếm..." className="w-full sm:w-[300px]" />
    {/* Active Filters Badges here */}
  </div>
  <div className="flex gap-2 w-full sm:w-auto">
    <Select>...</Select> {/* Filter 1 */}
    <Select>...</Select> {/* Filter 2 */}
    <Button>Tạo mới</Button>
  </div>
</div>
```

**Rules:** Search bên trái, Filters/Actions bên phải. Hiển thị badge cho active filters.

### Tabs (for detail pages)

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <div className="sticky top-(--header-height) bg-background/95 backdrop-blur">
    <TabsList className="bg-transparent border-b w-full justify-start rounded-none">
      <TabsTrigger
        value="tab1"
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
      >
        Tab 1
      </TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="tab1"><Content /></TabsContent>
</Tabs>
```

**Rules:** Sticky tabs với backdrop-blur; active = border-bottom; max 5-7 tabs.

---

## **7) State Management (Simplified)**

### Main Data Screens (Required)

```tsx
function DataPage() {
  const { data, isLoading, error, refetch } = useQuery()

  if (isLoading) return <SkeletonLoader />

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm mb-4">Không thể tải dữ liệu</p>
        <Button size="sm" onClick={refetch}>Thử lại</Button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Chưa có dữ liệu"
        description="Bắt đầu bằng cách tạo mới."
        action={<Button>Tạo mới</Button>}
      />
    )
  }

  return <DataDisplay data={data} />
}
```

**Required states:**
- **Loading:** Dùng **Skeleton** (Table: 5 rows; Detail: Header + Content blocks). Tránh Spinner full-screen.
- **Empty:** Icon + Message + CTA (Create button).
- **Error:** Message + Retry button.

### Secondary Views (Dialogs, Sub-tables)

```tsx
// Simplified - chỉ 3 states
{isLoading ? (
  <Skeleton className="h-20" />
) : error ? (
  <p className="text-sm text-muted-foreground">Không thể tải</p>
) : (
  <Content data={data} />
)}
```

**Optional:** Empty state có thể là inline "Không có dữ liệu"

### Simple Displays

```tsx
// Inline skeleton, no error UI needed
{isLoading ? <Skeleton className="h-4 w-20" /> : <span>{value}</span>}
```

**Rule:** State complexity theo importance của view.

---

## **8) Ngôn Ngữ & UX**

- **100% tiếng Việt**, câu ngắn, động từ rõ
- **Heading:** ≤ 6 từ
- **Mô tả:** ≤ 2 câu
- **CTA ngắn:** "Lưu", "Thêm", "Xóa"
- **Lỗi:** Sát field, một câu ngắn

---

## **9) Accessibility Basics**

- **Focus ring:** Visible (default shadcn behavior)
- **Tab order:** Logical
- **Keyboard:** Tab/Enter/Space cho actions
- **Contrast:** ≥4.5:1 (WCAG AA)
- **ARIA:** Dùng props mặc định của shadcn

**Test:** Tab through page, check focus visibility.

---

## **10) Quick Checklist**

Trước khi commit:

**Typography:**
- [ ] H1 = `text-3xl font-bold`
- [ ] Body = `text-base`, Secondary = `text-sm`

**Spacing:**
- [ ] Sections = `gap-6`
- [ ] Page padding = `px-4 lg:px-6`, `py-6 md:py-8`

**Cards:**
- [ ] **Max Depth 1:** Không lồng card trong card (trừ ngoại lệ)
- [ ] **Nested:** Dùng `bg-muted` hoặc `Separator` thay vì border
- [ ] Table = container wrapper
- [ ] Grid items = Card component if clickable

**States:**
- [ ] Main screens: loading/success/empty/error
- [ ] Secondary views: simplified OK

**Components:**
- [ ] Extract chỉ khi pattern lặp (≥2 uses)
- [ ] POC = inline OK

**Vietnamese:**
- [ ] 100% UI text tiếng Việt
- [ ] Heading ≤ 6 từ

---

## **11) Common Patterns**

### Page Structure

```tsx
<DashboardLayout title="Title" description="Description">
  <div className="space-y-6">
    <FilterSection />
    <DataSection />
    <PaginationSection />
  </div>
</DashboardLayout>
```

### Filter Section

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <Input placeholder="Tìm kiếm..." className="max-w-sm" />
  <Select>...</Select>
  <Select>...</Select>
</div>
```

### Data Grid

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id} className="cursor-pointer hover:shadow-sm">
      <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
      <CardContent>{item.description}</CardContent>
    </Card>
  ))}
</div>
```

### Info Grid (in headers)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">Label</span>
    </div>
    <p className="text-base font-semibold">Value</p>
  </div>
</div>
```

---

## **12) Agent Guardrails**

Khi implement code:

**Typography:**
- Dùng `text-3xl`, `text-2xl`, `text-base`, `text-sm` (Tailwind classes)
- KHÔNG custom px values
- H1 = `text-3xl font-bold`

**Spacing:**
- Default = `gap-6` cho sections
- Page padding = `px-4 lg:px-6`, `py-6 md:py-8`
- Container = `max-w-7xl mx-auto`

**Cards:**
- Default = Card OK cho main containers
- **Max Depth 1:** Tránh lồng card/border quá nhiều
- Table = `<div className="rounded-lg border overflow-hidden">`
- Grid items = `<Card>` nếu clickable

**Components:**
- Inline first (POC phase)
- Extract khi ≥2 uses với logic tương tự
- TypeScript interfaces cho extracted components

**States:**
- Main screens = full states (loading/success/empty/error)
- Secondary = simplified (loading/success/error)
- Simple displays = inline skeleton

**Colors:**
- Primary = brand color
- Hover = `bg-primary/90`
- Subtle = `bg-primary/10`
- KHÔNG custom color tokens

**Vietnamese:**
- 100% UI text
- Ngắn gọn, heading ≤6 từ

---