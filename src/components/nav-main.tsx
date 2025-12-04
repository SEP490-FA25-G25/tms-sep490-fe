import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNavigationGuard } from "@/contexts/NavigationGuardContext"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    badge?: ReactNode
  }[]
}) {
  const { isBlocking, confirmNavigation } = useNavigationGuard();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    // If blocking is enabled and trying to navigate away
    if (isBlocking && url !== location.pathname) {
      e.preventDefault();
      confirmNavigation(url);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link 
                  to={item.url} 
                  className="flex w-full items-center gap-2"
                  onClick={(e) => handleClick(e, item.url)}
                >
                  {item.icon && <item.icon />}
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
