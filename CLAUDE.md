# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite frontend application for a TMS (Tutor Management System) built with modern UI components. The project uses shadcn/ui components with Tailwind CSS for styling and implements a dashboard-based interface with authentication.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript check then Vite build)
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Build Process
The build process runs `tsc -b && vite build`, ensuring type checking before bundling.

## Technology Stack

- **Frontend Framework**: React 19.1+ with TypeScript
- **Build Tool**: Vite with SWC plugin for fast refresh
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Routing**: React Router DOM v7
- **State Management**: React Context (AuthContext)
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React and Tabler Icons
- **Drag & Drop**: @dnd-kit
- **Tables**: @tanstack/react-table

## Project Structure

### Key Directories
- `src/app/` - Page components organized by route (dashboard, login)
- `src/components/` - Reusable components
  - `ui/` - shadcn/ui component library
  - Feature-specific components (app-sidebar, site-header, etc.)
- `src/contexts/` - React contexts (AuthContext)
- `src/hooks/` - Custom hooks (useAuth, use-mobile)
- `src/lib/` - Utility functions (utils.ts with cn() helper)

### Component Architecture
- **Pages**: Located in `src/app/[route]/page.tsx` following Next.js-style conventions
- **Layout Components**: Dashboard uses `SidebarProvider` with `AppSidebar` and `SidebarInset`
- **Authentication**: Mock authentication system with localStorage persistence
- **Protected Routes**: `ProtectedRoute` component wraps authenticated pages

### UI Component System
Uses shadcn/ui with consistent patterns:
- All UI components export from `src/components/ui/`
- Components use `cn()` utility for class merging
- Consistent design tokens via Tailwind CSS variables
- Responsive design with container queries (`@container/main`)

## Authentication System

Currently implements mock authentication with hardcoded users:
- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

Authentication state is managed through `AuthContext` and persisted to localStorage. The system is designed to be easily replaced with real API calls.

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