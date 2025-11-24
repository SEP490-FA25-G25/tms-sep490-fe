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

### Complete Typography Scale (8-Point System)

| Element | Class | Desktop | Mobile | Line-height | Weight | Use |
|---------|-------|---------|--------|-------------|--------|-----|
| **Display** | `text-4xl` | 36px | `text-3xl md:text-4xl` | 1.2 | `font-bold` | Hero headings |
| **H1** | `text-3xl` | 30px | `text-2xl md:text-3xl` | 1.2 | `font-bold` | Page title |
| **H2** | `text-2xl` | 24px | `text-xl md:text-2xl` | 1.3 | `font-semibold` | Section |
| **H3** | `text-xl` | 20px | `text-lg md:text-xl` | 1.3 | `font-semibold` | Subsection |
| **H4** | `text-lg` | 18px | `text-base md:text-lg` | 1.4 | `font-medium` | Sub-subsection |
| **Body Large** | `text-lg` | 18px | `text-base` | 1.5 | `font-normal` | Intro text |
| **Body** | `text-base` | 16px | 16px | 1.5 | `font-normal` | Default |
| **Secondary** | `text-sm` | 14px | 14px | 1.4 | `font-normal` | Meta/labels |
| **Caption** | `text-xs` | 12px | 12px | 1.4 | `font-normal` | Timestamps |

### Typography Rules & Best Practices

**Line-height Standards:**
- Headings (H1-H3): `tracking-tight` + `leading-tight` (1.2-1.3)
- Body text: `leading-normal` (1.5) - WCAG minimum for readability
- Small text: `leading-relaxed` (1.4-1.5)

**Spacing Between Elements:**
- Heading to body: `mb-3` (12px)
- Section spacing: `mb-6` (24px)
- Paragraph spacing: `mb-4` (16px)

**Text Handling:**
- Long headings: `truncate` hoặc `line-clamp-2`
- Long descriptions: `line-clamp-3`
- ALL CAPS: `uppercase tracking-wider` + `text-xs`/`text-sm`

**Mobile Optimization:**
- Scale down by 1 step: `text-3xl` → `text-2xl` on mobile
- Maintain readability: minimum 16px for body text
- Increase line-height slightly on mobile: `leading-relaxed`

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

### Spacing System (8-Point Grid)

**Standard Spacing Scale:**
| Size | Tailwind | Use Case |
|------|----------|----------|
| 2px | `gap-0.5` | Icon-text inline spacing |
| 4px | `gap-1` | Tight element spacing |
| 8px | `gap-2` | Component internal spacing |
| 12px | `gap-3` | List items, button padding |
| 16px | `gap-4` | Form groups, cards |
| 24px | `gap-6` | **Default section spacing** |
| 32px | `gap-8` | Major sections |
| 48px | `gap-12` | Page sections |
| 64px | `gap-16` | Container margins |

**Context Guidelines:**
- **Sections:** `gap-6` (24px) - default for most cases
- **Groups:** `gap-4` (16px) - filters, form groups
- **Items:** `gap-3` (12px) - list items, table rows
- **Page padding:** `px-4 lg:px-6`, `py-6 md:py-8`
- **Container:** `max-w-7xl mx-auto`

**Visual Hierarchy Rules:**
- More important = more whitespace around it
- CTAs get generous spacing (`gap-8`+)
- Related items: closer spacing (`gap-3`-`gap-4`)
- Unrelated sections: clear separation (`gap-12`+)

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

## **5) Dashboard-Specific Patterns**

### Dashboard Layout (F-Pattern)

**Visual Hierarchy for Dashboards:**
- **Top-left:** Most important metrics/KPIs
- **Top-right:** Filters, date ranges, actions
- **Middle:** Data tables, charts
- **Bottom:** Secondary info, pagination

```tsx
<DashboardLayout title="Dashboard Overview">
  {/* Top section - KPI Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <MetricCard title="Total Classes" value="24" change="+12%" trend="up" />
    <MetricCard title="Active Students" value="156" change="+5%" trend="up" />
    <MetricCard title="Completion Rate" value="87%" change="-2%" trend="down" />
    <MetricCard title="Revenue" value="₫124M" change="+18%" trend="up" />
  </div>

  {/* Middle section - Main content */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">
      <DataTableSection />
    </div>
    <div className="space-y-6">
      <QuickActions />
      <RecentActivity />
    </div>
  </div>
</DashboardLayout>
```

