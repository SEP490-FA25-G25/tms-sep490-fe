import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectTeacherStep } from "./steps/SelectTeacherStep";
import { SelectSessionStep } from "./steps/SelectSessionStep";
import { RequestFormStep } from "./steps/RequestFormStep";
import type { RequestType } from "@/store/services/teacherRequestApi";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRequestType?: RequestType;
}

type Step = "teacher" | "session" | "info" | "reason";

export interface RequestSelectionState {
  selectedDate?: Date;
  selectedTimeSlotId?: number;
  selectedResourceId?: number;
  selectedReplacementTeacherId?: number;
  selectedModalityResourceId?: number;
  selectedTimeSlotLabel?: string;
  selectedResourceLabel?: string;
  selectedModalityResourceLabel?: string;
}

export function CreateRequestDialog({
  open,
  onOpenChange,
  initialRequestType,
}: CreateRequestDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>("teacher");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>();
  const [selectionState, setSelectionState] = useState<RequestSelectionState>({});

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep("teacher");
    setSelectedTeacherId(undefined);
    setSelectedRequestType(undefined);
    setSelectedSessionId(undefined);
    onOpenChange(false);
  };

  // Prefill type when opened from preset
  useEffect(() => {
    if (open) {
      if (initialRequestType) {
        setSelectedRequestType(initialRequestType);
      }
      setCurrentStep("teacher");
    } else {
      // reset when closed
      setSelectedRequestType(undefined);
    }
  }, [open, initialRequestType]);

  const handleTeacherSelected = (teacherId: number) => {
    setSelectedTeacherId(teacherId);
    setSelectedSessionId(undefined);
    setSelectionState({});
    setCurrentStep("session");
  };

  const handleSessionSelected = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setSelectionState({});
    setCurrentStep("info");
  };

  const handleInfoNext = (state: RequestSelectionState) => {
    setSelectionState(state);
    setCurrentStep("reason");
  };

  const handleFormSuccess = () => {
    handleClose();
  };

  const handleBack = () => {
    if (currentStep === "reason") {
      setCurrentStep("info");
    } else if (currentStep === "info") {
      setCurrentStep("session");
      setSelectionState({});
    } else if (currentStep === "session") {
      setCurrentStep("teacher");
      setSelectedSessionId(undefined);
      setSelectionState({});
    } else {
      handleClose();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "teacher":
        return "Chọn giáo viên";
      case "session":
        return "Chọn buổi học";
      case "info":
        return "Điền thông tin";
      case "reason":
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
              { key: "session", label: "Chọn buổi học" },
              { key: "info", label: "Điền thông tin" },
              { key: "reason", label: "Điền lý do" },
            ].map((step, index) => {
              const stepKey = step.key as Step;
              const isActive = currentStep === stepKey;
              const isCompleted =
                (stepKey === "teacher" && selectedTeacherId) ||
                (stepKey === "session" && selectedSessionId) ||
                (stepKey === "info" && currentStep !== "teacher" && currentStep !== "session") ||
                (stepKey === "reason" && currentStep === "reason");

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
          {currentStep === "teacher" && selectedRequestType && (
            <SelectTeacherStep
              onSelect={handleTeacherSelected}
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

          {currentStep === "info" &&
            selectedTeacherId &&
            selectedRequestType &&
            selectedSessionId && (
              <RequestFormStep
                teacherId={selectedTeacherId}
                sessionId={selectedSessionId}
                requestType={selectedRequestType}
                mode="info"
                onInfoNext={handleInfoNext}
                onBack={handleBack}
              />
            )}

          {currentStep === "reason" &&
            selectedTeacherId &&
            selectedRequestType &&
            selectedSessionId && (
              <RequestFormStep
                teacherId={selectedTeacherId}
                sessionId={selectedSessionId}
                requestType={selectedRequestType}
                mode="reason"
                selectionState={selectionState}
                onSuccess={handleFormSuccess}
                onBack={handleBack}
              />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

