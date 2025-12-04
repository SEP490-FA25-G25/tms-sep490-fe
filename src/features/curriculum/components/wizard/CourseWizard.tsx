/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronRight, Save, Loader2, ChevronDown, LogOut } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Step1BasicInfo, validateStep1 } from "./Step1BasicInfo";
import { Step2CLO, validateStep2 } from "./Step2CLO";
import { Step3Structure, validateStep3 } from "./Step3Structure";
import { Step4Assessment, validateStep4 } from "./Step4Assessment";
import { Step6Review } from "./Step6Review";
import { useCreateCourseMutation, useUpdateCourseMutation, useSubmitCourseMutation, useGetAllCoursesQuery } from "@/store/services/courseApi";
import type { CourseDetail } from "@/store/services/courseApi";
import { toast } from "sonner";
import type { CourseData } from "@/types/course";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";

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

// Helper function to transform CourseDetail to CourseData (for syncing after save)
const transformCourseDetailToFormData = (courseDetail: CourseDetail): CourseData => {
    // Get phases from response
    const phases = (courseDetail as any).structure?.phases || courseDetail.phases || [];
    
    // Collect ALL materials from all sources:
    // 1. COURSE level materials from courseDetail.materials
    // 2. PHASE level materials from phases[].materials
    // 3. SESSION level materials from phases[].sessions[].materials
    const allMaterials: any[] = [];
    
    // 1. Add COURSE level materials
    (courseDetail.materials || []).forEach((material: any) => {
        allMaterials.push({
            id: material.id?.toString() || crypto.randomUUID(),
            name: material.name || material.title,
            type: material.type || material.materialType || "DOCUMENT",
            scope: material.scope || material.level || "COURSE",
            url: material.url || material.fileUrl || "",
            phaseId: material.phaseId?.toString(),
            sessionId: material.sessionId?.toString(),
        });
    });
    
    // 2. Add PHASE and SESSION level materials from phases structure
    phases.forEach((phase: any) => {
        const phaseIdStr = phase.id?.toString();
        
        // Add PHASE level materials
        (phase.materials || []).forEach((material: any) => {
            // Check if this material is already added (avoid duplicates)
            const existingMaterial = allMaterials.find(m => m.id === material.id?.toString());
            if (!existingMaterial) {
                allMaterials.push({
                    id: material.id?.toString() || crypto.randomUUID(),
                    name: material.name || material.title,
                    type: material.type || material.materialType || "DOCUMENT",
                    scope: material.scope || "PHASE",
                    url: material.url || material.fileUrl || "",
                    phaseId: phaseIdStr,
                    sessionId: undefined,
                });
            }
        });
        
        // Add SESSION level materials
        (phase.sessions || []).forEach((session: any) => {
            const sessionIdStr = session.id?.toString();
            (session.materials || []).forEach((material: any) => {
                // Check if this material is already added (avoid duplicates)
                const existingMaterial = allMaterials.find(m => m.id === material.id?.toString());
                if (!existingMaterial) {
                    allMaterials.push({
                        id: material.id?.toString() || crypto.randomUUID(),
                        name: material.name || material.title,
                        type: material.type || material.materialType || "DOCUMENT",
                        scope: material.scope || "SESSION",
                        url: material.url || material.fileUrl || "",
                        phaseId: phaseIdStr,
                        sessionId: sessionIdStr,
                    });
                }
            });
        });
    });
    
    return {
        id: courseDetail.id,
        basicInfo: {
            subjectId: courseDetail.basicInfo?.subjectId?.toString() || courseDetail.subjectId?.toString() || "",
            levelId: courseDetail.basicInfo?.levelId?.toString() || courseDetail.levelId?.toString() || "",
            name: courseDetail.basicInfo?.name || courseDetail.name,
            code: courseDetail.basicInfo?.code || courseDetail.code,
            description: courseDetail.basicInfo?.description || courseDetail.description,
            durationHours: courseDetail.basicInfo?.durationHours || courseDetail.totalHours,
            numberOfSessions: courseDetail.basicInfo?.numberOfSessions || courseDetail.totalSessions,
            hoursPerSession: courseDetail.basicInfo?.hoursPerSession || courseDetail.hoursPerSession,
            targetAudience: courseDetail.basicInfo?.targetAudience || courseDetail.targetAudience,
            teachingMethods: courseDetail.basicInfo?.teachingMethods || courseDetail.teachingMethods,
            prerequisites: courseDetail.basicInfo?.prerequisites || courseDetail.prerequisites,
            scoreScale: courseDetail.basicInfo?.scoreScale || courseDetail.scoreScale,
            effectiveDate: courseDetail.basicInfo?.effectiveDate || courseDetail.effectiveDate,
            thumbnailUrl: courseDetail.basicInfo?.thumbnailUrl || courseDetail.thumbnailUrl,
        },
        clos: courseDetail.clos
            ?.slice()
            .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
            .map((clo) => ({
                id: clo.id?.toString() || crypto.randomUUID(),
                code: clo.code,
                description: clo.description,
                mappedPLOs: (clo as any).mappedPLOs || [],
            })) || [],
        structure: phases
            .slice()
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
                        skills: session.skills || [],
                        cloIds: (session as any).mappedCLOs || [],
                    })) || [],
            })) || [],
        assessments: courseDetail.assessments?.map((assessment) => ({
            id: assessment.id?.toString() || crypto.randomUUID(),
            name: assessment.name,
            type: assessment.assessmentType || (assessment as any).type,
            maxScore: assessment.maxScore || (assessment as any).weight,
            durationMinutes: (assessment as any).durationMinutes || 0,
            skills: (assessment as any).skills || [],
            description: assessment.description || "",
            note: (assessment as any).note || "",
            cloIds: assessment.cloMappings || (assessment as any).mappedCLOs || [],
        })) || [],
        materials: allMaterials,
        status: courseDetail.status,
    };
};