### KPI/Metrics Cards

**Structure:**
```tsx
<div className="rounded-lg border bg-card p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    <Icon className="h-8 w-8 text-muted-foreground/50" />
  </div>
</div>
```

**Rules:**
- Always use Card for metrics (creates focal points)
- Include trend indicators (up/down arrows)
- Sparklines optional for historical context
- Responsive: 1 column mobile, 2 tablet, 4 desktop

### Data Visualization Best Practices

**Chart Selection:**
- **Trends over time:** Line chart
- **Comparisons:** Bar chart
- **Proportions:** Pie/donut (max 5 segments)
- **Distributions:** Histogram

**Color Usage:**
- Sequential: Single hue, varied lightness
- Categorical: Distinct hues (max 8 colors)
- Avoid red/green for accessibility (use blue/orange instead)

**Table Design:**
- Header sticky (`sticky top-0`)
- Row height minimum 44px
- Zebra striping optional (`hover:bg-muted/50`)
- Sort indicators subtle
- Actions in last column with dropdown

### Dashboard Navigation

**Tab Pattern for Detail Pages:**
```tsx
<Tabs value={activeTab} className="w-full">
  <div className="sticky top-(--header-height) bg-background/95 backdrop-blur z-10">
    <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0">
      <TabsTrigger
        value="overview"
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
      >
        Tổng quan
      </TabsTrigger>
      <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
        Học viên
      </TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="overview" className="mt-6">
    <OverviewTab />
  </TabsContent>
</Tabs>
```

**Rules:**
- Sticky navigation with backdrop blur
- Active state = border-bottom (not background)
- Max 5-7 tabs
- Vietnamese labels only

---

## **6) Component Architecture**

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

## **7) Comprehensive State Management**

### State Priority Levels

**Level 1: Main Data Screens (Full States Required)**
- List pages, detail pages, dashboard widgets
- **4 states:** Loading → Success → Empty → Error

```tsx
function DataPage() {
  const { data, isLoading, error, refetch } = useQuery()

  // 1. Loading State
  if (isLoading) {
    return <DataTableSkeleton />
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-semibold">Không thể tải dữ liệu</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || "Đã có lỗi xảy ra. Vui lòng thử lại."}
          </p>
          <Button size="sm" onClick={refetch} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  // 3. Empty State
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-12 w-12 text-muted-foreground" />}
        title="Chưa có dữ liệu"
        description="Bắt đầu bằng cách tạo lớp học đầu tiên."
        action={<Button>Tạo mới</Button>}
      />
    )
  }

  // 4. Success State
  return <DataDisplay data={data} />
}
```

**Level 2: Secondary Views (Simplified States)**
- Modal dialogs, dropdown content, side panels
- **3 states:** Loading → Success → Error

```tsx
function SecondaryView() {
  const { data, isLoading, error } = useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Không thể tải dữ liệu</p>
      </div>
    )
  }

  return <Content data={data} />
}
```

**Level 3: Inline Elements (Minimal States)**
- Individual data points, status indicators
- **2 states:** Loading → Success

```tsx
function InlineDisplay({ value }) {
  const { data, isLoading } = useQuery()

  if (isLoading) {
    return <Skeleton className="h-4 w-20 inline-block" />
  }

  return <span>{data || value}</span>
}
```

### Loading State Patterns

**Table Skeleton:**
```tsx
function DataTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
```

**Card Grid Skeleton:**
```tsx
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  )
}
```

### Empty State Best Practices

**Required Elements:**
- **Icon:** Relevant visual (FolderOpen, Users, Calendar)
- **Title:** Clear, action-oriented message
- **Description:** Brief explanation of what this section contains
- **CTA:** Primary action button (Create, Add, Browse)

**Example Components:**
```tsx
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {action}
    </div>
  )
}
```

### Error State Patterns

**Error Types:**
1. **Network Error:** Retry button + message
2. **Permission Error:** Contact admin + explanation
3. **Not Found:** Back button + suggestion
4. **Validation Error:** Inline field errors

**Error Message Guidelines:**
- Use plain language, no technical jargon
- Be specific about what went wrong
- Provide clear next steps
- Include retry mechanism when appropriate

**Error State Component:**
```tsx
function ErrorState({ title, description, onRetry, showRetry = true }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      )}
    </div>
  )
}
```

### Success & Feedback Patterns

