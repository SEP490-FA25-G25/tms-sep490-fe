import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetSubjectsWithLevelsQuery, useGetTimeslotDurationQuery } from "@/store/services/curriculumApi";
import { useMemo, useEffect } from "react";

interface BasicInfo {
    courseCode?: string;
    courseName?: string;
    name?: string;
    code?: string;
    description?: string;
    subjectId?: string;
    levelId?: string;
    durationWeeks?: number;
    sessionPerWeek?: number;
    hoursPerSession?: number;
    durationHours?: number;
    effectiveDate?: string;
    scoreScale?: string;
    targetAudience?: string;
    teachingMethods?: string;
    prerequisites?: string;
}

interface CourseData {
    basicInfo: BasicInfo;
    clos: unknown[];
    structure: unknown[];
    assessments: unknown[];
    materials: unknown[];
}

interface Step1BasicInfoProps {
    data: CourseData;
    setData: (data: CourseData | ((prev: CourseData) => CourseData)) => void;
}

export function Step1BasicInfo({ data, setData }: Step1BasicInfoProps) {
    const { data: subjectsData, isLoading } = useGetSubjectsWithLevelsQuery();
    const { data: durationData } = useGetTimeslotDurationQuery();

    const selectedSubject = useMemo(() => {
        return subjectsData?.data?.find(s => s.id.toString() === data.basicInfo?.subjectId);
    }, [subjectsData, data.basicInfo?.subjectId]);

    const handleChange = (field: string, value: string | number) => {
        setData((prev: CourseData) => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                [field]: value,
            },
        }));
    };

    useEffect(() => {
        if (durationData?.data && !data.basicInfo?.hoursPerSession) {
            handleChange("hoursPerSession", durationData.data);
        }
    }, [durationData]);

    useEffect(() => {
        const weeks = data.basicInfo?.durationWeeks || 0;
        const sessions = data.basicInfo?.sessionPerWeek || 0;
        const hours = data.basicInfo?.hoursPerSession || 0;

        if (weeks > 0 && sessions > 0 && hours > 0) {
            const totalHours = weeks * sessions * hours;
            if (data.basicInfo?.durationHours !== totalHours) {
                handleChange("durationHours", totalHours);
            }
        }
    }, [data.basicInfo?.durationWeeks, data.basicInfo?.sessionPerWeek, data.basicInfo?.hoursPerSession]);

    // Auto-generate course code
    useEffect(() => {
        if (data.basicInfo?.subjectId && data.basicInfo?.levelId) {
            const subject = subjectsData?.data?.find(s => s.id.toString() === data.basicInfo?.subjectId);
            const level = subject?.levels?.find(l => l.id.toString() === data.basicInfo?.levelId);

            if (subject && level) {
                let year = new Date().getFullYear();
                if (data.basicInfo?.effectiveDate) {
                    year = new Date(data.basicInfo.effectiveDate).getFullYear();
                }

                const generatedCode = `${subject.code}-${level.code}-${year}`;
                handleChange("code", generatedCode);
            }
        }
    }, [data.basicInfo?.subjectId, data.basicInfo?.levelId, data.basicInfo?.effectiveDate, subjectsData]);

    const handleSubjectChange = (val: string) => {
        handleChange("subjectId", val);
        handleChange("levelId", ""); // Reset level when subject changes
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Môn học <span className="text-red-500">*</span></Label>
                    <Select
                        onValueChange={handleSubjectChange}
                        value={data.basicInfo?.subjectId}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn môn học"} />
                        </SelectTrigger>
                        <SelectContent>
                            {subjectsData?.data?.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                    {subject.name} ({subject.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Cấp độ <span className="text-red-500">*</span></Label>
                    <Select
                        onValueChange={(val) => handleChange("levelId", val)}
                        value={data.basicInfo?.levelId}
                        disabled={!data.basicInfo?.subjectId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn cấp độ" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedSubject?.levels?.map((level) => (
                                <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.name} ({level.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Tên khóa học <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="VD: Tiếng Anh Giao tiếp A1 - 2024"
                        value={data.basicInfo?.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Mã khóa học <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="VD: ENG-A1-2024"
                        value={data.basicInfo?.code || ""}
                        onChange={(e) => handleChange("code", e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>Tổng giờ</Label>
                    <Input
                        type="number"
                        placeholder="48"
                        value={data.basicInfo?.durationHours || ""}
                        onChange={(e) => handleChange("durationHours", Number(e.target.value))}
                        disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label>Thời lượng (Tuần)</Label>
                    <Input
                        type="number"
                        placeholder="12"
                        value={data.basicInfo?.durationWeeks || ""}
                        onChange={(e) => handleChange("durationWeeks", Number(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Buổi/Tuần</Label>
                    <Input
                        type="number"
                        placeholder="2"
                        value={data.basicInfo?.sessionPerWeek || ""}
                        onChange={(e) => handleChange("sessionPerWeek", Number(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Giờ/Buổi</Label>
                    <Input
                        type="number"
                        placeholder="2"
                        value={data.basicInfo?.hoursPerSession || ""}
                        onChange={(e) => handleChange("hoursPerSession", Number(e.target.value))}
                        disabled
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Thang điểm</Label>
                    <Input
                        placeholder="VD: 0-10, 0-9.0 (IELTS)"
                        value={data.basicInfo?.scoreScale || ""}
                        onChange={(e) => handleChange("scoreScale", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ngày hiệu lực</Label>
                    <Input
                        type="date"
                        value={data.basicInfo?.effectiveDate || ""}
                        onChange={(e) => handleChange("effectiveDate", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Đối tượng học viên</Label>
                <Textarea
                    placeholder="Nhập đối tượng học viên..."
                    value={data.basicInfo?.targetAudience || ""}
                    onChange={(e) => handleChange("targetAudience", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Phương pháp giảng dạy</Label>
                <Textarea
                    placeholder="Nhập phương pháp giảng dạy..."
                    value={data.basicInfo?.teachingMethods || ""}
                    onChange={(e) => handleChange("teachingMethods", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                    placeholder="Nhập mô tả khóa học..."
                    className="min-h-[100px]"
                    value={data.basicInfo?.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Điều kiện tiên quyết</Label>
                <Textarea
                    placeholder="Nhập điều kiện tiên quyết..."
                    value={data.basicInfo?.prerequisites || ""}
                    onChange={(e) => handleChange("prerequisites", e.target.value)}
                />
            </div>
        </div>
    );
}
