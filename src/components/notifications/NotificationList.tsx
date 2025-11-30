import { type Notification } from '@/store/services/notificationApi'
import { NotificationCard } from './NotificationCard'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'

interface NotificationListProps {
    notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
    // Group notifications by date
    const groupedNotifications = notifications.reduce((groups, notification) => {
        const date = new Date(notification.createdAt)
        let key = format(date, 'yyyy-MM-dd')

        if (isToday(date)) {
            key = 'Hôm nay'
        } else if (isYesterday(date)) {
            key = 'Hôm qua'
        } else {
            key = format(date, 'EEEE, dd/MM/yyyy', { locale: vi })
        }

        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(notification)
        return groups
    }, {} as Record<string, Notification[]>)

    return (
        <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                <div key={dateLabel} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                        {dateLabel}
                    </h3>
                    <div className="space-y-2">
                        {items.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
