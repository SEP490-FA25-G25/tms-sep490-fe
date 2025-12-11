import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import {
  useUpdateTeacherSkillsMutation,
  type TeacherSkillDTO,
  type Skill,
} from "@/store/services/academicTeacherApi";
import { toast } from "sonner";

const SKILL_OPTIONS: { value: Skill; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "READING", label: "Reading" },
  { value: "WRITING", label: "Writing" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "LISTENING", label: "Listening" },
  { value: "VOCABULARY", label: "Vocabulary" },
  { value: "GRAMMAR", label: "Grammar" },
  { value: "KANJI", label: "Kanji" },
];

interface UpdateSkillsDialogProps {
  teacherId: number;
  currentSkills: TeacherSkillDTO[];
  open: boolean;
  onClose: () => void;
}

export function UpdateSkillsDialog({
  teacherId,
  currentSkills,
  open,
  onClose,
}: UpdateSkillsDialogProps) {
  const [skills, setSkills] = useState<TeacherSkillDTO[]>([]);
  const [updateSkills, { isLoading }] = useUpdateTeacherSkillsMutation();

  // Initialize skills from currentSkills when dialog opens
  useEffect(() => {
    if (open) {
      setSkills(
        currentSkills.length > 0
          ? [...currentSkills]
          : [
              {
                skill: "GENERAL",
                specialization: "",
                language: "",
                level: null,
              },
            ]
      );
    }
  }, [open, currentSkills]);

  const handleAddSkill = () => {
    setSkills([
      ...skills,
      {
        skill: "GENERAL",
        specialization: "",
        language: "",
        level: null,
      },
    ]);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillChange = (
    index: number,
    field: keyof TeacherSkillDTO,
    value: string | number | null
  ) => {
    const updated = [...skills];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSkills(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (skills.length === 0) {
      toast.error("Vui lòng thêm ít nhất một kỹ năng");
      return;
    }

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      if (!skill.specialization.trim()) {
        toast.error(`Vui lòng nhập chuyên môn cho kỹ năng ${i + 1}`);
        return;
      }
      if (!skill.language.trim()) {
        toast.error(`Vui lòng nhập ngôn ngữ cho kỹ năng ${i + 1}`);
        return;
      }
    }

    try {
      await updateSkills({
        teacherId,
        request: { skills },
      }).unwrap();
      toast.success("Cập nhật kỹ năng thành công");
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Có lỗi xảy ra khi cập nhật kỹ năng");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật Kỹ năng Giáo viên</DialogTitle>
          <DialogDescription>
            Thêm hoặc chỉnh sửa các kỹ năng của giáo viên. Bạn có thể thêm nhiều
            kỹ năng cùng một lúc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có kỹ năng nào</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleAddSkill}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm kỹ năng
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-4 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Kỹ năng {index + 1}</Badge>
                    {skills.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor={`skill-${index}`}
                        className="mb-1 block leading-tight"
                      >
                        Kỹ năng <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={skill.skill}
                        onValueChange={(value) =>
                          handleSkillChange(index, "skill", value as Skill)
                        }
                      >
                        <SelectTrigger id={`skill-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor={`specialization-${index}`}
                        className="mb-1 block leading-tight"
                      >
                        Chuyên môn <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`specialization-${index}`}
                        placeholder="Ví dụ: IELTS, TOEIC, TOEFL"
                        value={skill.specialization}
                        onChange={(e) =>
                          handleSkillChange(
                            index,
                            "specialization",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`language-${index}`}
                        className="mb-1 block leading-tight"
                      >
                        Ngôn ngữ <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`language-${index}`}
                        placeholder="Ví dụ: English, Vietnamese"
                        value={skill.language}
                        onChange={(e) =>
                          handleSkillChange(index, "language", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`level-${index}`}
                        className="mb-1 block leading-tight"
                      >
                        Cấp độ (1-10)
                      </Label>
                      <Input
                        id={`level-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1-10"
                        value={skill.level || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleSkillChange(
                            index,
                            "level",
                            value === "" ? null : parseInt(value, 10)
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddSkill}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm kỹ năng
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || skills.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
