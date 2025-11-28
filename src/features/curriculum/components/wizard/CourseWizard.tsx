/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Step6Review } from "./Step6Review";
import { useCreateCourseMutation, useUpdateCourseMutation, useSubmitCourseMutation } from "@/store/services/courseApi";
import type { CourseDetail } from "@/store/services/courseApi";
import { toast } from "sonner";
import type { CourseData } from "@/types/course";

const STEPS = [
    { id: 1, title: "Thông tin cơ bản" },
    { id: 2, title: "Chuẩn đầu ra (CLO)" },
    { id: 3, title: "Cấu trúc chương trình" },
    { id: 4, title: "Đánh giá" },
    { id: 5, title: "Xem lại" },
];

interface CourseWizardProps {
    initialData?: CourseDetail;
    isEditMode?: boolean;
}

export function CourseWizard({ initialData, isEditMode = false }: CourseWizardProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
    const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
    const isLoading = isCreating || isUpdating;

    // Global form state
    const [formData, setFormData] = useState<CourseData>({
        basicInfo: {
            subjectId: "",
            levelId: "",
            name: "",
            code: "",
            durationHours: 0,
            numberOfSessions: 0,
            hoursPerSession: 0,
            scoreScale: "10",
            effectiveDate: new Date().toISOString(),
            targetAudience: "",
            teachingMethods: "",
            description: "",
            prerequisites: "",
        },
        clos: [],
        structure: [],
        assessments: [],
        materials: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                basicInfo: {
                    subjectId: initialData.basicInfo?.subjectId?.toString() || initialData.subjectId?.toString() || "",
                    levelId: initialData.basicInfo?.levelId?.toString() || initialData.levelId?.toString() || "",
                    name: initialData.basicInfo?.name || initialData.name,
                    code: initialData.basicInfo?.code || initialData.code,
                    description: initialData.basicInfo?.description || initialData.description,
                    durationHours: initialData.basicInfo?.durationHours || initialData.totalHours,
                    numberOfSessions: initialData.basicInfo?.numberOfSessions || initialData.totalSessions,
                    hoursPerSession: initialData.basicInfo?.hoursPerSession || initialData.hoursPerSession,
                    targetAudience: initialData.basicInfo?.targetAudience || initialData.targetAudience,
                    teachingMethods: initialData.basicInfo?.teachingMethods || initialData.teachingMethods,
                    prerequisites: initialData.basicInfo?.prerequisites || initialData.prerequisites,
                    scoreScale: initialData.basicInfo?.scoreScale || initialData.scoreScale,
                    effectiveDate: initialData.basicInfo?.effectiveDate || initialData.effectiveDate,
                },
                clos: initialData.clos
                    ?.slice()
                    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                    .map((clo) => ({
                        id: clo.id?.toString() || crypto.randomUUID(),
                        code: clo.code,
                        description: clo.description,
                        mappedPLOs: (clo as any).mappedPLOs || [],
                    })) || [],
                structure: ((initialData as any).structure?.phases || initialData.phases)
                    ?.slice()
                    .sort((a: any, b: any) => (a.phaseNumber || 0) - (b.phaseNumber || 0))
                    .map((phase: any) => ({
                        id: phase.id?.toString() || crypto.randomUUID(),
                        name: phase.name,
                        sessions: phase.sessions
                            ?.slice()
                            .sort((a: any, b: any) => (a.sequenceNo || 0) - (b.sequenceNo || 0))
                            .map((session: any) => ({
                                id: session.id?.toString() || crypto.randomUUID(),
                                sequence: session.sequenceNo,
                                topic: session.topic,
                                studentTask: session.studentTask || "",
                                skillSets: session.skillSets || [],
                                cloIds: (session as any).mappedCLOs || [],
                            })) || [],
                    })) || [],
                assessments: initialData.assessments?.map((assessment) => ({
                    id: assessment.id.toString(),
                    name: assessment.name,
                    type: assessment.assessmentType || (assessment as any).type,
                    maxScore: assessment.maxScore || (assessment as any).weight,
                    durationMinutes: (assessment as any).durationMinutes || 0,
                    skills: (assessment as any).skills || [],
                    description: assessment.description || "",
                    note: (assessment as any).note || "",
                    cloIds: assessment.cloMappings || (assessment as any).mappedCLOs || [],
                })) || [],
                materials: initialData.materials?.map((material) => ({
                    id: material.id.toString(),
                    name: (material as any).name || (material as any).title,
                    type: (material as any).type || (material as any).materialType || "DOCUMENT",
                    scope: (material as any).scope || (material as any).level,
                    url: (material as any).url || (material as any).fileUrl || "",
                    phaseId: (material as any).phaseId?.toString(),
                    sessionId: (material as any).sessionId?.toString(),
                })) || [],
            });
        }
    }, [initialData]);

    const handleNext = async () => {
        if (currentStep < STEPS.length) {
            // Validate Step 3: Check if total sessions match required sessions
            if (currentStep === 3) {
                const totalCreatedSessions = formData.structure?.reduce(
                    (sum, phase) => sum + (phase.sessions?.length || 0),
                    0
                ) || 0;
                const requiredSessions = Number(formData.basicInfo.numberOfSessions) || 0;

                if (totalCreatedSessions !== requiredSessions) {
                    toast.error(
                        `Số buổi đã tạo (${totalCreatedSessions}) không khớp với Tổng số buổi (${requiredSessions}). Vui lòng điều chỉnh lại.`
                    );
                    return;
                }
            }
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
                    numberOfSessions: formData.basicInfo.numberOfSessions ? Number(formData.basicInfo.numberOfSessions) : undefined,
                },
                clos: formData.clos.map((clo) => ({
                    code: clo.code,
                    description: clo.description,
                    mappedPLOs: clo.mappedPLOs || [],
                })),
                structure: {
                    phases: formData.structure.map((phase) => ({
                        id: phase.id && !isNaN(Number(phase.id)) ? Number(phase.id) : null,
                        name: phase.name,
                        sessions: phase.sessions.map((session) => ({
                            id: session.id && !isNaN(Number(session.id)) ? Number(session.id) : null,
                            topic: session.topic,
                            studentTask: session.studentTask,
                            skillSets: session.skillSets || [],
                            mappedCLOs: session.cloIds || [],
                            materials: formData.materials?.filter(m => m.scope === "SESSION" && m.sessionId === session.id).map(m => ({
                                id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                                name: m.name,
                                type: m.type,
                                scope: m.scope,
                                url: m.url,
                                phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                                sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
                            })) || [],
                        })) || [],
                    })),
                },
                assessments: formData.assessments.map((assessment) => ({
                    id: assessment.id && !isNaN(Number(assessment.id)) ? Number(assessment.id) : null,
                    name: assessment.name,
                    type: assessment.type,
                    weight: Number(assessment.maxScore), // Backend expects weight/maxScore
                    durationMinutes: assessment.durationMinutes ? Number(assessment.durationMinutes) : undefined,
                    skills: assessment.skills || [],
                    description: assessment.description,
                    note: assessment.note,
                    mappedCLOs: assessment.cloIds || [],
                })),
                materials: formData.materials?.filter(m => m.scope !== "SESSION").map((material) => ({
                    id: material.id && !isNaN(Number(material.id)) ? Number(material.id) : null,
                    name: material.name,
                    type: material.type,
                    scope: material.scope,
                    url: material.url,
                    phaseId: material.phaseId && !isNaN(Number(material.phaseId)) ? Number(material.phaseId) : null,
                    sessionId: material.sessionId && !isNaN(Number(material.sessionId)) ? Number(material.sessionId) : null,
                })) || [],
                status: 'DRAFT',
            };

            try {
                let courseId = initialData?.id;
                if (isEditMode && initialData?.id) {
                    await updateCourse({ id: initialData.id, data: requestData }).unwrap();
                    courseId = initialData.id;
                } else {
                    const newCourse = await createCourse(requestData).unwrap();
                    courseId = newCourse.id;
                }

                // If course is valid, submit for approval immediately
                if (isCourseValid(formData)) {
                    await submitCourse(courseId).unwrap();
                    toast.success("Đã gửi phê duyệt khóa học thành công!");
                } else {
                    toast.success(isEditMode ? "Đã cập nhật khóa học thành công!" : "Đã tạo khóa học thành công!");
                }

                navigate("/curriculum");
            } catch (error) {
                console.error("Failed to save/submit course:", error);
                toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
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
                numberOfSessions: formData.basicInfo.numberOfSessions ? Number(formData.basicInfo.numberOfSessions) : undefined,
            },
            clos: formData.clos?.map((clo) => ({
                code: clo.code,
                description: clo.description,
                mappedPLOs: clo.mappedPLOs || [],
            })) || [],
            structure: {
                phases: formData.structure?.map((phase) => ({
                    id: phase.id && !isNaN(Number(phase.id)) ? Number(phase.id) : null,
                    name: phase.name,
                    description: phase.description,
                    sessions: phase.sessions?.map((session) => ({
                        id: session.id && !isNaN(Number(session.id)) ? Number(session.id) : null,
                        topic: session.topic,
                        studentTask: session.studentTask,
                        skillSets: session.skillSets || [],
                        mappedCLOs: session.cloIds || [],
                        materials: formData.materials?.filter(m => m.scope === "SESSION" && m.sessionId === session.id).map(m => ({
                            id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                            name: m.name,
                            type: m.type,
                            scope: m.scope,
                            url: m.url,
                            phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                            sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
                        })) || [],
                    })) || [],
                    materials: formData.materials?.filter(m => m.scope === "PHASE" && m.phaseId === phase.id).map(m => ({
                        id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                        name: m.name,
                        type: m.type,
                        scope: m.scope,
                        url: m.url,
                        phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                        sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
                    })) || [],
                })) || [],
            },
            assessments: formData.assessments?.map((assessment) => ({
                id: assessment.id && !isNaN(Number(assessment.id)) ? Number(assessment.id) : null,
                name: assessment.name,
                type: assessment.type,
                weight: Number(assessment.maxScore),
                durationMinutes: assessment.durationMinutes ? Number(assessment.durationMinutes) : undefined,
                skills: assessment.skills || [],
                description: assessment.description,
                note: assessment.note,
                mappedCLOs: assessment.cloIds || [],
            })) || [],
            materials: formData.materials?.filter(m => m.scope === "COURSE").map((material) => ({
                id: material.id && !isNaN(Number(material.id)) ? Number(material.id) : null,
                name: material.name,
                type: material.type,
                scope: material.scope,
                url: material.url,
                phaseId: material.phaseId && !isNaN(Number(material.phaseId)) ? Number(material.phaseId) : null,
                sessionId: material.sessionId && !isNaN(Number(material.sessionId)) ? Number(material.sessionId) : null,
            })) || [],
            status: 'DRAFT',
        };

        try {
            if (isEditMode && initialData?.id) {
                await updateCourse({ id: initialData.id, data: requestData }).unwrap();
                toast.success("Đã cập nhật bản nháp thành công!");
            } else {
                await createCourse(requestData).unwrap();
                toast.success("Đã lưu nháp khóa học thành công!");
            }
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to save course:", error);
            toast.error(isEditMode ? "Cập nhật khóa học thất bại." : "Tạo khóa học thất bại. Vui lòng thử lại.");
        }
    }
    const [submitCourse, { isLoading: isSubmitting }] = useSubmitCourseMutation();

    const isCourseValid = (data: CourseData) => {
        const totalSessions = data.structure?.reduce((acc, p) => acc + (p.sessions?.length || 0), 0) || 0;
        const requiredSessions = Number(data.basicInfo?.numberOfSessions) || 0;
        const allSessions = data.structure?.flatMap(p => p.sessions || []) || [];

        // Check mappings
        const allClosMappedToPlo = data.clos?.every(clo => clo.mappedPLOs && clo.mappedPLOs.length > 0) ?? false;
        const allClosMappedToSession = (data.clos?.length || 0) > 0 &&
            data.clos.every(clo => allSessions.some(s => s.cloIds && s.cloIds.includes(clo.code)));

        const allClosMappedToAssessment = (data.clos?.length || 0) > 0 &&
            data.clos.every(clo => data.assessments?.some(a => a.cloIds && a.cloIds.includes(clo.code)));

        return (
            !!(data.basicInfo?.name && data.basicInfo?.code && data.basicInfo?.subjectId && data.basicInfo?.levelId) &&
            (data.clos?.length || 0) > 0 &&
            (data.materials?.length || 0) > 0 &&
            (data.assessments?.length || 0) > 0 &&
            totalSessions === requiredSessions &&
            allClosMappedToPlo &&
            allClosMappedToSession &&
            allClosMappedToAssessment
        );
    };

    // Removed standalone handleSubmitForApproval

    const canSubmit = isCourseValid(formData); // Simplified check for UI state

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        } else {
            navigate("/curriculum");
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold">
                    {isEditMode
                        ? (initialData?.status === 'DRAFT' ? "Tiếp tục tạo Khóa học" : "Chỉnh sửa Khóa học")
                        : "Tạo Khóa học Mới"}
                </h1>
                <p className="text-muted-foreground">
                    {isEditMode
                        ? (initialData?.status === 'DRAFT' ? "Hoàn thiện các thông tin để tạo khóa học." : "Cập nhật thông tin đề cương khóa học.")
                        : "Thực hiện theo các bước để định nghĩa đề cương khóa học."}
                </p>
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
                    {currentStep === 1 && <Step1BasicInfo data={formData} setData={setFormData} courseStatus={initialData?.status} />}
                    {currentStep === 2 && <Step2CLO data={formData} setData={setFormData} />}
                    {currentStep === 3 && <Step3Structure data={formData} setData={setFormData} />}
                    {currentStep === 4 && <Step4Assessment data={formData} setData={setFormData} />}
                    {currentStep === 5 && <Step6Review data={formData} />}
                </CardContent>

                <Separator />

                <div className="p-6 flex justify-between bg-muted/10">
                    <Button variant="outline" onClick={handleBack}>
                        {currentStep === 1 ? "Hủy" : "Quay lại"}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading || isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            Lưu lại
                        </Button>

                        {(currentStep < STEPS.length || canSubmit) && (
                            <Button
                                onClick={handleNext}
                                disabled={isLoading || isSubmitting}
                                className={currentStep === STEPS.length ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {isLoading || isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : currentStep === STEPS.length ? (
                                    "Gửi phê duyệt"
                                ) : (
                                    <>
                                        Tiếp theo
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
