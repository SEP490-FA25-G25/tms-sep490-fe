"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface AAStatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    urgentCount?: number
    className?: string
    valueClassName?: string
    iconClassName?: string
}

export function AAStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    urgentCount,
    className,
    valueClassName,
    iconClassName,
}: AAStatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="flex items-center gap-2">
                    {urgentCount && urgentCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {urgentCount} khẩn
                        </Badge>
                    )}
                    {Icon && (
                        <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50",
                            iconClassName
                        )}>
                            <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
