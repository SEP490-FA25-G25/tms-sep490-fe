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

### Design System
1. **Minimalism with purpose** - Remove unnecessary elements
2. **Content-first** - Design serves content
3. **High contrast** - WCAG AA compliance
4. **Generous whitespace** - 8px grid system
5. **Subtle animations** - Only when purposeful

### Card Usage (IMPORTANT)
- ❌ Don't wrap everything in cards
- ✅ Use cards only for visual grouping of related content
- ✅ Prefer direct content presentation

### Color Palette
- **Base**: White, grays (neutral)
- **Accent**: Subtle purple or brand color
- **Text**: High contrast ratios
- **Dark mode**: Support with careful gray selection

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
