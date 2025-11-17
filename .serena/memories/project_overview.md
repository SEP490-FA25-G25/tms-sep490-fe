# TMS SEP490 Frontend - Project Overview

## Purpose
A Training Management System (TMS) frontend application for managing training centers with classes, students, teachers, and enrollments. The system supports multiple user roles (ADMIN, MANAGER, CENTER_HEAD, SUBJECT_LEADER, ACADEMIC_AFFAIR, QA, TEACHER, STUDENT) and complex workflows like student transfers and class approvals.

## Tech Stack
- **Framework**: React 19.1+ with TypeScript 5.9
- **Build Tool**: Vite 7.1.7 with SWC plugin
- **Styling**: Tailwind CSS 4.1 with shadcn/ui components
- **State Management**: Redux Toolkit 2.9 + RTK Query
- **Routing**: React Router DOM 7.9
- **UI Components**: Radix UI primitives + shadcn/ui (New York style)
- **Icons**: Lucide React + Tabler Icons
- **Utilities**: date-fns, Recharts, Zod, Sonner (toast)
- **Package Manager**: pnpm

## Backend Integration
- API proxy configured in Vite to `http://localhost:8080`
- Backend: Spring Boot 3.5.7 (Java 21) with PostgreSQL
- All API responses wrapped in `ResponseObject<T>` structure:
```typescript
interface ResponseObject<T> {
  success: boolean;
  message: string;
  data: T;
}
```

## Authentication
- JWT-based authentication with access/refresh tokens
- AuthContext wraps Redux for convenient hook usage
- Protected routes with role-based access control
- Automatic token refresh on 401 responses

## Key Design Principles
- **100% Vietnamese language** for all UI text
- **Modern Minimal Design** following shadcn/ui style (New York)
- **Neutral color palette** with subtle accent colors
- **8px grid system** for consistent spacing
- **Mobile-first responsive design**
- **Avoid excessive card usage** - only when necessary for grouping
