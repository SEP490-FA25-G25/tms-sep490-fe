"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarDays, Download, Loader2 } from "lucide-react"
import { QAExportDialog } from "@/components/qa/QAExportDialog"
import { useSearchParams } from "react-router-dom"

interface QAExportButtonProps {
    className?: string
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

export function QAExportButton({
    className,
    variant = "outline",
    size = "default"
}: QAExportButtonProps) {
    const [searchParams] = useSearchParams()
    const [isOpen, setIsOpen] = React.useState(false)

    // Get date range from URL parameters for default values
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')

    const defaultDateFrom = dateFromParam ? new Date(dateFromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const defaultDateTo = dateToParam ? new Date(dateToParam) : new Date()

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Dữ Liệu
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Xuất Dữ Liệu QA
                    </DialogTitle>
                    <DialogDescription>
                        Chọn khoảng thời gian và các phần dữ liệu bạn muốn xuất ra file Excel.
                    </DialogDescription>
                </DialogHeader>
                <QAExportDialog
                    defaultDateFrom={defaultDateFrom}
                    defaultDateTo={defaultDateTo}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}