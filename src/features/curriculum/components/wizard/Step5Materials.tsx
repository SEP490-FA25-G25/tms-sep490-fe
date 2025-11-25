
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
import { Plus, Trash2 } from "lucide-react";

interface Material {
    id: string;
    name?: string;
    title?: string;
    type: string;
    url: string;
    scope?: string;
}

interface CourseData {
    basicInfo: unknown;
    clos: unknown[];
    structure: unknown[];
    assessments: unknown[];
    materials: Material[];
}

interface Step5MaterialsProps {
    data: CourseData;
    setData: (data: CourseData | ((prev: CourseData) => CourseData)) => void;
}

export function Step5Materials({ data, setData }: Step5MaterialsProps) {
    const addMaterial = () => {
        const newMaterial = {
            id: crypto.randomUUID(),
            name: "",
            type: "PDF",
            url: "",
            scope: "COURSE",
        };
        setData((prev: CourseData) => ({
            ...prev,
            materials: [...(prev.materials || []), newMaterial],
        }));
    };

    const updateMaterial = (index: number, field: string, value: string) => {
        const newMaterials = [...(data.materials || [])];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setData((prev: CourseData) => ({ ...prev, materials: newMaterials }));
    };

    const removeMaterial = (index: number) => {
        const newMaterials = data.materials.filter((_: any, i: number) => i !== index);
        setData((prev: CourseData) => ({ ...prev, materials: newMaterials }));
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
                {data.materials?.map((material: any, index: number) => (
                    <div key={material.id} className="border rounded-lg p-4 space-y-4 relative group">
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

                        <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-4 space-y-2">
                                <Label>Tên tài liệu</Label>
                                <Input
                                    value={material.name}
                                    onChange={(e) => updateMaterial(index, "name", e.target.value)}
                                    placeholder="VD: Giáo trình chính, Slide bài giảng..."
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label>Loại</Label>
                                <Select
                                    value={material.type}
                                    onValueChange={(val) => updateMaterial(index, "type", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DOCUMENT">Tài liệu / Giáo trình</SelectItem>
                                        <SelectItem value="SLIDE">Slide bài giảng</SelectItem>
                                        <SelectItem value="VIDEO">Video</SelectItem>
                                        <SelectItem value="PDF">PDF</SelectItem>
                                        <SelectItem value="AUDIO">Audio</SelectItem>
                                        <SelectItem value="OTHER">Khác (Website, Link...)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-5 space-y-2">
                                <Label>Phạm vi</Label>
                                <Select
                                    value={material.scope}
                                    onValueChange={(val) => updateMaterial(index, "scope", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COURSE">Toàn khóa học</SelectItem>
                                        <SelectItem value="PHASE">Giai đoạn cụ thể</SelectItem>
                                        <SelectItem value="SESSION">Buổi học cụ thể</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="col-span-4 space-y-2">
                            <Label>URL / Link</Label>
                            <Input
                                value={material.url}
                                onChange={(e) => updateMaterial(index, "url", e.target.value)}
                                placeholder="https://..."
                            />
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
