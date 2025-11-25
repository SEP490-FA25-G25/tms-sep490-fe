import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { CourseData, Assessment, Phase } from "@/types/course";

interface Step6Props {
    data: CourseData;
}

export function Step6Review({ data }: Step6Props) {
    // Validation Logic
    const totalWeight = data.assessments?.reduce((sum: number, assessment: Assessment) => sum + (Number(assessment.weight) || 0), 0) || 0;

    const checklist = [
        { label: "Thông tin cơ bản (Tên, Mã, Mô tả)", valid: !!(data.basicInfo?.name && data.basicInfo?.code) },
        { label: "Ít nhất 1 CLO được định nghĩa", valid: (data.clos?.length || 0) > 0 },
        { label: "Cấu trúc chương trình (Ít nhất 1 giai đoạn)", valid: (data.structure?.length || 0) > 0 },
        { label: "Tổng trọng số đánh giá là 100%", valid: totalWeight === 100 },
    ];

    const allValid = checklist.every((v) => v.valid);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tóm tắt Khóa học</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tên khóa học</p>
                                    <p className="font-medium">{data.basicInfo?.name || "Chưa nhập"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Mã khóa học</p>
                                    <p className="font-medium">{data.basicInfo?.code || "Chưa nhập"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Môn học</p>
                                    <p className="font-medium">{data.basicInfo?.subjectId === "1" ? "Tiếng Anh" : "Tiếng Nhật"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cấp độ</p>
                                    <p className="font-medium">{data.basicInfo?.levelId || "Chưa nhập"}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Thống kê</p>
                                <div className="flex gap-2">
                                    <Badge variant="outline">{data.clos?.length || 0} CLOs</Badge>
                                    <Badge variant="outline">{data.structure?.length || 0} Giai đoạn</Badge>
                                    <Badge variant="outline">
                                        {data.structure?.reduce((acc: number, p: Phase) => acc + (p.sessions?.length || 0), 0) || 0} Buổi học
                                    </Badge>
                                    <Badge variant="outline">{data.assessments?.length || 0} Bài kiểm tra</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách kiểm tra</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {checklist.map((item, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    {item.valid ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                                    )}
                                    <span className={`text - sm ${item.valid ? "text-foreground" : "text-destructive font-medium"} `}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}

                            <div className={`mt - 6 p - 3 rounded - md text - center text - sm font - medium ${allValid ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"} `}>
                                {allValid ? "Tất cả điều kiện đã thỏa mãn. Bạn có thể tạo khóa học." : "Vui lòng hoàn thành các mục còn thiếu trước khi tạo khóa học."}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
