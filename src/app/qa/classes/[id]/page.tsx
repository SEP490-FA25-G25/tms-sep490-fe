"use client"

import type { CSSProperties } from 'react'
import { useParams } from "react-router-dom"
import { useGetQAClassDetailQuery } from "@/store/services/qaApi"
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { QAClassHeader } from "@/components/qa/QAClassHeader"
import { SessionsListTab } from "@/components/qa/SessionsListTab"
import { QAReportsListTab } from "@/components/qa/QAReportsListTab"
import { StudentFeedbackTab } from "@/components/qa/StudentFeedbackTab"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AlertTriangle } from "lucide-react"

export default function ClassDetailsPage() {
    const params = useParams()
    const classId = parseInt(params.id as string)

    const { data: classInfo, isLoading, error } = useGetQAClassDetailQuery(classId)

    const renderHeader = () => {
        if (isLoading) {
            return (
                <div className="border-b bg-background">
                    <div className="@container/main py-6 md:py-8">
                        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
                            <div className="flex items-start gap-3">
                                <Skeleton className="h-10 w-10" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <Skeleton key={idx} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        if (error || !classInfo) {
            return (
                <div className="border-b bg-background">
                    <div className="@container/main py-4">
                        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Không thể tải thông tin lớp học</p>
                                <Button size="sm" onClick={() => window.location.reload()}>
                                    Thử lại
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return <QAClassHeader classInfo={classInfo} />
    }

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col">
                        {renderHeader()}

                        <main className="flex-1">
                            <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 md:py-8">
                                {isLoading && (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-40 w-full" />
                                    </div>
                                )}

                                {!isLoading && error && (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
                                        <AlertTriangle className="h-8 w-8 text-destructive" />
                                        <p className="text-base font-semibold text-foreground">Không thể tải thông tin lớp học</p>
                                        <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
                                        <Button size="sm" onClick={() => window.location.reload()}>
                                            Thử lại
                                        </Button>
                                    </div>
                                )}

                                {!isLoading && classInfo && (
                                    <Tabs defaultValue="sessions" className="w-full space-y-6">
                                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                                            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
                                                <TabsTrigger
                                                    value="sessions"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Buổi học
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="reports"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Báo cáo QA
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="feedback"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Phản hồi HV
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <TabsContent value="sessions" className="space-y-6">
                                            <SessionsListTab classId={classInfo.classId} />
                                        </TabsContent>

                                        <TabsContent value="reports" className="space-y-6">
                                            <QAReportsListTab classId={classInfo.classId} />
                                        </TabsContent>

                                        <TabsContent value="feedback" className="space-y-6">
                                            <StudentFeedbackTab classId={classInfo.classId} />
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
