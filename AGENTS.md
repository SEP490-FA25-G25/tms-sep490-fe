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
- **Card Component And Borders Limitations**: Only use card components when absolutely necessary for visual grouping of related content. Avoid wrapping everything in cards unnecessarily
- **Clean Interface**: Prioritize direct content presentation over unnecessary container elements

## Serena MCP Server Integration

### Overview
This project uses **Serena MCP (Model Context Protocol) Server** for intelligent code navigation and editing. Serena provides semantic understanding of the codebase through language server integration.

### Memory Files Available
After onboarding, these memory files contain project-specific knowledge:
- `project_overview.md` - Tech stack, architecture, key design principles
- `suggested_commands.md` - Development, Git, and system commands
- `code_style_conventions.md` - TypeScript settings, component patterns, RTK Query patterns
- `task_completion_checklist.md` - Quality checks before completing tasks
- `project_structure.md` - Complete directory layout and key files
- `design_patterns_guidelines.md` - Architecture patterns, UI/UX guidelines, Vietnamese language requirements

### Key Serena Tools for This Project

**Code Navigation (Use Instead of Reading Entire Files)**
```
# Get overview of symbols in a file
mcp__serena__get_symbols_overview("src/store/services/authApi.ts")

# Find specific symbol by name path
mcp__serena__find_symbol("authApi", include_body=true)

# Find references to a symbol
mcp__serena__find_referencing_symbols("useAuth", "src/hooks/useAuth.ts")

# Search for patterns in codebase
mcp__serena__search_for_pattern("useGetClassesQuery")
```

**Code Editing (Symbol-Based)**
```
# Replace entire symbol body
mcp__serena__replace_symbol_body("ComponentName", "src/components/...tsx", "new component body")

# Insert after a symbol (e.g., add new function)
mcp__serena__insert_after_symbol("existingFunction", "src/...tsx", "new function")

# Insert before a symbol (e.g., add imports)
mcp__serena__insert_before_symbol("ComponentName", "src/...tsx", "import statement")

# Rename symbol throughout codebase
mcp__serena__rename_symbol("oldName", "src/...tsx", "newName")
```

**Memory Management**
```
# Read project-specific knowledge
mcp__serena__read_memory("code_style_conventions.md")

# Update memory with new learnings
mcp__serena__write_memory("new_insight.md", "content")

# List all available memories
mcp__serena__list_memories()
```

**Thinking Tools (Call Before Important Actions)**
```
# After gathering information
mcp__serena__think_about_collected_information()

# Before making code changes
mcp__serena__think_about_task_adherence()

# When task seems complete
mcp__serena__think_about_whether_you_are_done()
```

### Best Practices with Serena

1. **Don't Read Entire Files** - Use `get_symbols_overview` first, then `find_symbol` with specific name paths
2. **Use Symbol-Based Editing** - Prefer `replace_symbol_body` over line-based edits for component/function changes
3. **Check Memory Files** - Read relevant memories before starting complex tasks
4. **Think Before Acting** - Call thinking tools before making significant changes
5. **Restrict Searches** - Always pass `relative_path` to narrow searches to specific directories

### Example Workflow

```
1. Read memory: mcp__serena__read_memory("code_style_conventions.md")
2. Overview: mcp__serena__get_symbols_overview("src/store/services/studentApi.ts")
3. Find function: mcp__serena__find_symbol("studentApi", include_body=true, depth=1)
4. Think: mcp__serena__think_about_collected_information()
5. Edit: mcp__serena__replace_symbol_body("useGetStudentsQuery", ..., "updated query")
6. Verify: mcp__serena__think_about_whether_you_are_done()
```

## Acknowledging Correct Feedback

When feedback IS correct:

✅ "Fixed. [Brief description of what changed]"
✅ "Good catch – [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]

❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
❌ "Thanks for [anything]!"
❌ ANY gratitude expression

**Why no thanks:** Actions speak. Just fix it. The code itself shows you heard the feedback.

**If you catch yourself about to write "Thanks":** DELETE IT. State the fix instead.

---

## Gracefully Correcting Your Pushback

If you pushed back and were wrong:

✅ "You were right – I checked [X] and it does [Y]. Implementing now."
✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

❌ Long apology  
❌ Defending why you pushed back  
❌ Over-explaining  

State the correction factually and move on.

