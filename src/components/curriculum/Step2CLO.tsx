import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import type { CourseData, CLO } from "@/types/course";
import { useGetSubjectQuery } from "@/store/services/curriculumApi";

interface Step2Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

// Validation constants
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 500;

// Validation function for Step2 - exported for use in CourseWizard
// eslint-disable-next-line react-refresh/only-export-components
export function validateStep2(data: CourseData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if there are any CLOs
    if (!data.clos || data.clos.length === 0) {
        errors.push("Cần có ít nhất 1 CLO.");
    } else {
        // Check for duplicate descriptions
        const descriptions = data.clos.map(clo => clo.description?.trim().toLowerCase());
        const duplicates = descriptions.filter((desc, index) =>
            desc && descriptions.indexOf(desc) !== index
        );
        if (duplicates.length > 0) {
            errors.push("Nội dung mô tả CLO không được trùng nhau.");
        }

        // Validate each CLO
        data.clos.forEach((clo) => {
            // Check description
            if (!clo.description || clo.description.trim() === "") {
                errors.push(`${clo.code}: Mô tả không được để trống.`);
            } else if (clo.description.trim().length < MIN_DESCRIPTION_LENGTH) {
                errors.push(`${clo.code}: Mô tả phải có ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự.`);
            } else if (clo.description.trim().length > MAX_DESCRIPTION_LENGTH) {
                errors.push(`${clo.code}: Mô tả không được vượt quá ${MAX_DESCRIPTION_LENGTH} ký tự.`);
            }

            // Check PLO mapping - required
            if (!clo.mappedPLOs || clo.mappedPLOs.length === 0) {
                errors.push(`${clo.code}: Cần map với ít nhất 1 PLO.`);
            }
        });
    }

    return { isValid: errors.length === 0, errors };
}

