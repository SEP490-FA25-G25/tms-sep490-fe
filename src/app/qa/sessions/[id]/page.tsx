"use client"

import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { SessionDetailView } from "@/components/session/SessionDetailView"

export default function SessionDetailsPage() {
    const params = useParams()
    const sessionId = parseInt(params.id as string)

    return (
        <DashboardLayout
            title="Chi tiết buổi học"
            description="Thông tin chi tiết về buổi học"
        >
            <SessionDetailView sessionId={sessionId} />
        </DashboardLayout>
    )
}