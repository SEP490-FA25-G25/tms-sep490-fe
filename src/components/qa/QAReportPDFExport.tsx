"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { QAReportDetailDTO, getQAReportTypeDisplayName, getQAReportStatusDisplayName } from "@/types/qa"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface QAReportPDFExportProps {
    report: QAReportDetailDTO
    variant?: "default" | "outline" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
}

export function QAReportPDFExport({
    report,
    variant = "outline",
    size = "default"
}: QAReportPDFExportProps) {
    const [isExporting, setIsExporting] = React.useState(false)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleExportPDF = async () => {
        setIsExporting(true)

        try {
            // Create a temporary container for the PDF content
            const container = document.createElement('div')
            container.id = 'pdf-export-container'
            container.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: 210mm;
                padding: 15mm 20mm;
                background: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #000;
                line-height: 1.5;
            `

            // Build the PDF content - Black & White, Minimal, No class metrics
            container.innerHTML = `
                <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
                    <h1 style="margin: 0 0 5px 0; font-size: 20px; font-weight: bold;">
                        BÁO CÁO CHẤT LƯỢNG ĐÀO TẠO #${report.id}
                    </h1>
                    <p style="margin: 0; font-size: 13px;">
                        Lớp: <strong>${report.classCode}</strong> · 
                        Loại: ${getQAReportTypeDisplayName(report.reportType)} · 
                        Trạng thái: ${getQAReportStatusDisplayName(report.status)}
                    </p>
                </div>

                <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 4px 0; width: 50%;">
                            <strong>Người báo cáo:</strong> ${report.reportedByName}
                        </td>
                        <td style="padding: 4px 0;">
                            <strong>Ngày tạo:</strong> ${formatDate(report.createdAt)}
                        </td>
                    </tr>
                    ${report.sessionDate ? `
                    <tr>
                        <td style="padding: 4px 0;">
                            <strong>Buổi học:</strong> ${new Date(report.sessionDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td style="padding: 4px 0;">
                            ${report.updatedAt && report.updatedAt !== report.createdAt ? `<strong>Cập nhật:</strong> ${formatDate(report.updatedAt)}` : ''}
                        </td>
                    </tr>
                    ` : ''}
                    ${report.phaseName ? `
                    <tr>
                        <td style="padding: 4px 0;" colspan="2">
                            <strong>Giai đoạn:</strong> ${report.phaseName}
                        </td>
                    </tr>
                    ` : ''}
                </table>

                <div style="margin-bottom: 20px;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                        NỘI DUNG BÁO CÁO
                    </div>
                    <div style="white-space: pre-wrap; font-size: 12px; line-height: 1.6; padding-left: 10px; border-left: 2px solid #000;">
${report.findings.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                </div>

                ${report.actionItems ? `
                <div style="margin-bottom: 20px;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                        GHI CHÚ / HÀNH ĐỘNG CẦN THỰC HIỆN
                    </div>
                    <div style="white-space: pre-wrap; font-size: 12px; line-height: 1.6; padding-left: 10px; border-left: 2px solid #666;">
${report.actionItems.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                </div>
                ` : ''}

                <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; color: #666;">
                    Xuất từ TMS · ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            `

            document.body.appendChild(container)

            // Wait for fonts to load
            await new Promise(resolve => setTimeout(resolve, 100))

            // Generate canvas from HTML
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            // Remove temporary container
            document.body.removeChild(container)

            // Create PDF
            const imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            const pdf = new jsPDF('p', 'mm', 'a4')
            const imgData = canvas.toDataURL('image/png')

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }

            // Generate filename
            const fileName = `BaoCaoQA_${report.id}_${report.classCode}_${new Date().toISOString().split('T')[0]}.pdf`

            // Download PDF
            pdf.save(fileName)

            toast.success('Xuất PDF thành công', {
                description: `Đã tải xuống file ${fileName}`
            })
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Lỗi khi xuất PDF', {
                description: 'Vui lòng thử lại sau'
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExportPDF}
            disabled={isExporting}
        >
            {isExporting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xuất...
                </>
            ) : (
                <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Xuất PDF
                </>
            )}
        </Button>
    )
}
