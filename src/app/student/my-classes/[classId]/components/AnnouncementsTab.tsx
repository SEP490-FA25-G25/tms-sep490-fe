import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Clock, User, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';
import type { ClassDetailDTO } from '@/types/studentClass';
import { cn } from '@/lib/utils';

interface AnnouncementsTabProps {
  classDetail?: ClassDetailDTO;
}

// Mock announcement data - this would come from API
const mockAnnouncements = [
  {
    id: 1,
    title: 'Lịch học điều chỉnh tuần tới',
    content: 'Do lịch trùng với sự kiện của trung tâm, lớp học sẽ tạm dừng vào thứ 6 tuần tới và chuyển sang thứ 7. Thời gian và địa điểm không đổi. Mong các bạn thông cảm.',
    type: 'SCHEDULE_CHANGE',
    priority: 'HIGH',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-15T10:30:00Z',
    isRead: false,
    attachments: []
  },
  {
    id: 2,
    title: 'Bài tập cuối tuần',
    content: 'Nhắc nhở: Các bạn hoàn thành bài tập Reading Unit 5-6 và nộp trước hết thứ 2 tuần tới qua email. Bài tập sẽ được tính điểm chuyên cần.',
    type: 'HOMEWORK',
    priority: 'MEDIUM',
    createdBy: 'Trần Thị B',
    createdAt: '2024-01-14T16:20:00Z',
    isRead: true,
    attachments: [
      { name: 'Reading_Unit5-6.pdf', url: '#' },
      { name: 'Answer_Sheet.docx', url: '#' }
    ]
  },
  {
    id: 3,
    title: 'Chào mừng học viên mới',
    content: 'Lớp chúng ta chào đón 3 bạn học viên mới tuần này: Nguyễn Văn C, Trần Thị D, Lê Văn E. Cả lớp cùng giúp đỡ các bạn mới làm quen với lớp học nhé!',
    type: 'GENERAL',
    priority: 'LOW',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-13T09:15:00Z',
    isRead: true,
    attachments: []
  },
  {
    id: 4,
    title: 'Lịch thi giữa kỳ',
    content: 'Thời gian thi giữa kỳ: 9:00 - 10:30, thứ 7, ngày 25/01/2024. Nội dung thi: Units 1-6. Hình thức: Listening + Reading + Writing. Phòng thi sẽ được thông báo sau.',
    type: 'EXAM',
    priority: 'HIGH',
    createdBy: 'Trần Thị B',
    createdAt: '2024-01-12T14:00:00Z',
    isRead: false,
    attachments: [
      { name: 'Exam_Guidelines.pdf', url: '#' }
    ]
  },
  {
    id: 5,
    title: 'Cải thiện tiếng Anh qua phim',
    content: 'Giáo viên giới thiệu một số bộ phim hữu ích để cải thiện kỹ năng nghe: Friends (cơ bản), The Crown (trung bình), Sherlock (nâng cao). Các bạn có thể tham khảo!',
    type: 'RESOURCE',
    priority: 'LOW',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-11T11:45:00Z',
    isRead: true,
    attachments: []
  }
];

const AnnouncementsTab: React.FC<AnnouncementsTabProps> = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'medium' | 'low'>('all');

  type FilterType = 'all' | 'unread' | 'high' | 'medium' | 'low';
  const [announcements] = useState(mockAnnouncements);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SCHEDULE_CHANGE':
        return <Calendar className="h-4 w-4" />;
      case 'HOMEWORK':
        return <Clock className="h-4 w-4" />;
      case 'EXAM':
        return <AlertTriangle className="h-4 w-4" />;
      case 'RESOURCE':
        return <Info className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SCHEDULE_CHANGE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HOMEWORK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EXAM':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'RESOURCE':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hôm qua';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SCHEDULE_CHANGE':
        return 'Điều chỉnh lịch';
      case 'HOMEWORK':
        return 'Bài tập';
      case 'EXAM':
        return 'Kiểm tra';
      case 'RESOURCE':
        return 'Tài liệu';
      default:
        return 'Thông báo chung';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Quan trọng';
      case 'MEDIUM':
        return 'Trung bình';
      case 'LOW':
        return 'Thông thường';
      default:
        return 'Thông thường';
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    switch (filter) {
      case 'unread':
        return !announcement.isRead;
      case 'high':
        return announcement.priority === 'HIGH';
      case 'medium':
        return announcement.priority === 'MEDIUM';
      case 'low':
        return announcement.priority === 'LOW';
      default:
        return true;
    }
  });

  const markAsRead = (id: number) => {
    // This would call an API to mark announcement as read
    console.log('Mark announcement as read:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Thông báo lớp học</h3>
        <div className="text-sm text-gray-600">
          {announcements.filter(a => !a.isRead).length} chưa đọc
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
          { key: 'high', label: 'Quan trọng' },
          { key: 'medium', label: 'Trung bình' },
          { key: 'low', label: 'Thông thường' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as FilterType)}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              filter === tab.key
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <Card
              key={announcement.id}
              className={cn(
                "border transition-all",
                !announcement.isRead ? "border-blue-200 bg-blue-50" : "border-gray-200"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {!announcement.isRead ? (
                      <div className="relative">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full"></div>
                      </div>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {announcement.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{announcement.createdBy}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(announcement.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={cn("text-xs", getTypeColor(announcement.type))}>
                          {getTypeIcon(announcement.type)}
                          <span className="ml-1">{getTypeLabel(announcement.type)}</span>
                        </Badge>

                        <Badge className={cn("text-xs", getPriorityColor(announcement.priority))}>
                          {getPriorityLabel(announcement.priority)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {announcement.content}
                    </p>

                    {/* Attachments */}
                    {announcement.attachments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Tệp đính kèm:</h5>
                        <div className="space-y-1">
                          {announcement.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment.url}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                                📎
                              </div>
                              {attachment.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      {!announcement.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(announcement.id)}
                          className="text-xs"
                        >
                          Đánh dấu đã đọc
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-xs">
                        Chia sẻ
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Chưa có thông báo nào' : `Không có thông báo ${filter}`}
            </h4>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Khi có thông báo mới từ giáo viên, chúng sẽ xuất hiện ở đây.'
                : 'Chuyển sang bộ lọc khác để xem thêm thông báo.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">Tổng thông báo</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-gray-600">Quan trọng</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {announcements.filter(a => a.priority === 'HIGH').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">Chưa đọc</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {announcements.filter(a => !a.isRead).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Đã đọc</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {announcements.filter(a => a.isRead).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnouncementsTab;