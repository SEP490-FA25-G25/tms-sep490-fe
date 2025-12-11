"use client"

import type { CSSProperties } from 'react'
import { useParams, Link } from "react-router-dom"
import { useGetClassByIdQuery } from "@/store/services/classApi"
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ClassInfoHeader } from "@/components/class/ClassInfoHeader"
import { SessionsListTab } from "@/components/qa/SessionsListTab"
import { ScoresTab } from "@/components/qa/ScoresTab"
import { QAReportsListTab } from "@/components/qa/QAReportsListTab"
import { OverviewTab } from "@/app/academic/classes/[id]/components/OverviewTab"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AlertTriangle, Plus } from "lucide-react"

export default function ClassDetailsPage() {
    const params = useParams()
    const classId = parseInt(params.id as string)

    const { data: classResponse, isLoading, error } = useGetClassByIdQuery(classId, {
        skip: !classId
    })
    const classData = classResponse?.data

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
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <Skeleton key={idx} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        if (error || !classData) {
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

        const qaActions = (
            <Button asChild>
                <Link to={`/qa/reports/create?classId=${classData.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo báo cáo
                </Link>
            </Button>
        )

        return <ClassInfoHeader classData={classData} actions={qaActions} />
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

                                {!isLoading && classData && (
                                    <Tabs defaultValue="overview" className="w-full space-y-6">
                                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                                            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
                                                <TabsTrigger
                                                    value="overview"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Tổng quan
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="sessions"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Buổi học
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="scores"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Điểm số
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="reports"
                                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                                >
                                                    Báo cáo QA
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <TabsContent value="overview" className="space-y-6">
                                            <OverviewTab classData={classData} />
                                        </TabsContent>

                                        <TabsContent value="sessions" className="space-y-6">
                                            <SessionsListTab classId={classData.id} />
                                        </TabsContent>

                                        <TabsContent value="scores" className="space-y-6">
                                            <ScoresTab classId={classData.id} />
                                        </TabsContent>

                                        <TabsContent value="reports" className="space-y-6">
                                            <QAReportsListTab classId={classData.id} />
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
