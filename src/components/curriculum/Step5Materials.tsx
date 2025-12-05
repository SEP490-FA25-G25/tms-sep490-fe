
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import type { CourseData, Material } from "@/types/course";
import { useUploadFileMutation } from "@/store/services/uploadApi";
import { toast } from "sonner";
import { useState } from "react";

interface Step5Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

export function Step5Materials({ data, setData }: Step5Props) {
    const addMaterial = () => {
        const newMaterial: Material = {
            id: crypto.randomUUID(),
            name: "",
            type: "PDF",
            url: "",
            scope: "COURSE",
        };
        setData((prev) => ({
            ...prev,
            materials: [...(prev.materials || []), newMaterial],
        }));
    };

    const updateMaterial = (index: number, field: keyof Material, value: string) => {
        const newMaterials = [...(data.materials || [])];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setData((prev) => ({ ...prev, materials: newMaterials }));
    };

    const removeMaterial = (index: number) => {
        const newMaterials = data.materials.filter((_, i) => i !== index);
        setData((prev) => ({ ...prev, materials: newMaterials }));
    };

    const [uploadFile] = useUploadFileMutation();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (index: number, file: File) => {
        setIsUploading(true);
        try {
            const response = await uploadFile(file).unwrap();
            if (response && response.url) {
                updateMaterial(index, "url", response.url);
                toast.success("Upload thành công", {
                    description: "File đã được tải lên thành công.",
                });
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Upload thất bại", {
                description: "Có lỗi xảy ra khi tải file. Vui lòng thử lại.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Tài liệu khóa học</h3>
                <Button size="sm" onClick={addMaterial}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Tài liệu
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.materials?.map((material, index) => (
                    <div key={material.id || index} className="border rounded-lg p-4 space-y-4 relative group">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => removeMaterial(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* Removed the FileText icon and its container */}
                        {/* The material name input is now part of a grid */}

                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8 space-y-2">
                                    <Label>Tên tài liệu <span className="text-rose-500">*</span></Label>
                                    <Input
                                        value={material.name}
                                        onChange={(e) => updateMaterial(index, "name", e.target.value)}
                                        placeholder="VD: Giáo trình chính, Slide bài giảng..."
                                    />
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <Label>Loại</Label>
                                    <Select
                                        value={material.type}
                                        onValueChange={(val) => updateMaterial(index, "type", val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100]">
                                            <SelectItem value="DOCUMENT">Tài liệu / Giáo trình</SelectItem>
                                            <SelectItem value="SLIDE">Slide bài giảng</SelectItem>
                                            <SelectItem value="VIDEO">Video</SelectItem>
                                            <SelectItem value="PDF">PDF</SelectItem>
                                            <SelectItem value="AUDIO">Audio</SelectItem>
                                            <SelectItem value="OTHER">Khác (Website, Link...)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>URL / Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={material.url}
                                        onChange={(e) => updateMaterial(index, "url", e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id={`file-upload-${index}`}
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(index, file);
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-md space-y-4">
                                <div className="space-y-2">
                                    <Label>Phạm vi áp dụng</Label>
                                    <RadioGroup
                                        value={material.scope === "PHASE" ? "PHASE" : "COURSE"}
                                        onValueChange={(val) => {
                                            updateMaterial(index, "scope", val);
                                            if (val === "COURSE") {
                                                updateMaterial(index, "phaseId", "");
                                                updateMaterial(index, "sessionId", "");
                                            } else if (val === "PHASE") {
                                                updateMaterial(index, "sessionId", "");
                                            }
                                        }}
                                        className="flex flex-col sm:flex-row gap-6 relative z-20"
                                    >
                                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => updateMaterial(index, "scope", "COURSE")}>
                                            <RadioGroupItem value="COURSE" id={`scope-course-${index}`} className="cursor-pointer" />
                                            <Label htmlFor={`scope-course-${index}`} className="font-normal cursor-pointer text-base">Toàn khóa học</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => updateMaterial(index, "scope", "PHASE")}>
                                            <RadioGroupItem value="PHASE" id={`scope-phase-${index}`} className="cursor-pointer" />
                                            <Label htmlFor={`scope-phase-${index}`} className="font-normal cursor-pointer text-base">Giai đoạn cụ thể</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {material.scope === "PHASE" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Chọn Giai đoạn <span className="text-rose-500">*</span></Label>
                                            <Select
                                                value={material.phaseId?.toString()}
                                                onValueChange={(val) => {
                                                    updateMaterial(index, "phaseId", val);
                                                    updateMaterial(index, "sessionId", "");
                                                }}
                                            >
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue placeholder="Chọn giai đoạn" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[100]">
                                                    {data.structure?.map((phase) => (
                                                        <SelectItem key={phase.id} value={phase.id.toString()}>
                                                            {phase.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {(!data.materials || data.materials.length === 0) && (
                    <div className="col-span-2 text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        No materials added.
                    </div>
                )}
            </div>
        </div>
    );
}