export function Step2CLO({ data, setData }: Step2Props) {
    const [selectedCloIndex, setSelectedCloIndex] = useState<number | null>(null);
    const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
    const [descriptionErrors, setDescriptionErrors] = useState<Record<number, string | null>>({});

    // Fetch Subject Details to get PLOs
    const subjectId = data.basicInfo.subjectId ? parseInt(data.basicInfo.subjectId) : undefined;
    const { data: subjectResponse, isLoading: isLoadingSubject } = useGetSubjectQuery(subjectId!, {
        skip: !subjectId
    });

    // Get PLOs and sort them by code
    const plos = useMemo(() => {
        const ploList = subjectResponse?.data?.plos?.map(plo => ({
            id: plo.code, // Use code as ID since backend doesn't provide ID
            code: plo.code,
            description: plo.description
        })) || [];

        // Sort PLOs by code (e.g., PLO1, PLO2, PLO10 should be in correct order)
        return ploList.sort((a, b) => {
            const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    }, [subjectResponse]);

    // Validate description
    const validateDescription = useCallback((value: string, currentIndex: number): string | null => {
        if (!value || value.trim() === "") {
            return "Mô tả CLO không được để trống";
        }
        if (value.trim().length < MIN_DESCRIPTION_LENGTH) {
            return `Mô tả phải có ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự`;
        }
        if (value.trim().length > MAX_DESCRIPTION_LENGTH) {
            return `Mô tả không được vượt quá ${MAX_DESCRIPTION_LENGTH} ký tự`;
        }
        // Check for duplicate description
        const isDuplicate = data.clos?.some((clo, index) =>
            index !== currentIndex &&
            clo.description?.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (isDuplicate) {
            return "Nội dung mô tả này đã tồn tại ở CLO khác";
        }
        return null;
    }, [data.clos]);

    const addClo = () => {
        const nextIndex = (data.clos?.length || 0) + 1;
        const newClo: CLO = {
            id: crypto.randomUUID(),
            code: `CLO${nextIndex}`,
            description: "",
            mappedPLOs: [],
        };
        setData((prev) => ({
            ...prev,
            clos: [...(prev.clos || []), newClo],
        }));
    };

    const updateClo = (index: number, field: keyof CLO, value: string | string[]) => {
        const newClos = [...(data.clos || [])];
        newClos[index] = { ...newClos[index], [field]: value };
        setData((prev) => ({ ...prev, clos: newClos }));

        // Validate description on change
        if (field === "description") {
            const error = validateDescription(value as string, index);
            setDescriptionErrors(prev => ({ ...prev, [index]: error }));
        }
    };

    const togglePloMapping = (cloIndex: number, ploId: string) => {
        const currentPloIds = data.clos[cloIndex].mappedPLOs || [];
        // Ensure uniqueness using Set
        const uniqueCurrentPloIds = [...new Set(currentPloIds)];
        const newPloIds = uniqueCurrentPloIds.includes(ploId)
            ? uniqueCurrentPloIds.filter((id) => id !== ploId)
            : [...uniqueCurrentPloIds, ploId];

        updateClo(cloIndex, "mappedPLOs", newPloIds);
    };

    const removeClo = (index: number) => {
        setPendingRemoveIndex(index);
    };

    const handleConfirmRemove = () => {
        if (pendingRemoveIndex === null) return;

        // Remove the CLO
        const newClos = data.clos.filter((_, i) => i !== pendingRemoveIndex);

        // Reindex CLO codes after removal
        const reindexedClos = newClos.map((clo, index) => ({
            ...clo,
            code: `CLO${index + 1}`
        }));

        setData((prev) => ({ ...prev, clos: reindexedClos }));

        // Clear description errors and reindex them
        const newErrors: Record<number, string | null> = {};
        Object.keys(descriptionErrors).forEach(key => {
            const oldIndex = parseInt(key);
            if (oldIndex < pendingRemoveIndex) {
                newErrors[oldIndex] = descriptionErrors[oldIndex];
            } else if (oldIndex > pendingRemoveIndex) {
                newErrors[oldIndex - 1] = descriptionErrors[oldIndex];
            }
        });
        setDescriptionErrors(newErrors);

        if (selectedCloIndex === pendingRemoveIndex) {
            setSelectedCloIndex(null);
        } else if (selectedCloIndex !== null && selectedCloIndex > pendingRemoveIndex) {
            setSelectedCloIndex(selectedCloIndex - 1);
        }

        setPendingRemoveIndex(null);
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left: CLO List */}
            <div className="col-span-7 space-y-4 border-r pr-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Chuẩn đầu ra khóa học (CLO)</h3>
                    <Button size="sm" onClick={addClo}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm CLO
                    </Button>
                </div>

                <div className="space-y-3">
                    {data.clos?.map((clo, index) => (
                        <div
                            key={clo.id || index}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCloIndex === index
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "hover:border-primary/50"
                                } `}
                            onClick={() => setSelectedCloIndex(index)}
                        >
                            <div className="flex gap-3 items-start">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2 items-start">
                                        {/* CLO Code - Auto generated, disabled */}
                                        <div className="w-20 h-10 flex items-center justify-center bg-muted rounded-md font-bold text-sm shrink-0">
                                            {clo.code}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Textarea
                                                value={clo.description}
                                                onChange={(e) => updateClo(index, "description", e.target.value)}
                                                onBlur={() => {
                                                    const error = validateDescription(clo.description, index);
                                                    setDescriptionErrors(prev => ({ ...prev, [index]: error }));
                                                }}
                                                placeholder="Nhập mô tả chuẩn đầu ra (ít nhất 10 ký tự)..."
                                                className={`min-h-10 resize-none ${descriptionErrors[index] ? 'border-destructive' : ''}`}
                                                rows={2}
                                            />
                                            {descriptionErrors[index] && (
                                                <p className="text-xs text-destructive">{descriptionErrors[index]}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Use Set to ensure unique PLO display */}
                                        {[...new Set(clo.mappedPLOs || [])].map((ploId) => (
                                            <span key={ploId} className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                                {ploId}
                                            </span>
                                        ))}
                                        {(!clo.mappedPLOs || clo.mappedPLOs.length === 0) && (
                                            <span className="text-xs text-destructive italic">Chưa map PLO</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeClo(index);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(!data.clos || data.clos.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            Chưa có CLO nào. Nhấn "Thêm CLO" để bắt đầu.
                        </div>
                    )}
                </div>
            </div>

            {/* Right: PLO Mapping */}
            <div className="col-span-5 space-y-4">
                <h3 className="text-lg font-medium">Map với PLO</h3>
                {selectedCloIndex !== null && data.clos?.[selectedCloIndex] ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                            Chọn các Chuẩn đầu ra chương trình (PLO) được đáp ứng bởi{" "}
                            <span className="font-bold text-foreground">
                                {data.clos[selectedCloIndex].code}
                            </span>
                        </p>

                        {isLoadingSubject ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start space-x-3 p-3 rounded-md border">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : plos.length > 0 ? (
                            plos.map((plo) => (
                                <div
                                    key={plo.id}
                                    className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50"
                                >
                                    <Checkbox
                                        id={plo.id}
                                        checked={data.clos[selectedCloIndex].mappedPLOs?.includes(plo.id)}
                                        onCheckedChange={() => togglePloMapping(selectedCloIndex, plo.id)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor={plo.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {plo.code}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {plo.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-lg">
                                Không tìm thấy PLO nào cho môn học này.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-lg">
                        Chọn một CLO bên trái để map PLO.
                    </div>
                )}
            </div>
            <AlertDialog open={pendingRemoveIndex !== null} onOpenChange={(open) => !open && setPendingRemoveIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa CLO</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa CLO này? Hành động không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRemove}>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
