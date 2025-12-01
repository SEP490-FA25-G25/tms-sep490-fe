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
}: QAStatsCardProps) {
    return (
        <Card className={cn("overflow-hidden py-0 gap-0", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-3 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent className="pb-3">
                <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
                {(subtitle || trendValue) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
