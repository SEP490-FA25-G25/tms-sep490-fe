'use client';

import {
    useGetAvailabilityCampaignsQuery,
    useSendBulkRemindersMutation,
} from '@/store/services/teacherAvailabilityApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Bell, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateCampaignModal from './components/CreateCampaignModal';
import TeacherStatusTable from './components/TeacherStatusTable';

export default function CampaignDashboard() {
    const { data: campaigns, isLoading } = useGetAvailabilityCampaignsQuery();
    const campaign = campaigns?.[0];
    const [sendBulkReminders, { isLoading: isReminding }] = useSendBulkRemindersMutation();

    const handleSendReminders = async () => {
        if (!campaign) return;
        try {
            // Chưa có danh sách teacher cụ thể, tạm thời gửi nhắc nhở rỗng
            await sendBulkReminders([]).unwrap();
            toast.success('Reminders sent successfully');
        } catch {
            toast.error('Failed to send reminders');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Availability Campaigns
                    </h1>
                    <p className="text-muted-foreground">
                        Manage teacher availability update campaigns.
                    </p>
                </div>
                <CreateCampaignModal />
            </div>

            {campaign ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold">
                                Active Campaign: {campaign.name}
                            </CardTitle>
                            <Button
                                variant="outline"
                                onClick={handleSendReminders}
                                disabled={isReminding}
                            >
                                {isReminding ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Bell className="mr-2 h-4 w-4" />
                                )}
                                Send Reminders to Outdated
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Deadline:
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {format(
                                            new Date(campaign.deadline),
                                            'PPP p'
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Created At:
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {format(
                                            new Date(campaign.createdAt),
                                            'PPP p'
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teacher Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TeacherStatusTable campaignId={campaign.id} />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="flex h-64 flex-col items-center justify-center space-y-4 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground/50" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                No Active Campaign
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Create a new campaign to start tracking teacher
                                availability updates.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
