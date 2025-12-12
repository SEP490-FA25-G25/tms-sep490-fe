import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, Save, Loader2, LogOut } from "lucide-react";
import { useDeleteClassMutation } from "@/store/services/classApi";
import { useGetClassByIdQuery } from "@/store/services/classApi";
import { useWizardNavigation } from "./hooks/useWizardNavigation";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2ReviewSessions } from "./Step2ReviewSessions";
import { Step3TimeSlots } from "./Step3TimeSlots";
import { Step4Resources } from "./Step4Resources";
import { Step5Validation } from "./Step6Validation";

const STEPS = [
  { id: 1, title: "Thông tin cơ bản" },
  { id: 2, title: "Xem lại buổi học" },
  { id: 3, title: "Lịch học" },
  { id: 4, title: "Tài nguyên" },
  { id: 5, title: "Kiểm tra & Gửi duyệt" },
];

interface CreateClassWizardProps {
  classId?: number;
  mode?: "create" | "edit";
}

export function CreateClassWizard({
  classId: propClassId,
  mode: modeProp,
}: CreateClassWizardProps = {}) {
  const [mode] = useState<"create" | "edit">(
    () => modeProp ?? (propClassId ? "edit" : "create")
  );
  const navigate = useNavigate();
  const { setIsBlocking } = useNavigationGuard();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [_deleteClass] = useDeleteClassMutation();

  const { currentStep, classId, navigateToStep, markStepComplete } =
    useWizardNavigation(propClassId);

  // Fetch class data for header display
  const { data: classData } = useGetClassByIdQuery(classId ?? 0, {
    skip: !classId,
  });
  const className = classData?.data?.name || "Chưa đặt tên";
  const classCode = classData?.data?.code || "";

  // Enable navigation blocking when component mounts
  useEffect(() => {
    setIsBlocking(true);
    return () => setIsBlocking(false);
  }, [setIsBlocking]);

  // === Navigation Handlers ===
  const handleBack = () => {
    if (currentStep > 1) {
      navigateToStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const handleNext = () => {
    // Validate before proceeding to next step
    if (!classId && currentStep !== 1) {
      // For all steps except 1, classId is required
      toast.error(
        "Không tìm thấy lớp học. Vui lòng quay lại bước 1 và tạo lớp."
      );
      return;
    }

    // Step-specific handling
    switch (currentStep) {
      case 1:
        // Step 1: Always trigger form submission to save/update class data
        {
          const step1SubmitBtn = document.getElementById("step1-submit-btn");
          if (step1SubmitBtn) {
            step1SubmitBtn.click();
          } else {
            toast.error('Vui lòng nhấn nút "Tạo lớp" để tạo lớp trước');
          }
        }
        break;

      case 2:
        // Step 2: Review only, just navigate
        markStepComplete(2);
        navigateToStep(3);
        break;

      case 3:
        // Step 3: Always trigger time slot assignment to save/update
        {
          const step3SubmitBtn = document.getElementById("step3-submit-btn");
          if (step3SubmitBtn) {
            step3SubmitBtn.click();
          } else {
            // If button not found, just navigate (component may not be ready)
            markStepComplete(3);
            navigateToStep(4);
          }
        }
        break;

      case 4:
        // Step 4: Always trigger resource assignment to save/update
        {
          const step4SubmitBtn = document.getElementById("step4-submit-btn");
          if (step4SubmitBtn) {
            step4SubmitBtn.click();
          } else {
            // If button not found, just navigate (component may not be ready)
            markStepComplete(4);
            navigateToStep(5);
          }
        }
        break;

      default:
        break;
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    setIsBlocking(false);
    navigate("/academic/classes");
  };

  // === Step Handlers ===
  const handleStep1Success = (newClassId: number) => {
    markStepComplete(1);
    navigateToStep(2, newClassId);
  };

  // === Save Draft Handler (like CourseWizard pattern) ===
  const handleSaveDraft = async () => {
    if (!classId) {
      // If no class created yet, trigger Step 1 form submission
      const step1SubmitBtn = document.getElementById("step1-submit-btn");
      if (step1SubmitBtn) {
        step1SubmitBtn.click();
      } else {
        toast.error('Vui lòng hoàn thành Bước 1 - Thông tin cơ bản trước');
      }
      return;
    }
    // Class already exists - just show success (data is auto-saved per step)
    toast.success('Bản nháp đã được lưu');
  };

  // === Save and Exit Handler ===
  const handleSaveAndExit = async () => {
    if (!classId) {
      // If no class created yet, trigger Step 1 form submission first
      const step1SubmitBtn = document.getElementById("step1-submit-btn");
      if (step1SubmitBtn) {
        step1SubmitBtn.click();
        // Note: Navigation will happen after successful class creation in Step1BasicInfo
        toast.info('Vui lòng đợi lớp được tạo xong...');
      } else {
        toast.error('Vui lòng hoàn thành Bước 1 - Thông tin cơ bản trước');
      }
      return;
    }
    // Class already exists - save and navigate away
    toast.success('Bản nháp đã được lưu');
    setIsBlocking(false);
    navigate("/academic/classes");
  };

  // === Delete Handler ===
  // @ts-expect-error - intentionally unused, kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleDeleteClass = async () => {
    if (!classId) {
      toast.error("Không tìm thấy lớp nháp để xóa.");
      return;
    }
    try {
      await _deleteClass(classId).unwrap();
      toast.success("Lớp nháp đã được xóa.");
      setIsBlocking(false);
      navigate("/academic/classes");
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Không thể xóa lớp. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const isLoading = false; // Placeholder
  const isSubmitting = false; // Placeholder

  return (
    <div className="bg-muted/30">
      {/* Header - Sticky */}
      <div className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Exit/Back + Title */}
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
                  {mode === "edit" ? "Chỉnh sửa Lớp Học" : "Tạo Lớp Học Mới"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {className}
                  {classCode && ` • ${classCode}`}
                </p>
              </div>
            </div>

            {/* Right Side: Save Draft Split Button */}
            <div className="flex items-center gap-2">
              <div className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
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
                    <DropdownMenuItem onClick={handleSaveDraft}>
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-6">
        {/* Enhanced Stepper */}
        <div className="mb-8">
          <div className="relative">
            {/* Progress Line Background */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            {/* Progress Line Active */}
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300 ${isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                        : isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted text-muted-foreground"
                        }`}
                    >
                      <span className="font-semibold">{step.id}</span>
                    </div>
                    <div className="mt-3 text-center">
                      <span
                        className={`text-sm font-medium block ${isActive
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
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
            {currentStep === 1 && (
              <Step1BasicInfo
                classId={classId}
                onSuccess={handleStep1Success}
              />
            )}

            {currentStep === 2 && <Step2ReviewSessions classId={classId} />}

            {currentStep === 3 && (
              <Step3TimeSlots
                classId={classId}
                onContinue={() => {
                  markStepComplete(3);
                  navigateToStep(4);
                }}
              />
            )}

            {currentStep === 4 && (
              <Step4Resources
                classId={classId}
                onContinue={() => {
                  markStepComplete(4);
                  navigateToStep(5);
                }}
              />
            )}

            {currentStep === 5 && (
              <Step5Validation
                classId={classId}
                onFinish={() => {
                  markStepComplete(5);
                  setIsBlocking(false);
                  navigate("/academic/classes");
                }}
              />
            )}
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

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thay đổi chưa được lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thay đổi chưa được lưu. Vui lòng sử dụng nút{" "}
              <strong>&quot;Lưu &amp; Thoát&quot;</strong> để lưu trước khi rời
              khỏi trang, hoặc nhấn &quot;Hủy thay đổi&quot; để bỏ qua các thay
              đổi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quay lại chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hủy thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
