import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface QAStatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    className?: string
    valueClassName?: string
    iconClassName?: string
}

export function QAStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    className,
    valueClassName,
    iconClassName,
}: QAStatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && (
                    <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50",
                        iconClassName
                    )}>
                        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
                {(subtitle || trendValue) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {trendValue && (
                            <span
                                className={cn(
                                    "font-medium",
                                    trend === "up" && "text-green-600",
                                    trend === "down" && "text-red-600",
                                    trend === "neutral" && "text-yellow-600"
                                )}
                            >
                                {trendValue}
                            </span>
                        )}
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
