# Design Patterns and Guidelines

## Architecture Patterns

### 1. Layered Architecture
```
Pages (App) → Components → Hooks → Store (Services/Slices) → API
```

### 2. Provider Pattern
- Redux Provider wraps entire app
- AuthProvider for authentication context
- SidebarProvider for sidebar state

### 3. Protected Route Pattern
```typescript
<ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
  <AdminPage />
</ProtectedRoute>
```

## Component Patterns

### Smart vs Presentational
- **Smart Components** (Pages): Data fetching, business logic
- **Presentational Components** (UI): Pure rendering, receive props

### Composition Pattern
```typescript
// shadcn/ui components are composable
<Dialog>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### Custom Hook Pattern
```typescript
// Encapsulate logic in hooks
function useAuth() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return authContext;
}
```

## State Management Patterns

### RTK Query for Server State
- Automatic caching and background updates
- Tag-based cache invalidation
- Optimistic updates for better UX

### Redux for Client State (Minimal)
- Auth state (tokens, user info)
- UI state that needs persistence
- Avoid for server-cached data

### Context for Cross-Cutting Concerns
- Authentication access
- Theme/preferences
- Global configurations

## UI/UX Guidelines (CRITICAL)

### Language
**100% Vietnamese** for all user-facing text:
- Labels: "Tên", "Email", "Mật khẩu"
- Buttons: "Đăng nhập", "Lưu", "Hủy"
- Messages: "Đang tải...", "Thành công", "Lỗi"
- Placeholders: "Nhập tên...", "Chọn ngày..."

### Design System Core
1. **Minimalism with purpose** - Remove unnecessary elements
2. **Content-first** - Design serves content
3. **High contrast** - WCAG AA compliance
4. **Generous whitespace** - 8px grid system
5. **Subtle animations** - Only when purposeful

### Card, Border, Shadow Rules (CRITICAL)
- ❌ Don't wrap everything in cards
- ✅ Cards only for independent content blocks (widgets/functional blocks)
- ✅ Maximum 1 level of card nesting
- ❌ Don't wrap lists/tables/forms in cards unless background separation needed
- ✅ Prefer Grid/Flex layout for grouping over card containers
- ✅ Border: 1px neutral-200/300 only
- ✅ Shadow: none or very subtle (no glow)
- ❌ Avoid grid of identical cards causing visual noise

### Information Hygiene (Anti-Text Noise)
- **Heading**: ≤ 6 words
- **Description**: ≤ 2 sentences
- ❌ No successive text blocks (multiple descriptions in a row)
- ✅ Use tooltip/assist sparingly when really needed
- ❌ Remove redundant labels when placeholder/label is clear enough
- ❌ Don't repeat context in subtext
- ✅ Keep only meaningful information that helps decision/action

### Feedback & Notifications
- **Inline feedback**: Prefer validation near form fields
- **Toast**: Only for important actions/success/system errors
  - Maximum 1-2 toasts per flow
  - Auto-dismiss with reasonable timing
  - No stacking/prolonged display
- **Banner**: Rare, only for system-wide warnings
- **Loading**: Skeleton/shimmer preferred
  - ❌ Avoid full-page overlays
  - Spinner only when absolutely necessary

### Layout & Density for Dashboard
- **Grid/Flex first, cards second**: Group content with layout and spacing
- **Tables**:
  - Density: comfortable/compact
  - Row height: minimum 44px
  - Light zebra striping or thin dividers
  - ❌ No card wrapper around tables
  - Clear sorting/filter, minimal empty state
- **Forms**:
  - 8px grid spacing
  - Group by sections
  - ❌ No border-box for each field
  - Short descriptions, clear hints/placeholders
  - Inline validation
- **Navigation/Toolbar**: Compact with icon + short label

### Spacing with Purpose
- Whitespace must guide content flow
- ❌ No isolated whitespace without visual direction
- Block spacing: multiples of 8 (16/24/32px)
- Heading to content: 8-12px
- Between groups: 16-24px
- ✅ Prefer grid alignment over adding cards/bezels

### Icon & Accent Usage
- **Icons**: Monochrome, only when improving scannability or clarifying actions
- ❌ No decorative icons
- **Accent colors**: Only for primary actions/focus states
- ❌ Avoid multiple accent colors side by side
- **Status colors** (success/warning/error): Neutral, low saturation, darker only for clear warnings

### Empty/Error States
- **Empty state**: 1 short sentence + CTA if needed
  - ❌ No card wrapper
  - ❌ No elaborate background
- **Error**: Vietnamese, clear, inline near the error
  - ❌ No spam toasts/banners
- **Retry/Refresh**: Visible near the action
  - ❌ No error modals unless major decision needed

### Dashboard Minimal Checklist
1. **Card/Border**: Cards when truly needed; border 1px neutral-200/300, shadow light or none
2. **Layout**: Grid/Flex for grouping; avoid repeated card grids; spacing in multiples of 8, no isolated whitespace
3. **Text**: 100% Vietnamese, concise; no successive text; heading ≤ 6 words, description ≤ 2 sentences; remove extra captions
4. **Feedback**: Inline validation; max 1-2 toasts/flow; rare banners; skeleton/shimmer loading
5. **Tables/Forms**: Compact tables (≥44px rows), light zebra/dividers, no outer card; forms grouped by section, clear hints, inline validation
6. **Icon/Accent**: Monochrome icons when useful; accent only for primary/focus; avoid multiple accent colors
7. **Empty/Error**: Empty state 1 sentence + CTA; clear Vietnamese errors, no notification spam; retry near action

## Code Quality Principles

### SOLID Principles
- **Single Responsibility**: Components do one thing
- **Open/Closed**: Extend via props, not modification
- **Liskov Substitution**: Components can be swapped
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions (hooks)

### DRY (Don't Repeat Yourself)
```typescript
// Bad: Repeated API call pattern
const { data: users } = useGetUsersQuery();
const { data: classes } = useGetClassesQuery();
// Each with same loading/error handling

// Good: Abstracted pattern
function useApiQuery<T>(queryHook: () => QueryResult<T>) {
  const result = queryHook();
  // Centralized loading/error handling
  return result;
}
```

### Clean Code
- Meaningful names
- Small functions (< 30 lines ideal)
- No magic numbers/strings
- Comments explain "why", not "what"
- Early returns reduce nesting

## Error Handling

### API Errors
```typescript
try {
  await createItem(data).unwrap();
  toast.success('Tạo thành công');
} catch (error) {
  if (error.status === 400) {
    toast.error('Dữ liệu không hợp lệ');
  } else if (error.status === 401) {
    // Handled by baseQueryWithReauth
  } else {
    toast.error('Có lỗi xảy ra');
  }
}
```

### Form Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
});
```

## Performance Considerations

### Prevent Race Conditions
- Use RTK Query's built-in request deduplication
- Cancel outdated requests
- Proper loading state management

### Avoid Over-Engineering
- Don't add speculative features
- Keep components focused
- Prefer simple solutions
- Refactor when patterns emerge

### Memoization
```typescript
// Use when computation is expensive
const memoizedValue = useMemo(() => expensiveCalc(data), [data]);
const memoizedCallback = useCallback(() => handleClick(id), [id]);
```

## MVP Focus
- Complete the user story at hand
- Stay within defined scope
- Functional and demonstrable features
- Meet acceptance criteria first
- Polish later
