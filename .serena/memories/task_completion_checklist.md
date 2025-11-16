# Task Completion Checklist

## Before Marking Task as Complete

### 1. Code Quality
- [ ] Code compiles without TypeScript errors: `pnpm build`
- [ ] No ESLint warnings or errors: `pnpm lint`
- [ ] No unused imports or variables
- [ ] No console.log statements left in production code
- [ ] Proper error handling implemented

### 2. Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation with Zod schemas where applicable
- [ ] Protected routes properly configured
- [ ] No XSS vulnerabilities (sanitize user input)

### 3. UI/UX Requirements
- [ ] All text is in Vietnamese (100%)
- [ ] Follows modern minimal design principles
- [ ] Uses shadcn/ui components consistently
- [ ] Responsive design (mobile-first)
- [ ] Proper loading states
- [ ] Error states handled gracefully
- [ ] Toast notifications for user feedback (Sonner)

### 4. State Management
- [ ] RTK Query services use `transformResponse` to extract data
- [ ] Cache invalidation configured (`providesTags`/`invalidatesTags`)
- [ ] No race conditions in async operations
- [ ] Proper loading/error/success states

### 5. Best Practices
- [ ] DRY - No code duplication
- [ ] Clean and readable code
- [ ] Meaningful variable and function names
- [ ] Proper TypeScript types (no `any` unless necessary)
- [ ] Components are reasonably sized (split if too large)

### 6. Integration
- [ ] API calls match backend endpoints
- [ ] Request/Response types match backend DTOs
- [ ] Handles all API response scenarios (success, error, validation)
- [ ] Authentication tokens properly attached

## Commands to Run
```bash
# Type checking
pnpm build

# Linting
pnpm lint

# Development server (visual testing)
pnpm dev
```

## Post-Task Actions
1. Test in development environment
2. Verify UI matches requirements
3. Check browser console for errors
4. Test responsive behavior
5. Verify API integration works
6. Document any non-obvious implementations
