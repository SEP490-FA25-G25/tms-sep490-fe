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
- `src/app/` - Page components organized by route (dashboard, login, admin, teacher, student, academic)
- `src/components/` - Reusable components
  - `ui/` - shadcn/ui component library
  - `dashboard/` - Role-specific dashboard components
  - Feature-specific components (app-sidebar, site-header, etc.)
- `src/contexts/` - React contexts (AuthContext)
- `src/hooks/` - Custom hooks (useAuth, use-mobile, useAuthVerification, useRoleBasedAccess)
- `src/lib/` - Utility functions (utils.ts with cn() helper)
- `src/store/` - Redux store configuration
  - `slices/` - Redux slices (authSlice)
  - `services/` - RTK Query API services (authApi, classApi, studentApi, enrollmentApi)

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
- **Multiple API services**: `authApi`, `classApi`, `studentApi`, `enrollmentApi`

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

## Implementation Plan: Core Principles

**1. Code Quality & Structure:**

- **Clean Implementation:** The implementation must be clean, avoiding unnecessary code, complexity, and "code smells." Adhere strictly to established coding standards and best practices (e.g., SOLID, DRY).
- **No Redundancy (DRY - Don't Repeat Yourself):** Actively prevent code duplication. Abstract and reuse components, functions, and logic wherever possible.
- **Logical Soundness & Correct Algorithms:** Ensure all logic is correct and the algorithms used are efficient and appropriate for the given problem.

**2. System Integrity & Performance:**

- **Prevent Race Conditions:** Proactively identify and prevent potential race conditions to ensure data integrity and system stability, especially in concurrent operations.
- **Avoid Over-engineering:** The solution must not be over-engineered. Implement what is necessary to meet the current requirements without adding speculative features or unnecessary complexity.

**3. Development Approach:**

- **Adhere to Best Practices:** Always follow the best and most current industry-standard approaches for the technologies and patterns being used.
- **Maintain a Holistic View:** Always consider the overall architecture and the impact of your changes on the entire system. Ensure new implementations integrate seamlessly.
- **Focus on the Story & Scope:** Concentrate on delivering the user story at hand. Ensure the implementation directly serves the story's requirements and stays within the defined scope for the MVP (Minimum Viable Product). The primary goal is a functional, demonstrable feature that meets the story's acceptance criteria.

**4. Final Deliverable:**

- **Solid & Maintainable Code:** The final code must be robust, reliable, well-documented, and easy for other developers to understand, modify, and maintain in the future.

**5. UI/UX Requirements:**

- **Vietnamese Language**: All user interface text, labels, buttons, messages, and user-facing content must be in Vietnamese 100%
- **Padding Usage**: Use padding purposefully and avoid excessive whitespace that makes the interface feel disconnected
- **Card Component Limitations**: Only use card components when absolutely necessary for visual grouping of related content. Avoid wrapping everything in cards unnecessarily
- **Clean Interface**: Prioritize direct content presentation over unnecessary container elements