**Success Feedback:**
- Toast notifications for actions
- Inline success messages for forms
- Progress indicators for multi-step flows

**Loading Feedback:**
- Skeleton screens for content
- Spinners for actions
- Progress bars for file uploads

**Micro-interactions:**
- Button press effects (scale: 0.98)
- Loading states disable interactions
- Hover states provide feedback

---

## **8) Ngôn Ngữ & UX**

- **100% tiếng Việt**, câu ngắn, động từ rõ
- **Heading:** ≤ 6 từ
- **Mô tả:** ≤ 2 câu
- **CTA ngắn:** "Lưu", "Thêm", "Xóa"
- **Lỗi:** Sát field, một câu ngắn

---

## **9) Accessibility Implementation (WCAG AA Compliance)**

### Color & Contrast Requirements

**Minimum Contrast Ratios (WCAG AA):**
- **Normal text (< 18px):** 4.5:1 minimum
- **Large text (≥ 18px or bold ≥ 14px):** 3:1 minimum
- **UI components & graphics:** 3:1 minimum

**Color Usage Guidelines:**
- **Primary actions:** Use brand color with sufficient contrast
- **Success/Error states:** Don't rely on color alone - add icons or text
- **Links:** Must have 3:1 contrast with surrounding text + non-color indicator (underline)
- **Disabled elements:** Can have lower contrast but must still be distinguishable

**Implementation:**
```tsx
// Good - High contrast + icon
<span className="flex items-center gap-2 text-green-600">
  <CheckCircle className="h-4 w-4" />
  Hoàn thành
</span>

// Bad - Color only
<span className="text-green-600">Hoàn thành</span>
```

### Focus Management

**Focus States:**
- All interactive elements must have visible focus indication
- Use shadcn's default focus rings or custom `focus-visible` styles
- Focus trap inside modals and dropdowns

**Focus Order:**
- Logical tab order following DOM structure
- Skip links for keyboard navigation
- No keyboard traps

**Implementation:**
```tsx
// Custom focus ring (if needed)
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Button
</button>

// Skip link (top of page)
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
  Skip to main content
</a>
```

### Keyboard Navigation

**Required Keyboard Support:**
- **Tab:** Navigate through focusable elements
- **Shift+Tab:** Navigate backwards
- **Enter/Space:** Activate buttons, links, form controls
- **Arrow keys:** Navigate menus, tabs, radio buttons
- **Escape:** Close modals, dropdowns, cancel actions

**Touch Targets:**
- Minimum 44x44px for touch devices
- Adequate spacing between touch targets
- Large enough for finger accuracy

**Implementation Examples:**
```tsx
// Accessible dropdown
<DropdownMenu>
  <DropdownMenuTrigger className="h-10 px-4">Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Option 1</DropdownMenuItem>
    <DropdownMenuItem>Option 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Accessible tabs
<Tabs defaultValue="tab1">
  <TabsList aria-label="Navigation tabs">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Screen Reader Support

**Semantic HTML:**
- Use proper HTML elements: `<nav>`, `<main>`, `<section>`, `<article>`
- Heading hierarchy: Single `<h1>` per page, logical heading order
- Form labels associated with inputs

**ARIA Usage:**
- Use ARIA labels when native HTML insufficient
- Live regions for dynamic content updates
- Descriptive labels for icons and decorative elements

**Implementation:**
```tsx
// Form with proper labels
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    required
    aria-describedby="email-help"
  />
  <p id="email-help" className="text-sm text-muted-foreground">
    Ví dụ: user@example.com
  </p>
</div>

// Icon buttons with labels
<button
  aria-label="Delete item"
  className="p-2 hover:bg-muted rounded"
>
  <Trash2 className="h-4 w-4" />
</button>

// Live regions for status updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage && <p>{statusMessage}</p>}
</div>
```

### Motion & Animation

**Reduced Motion Support:**
- Respect `prefers-reduced-motion: reduce`
- Provide non-animated alternatives
- Essential animations (like loading states) can remain

**Implementation:**
```tsx
// Respect motion preferences
<div className="transition-all duration-200 motion-reduce:transition-none">
  Animated content
</div>

// CSS for reduced motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Testing Checklist

**Manual Testing:**
- [ ] Navigate entire page using Tab key only
- [ ] Check focus visibility on all interactive elements
- [ ] Test with screen reader (NVDA, VoiceOver, TalkBack)
- [ ] Verify color contrast with WebAIM Contrast Checker
- [ ] Test with zoom (200%) - content must remain usable
- [ ] Check with high contrast mode

