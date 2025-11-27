# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite frontend application for a TMS (Tutor Management System) built with modern UI components. The project uses shadcn/ui components with Tailwind CSS for styling and implements a dashboard-based interface with authentication.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production (runs TypeScript check then Vite build)
- `pnpm lint` - Run ESLint to check code quality
- `pnpm preview` - Preview production build locally

### Build Process
The build process runs `tsc -b && vite build`, ensuring type checking before bundling.

### Backend Integration
- **API Proxy**: Vite dev server proxies `/api/*` requests to `http://localhost:8080`
- **CORS Handling**: Backend API configured to handle frontend requests
- **Environment**: Development connects to local backend, production can be configured via environment variables

## Technology Stack

- **Frontend Framework**: React 19.1+ with TypeScript
- **Build Tool**: Vite with SWC plugin for fast refresh
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Routing**: React Router DOM v7
- **State Management**: Redux Toolkit with RTK Query + React Context (AuthContext)
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React and Tabler Icons
- **Drag & Drop**: @dnd-kit
- **Tables**: @tanstack/react-table

## Project Structure

### Key Directories
- `src/app/` - Page components organized by route
  - `login/` - Authentication page
  - `dashboard/` - Role-based main dashboard
  - `admin/users/` - User management (ADMIN only)
  - `teacher/classes/` - Teacher's assigned classes
  - `student/courses/`, `student/schedule/`, `student/requests/` - Student features
  - `academic/classes/`, `academic/classes/[id]/`, `academic/requests/` - Academic affairs management
- `src/components/` - Reusable components
  - `ui/` - shadcn/ui component library
  - `dashboard/` - Role-specific dashboard components
  - Feature-specific components (app-sidebar, site-header, etc.)
- `src/contexts/` - React contexts (AuthContext)
- `src/hooks/` - Custom hooks (useAuth, use-mobile, useAuthVerification, useRoleBasedAccess)
- `src/lib/` - Utility functions (utils.ts with cn() helper)
- `src/store/` - Redux store configuration
  - `slices/` - Redux slices (authSlice)
  - `services/` - RTK Query API services (authApi, classApi, studentApi, enrollmentApi, curriculumApi, studentScheduleApi, studentRequestApi)

### Component Architecture
- **Pages**: Located in `src/app/[route]/page.tsx` following Next.js-style conventions
- **Layout Components**: Dashboard uses `SidebarProvider` with `AppSidebar` and `SidebarInset`
- **Authentication**: JWT-based authentication with Redux state management
- **Protected Routes**: `ProtectedRoute` component with role-based access control
- **Role-Based Dashboards**: Separate dashboard components for different user types (Admin, Teacher, Student, Academic Affairs, etc.)

### UI Component System
Uses shadcn/ui with consistent patterns:
- All UI components export from `src/components/ui/`
- Components use `cn()` utility for class merging
- Consistent design tokens via Tailwind CSS variables
- Responsive design with container queries (`@container/main`)

## State Management & Architecture

The application uses a hybrid state management approach:

### Redux Store (Primary)
- **RTK Query** for API calls with auto-caching and background updates
- **Auth slice** for authentication state management
- **API services**: `authApi`, `classApi`, `studentApi`, `enrollmentApi`, `curriculumApi`, `studentScheduleApi`, `studentRequestApi`

### Authentication Flow
- **Redux Toolkit Query** handles login/logout API calls
- **AuthContext** provides a clean interface for components
- **JWT tokens** stored in Redux state (access and refresh tokens)
- **Automatic token verification** on app load via `useAuthVerification`
- **Role-based access control** with multiple user roles (ADMIN, TEACHER, STUDENT, ACADEMIC_AFFAIR, etc.)

### Current Authentication State
The system is connected to a real backend API (localhost:8080) and no longer uses mock authentication. The backend API handles:
- User authentication with JWT tokens
- Role-based authorization
- Multiple user types and permissions

### Adding New RTK Query Service

All backend responses use `ResponseObject<T>` wrapper:
```typescript
interface ResponseObject<T> {
  success: boolean;
  message: string;
  data: T;
}
```

Pattern for new API service (`src/store/services/exampleApi.ts`):
```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

interface Example {
  id: number;
  name: string;
}

export const exampleApi = createApi({
  reducerPath: 'exampleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Example'],
  endpoints: (builder) => ({
    getExamples: builder.query<Example[], void>({
      query: () => '/examples',
      transformResponse: (response: { data: Example[] }) => response.data,
      providesTags: ['Example'],
    }),
    createExample: builder.mutation<Example, Partial<Example>>({
      query: (body) => ({
        url: '/examples',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: Example }) => response.data,
      invalidatesTags: ['Example'],
    }),
  }),
});

export const { useGetExamplesQuery, useCreateExampleMutation } = exampleApi;
```

Register in `src/store/index.ts`:
```typescript
import { exampleApi } from './services/exampleApi';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    [exampleApi.reducerPath]: exampleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // ... existing middleware
      exampleApi.middleware,
    ),
});
```

## Path Aliases

The project uses `@` as an alias for `src/` directory, configured in both Vite and TypeScript configs.

## Design System & UI/UX Guidelines

The project follows a modern minimal design philosophy inspired by shadcn/ui, OpenAI, and contemporary design systems. Key design principles are documented in `docs/uiux-design.md`:

