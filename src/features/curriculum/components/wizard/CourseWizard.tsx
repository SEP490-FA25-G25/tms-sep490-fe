import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronRight, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2CLO } from "./Step2CLO";
import { Step3Structure } from "./Step3Structure";
import { Step4Assessment } from "./Step4Assessment";
import { Step5Materials } from "./Step5Materials";
import { Step6Review } from "./Step6Review";
import { useCreateCourseMutation, useUpdateCourseMutation } from "@/store/services/courseApi";
import { toast } from "sonner";

const STEPS = [
    { id: 1, title: "Thông tin cơ bản" },
    { id: 2, title: "Chuẩn đầu ra (CLO)" },
    { id: 3, title: "Cấu trúc chương trình" },
    { id: 4, title: "Đánh giá" },
    { id: 5, title: "Tài liệu" },
    { id: 6, title: "Xem lại" },
];

interface CourseWizardProps {
    initialData?: any;
    isEditMode?: boolean;
}

export function CourseWizard({ initialData, isEditMode = false }: CourseWizardProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
    const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
    const isLoading = isCreating || isUpdating;

    // Global form state
    const [formData, setFormData] = useState<any>({
        basicInfo: {},
        clos: [],
        structure: [],
        assessments: [],
        materials: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                basicInfo: {
                    ...initialData.basicInfo,
                    subjectId: initialData.basicInfo.subjectId?.toString(),
                    levelId: initialData.basicInfo.levelId?.toString(),
                },
                clos: initialData.clos?.map((clo: any) => ({
                    code: clo.code,
                    description: clo.description,
                    mappedPLOs: clo.mappedPLOs || [],
                })) || [],
                structure: initialData.structure?.phases?.map((phase: any) => ({
                    name: phase.name,
                    sessions: phase.sessions?.map((session: any) => ({
                        topic: session.topic,
                        studentTask: session.studentTask,
                        cloIds: session.mappedCLOs || [],
                    })) || [],
                })) || [],
                assessments: initialData.assessments?.map((assessment: any) => ({
                    name: assessment.name,
                    type: assessment.type,
                    weight: assessment.weight,
                    durationMinutes: assessment.durationMinutes,
                    cloIds: assessment.mappedCLOs || [],
                })) || [],
                materials: initialData.materials?.map((material: any) => ({
                    name: material.name,
                    type: material.type,
                    scope: material.scope,
                    url: material.url,
                })) || [],
            });
        }
    }, [initialData]);

    const handleNext = async () => {
        if (currentStep < STEPS.length) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Validate before submit
            if (!isCourseValid(formData)) {
                toast.error("Vui lòng hoàn thiện các thông tin bắt buộc trước khi tạo khóa học.");
                return;
            }

            // Transform data to match API DTO
            const requestData = {
                basicInfo: {
                    ...formData.basicInfo,
                    subjectId: Number(formData.basicInfo.subjectId),
                    levelId: Number(formData.basicInfo.levelId),
                    durationHours: formData.basicInfo.durationHours ? Number(formData.basicInfo.durationHours) : undefined,
                    durationWeeks: formData.basicInfo.durationWeeks ? Number(formData.basicInfo.durationWeeks) : undefined,
                },
                clos: formData.clos.map((clo: any) => ({
                    code: clo.code,
                    description: clo.description,
                    mappedPLOs: clo.mappedPLOs || [],
                })),
                structure: {
                    phases: formData.structure.map((phase: any) => ({
                        name: phase.name,
                        sessions: phase.sessions.map((session: any) => ({
                            topic: session.topic,
                            studentTask: session.studentTask,
                            mappedCLOs: session.cloIds || [],
                        })),
                    })),
                },
                assessments: formData.assessments.map((assessment: any) => ({
                    name: assessment.name,
                    type: assessment.type,
                    weight: Number(assessment.weight),
                    durationMinutes: assessment.durationMinutes ? Number(assessment.durationMinutes) : undefined,
                    mappedCLOs: assessment.cloIds || [],
                })),
                materials: formData.materials?.map((material: any) => ({
                    name: material.name,
                    type: material.type,
                    scope: material.scope,
                    url: material.url,
                })) || [],
                status: 'ACTIVE',
            };

            try {
                if (isEditMode && initialData?.id) {
                    await updateCourse({ id: initialData.id, data: requestData }).unwrap();
                    toast.success("Đã cập nhật khóa học thành công!");
                } else {
                    await createCourse(requestData).unwrap();
                    toast.success("Đã tạo khóa học thành công!");
                }
                navigate("/curriculum");
            } catch (error) {
                console.error("Failed to save course:", error);
                toast.error(isEditMode ? "Cập nhật khóa học thất bại." : "Tạo khóa học thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleSaveDraft = async () => {
        // Validate minimum required fields
        if (!formData.basicInfo?.subjectId || !formData.basicInfo?.name || !formData.basicInfo?.code) {
            toast.error("Vui lòng nhập Môn học, Tên khóa học và Mã khóa học để lưu nháp.");
            return;
        }

        // Transform data to match API DTO
        const requestData = {
            basicInfo: {
                ...formData.basicInfo,
                subjectId: Number(formData.basicInfo.subjectId),
                levelId: formData.basicInfo.levelId ? Number(formData.basicInfo.levelId) : undefined,
                durationHours: formData.basicInfo.durationHours ? Number(formData.basicInfo.durationHours) : undefined,
                durationWeeks: formData.basicInfo.durationWeeks ? Number(formData.basicInfo.durationWeeks) : undefined,
            },
            clos: formData.clos?.map((clo: any) => ({
                code: clo.code,
                description: clo.description,
                mappedPLOs: clo.mappedPLOs || [],
            })) || [],
            structure: {
                phases: formData.structure?.map((phase: any) => ({
                    name: phase.name,
                    sessions: phase.sessions.map((session: any) => ({
                        topic: session.topic,
                        studentTask: session.studentTask,
                        mappedCLOs: session.cloIds || [],
                    })),
                })) || [],
            },
            assessments: formData.assessments?.map((assessment: any) => ({
                name: assessment.name,
                type: assessment.type,
                weight: Number(assessment.weight),
                durationMinutes: assessment.durationMinutes ? Number(assessment.durationMinutes) : undefined,
                mappedCLOs: assessment.cloIds || [],
            })) || [],
            materials: formData.materials?.map((material: any) => ({
                name: material.name,
                type: material.type,
                scope: material.scope,
                url: material.url,
            })) || [],
            status: 'DRAFT',
        };

        try {
            if (isEditMode && initialData?.id) {
                await updateCourse({ id: initialData.id, data: requestData }).unwrap();
                toast.success("Đã cập nhật bản nháp thành công!");
            } else {
                await createCourse(requestData).unwrap();
                toast.success("Đã tạo khóa học thành công!");
            }
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to save course:", error);
            toast.error(isEditMode ? "Cập nhật khóa học thất bại." : "Tạo khóa học thất bại. Vui lòng thử lại.");
        }
    }
    const isCourseValid = (data: any) => {
        const totalWeight = data.assessments?.reduce((sum: number, assessment: any) => sum + (assessment.weight || 0), 0) || 0;
        return (
            !!(data.basicInfo?.name && data.basicInfo?.code && data.basicInfo?.subjectId && data.basicInfo?.levelId) &&
            (data.clos?.length || 0) > 0 &&
            (data.structure?.length || 0) > 0 &&
            totalWeight === 100
        );
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        } else {
            navigate("/curriculum");
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold">{isEditMode ? "Chỉnh sửa Khóa học" : "Tạo Khóa học Mới"}</h1>
                <p className="text-muted-foreground">Thực hiện theo các bước để {isEditMode ? "cập nhật" : "định nghĩa"} đề cương khóa học.</p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
                    {STEPS.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isActive
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : isCompleted
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-muted-foreground text-muted-foreground"
                                        }`}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                <span
                                    className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"
                                        }`}
                                >
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <Card className="min-h-[500px] flex flex-col">
                <CardContent className="p-6 flex-1">
                    {currentStep === 1 && <Step1BasicInfo data={formData} setData={setFormData} />}
                    {currentStep === 2 && <Step2CLO data={formData} setData={setFormData} />}
                    {currentStep === 3 && <Step3Structure data={formData} setData={setFormData} />}
                    {currentStep === 4 && <Step4Assessment data={formData} setData={setFormData} />}
                    {currentStep === 5 && <Step5Materials data={formData} setData={setFormData} />}
                    {currentStep === 6 && <Step6Review data={formData} />}
                </CardContent>

                <Separator />

                <div className="p-6 flex justify-between bg-muted/10">
                    <Button variant="outline" onClick={handleBack}>
                        {currentStep === 1 ? "Hủy" : "Quay lại"}
                    </Button>
                    <Button onClick={handleNext} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : currentStep === STEPS.length ? (
                            isEditMode ? "Cập nhật Khóa học" : "Tạo Khóa học"
                        ) : (
                            <>
                                Tiếp theo
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>

                <div className="absolute top-6 right-6">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu nháp
                    </Button>
                </div>
            </Card>
        </div>
    );
}