**Automated Testing:**
- [ ] Run axe DevTools extension
- [ ] Use Lighthouse accessibility audit
- [ ] ESLint with `jsx-a11y` plugin

**Common Issues to Check:**
- Missing alt text for meaningful images
- Empty links or buttons
- Duplicate IDs on elements
- Missing form labels
- Insufficient color contrast
- Keyboard traps
- Focus order issues

### Resources for Testing

**Tools:**
- **Browser DevTools:** Accessibility panel, Lighthouse
- **Screen Readers:** NVDA (Windows), VoiceOver (Mac), TalkBack (Android)
- **Color Checkers:** WebAIM Contrast Checker, Chrome DevTools
- **Automated:** axe DevTools, WAVE Web Accessibility Evaluation

**Test Users:**
- Keyboard-only users
- Screen reader users
- Users with motor impairments
- Users with low vision
- Color blind users

**Implementation Priority:**
1. **Level A (Essential):** Keyboard navigation, focus management, color contrast
2. **Level AA (Enhanced):** Screen reader support, reduced motion, enhanced contrast
3. **Level AAA (Optional):** Extended contrast ratios, sign language support

---

## **10) Quick Checklist**

Trước khi commit:

### Typography & Readability
- [ ] **Heading hierarchy:** H1 = `text-3xl font-bold`, H2 = `text-2xl font-semibold`, etc.
- [ ] **Body text:** `text-base` with `leading-normal` (1.5)
- [ ] **Mobile responsive:** Scale down headings on mobile (`text-2xl md:text-3xl`)
- [ ] **Text handling:** Use `truncate` or `line-clamp` for long content
- [ ] **Vietnamese content:** 100% UI text in Vietnamese, headings ≤ 6 words

### Spacing & Layout
- [ ] **8-point grid:** Use standard spacing values (4, 8, 12, 16, 24, 32, 48, 64px)
- [ ] **Section spacing:** Default `gap-6` (24px) between major sections
- [ ] **Page container:** `px-4 lg:px-6`, `py-6 md:py-8`, `max-w-7xl mx-auto`
- [ ] **Visual hierarchy:** More whitespace around important elements
- [ ] **Touch targets:** Minimum 44x44px for interactive elements

### Component Usage
- [ ] **Card depth:** Max 1 level deep, avoid "card-ception"
- [ ] **Tables:** Container wrapper with border, sticky headers
- [ ] **Grid items:** Use Card component if clickable
- [ ] **Forms:** Proper labels, validation states, error handling
- [ ] **Buttons:** Loading states, disabled states, proper variants

### State Management
- [ ] **Main screens:** Complete 4-state flow (loading → success → empty → error)
- [ ] **Secondary views:** Simplified 3-state flow (loading → success → error)
- [ ] **Inline elements:** Minimal loading → success states
- [ ] **Empty states:** Icon + title + description + CTA
- [ ] **Error states:** Clear message + retry mechanism when appropriate

### Accessibility (WCAG AA)
- [ ] **Color contrast:** ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] **Focus states:** Visible focus rings on all interactive elements
- [ ] **Keyboard navigation:** Tab order logical, no keyboard traps
- [ ] **Screen reader:** Semantic HTML, proper labels, ARIA where needed
- [ ] **Motion support:** Respect `prefers-reduced-motion`

### Dashboard-Specific
- [ ] **KPI cards:** Always use Card for metrics, include trend indicators
- [ ] **Data visualization:** Appropriate chart types, accessible colors
- [ ] **F-pattern layout:** Important metrics top-left, filters top-right
- [ ] **Tab navigation:** Sticky with backdrop-blur, Vietnamese labels

### Performance & Polish
- [ ] **Loading feedback:** Skeleton screens > spinners for content
- [ ] **Micro-interactions:** Button press effects, hover states
- [ ] **Error prevention:** Clear validation, confirmation for destructive actions
- [ ] **Success feedback:** Toast notifications, inline messages

### Code Quality
- [ ] **Component extraction:** Only when pattern repeats (≥2 uses)
- [ ] **POC code:** Inline acceptable in development phase
- [ ] **TypeScript interfaces:** Proper typing for extracted components
- [ ] **Consistency:** Follow established patterns and shadcn defaults

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