### Design Philosophy
- **Minimalism with purpose**: Clean, content-first design with restraint
- **High accessibility**: WCAG AA contrast ratios and keyboard navigation
- **System consistency**: 8px grid system and generous whitespace
- **Neutral palette**: White/gray base with subtle accent colors (typically purple)

### UI Components Standards
- Use shadcn/ui components as the foundation
- Maintain consistent spacing using 8px grid system
- System fonts (Inter/SF Pro/Roboto) with clear hierarchy
- Subtle, purposeful animations only
- Mobile-first responsive design
- AVOID excessive card component usage - Only use cards when necessary for visual grouping, avoid overusing

### Language & Localization
- **100% Vietnamese language** for all UI text, labels, buttons, and user-facing content
- Code comments and technical documentation can remain in English
- All user interface elements must be localized to Vietnamese

### Color Usage
- Neutral base colors dominate (white, gray tones)
- Accent colors used sparingly for primary actions and focus states
- Support for dark mode with carefully selected gray tones
- High contrast ratios for readability

## Development Notes

- Uses React 19 with concurrent features enabled
- TypeScript strict mode enabled
- ESLint configured with React-specific rules
- Tailwind CSS v4 with Vite plugin for optimal performance
- Component library follows accessibility best practices via Radix UI
- Design system documented in `docs/uiux-design.md` with comprehensive guidelines
- Product requirements documented in `docs/prd.md` for TMS system context

## Implementation Philosophy: Student Capstone Project

### Project Context
This is a **student capstone project** (đồ án tốt nghiệp), NOT a high-enterprise production system. The focus is on delivering functional, demonstrable features that serve real user needs within academic scope.

### Core Principles

**1. User-Role-Centric Thinking**
- Always think from the **role's perspective**: "If I am a STUDENT, what do I actually need?", "If I am a QA, what tasks do I need to complete?"
- Example: A student needs to see their classes, schedule, and grades - NOT complex analytics or AI-powered recommendations.
- Example: Academic Affairs needs to approve/reject student requests - NOT a multi-level approval workflow with delegation features.

**2. Scope-Appropriate Complexity**
- ✅ **Build what users actually use**: Core CRUD operations, simple workflows, clear data presentation
- ❌ **Avoid speculative features**: "What if we need...", "In the future we might...", "Enterprise systems have..."
- ❌ **Don't over-engineer**: Complex state machines, custom design systems, elaborate animation frameworks when simple solutions work

**3. Practical Implementation Guidelines**

**Clean & Simple Code:**
- Follow React best practices, but don't force complex patterns where they add no value
- A straightforward component with clear props is better than an over-abstracted generic component
- Inline 3 lines of JSX is sometimes better than creating a micro-component

**Real Business Logic:**
- Understand the actual workflow: How does a student view their schedule? What does Academic Affairs need to see?
- Don't add features "just in case" - only what's needed NOW for the feature to work
- Example: Don't build "customizable dashboards" if users only need one fixed view

**Avoid Unnecessary Complexity:**
- ❌ Don't implement complex state management (Zustand, Jotai, MobX) when Redux Toolkit + Context works
- ❌ Don't add real-time updates (WebSocket, SSE) if periodic refresh is sufficient
- ❌ Don't create elaborate form builders if simple react-hook-form works
- ❌ Don't add virtual scrolling if lists are under 100 items

**Focus on MVP Delivery:**
- Each feature should be **demonstrable and functional**
- Student can log in → see classes table → click to see details → submit request (DONE)
- Don't add: infinite scroll, drag-to-reorder, keyboard shortcuts, advanced filters, data export

**4. Code Quality ≠ Complexity**
- **Clean code** means readable, maintainable, correct - NOT necessarily "production-grade"
- **Best practices** for capstone projects: Component composition, proper TypeScript types, error boundaries, loading states
- **NOT required**: Custom hook libraries, higher-order components everywhere, render props pattern, compound components

**5. UI/UX Requirements:**
- **Vietnamese Language**: All UI text must be in Vietnamese 100%
- **Minimal Cards/Borders**: Only use cards when necessary for visual grouping
- **Clean Interface**: Prioritize direct content presentation over unnecessary containers

**6. When in Doubt, Ask:**
- "Do users (Student/Teacher/QA/Academic Affairs) actually need this UI feature?"
- "Is this solving a real UX problem or adding 'nice-to-have' complexity?"
- "Can this be simpler and still meet the requirement?"
```

### Remember
- **This is a capstone project to demonstrate learning**, not a production system for 10,000 users
- **Focus on core features working correctly**, not on perfect UX for edge cases
- **Deliver working software that can be demo'd**, not pixel-perfect design for all screen sizes
- **Think like a user of the system**, not a UX designer optimizing for milliseconds

## Acknowledging Correct Feedback

When feedback IS correct:
- ✅ "Fixed. [Brief description of what changed]"
- ✅ "Good catch – [specific issue]. Fixed in [location]."
- ✅ Just fix it and show in the code

When feedback is correct, DO NOT use:
- ❌ "You're absolutely right!", "Great point!", "Thanks for catching that!"
- ❌ ANY gratitude expression

**Why:** Actions speak. The code itself shows you heard the feedback.

## Gracefully Correcting Your Pushback

If you pushed back and were wrong:
- ✅ "You were right – I checked [X] and it does [Y]. Implementing now."
- ✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

Avoid long apologies, defending why you pushed back, or over-explaining. State the correction factually and move on.