"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { CalendarIcon, Download, Loader2, AlertTriangle, Check } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useExportQADataMutation } from "@/store/services/qaApi"
import type { QAExportRequest } from "@/types/qa"

interface QAExportDialogProps {
    defaultDateFrom: Date
    defaultDateTo: Date
    onSuccess: () => void
    onCancel: () => void
}

type ExportSection = 'KPI_OVERVIEW' | 'CLASSES_REQUIRING_ATTENTION' | 'RECENT_QA_REPORTS'
type ExportFormat = 'EXCEL'

interface ExportFormData {
    dateFrom: Date | undefined
    dateTo: Date | undefined
    format: ExportFormat
    includeSections: ExportSection[]
}

export function QAExportDialog({
    defaultDateFrom,
    defaultDateTo,
    onSuccess,
    onCancel
}: QAExportDialogProps) {
    const [formData, setFormData] = React.useState<ExportFormData>({
        dateFrom: defaultDateFrom,
        dateTo: defaultDateTo,
        format: 'EXCEL',
        includeSections: ['KPI_OVERVIEW', 'CLASSES_REQUIRING_ATTENTION', 'RECENT_QA_REPORTS']
    })

    const [error, setError] = React.useState<string | null>(null)
    const [exportMutation, { isLoading }] = useExportQADataMutation()

    const exportSections = [
        {
            id: 'KPI_OVERVIEW' as ExportSection,
            label: 'Tổng Quan KPIs',
            description: 'Chỉ số hiệu suất chính của QA'
        },
        {
            id: 'CLASSES_REQUIRING_ATTENTION' as ExportSection,
            label: 'Lớp Cần Chú Ý',
            description: 'Các lớp có tỷ lệ điểm danh hoặc hoàn thành bài tập thấp'
        },
        {
            id: 'RECENT_QA_REPORTS' as ExportSection,
            label: 'Báo Cáo QA Gần Đây',
            description: 'Danh sách báo cáo QA gần đây theo khoảng thời gian'
        }
    ]

    const exportFormats = [
        {
            id: 'EXCEL' as ExportFormat,
            label: 'Excel (.xlsx)',
            description: 'File Excel có nhiều sheets'
        }
    ]

    const handleSectionChange = (section: ExportSection, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            includeSections: checked
                ? [...prev.includeSections, section]
                : prev.includeSections.filter(s => s !== section)
        }))
    }

    const handleDateFromChange = (date: Date | undefined) => {
        setFormData(prev => ({
            ...prev,
            dateFrom: date,
            // Auto-adjust dateTo if it's before dateFrom
            dateTo: date && prev.dateTo && prev.dateTo < date ? date : prev.dateTo
        }))
    }

    const handleDateToChange = (date: Date | undefined) => {
        setFormData(prev => ({
            ...prev,
            dateTo: date,
            // Auto-adjust dateFrom if it's after dateTo
            dateFrom: date && prev.dateFrom && prev.dateFrom > date ? date : prev.dateFrom
        }))
    }

    const validateForm = (): boolean => {
        if (!formData.dateFrom || !formData.dateTo) {
            setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc')
            return false
        }

        if (formData.dateFrom > formData.dateTo) {
            setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
            return false
        }

        if (formData.includeSections.length === 0) {
            setError('Vui lòng chọn ít nhất một phần dữ liệu để xuất')
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }

        setError(null)

        try {
            const exportRequest: QAExportRequest = {
                dateFrom: formData.dateFrom?.toISOString().split('T')[0] || '',
                dateTo: formData.dateTo?.toISOString().split('T')[0] || '',
                format: formData.format,
                includeSections: formData.includeSections
            }

            await exportMutation(exportRequest)

            // Success - file download is handled by the mutation response handler
            onSuccess()

        } catch (err) {
            console.error('Export error:', err)
            setError(err instanceof Error ? err.message : 'Không thể xuất dữ liệu. Vui lòng thử lại.')
        }
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* Date Range Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Khoảng Thời Gian</Label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Từ ngày</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.dateFrom && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.dateFrom ? (
                                        format(formData.dateFrom, "dd/MM/yyyy", { locale: vi })
                                    ) : (
                                        <span>Chọn ngày</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.dateFrom}
                                    onSelect={handleDateFromChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Đến ngày</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.dateTo && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.dateTo ? (
                                        format(formData.dateTo, "dd/MM/yyyy", { locale: vi })
                                    ) : (
                                        <span>Chọn ngày</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.dateTo}
                                    onSelect={handleDateToChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Định Dạng Xuất</Label>
                <RadioGroup
                    value={formData.format}
                    onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        format: value as ExportFormat
                    }))}
                    className="space-y-2"
                >
                    {exportFormats.map((format) => (
                        <div key={format.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={format.id} id={format.id} />
                            <Label htmlFor={format.id} className="text-sm">
                                {format.label}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Sections Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Phần Dữ Liệu Xuất</Label>
                <div className="space-y-3">
                    {exportSections.map((section) => (
                        <div key={section.id} className="flex items-start space-x-3">
                            <Checkbox
                                id={section.id}
                                checked={formData.includeSections.includes(section.id)}
                                onCheckedChange={(checked) => handleSectionChange(section.id, checked as boolean)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor={section.id} className="text-sm font-medium">
                                    {section.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {section.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="min-w-[100px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xuất...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Xuất File
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}