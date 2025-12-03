import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function DashboardLayout({ children, title, description, actions }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            {(title || description || actions) && (
              <header className="flex flex-col gap-2 border-b border-border px-4 lg:px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    {title && (
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                    )}
                    {description && typeof description === 'string' ? (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    ) : description ? (
                      <div className="text-sm text-muted-foreground">{description}</div>
                    ) : null}
                  </div>
                  {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
              </header>
            )}
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
