import { useTheme } from "@/components/hooks/use-theme"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const themeState = useTheme()
  if (!themeState) return null

  const { theme, setTheme } = themeState
  const isDarkMode = theme === "dark"

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isDarkMode}
        onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
        title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      />
    </div>
  )
}