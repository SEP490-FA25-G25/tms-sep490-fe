# Project Structure - TMS SEP490 Frontend

```
tms-sep490-fe/
├── .claude/                    # Claude Code configuration
├── .serena/                    # Serena memories (this directory)
├── dist/                       # Production build output
├── docs/                       # Documentation
│   ├── uiux-design.md          # UI/UX design guidelines
│   ├── prd.md                  # Product requirements
│   └── student-request/        # Feature-specific docs
├── node_modules/               # Dependencies
├── public/                     # Static assets
├── src/
│   ├── app/                    # Page components (route-based)
│   │   ├── academic/           # Academic affairs pages
│   │   │   ├── classes/        # Class management
│   │   │   └── requests/       # Request management
│   │   ├── admin/              # Admin pages
│   │   │   └── users/          # User management
│   │   ├── dashboard/          # Dashboard page
│   │   ├── login/              # Login page
│   │   ├── student/            # Student pages
│   │   │   ├── courses/        # Student courses
│   │   │   ├── schedule/       # Student schedule
│   │   │   └── requests/       # Student requests
│   │   ├── teacher/            # Teacher pages
│   │   │   └── classes/        # Teacher classes
│   │   └── page.tsx            # Landing page
│   ├── assets/                 # Static assets (images, etc.)
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   │   └── role-based/     # Role-specific dashboards
│   │   ├── requests/           # Request workflow components
│   │   ├── ui/                 # shadcn/ui components (32+)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (many more)
│   │   ├── app-sidebar.tsx     # Main navigation sidebar
│   │   ├── DashboardLayout.tsx # Dashboard layout wrapper
│   │   ├── ProtectedRoute.tsx  # Route protection
│   │   ├── login-form.tsx      # Login form component
│   │   └── ... (other components)
│   ├── constants/              # Application constants
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth hook (convenience wrapper)
│   │   ├── useAuthVerification.ts
│   │   ├── useRoleBasedAccess.ts
│   │   └── use-mobile.tsx      # Mobile detection
│   ├── lib/
│   │   ├── utils.ts            # cn() class merging utility
│   │   └── validations.ts      # Zod validation schemas
│   ├── store/
│   │   ├── services/           # RTK Query API services
│   │   │   ├── authApi.ts      # Authentication endpoints
│   │   │   ├── classApi.ts     # Class management
│   │   │   ├── studentApi.ts   # Student management
│   │   │   ├── enrollmentApi.ts
│   │   │   ├── curriculumApi.ts
│   │   │   ├── studentRequestApi.ts
│   │   │   └── studentScheduleApi.ts
│   │   ├── slices/
│   │   │   └── authSlice.ts    # Auth state slice
│   │   └── index.ts            # Store configuration
│   ├── types/                  # TypeScript type definitions
│   │   └── academicTransfer.ts
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main app with routing
│   ├── App.css                 # App-specific styles
│   ├── index.css               # Global styles (Tailwind)
│   └── main.tsx                # Entry point
├── .gitignore
├── AGENTS.md                   # AI agent instructions
├── CLAUDE.md                   # Claude Code instructions
├── components.json             # shadcn/ui configuration
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── pnpm-lock.yaml              # Lock file
├── README.md                   # Project readme
├── tsconfig.json               # TypeScript config (root)
├── tsconfig.app.json           # TypeScript config (app)
├── tsconfig.node.json          # TypeScript config (node)
└── vite.config.ts              # Vite configuration
```

## Key Files

### Configuration
- `vite.config.ts` - Build tool config with API proxy
- `tsconfig.app.json` - TypeScript strict mode settings
- `eslint.config.js` - Linting rules
- `components.json` - shadcn/ui style configuration
- `tailwind.config.ts` - Tailwind CSS (if exists, or in index.css)

### Entry Points
- `src/main.tsx` - App entry point
- `src/App.tsx` - Main routing configuration
- `src/index.css` - Global Tailwind styles

### Core Logic
- `src/store/index.ts` - Redux store setup
- `src/store/services/authApi.ts` - Auth with token refresh
- `src/contexts/AuthContext.tsx` - Auth context provider
- `src/components/ProtectedRoute.tsx` - Route protection

### Documentation
- `CLAUDE.md` - Development guidelines and patterns
- `docs/uiux-design.md` - UI/UX design system
- `docs/prd.md` - Product requirements
