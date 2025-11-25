
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const MOCK_PLOS = [
    { id: "PLO1", code: "PLO1", description: "Thể hiện kỹ năng giao tiếp cơ bản" },
    { id: "PLO2", code: "PLO2", description: "Áp dụng đúng các quy tắc ngữ pháp" },
    { id: "PLO3", code: "PLO3", description: "Hiểu bối cảnh văn hóa" },
];

interface CLO {
    id: string;
    code: string;
    description: string;
    ploIds: string[];
    category?: 'KIEN_THUC' | 'KY_NANG';
    level?: 'NHAP_MON' | 'CO_BAN' | 'TRUNG_BINH' | 'NANG_CAO';
}

interface CourseData {
    basicInfo: unknown;
    clos: CLO[];
    structure: unknown[];
    assessments: unknown[];
    materials: unknown[];
}

interface Step2CLOProps {
    data: CourseData;
    setData: (data: CourseData | ((prev: CourseData) => CourseData)) => void;
}

export function Step2CLO({ data, setData }: Step2CLOProps) {
    const [selectedCloIndex, setSelectedCloIndex] = useState<number | null>(null);

    const addClo = () => {
        const newClo = {
            id: crypto.randomUUID(),
            code: `CLO${(data.clos?.length || 0) + 1} `,
            description: "",
            ploIds: [],
        };
        setData((prev: CourseData) => ({
            ...prev,
            clos: [...(prev.clos || []), newClo],
        }));
        setSelectedCloIndex((data.clos?.length || 0));
    };

    const updateClo = (index: number, field: keyof CLO, value: string | string[]) => {
        const newClos = [...(data.clos || [])];
        newClos[index] = { ...newClos[index], [field]: value };
        setData((prev: CourseData) => ({ ...prev, clos: newClos }));
    };

    const togglePloMapping = (cloIndex: number, ploId: string) => {
        const currentPloIds = data.clos[cloIndex].ploIds || [];
        const newPloIds = currentPloIds.includes(ploId)
            ? currentPloIds.filter((id: string) => id !== ploId)
            : [...currentPloIds, ploId];

        updateClo(cloIndex, "ploIds", newPloIds);
    };

    const removeClo = (index: number) => {
        const newClos = data.clos.filter((_: any, i: number) => i !== index);
        setData((prev: any) => ({ ...prev, clos: newClos }));
        if (selectedCloIndex === index) setSelectedCloIndex(null);
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
                    {data.clos?.map((clo: any, index: number) => (
                        <div
                            key={clo.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCloIndex === index
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "hover:border-primary/50"
                                }`}
                            onClick={() => setSelectedCloIndex(index)}
                        >
                            <div className="flex gap-3 items-start">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            value={clo.code}
                                            onChange={(e) => updateClo(index, "code", e.target.value)}
                                            className="w-24 font-bold"
                                        />
                                        <Input
                                            value={clo.description}
                                            onChange={(e) => updateClo(index, "description", e.target.value)}
                                            placeholder="Nhập mô tả chuẩn đầu ra..."
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {clo.ploIds?.map((ploId: string) => (
                                            <span key={ploId} className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                                {ploId}
                                            </span>
                                        ))}
                                        {(!clo.ploIds || clo.ploIds.length === 0) && (
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
                        {MOCK_PLOS.map((plo) => (
                            <div
                                key={plo.id}
                                className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50"
                            >
                                <Checkbox
                                    id={plo.id}
                                    checked={data.clos[selectedCloIndex].ploIds?.includes(plo.id)}
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
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-lg">
                        Chọn một CLO bên trái để map PLO.
                    </div>
                )}
            </div>
        </div>
    );
}
