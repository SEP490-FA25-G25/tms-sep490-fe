# Suggested Commands for TMS Frontend Development

## Development Commands
```bash
# Start development server (port 5173, proxies to backend at 8080)
pnpm dev

# Build for production (runs TypeScript check then Vite build)
pnpm build

# Lint code with ESLint
pnpm lint

# Preview production build
pnpm preview
```

## Adding shadcn/ui Components
```bash
# Add new component from shadcn/ui registry
pnpm dlx shadcn@latest add <component-name>
# Example: pnpm dlx shadcn@latest add button
```

## Git Commands
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "message"

# View recent commits
git log --oneline -n 10

# Check branch
git branch

# Diff
git diff
```

## Windows-Specific System Commands
```bash
# List directory (PowerShell)
Get-ChildItem  # or dir

# Find files
Get-ChildItem -Recurse -Filter "*.tsx"

# Search in files (PowerShell)
Select-String -Path "*.tsx" -Pattern "pattern"

# Navigate
cd <path>

# Current directory
pwd  # or Get-Location
```

## Backend Commands (if needed)
```bash
# Navigate to backend
cd ../tms-sep490-be

# Run backend
mvn spring-boot:run

# Test backend
mvn test -Dtest=TestClassName
```

## Database Setup (Docker)
```bash
# Start PostgreSQL container
docker run --name tms-postgres -e POSTGRES_PASSWORD=979712 -p 5432:5432 -d postgres:16

# Create database
docker exec -it tms-postgres psql -U postgres -c "CREATE DATABASE tms;"
```

## Useful Paths
- Frontend root: `D:\Workspace\projects\tms-sep490-fa25\tms-sep490-fe`
- Backend root: `D:\Workspace\projects\tms-sep490-fa25\tms-sep490-be`
- UI Components: `src/components/ui/`
- RTK Query Services: `src/store/services/`
- Page Components: `src/app/`