export function CourseWizard({ initialData, isEditMode = false }: CourseWizardProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const { setIsBlocking } = useNavigationGuard();
    const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
    const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
    const { data: existingCourses } = useGetAllCoursesQuery();
    const isLoading = isCreating || isUpdating;

    // Enable navigation blocking when component mounts
    useEffect(() => {
        setIsBlocking(true);
        return () => setIsBlocking(false); // Disable when unmounting
    }, [setIsBlocking]);

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
                    thumbnailUrl: initialData.basicInfo?.thumbnailUrl || initialData.thumbnailUrl,
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
                                skills: session.skills || [],
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
            // Validate Step 1: Basic Info validation
            if (currentStep === 1) {
                const coursesForValidation = existingCourses?.map(c => ({ id: c.id, code: c.code })) || [];
                // Use initialData?.id for edit mode, or createdCourseId after first save
                const courseIdToExclude = initialData?.id || createdCourseId || undefined;
                const step1Validation = validateStep1(formData, coursesForValidation, courseIdToExclude);
                
                if (!step1Validation.isValid) {
                    step1Validation.errors.forEach(error => toast.error(error));
                    return;
                }
            }

            // Validate Step 2: CLO validation
            if (currentStep === 2) {
                const step2Validation = validateStep2(formData);
                
                if (!step2Validation.isValid) {
                    step2Validation.errors.forEach(error => toast.error(error));
                    return;
                }
            }

            // Validate Step 3: Complete validation
            if (currentStep === 3) {
                const step3Validation = validateStep3(formData);
                
                if (!step3Validation.isValid) {
                    step3Validation.errors.forEach(error => toast.error(error));
                    return;
                }
            }

            // Validate Step 4: Assessment validation
            if (currentStep === 4) {
                const step4Validation = validateStep4(formData);
                
                if (!step4Validation.isValid) {
                    step4Validation.errors.forEach(error => toast.error(error));
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
                            skills: session.skills || [],
                            mappedCLOs: session.cloIds || [],
                            materials: formData.materials?.filter(m => m.scope === "SESSION" && m.sessionId === session.id).map(m => ({
                                id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                                title: m.name,
                                materialType: m.type,
                                scope: m.scope,
                                url: m.url,
                                phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                                sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
                            })) || [],
                        })) || [],
                        materials: formData.materials?.filter(m => m.scope === "PHASE" && m.phaseId === phase.id).map(m => ({
                            id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                            title: m.name,
                            materialType: m.type,
                            scope: m.scope,
                            url: m.url,
                            phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                            sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
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
                    title: material.name,
                    materialType: material.type,
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

                setIsBlocking(false); // Disable blocking before navigation

                navigate("/curriculum");
            } catch (error) {
                console.error("Failed to save/submit course:", error);
                toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        }
    };

    // Helper function to prepare request data for saving
    const prepareRequestData = () => {
        return {
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
                        skills: session.skills || [],
                        mappedCLOs: session.cloIds || [],
                        materials: formData.materials?.filter(m => m.scope === "SESSION" && m.sessionId === session.id).map(m => ({
                            id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                            title: m.name,
                            materialType: m.type,
                            scope: m.scope,
                            url: m.url,
                            phaseId: m.phaseId && !isNaN(Number(m.phaseId)) ? Number(m.phaseId) : null,
                            sessionId: m.sessionId && !isNaN(Number(m.sessionId)) ? Number(m.sessionId) : null,
                        })) || [],
                    })) || [],
                    materials: formData.materials?.filter(m => m.scope === "PHASE" && m.phaseId === phase.id).map(m => ({
                        id: m.id && !isNaN(Number(m.id)) ? Number(m.id) : null,
                        title: m.name,
                        materialType: m.type,
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
                title: material.name,
                materialType: material.type,
                scope: material.scope,
                url: material.url,
                phaseId: material.phaseId && !isNaN(Number(material.phaseId)) ? Number(material.phaseId) : null,
                sessionId: material.sessionId && !isNaN(Number(material.sessionId)) ? Number(material.sessionId) : null,
            })) || [],
            status: 'DRAFT',
        };
    };

    // Track created course ID for subsequent saves
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);

    // Save and continue editing
    const handleSaveAndContinue = async () => {
        // Validate minimum required fields
        if (!formData.basicInfo?.subjectId || !formData.basicInfo?.name || !formData.basicInfo?.code) {
            toast.error("Vui lòng nhập Môn học, Tên khóa học và Mã khóa học để lưu nháp.");
            return;
        }

        const requestData = prepareRequestData();
        const courseIdToUpdate = initialData?.id || createdCourseId;

        try {
            let savedCourse;
            if (courseIdToUpdate) {
                // Update existing course
                savedCourse = await updateCourse({ id: courseIdToUpdate, data: requestData }).unwrap();
                toast.success("Đã cập nhật bản nháp thành công!");
            } else {
                // Create new course
                savedCourse = await createCourse(requestData).unwrap();
                setCreatedCourseId(savedCourse.id); // Track for subsequent saves
                toast.success("Đã lưu nháp khóa học thành công!");
            }
            
            // Sync formData with response to get new IDs from database
            if (savedCourse) {
                console.log('=== DEBUG: savedCourse from API ===', savedCourse);
                const syncedData = transformCourseDetailToFormData(savedCourse);
                console.log('=== DEBUG: syncedData after transform ===', syncedData);
                setFormData(syncedData);
            }
            // Stay on current page - don't navigate away
        } catch (error) {
            console.error("Failed to save course:", error);
            toast.error(courseIdToUpdate ? "Cập nhật khóa học thất bại." : "Tạo khóa học thất bại. Vui lòng thử lại.");
        }
    };

    // Save and exit to curriculum list
    const handleSaveAndExit = async () => {
        // Validate minimum required fields
        if (!formData.basicInfo?.subjectId || !formData.basicInfo?.name || !formData.basicInfo?.code) {
            toast.error("Vui lòng nhập Môn học, Tên khóa học và Mã khóa học để lưu nháp.");
            return;
        }

        const requestData = prepareRequestData();
        const courseIdToUpdate = initialData?.id || createdCourseId;

        try {
            if (courseIdToUpdate) {
                // Update existing course
                await updateCourse({ id: courseIdToUpdate, data: requestData }).unwrap();
                toast.success("Đã cập nhật bản nháp thành công!");
            } else {
                // Create new course
                await createCourse(requestData).unwrap();
                toast.success("Đã lưu nháp khóa học thành công!");
            }
            setIsBlocking(false); // Disable blocking before navigation
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to save course:", error);
            toast.error(courseIdToUpdate ? "Cập nhật khóa học thất bại." : "Tạo khóa học thất bại. Vui lòng thử lại.");
        }
    };

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
            // Show confirmation when leaving from step 1
            setShowLeaveConfirm(true);
        }
    };

    const handleConfirmLeave = () => {
        setShowLeaveConfirm(false);
        setIsBlocking(false); // Disable blocking before navigation
        navigate("/curriculum");
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
                <div className="w-full px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleBack}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {currentStep === 1 ? (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Thoát
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                                        Quay lại
                                    </>
                                )}
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <div>
                                <h1 className="text-lg font-semibold">
                                    {isEditMode
                                        ? (initialData?.status === 'DRAFT' ? "Tiếp tục tạo Khóa học" : "Chỉnh sửa Khóa học")
                                        : "Tạo Khóa học Mới"}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {formData.basicInfo?.name || "Chưa đặt tên"}
                                    {formData.basicInfo?.code && ` • ${formData.basicInfo.code}`}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons in Header */}
                        <div className="flex items-center gap-2">
                            {/* Save Draft Split Button */}
                            <div className="flex">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleSaveAndContinue} 
                                    disabled={isLoading || isSubmitting}
                                    className="rounded-r-none border-r-0"
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Lưu nháp
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            disabled={isLoading || isSubmitting}
                                            className="rounded-l-none px-2"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleSaveAndContinue}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Lưu & Tiếp tục
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleSaveAndExit}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Lưu & Thoát
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {currentStep === STEPS.length && canSubmit && (
                                <Button
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={isLoading || isSubmitting}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Gửi phê duyệt
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-6 py-6">
                {/* Enhanced Stepper */}
                <div className="mb-8">
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
                        <div 
                            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                        
                        {/* Steps */}
                        <div className="relative flex justify-between">
                            {STEPS.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;

                                return (
                                    <div 
                                        key={step.id} 
                                        className="flex flex-col items-center"
                                        onClick={() => {
                                            // Allow navigation to completed steps
                                            if (isCompleted) {
                                                setCurrentStep(step.id);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300 ${
                                                isActive
                                                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                                                    : isCompleted
                                                        ? "border-primary bg-primary text-primary-foreground cursor-pointer hover:scale-105"
                                                        : "border-muted text-muted-foreground"
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <span className="font-semibold">{step.id}</span>
                                            )}
                                        </div>
                                        <div className="mt-3 text-center">
                                            <span
                                                className={`text-sm font-medium block ${
                                                    isActive 
                                                        ? "text-primary" 
                                                        : isCompleted 
                                                            ? "text-foreground cursor-pointer" 
                                                            : "text-muted-foreground"
                                                }`}
                                            >
                                                {step.title}
                                            </span>
                                            {isActive && (
                                                <span className="text-xs text-muted-foreground mt-0.5 block">
                                                    Bước hiện tại
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-sm border-muted/50">
                    <CardContent className="p-6 min-h-[500px]">
                        {currentStep === 1 && <Step1BasicInfo data={formData} setData={setFormData} courseStatus={initialData?.status} courseId={initialData?.id} />}
                        {currentStep === 2 && <Step2CLO data={formData} setData={setFormData} />}
                        {currentStep === 3 && <Step3Structure data={formData} setData={setFormData} />}
                        {currentStep === 4 && <Step4Assessment data={formData} setData={setFormData} />}
                        {currentStep === 5 && <Step6Review data={formData} />}
                    </CardContent>
                </Card>

                {/* Bottom Navigation */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        Bước {currentStep} / {STEPS.length}
                    </div>
                    
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handleBack}>
                                <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                                Quay lại
                            </Button>
                        )}
                        
                        {currentStep < STEPS.length && (
                            <Button onClick={handleNext} disabled={isLoading}>
                                Tiếp theo
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for leaving page */}
            <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Thay đổi chưa được lưu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có thay đổi chưa được lưu. Vui lòng sử dụng nút <strong>"Lưu & Thoát"</strong> để lưu trước khi rời khỏi trang, hoặc nhấn "Hủy thay đổi" để bỏ qua các thay đổi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Quay lại chỉnh sửa</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive hover:bg-destructive/90">
                            Hủy thay đổi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
