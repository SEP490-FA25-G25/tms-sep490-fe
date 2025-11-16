# Code Style and Conventions

## TypeScript Configuration
- **Strict mode**: Enabled
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Path alias**: `@/*` maps to `./src/*`
- **JSX**: react-jsx

### Strict Settings
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noFallthroughCasesInSwitch`: true
- `noUncheckedSideEffectImports`: true

## ESLint Configuration
- TypeScript ESLint recommended rules
- React Hooks plugin (recommended-latest)
- React Refresh plugin for Vite
- ECMAScript 2020 features
- Browser globals

## Component Patterns

### File Structure
```
src/
├── app/                  # Page components (route-based)
│   └── [route]/page.tsx  # Next.js-style naming
├── components/
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature-specific components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utilities
├── store/
│   ├── services/         # RTK Query API services
│   └── slices/           # Redux slices
└── types/                # TypeScript type definitions
```

### Component Structure
```typescript
// Functional components only (no class components)
// Use TypeScript for all components
// Use hooks for state and side effects

import { cn } from "@/lib/utils"

interface ComponentProps {
  className?: string;
  // ... props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {/* content */}
    </div>
  )
}
```

### State Management Patterns
```typescript
// RTK Query for server state
import { useGetItemsQuery, useCreateItemMutation } from '@/store/services/itemApi';

// Redux slices for client state (rare)
import { useSelector, useDispatch } from 'react-redux';

// React Context for cross-cutting concerns
import { useAuth } from '@/hooks/useAuth';
```

### RTK Query Service Pattern
```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export const featureApi = createApi({
  reducerPath: 'featureApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Feature'],
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => '/endpoint',
      transformResponse: (response: ResponseObject<Item[]>) => response.data,
      providesTags: ['Feature'],
    }),
    createItem: builder.mutation<Item, CreateItemDto>({
      query: (body) => ({
        url: '/endpoint',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ResponseObject<Item>) => response.data,
      invalidatesTags: ['Feature'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = featureApi;
```

## Naming Conventions
- **Files**: camelCase for utilities, PascalCase for components
- **Components**: PascalCase (e.g., `DashboardPage`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth`)
- **Types/Interfaces**: PascalCase (e.g., `UserRole`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for enums/configs

## Import Order (Recommended)
1. React and external libraries
2. Internal absolute imports (`@/...`)
3. Relative imports
4. Type imports

## shadcn/ui Usage
- Style: "new-york"
- Base color: neutral
- Use CSS variables for theming
- Icon library: Lucide React
- Class merging: `cn()` from `@/lib/utils`

## Styling Guidelines
- Use Tailwind CSS classes
- Use `cn()` utility for conditional classes
- Follow 8px grid system for spacing
- Prefer composition over custom CSS
- Mobile-first responsive design
