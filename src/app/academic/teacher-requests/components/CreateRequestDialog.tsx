import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectTeacherStep } from "./steps/SelectTeacherStep";
import { SelectTypeStep } from "./steps/SelectTypeStep";
import { SelectSessionStep } from "./steps/SelectSessionStep";
import { RequestFormStep } from "./steps/RequestFormStep";
import type { RequestType } from "@/store/services/teacherRequestApi";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "teacher" | "type" | "session" | "form";

export function CreateRequestDialog({
  open,
  onOpenChange,
}: CreateRequestDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>("teacher");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>();

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep("teacher");
    setSelectedTeacherId(undefined);
    setSelectedRequestType(undefined);
    setSelectedSessionId(undefined);
    onOpenChange(false);
  };

  const handleTeacherSelected = (teacherId: number) => {
    setSelectedTeacherId(teacherId);
    setCurrentStep("type");
  };

  const handleTypeSelected = (requestType: RequestType) => {
    setSelectedRequestType(requestType);
    setCurrentStep("session");
  };

  const handleSessionSelected = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setCurrentStep("form");
  };

  const handleFormSuccess = () => {
    handleClose();
  };

  const handleBack = () => {
    if (currentStep === "form") {
      setCurrentStep("session");
      setSelectedSessionId(undefined);
    } else if (currentStep === "session") {
      setCurrentStep("type");
      setSelectedRequestType(undefined);
    } else if (currentStep === "type") {
      setCurrentStep("teacher");
      setSelectedTeacherId(undefined);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "teacher":
        return "Chọn giáo viên";
      case "type":
        return "Chọn loại yêu cầu";
      case "session":
        return "Chọn buổi học";
      case "form":
        return "Điền thông tin yêu cầu";
      default:
        return "Tạo yêu cầu cho giáo viên";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getStepTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            {[
              { key: "teacher", label: "Chọn giáo viên" },
              { key: "type", label: "Chọn loại" },
              { key: "session", label: "Chọn buổi" },
              { key: "form", label: "Điền form" },
            ].map((step, index) => {
              const stepKey = step.key as Step;
              const isActive = currentStep === stepKey;
              const isCompleted =
                (stepKey === "teacher" && selectedTeacherId) ||
                (stepKey === "type" && selectedRequestType) ||
                (stepKey === "session" && selectedSessionId) ||
                (stepKey === "form" && currentStep === "form");

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isActive
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          {currentStep === "teacher" && (
            <SelectTeacherStep
              onSelect={handleTeacherSelected}
              onCancel={handleClose}
            />
          )}

          {currentStep === "type" && selectedTeacherId && (
            <SelectTypeStep
              teacherId={selectedTeacherId}
              onSelect={handleTypeSelected}
              onBack={handleBack}
            />
          )}

          {currentStep === "session" &&
            selectedTeacherId &&
            selectedRequestType && (
              <SelectSessionStep
                teacherId={selectedTeacherId}
                requestType={selectedRequestType}
                onSelect={handleSessionSelected}
                onBack={handleBack}
              />
            )}

          {currentStep === "form" &&
            selectedTeacherId &&
            selectedRequestType &&
            selectedSessionId && (
              <RequestFormStep
                teacherId={selectedTeacherId}
                sessionId={selectedSessionId}
                requestType={selectedRequestType}
                onSuccess={handleFormSuccess}
                onBack={handleBack}
              />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

