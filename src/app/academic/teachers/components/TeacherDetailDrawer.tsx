import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useGetTeacherDetailQuery } from "@/store/services/academicTeacherApi";
import { Edit, User, Mail, Phone, MapPin } from "lucide-react";
import { UpdateSkillsDialog } from "./UpdateSkillsDialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TeacherDetailDrawerProps {
  teacherId: number;
  open: boolean;
  onClose: () => void;
}

export function TeacherDetailDrawer({
  teacherId,
  open,
  onClose,
}: TeacherDetailDrawerProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const {
    data: teacher,
    isLoading,
    error,
  } = useGetTeacherDetailQuery(teacherId, {
    skip: !open,
  });

  // Group skills by specialization
  const skillsBySpecialization =
    teacher?.skills.reduce((acc, skill) => {
      const key = skill.specialization || "Khác";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(skill);
      return acc;
    }, {} as Record<string, typeof teacher.skills>) || {};

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl sm:max-w-2xl w-[95vw] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Giáo viên</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và quản lý kỹ năng của giáo viên
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Có lỗi xảy ra khi tải thông tin giáo viên</p>
            </div>
          ) : teacher ? (
            <div className="space-y-6 mt-6">
              {/* Teacher Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={teacher.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {teacher.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{teacher.fullName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        teacher.status === "ACTIVE"
                          ? "default"
                          : teacher.status === "INACTIVE"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {teacher.status === "ACTIVE"
                        ? "Hoạt động"
                        : teacher.status === "INACTIVE"
                        ? "Không hoạt động"
                        : teacher.status}
                    </Badge>
                    {teacher.branchName && (
                      <Badge variant="outline">{teacher.branchName}</Badge>
                    )}
                  </div>
                </div>
                <Button onClick={() => setUpdateDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Cập nhật kỹ năng
                </Button>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{teacher.email}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{teacher.phone}</span>
                  </div>
                )}
                {teacher.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{teacher.address}</span>
                  </div>
                )}
                {teacher.employeeCode && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Mã: {teacher.employeeCode}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(teacher.dob ||
                teacher.gender ||
                teacher.hireDate ||
                teacher.contractType) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {teacher.dob && (
                      <div>
                        <span className="text-muted-foreground">
                          Ngày sinh:{" "}
                        </span>
                        <span>
                          {format(new Date(teacher.dob), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    )}
                    {teacher.gender && (
                      <div>
                        <span className="text-muted-foreground">
                          Giới tính:{" "}
                        </span>
                        <span>
                          {teacher.gender === "MALE"
                            ? "Nam"
                            : teacher.gender === "FEMALE"
                            ? "Nữ"
                            : teacher.gender}
                        </span>
                      </div>
                    )}
                    {teacher.hireDate && (
                      <div>
                        <span className="text-muted-foreground">
                          Ngày vào làm:{" "}
                        </span>
                        <span>
                          {format(new Date(teacher.hireDate), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    )}
                    {teacher.contractType && (
                      <div>
                        <span className="text-muted-foreground">
                          Loại hợp đồng:{" "}
                        </span>
                        <span>{teacher.contractType}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Skills Section */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Kỹ năng</h4>
                  <Badge variant="secondary">
                    {teacher.skills.length} kỹ năng
                  </Badge>
                </div>

                {teacher.skills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Giáo viên chưa có kỹ năng nào</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setUpdateDialogOpen(true)}
                    >
                      Thêm kỹ năng
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(skillsBySpecialization).map(
                      ([specialization, skills]) => (
                        <div
                          key={specialization}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-lg">
                              {specialization}
                            </h5>
                          </div>
                          {skills[0]?.language && (
                            <p className="text-sm text-muted-foreground">
                              Ngôn ngữ: {skills[0].language}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <span>{skill.skill}</span>
                                {skill.level && (
                                  <span className="text-xs text-muted-foreground">
                                    (Level {skill.level})
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Note */}
              {teacher.note && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ghi chú</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {teacher.note}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Update Skills Dialog */}
      {teacher && (
        <UpdateSkillsDialog
          teacherId={teacherId}
          currentSkills={teacher.skills}
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
        />
      )}
    </>
  );
}
