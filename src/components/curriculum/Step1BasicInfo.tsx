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
import { useGetCurriculumsWithLevelsQuery, useGetTimeslotDurationsQuery } from "@/store/services/curriculumApi";
import { useGetAllCoursesQuery, useLazyGetNextVersionQuery } from "@/store/services/courseApi";
import { useUploadFileMutation, useDeleteFileMutation } from "@/store/services/uploadApi";
import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import type { CourseData } from "@/types/course";
import { Image, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Step1Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
    courseStatus?: string;
    courseId?: number; // ID của khóa học đang edit (nếu có)
}

// Validation error interface
interface ValidationErrors {
    subjectId: string | null;
    levelId: string | null;
    name: string | null;
    code: string | null;
    numberOfSessions: string | null;
    effectiveDate: string | null;
    targetAudience: string | null;
    teachingMethods: string | null;
    description: string | null;
    prerequisites: string | null;
}

export function Step1BasicInfo({ data, setData, courseStatus, courseId }: Step1Props) {
    const { data: subjectsData, isLoading } = useGetCurriculumsWithLevelsQuery();
    const { data: durationsData } = useGetTimeslotDurationsQuery();
    const { data: existingCourses } = useGetAllCoursesQuery();
    const [getNextVersion] = useLazyGetNextVersionQuery();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    const [deleteFile] = useDeleteFileMutation();

    // Validation error states
    const [errors, setErrors] = useState<ValidationErrors>({
        subjectId: null,
        levelId: null,
        name: null,
        code: null,
        numberOfSessions: null,
        effectiveDate: null,
        targetAudience: null,
        teachingMethods: null,
        description: null,
        prerequisites: null,
    });

    // Get available durations from timeslots
    const availableDurations = useMemo(() => {
        return durationsData?.data || [1.5, 2, 2.5, 3]; // Default options if no data
    }, [durationsData]);

    // Refs to track previous values for change detection
    const prevSubjectId = useRef(data.basicInfo?.subjectId);
    const prevLevelId = useRef(data.basicInfo?.levelId);
    const prevEffectiveDate = useRef(data.basicInfo?.effectiveDate);

    const selectedSubject = useMemo(() => {
        return subjectsData?.data?.find(s => s.id.toString() === data.basicInfo?.subjectId);
    }, [subjectsData, data.basicInfo?.subjectId]);

    // ========== VALIDATION FUNCTIONS ==========

    const validateSubjectId = useCallback((value: string): string | null => {
        if (!value || value.trim() === "") {
            return "Vui lòng chọn môn học";
        }
        return null;
    }, []);

    const validateLevelId = useCallback((value: string): string | null => {
        if (!value || value.trim() === "") {
            return "Vui lòng chọn cấp độ";
        }
        return null;
    }, []);

    const validateName = useCallback((value: string): string | null => {
        if (!value || value.trim() === "") {
            return "Tên khóa học không được để trống";
        }
        if (value.trim().length < 3) {
            return "Tên khóa học phải có ít nhất 3 ký tự";
        }
        return null;
    }, []);

    const validateCode = useCallback((value: string): string | null => {
        if (!value || value.trim() === "") {
            return "Mã khóa học không được để trống";
        }

        // Check trùng lặp mã khóa học
        const trimmedValue = value.trim().toLowerCase();
        const isDuplicate = existingCourses?.some(
            (course) =>
                course.code.toLowerCase() === trimmedValue &&
                course.id !== courseId // Loại trừ khóa học đang edit
        );

        if (isDuplicate) {
            return "Mã khóa học đã tồn tại";
        }
        return null;
    }, [existingCourses, courseId]);

    const validateNumberOfSessions = useCallback((value: number): string | null => {
        if (!value || value <= 0) {
            return "Tổng số buổi phải lớn hơn 0";
        }
        if (value > 200) {
            return "Tổng số buổi không được vượt quá 200";
        }
        return null;
    }, []);

    const validateEffectiveDate = useCallback((value: string): string | null => {
        if (!value) {
            return null; // Không bắt buộc
        }

        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return "Ngày hiệu lực không được là ngày trong quá khứ";
        }
        return null;
    }, []);

    // Validate optional text fields - nếu có nhập thì phải >= 10 ký tự
    const validateOptionalTextField = useCallback((value: string, fieldName: string, maxLength: number = 1000): string | null => {
        if (!value || value.trim() === "") {
            return null; // Không bắt buộc
        }

        const trimmedValue = value.trim();

        if (trimmedValue.length < 10) {
            return `${fieldName} phải có ít nhất 10 ký tự nếu nhập`;
        }

        if (trimmedValue.length > maxLength) {
            return `${fieldName} không được vượt quá ${maxLength} ký tự`;
        }

        return null;
    }, []);

    // ========== HANDLERS ==========

    const handleChange = useCallback((field: string, value: string | number) => {
        setData((prev) => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                [field]: value,
            },
        }));

        // Real-time validation
        switch (field) {
            case "name":
                setErrors(prev => ({ ...prev, name: validateName(value as string) }));
                break;
            case "code":
                setErrors(prev => ({ ...prev, code: validateCode(value as string) }));
                break;
            case "numberOfSessions":
                setErrors(prev => ({ ...prev, numberOfSessions: validateNumberOfSessions(value as number) }));
                break;
            case "effectiveDate":
                setErrors(prev => ({ ...prev, effectiveDate: validateEffectiveDate(value as string) }));
                break;
            case "targetAudience":
                setErrors(prev => ({ ...prev, targetAudience: validateOptionalTextField(value as string, "Đối tượng học viên") }));
                break;
            case "teachingMethods":
                setErrors(prev => ({ ...prev, teachingMethods: validateOptionalTextField(value as string, "Phương pháp giảng dạy") }));
                break;
            case "description":
                setErrors(prev => ({ ...prev, description: validateOptionalTextField(value as string, "Mô tả", 2000) }));
                break;
            case "prerequisites":
                setErrors(prev => ({ ...prev, prerequisites: validateOptionalTextField(value as string, "Điều kiện tiên quyết") }));
                break;
        }
    }, [setData, validateName, validateCode, validateNumberOfSessions, validateEffectiveDate, validateOptionalTextField]);

    const handleSubjectChange = useCallback((val: string) => {
        handleChange("subjectId", val);
        handleChange("levelId", ""); // Reset level when subject changes
        setErrors(prev => ({
            ...prev,
            subjectId: validateSubjectId(val),
            levelId: null // Clear level error since it's reset
        }));
    }, [handleChange, validateSubjectId]);

    const handleLevelChange = useCallback((val: string) => {
        handleChange("levelId", val);
        setErrors(prev => ({ ...prev, levelId: validateLevelId(val) }));
    }, [handleChange, validateLevelId]);

    // Thumbnail upload handler
    const handleThumbnailUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước file tối đa là 5MB');
            return;
        }

        try {
            // Delete old thumbnail from S3 if exists
            const oldThumbnailUrl = data.basicInfo?.thumbnailUrl;
            if (oldThumbnailUrl) {
                try {
                    await deleteFile(oldThumbnailUrl).unwrap();
                } catch (deleteError) {
                    console.warn('Failed to delete old thumbnail:', deleteError);
                    // Continue with upload even if delete fails
                }
            }

            const response = await uploadFile(file).unwrap();
            handleChange("thumbnailUrl", response.url);
            toast.success('Tải ảnh bìa thành công');
        } catch (error) {
            console.error('Thumbnail upload failed:', error);
            toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
        }

        // Reset input
        e.target.value = '';
    }, [uploadFile, deleteFile, handleChange, data.basicInfo?.thumbnailUrl]);

    const handleRemoveThumbnail = useCallback(async () => {
        const thumbnailUrl = data.basicInfo?.thumbnailUrl;
        if (thumbnailUrl) {
            try {
                await deleteFile(thumbnailUrl).unwrap();
            } catch (error) {
                console.warn('Failed to delete thumbnail from S3:', error);
                // Continue with removing from state even if S3 delete fails
            }
        }
        handleChange("thumbnailUrl", "");
    }, [deleteFile, handleChange, data.basicInfo?.thumbnailUrl]);

    // Set default hoursPerSession when durations are loaded and no value is set
    useEffect(() => {
        if (availableDurations.length > 0 && !data.basicInfo?.hoursPerSession) {
            handleChange("hoursPerSession", availableDurations[0]);
        }
    }, [availableDurations, data.basicInfo?.hoursPerSession, handleChange]);

    // Auto-calculate total hours
    useEffect(() => {
        const sessions = data.basicInfo?.numberOfSessions || 0;
        const hours = data.basicInfo?.hoursPerSession || 0;

        if (sessions > 0 && hours > 0) {
            const totalHours = sessions * hours;
            if (data.basicInfo?.durationHours !== totalHours) {
                setData((prev) => ({
                    ...prev,
                    basicInfo: {
                        ...prev.basicInfo,
                        durationHours: totalHours,
                    },
                }));
            }
        }
    }, [data.basicInfo?.numberOfSessions, data.basicInfo?.hoursPerSession, data.basicInfo?.durationHours, setData]);

    // Auto-generate course code
    useEffect(() => {
        const currentSubjectId = data.basicInfo?.subjectId;
        const currentLevelId = data.basicInfo?.levelId;
        const currentEffectiveDate = data.basicInfo?.effectiveDate;

        // Check if any relevant field has changed
        const hasChanged =
            currentSubjectId !== prevSubjectId.current ||
            currentLevelId !== prevLevelId.current ||
            currentEffectiveDate !== prevEffectiveDate.current;

        if (hasChanged && currentSubjectId && currentLevelId && subjectsData?.data) {
            // Check if we are in an update mode (either Continue Creating or Edit)
            const isUpdate = !!courseStatus;

            // Special handling for initial load in Update Mode
            // If we are updating and transitioning from empty state to populated state, it's the data load.
            // We should NOT overwrite the existing code.
            if (isUpdate && (!prevSubjectId.current || prevSubjectId.current === "")) {
                prevSubjectId.current = currentSubjectId;
                prevLevelId.current = currentLevelId;
                prevEffectiveDate.current = currentEffectiveDate;
                return;
            }

            const subject = subjectsData.data.find(s => s.id.toString() === currentSubjectId);
            const level = subject?.levels?.find(l => l.id.toString() === currentLevelId);

            if (subject && level) {
                let year = new Date().getFullYear();
                if (currentEffectiveDate) {
                    year = new Date(currentEffectiveDate).getFullYear();
                }

                // Get next version from API
                getNextVersion({ subjectCode: subject.code, levelCode: level.code, year })
                    .then((result) => {
                        const version = result.data?.data || 1;
                        const generatedCode = `${subject.code}-${level.code}-${year}-V${version}`;
                        setData((prev) => ({
                            ...prev,
                            basicInfo: {
                                ...prev.basicInfo,
                                code: generatedCode,
                            },
                        }));

                        // Validate the generated code
                        setErrors(prev => ({ ...prev, code: validateCode(generatedCode) }));
                    })
                    .catch(() => {
                        // Fallback to V1 if API fails
                        const generatedCode = `${subject.code}-${level.code}-${year}-V1`;
                        setData((prev) => ({
                            ...prev,
                            basicInfo: {
                                ...prev.basicInfo,
                                code: generatedCode,
                            },
                        }));
                    });

                // Update refs only after successful generation trigger
                prevSubjectId.current = currentSubjectId;
                prevLevelId.current = currentLevelId;
                prevEffectiveDate.current = currentEffectiveDate;
            }
        }
    }, [data.basicInfo?.subjectId, data.basicInfo?.levelId, data.basicInfo?.effectiveDate, subjectsData, courseStatus, setData, validateCode, getNextVersion]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Khung chương trình <span className="text-rose-500">*</span></Label>
                    <Select
                        onValueChange={handleSubjectChange}
                        value={data.basicInfo?.subjectId}
                        disabled={isLoading}
                    >
                        <SelectTrigger className={`w-full ${errors.subjectId ? "border-rose-500" : ""}`}>
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
                    {errors.subjectId && <p className="text-sm text-rose-500">{errors.subjectId}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Cấp độ <span className="text-rose-500">*</span></Label>
                    <Select
                        onValueChange={handleLevelChange}
                        value={data.basicInfo?.levelId}
                        disabled={!data.basicInfo?.subjectId}
                    >
                        <SelectTrigger className={`w-full ${errors.levelId ? "border-rose-500" : ""}`}>
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
                    {errors.levelId && <p className="text-sm text-rose-500">{errors.levelId}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Tên khóa học <span className="text-rose-500">*</span></Label>
                    <Input
                        placeholder="VD: Tiếng Anh Giao tiếp A1 - 2024"
                        value={data.basicInfo?.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={errors.name ? "border-rose-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Mã khóa học <span className="text-rose-500">*</span></Label>
                    <Input
                        placeholder="VD: ENG-A1-2024"
                        value={data.basicInfo?.code || ""}
                        onChange={(e) => handleChange("code", e.target.value)}
                        className={errors.code ? "border-rose-500" : ""}
                    />
                    {errors.code && <p className="text-sm text-rose-500">{errors.code}</p>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Tổng giờ</Label>
                    <Input
                        type="number"
                        placeholder="48"
                        value={data.basicInfo?.durationHours || ""}
                        disabled
                        className="bg-muted"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tổng số buổi <span className="text-rose-500">*</span></Label>
                    <Input
                        type="number"
                        placeholder="24"
                        min="1"
                        max="200"
                        value={data.basicInfo?.numberOfSessions || ""}
                        onChange={(e) => handleChange("numberOfSessions", Number(e.target.value))}
                        className={errors.numberOfSessions ? "border-rose-500" : ""}
                    />
                    {errors.numberOfSessions && <p className="text-sm text-rose-500">{errors.numberOfSessions}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Giờ/Buổi <span className="text-rose-500">*</span></Label>
                    <Select
                        value={data.basicInfo?.hoursPerSession?.toString() || ""}
                        onValueChange={(val) => handleChange("hoursPerSession", Number(val))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn số giờ/buổi" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableDurations.map((duration) => (
                                <SelectItem key={duration} value={duration.toString()}>
                                    {duration} giờ
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                        className={errors.effectiveDate ? "border-rose-500" : ""}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.effectiveDate && <p className="text-sm text-rose-500">{errors.effectiveDate}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Đối tượng học viên</Label>
                <Textarea
                    placeholder="Nhập đối tượng học viên..."
                    value={data.basicInfo?.targetAudience || ""}
                    onChange={(e) => handleChange("targetAudience", e.target.value)}
                    className={errors.targetAudience ? "border-rose-500" : ""}
                />
                {errors.targetAudience && <p className="text-sm text-rose-500">{errors.targetAudience}</p>}
            </div>

            <div className="space-y-2">
                <Label>Phương pháp giảng dạy</Label>
                <Textarea
                    placeholder="Nhập phương pháp giảng dạy..."
                    value={data.basicInfo?.teachingMethods || ""}
                    onChange={(e) => handleChange("teachingMethods", e.target.value)}
                    className={errors.teachingMethods ? "border-rose-500" : ""}
                />
                {errors.teachingMethods && <p className="text-sm text-rose-500">{errors.teachingMethods}</p>}
            </div>

            <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                    placeholder="Nhập mô tả khóa học..."
                    className={`min-h-[100px] ${errors.description ? "border-rose-500" : ""}`}
                    value={data.basicInfo?.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                />
                {errors.description && <p className="text-sm text-rose-500">{errors.description}</p>}
            </div>

            <div className="space-y-2">
                <Label>Điều kiện tiên quyết</Label>
                <Textarea
                    placeholder="Nhập điều kiện tiên quyết..."
                    value={data.basicInfo?.prerequisites || ""}
                    onChange={(e) => handleChange("prerequisites", e.target.value)}
                    className={errors.prerequisites ? "border-rose-500" : ""}
                />
                {errors.prerequisites && <p className="text-sm text-rose-500">{errors.prerequisites}</p>}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
                <Label>Ảnh bìa khóa học <span className="text-rose-500">*</span></Label>
                <div className="flex items-start gap-4">
                    {/* Thumbnail Preview */}
                    {data.basicInfo?.thumbnailUrl ? (
                        <div className="relative group">
                            <img
                                src={data.basicInfo.thumbnailUrl}
                                alt="Ảnh bìa khóa học"
                                className="w-48 h-32 object-cover rounded-lg border"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveThumbnail}
                                className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ảnh"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            ) : (
                                <>
                                    <Image className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Tải ảnh lên</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailUpload}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                    <div className="text-sm text-muted-foreground">
                        <p>Định dạng: JPG, PNG, GIF, WebP</p>
                        <p>Kích thước tối đa: 5MB</p>
                        <p>Khuyến nghị: 1200x630px</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export validation function for use in parent component (CourseWizard)
// eslint-disable-next-line react-refresh/only-export-components
export function validateStep1(data: CourseData, existingCourses: { id: number; code: string }[] = [], courseId?: number): { isValid: boolean; errors: string[] } {
    const validationErrors: string[] = [];

    // Required fields
    if (!data.basicInfo?.subjectId) {
        validationErrors.push("Vui lòng chọn môn học");
    }
    if (!data.basicInfo?.levelId) {
        validationErrors.push("Vui lòng chọn cấp độ");
    }
    if (!data.basicInfo?.name?.trim()) {
        validationErrors.push("Tên khóa học không được để trống");
    } else if (data.basicInfo.name.trim().length < 3) {
        validationErrors.push("Tên khóa học phải có ít nhất 3 ký tự");
    }
    if (!data.basicInfo?.code?.trim()) {
        validationErrors.push("Mã khóa học không được để trống");
    } else {
        // Check duplicate
        const isDuplicate = existingCourses.some(
            course => course.code.toLowerCase() === data.basicInfo?.code?.trim().toLowerCase() && course.id !== courseId
        );
        if (isDuplicate) {
            validationErrors.push("Mã khóa học đã tồn tại");
        }
    }
    if (!data.basicInfo?.numberOfSessions || data.basicInfo.numberOfSessions <= 0) {
        validationErrors.push("Tổng số buổi phải lớn hơn 0");
    }
    if (!data.basicInfo?.hoursPerSession || data.basicInfo.hoursPerSession <= 0) {
        validationErrors.push("Vui lòng chọn số giờ/buổi");
    }
    if (!data.basicInfo?.thumbnailUrl?.trim()) {
        validationErrors.push("Vui lòng tải lên ảnh bìa khóa học");
    }

    // Optional but validate if provided
    if (data.basicInfo?.effectiveDate) {
        const selectedDate = new Date(data.basicInfo.effectiveDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            validationErrors.push("Ngày hiệu lực không được là ngày trong quá khứ");
        }
    }

    // Validate optional text fields - nếu có nhập thì phải >= 10 ký tự
    const optionalTextFields: { field: string | undefined; name: string; maxLength: number }[] = [
        { field: data.basicInfo?.targetAudience, name: "Đối tượng học viên", maxLength: 1000 },
        { field: data.basicInfo?.teachingMethods, name: "Phương pháp giảng dạy", maxLength: 1000 },
        { field: data.basicInfo?.description, name: "Mô tả", maxLength: 2000 },
        { field: data.basicInfo?.prerequisites, name: "Điều kiện tiên quyết", maxLength: 1000 },
    ];

    for (const { field, name, maxLength } of optionalTextFields) {
        if (field && field.trim() !== "") {
            const trimmedValue = field.trim();
            if (trimmedValue.length < 10) {
                validationErrors.push(`${name} phải có ít nhất 10 ký tự nếu nhập`);
            } else if (trimmedValue.length > maxLength) {
                validationErrors.push(`${name} không được vượt quá ${maxLength} ký tự`);
            }
        }
    }

    return {
        isValid: validationErrors.length === 0,
        errors: validationErrors
    };
}
