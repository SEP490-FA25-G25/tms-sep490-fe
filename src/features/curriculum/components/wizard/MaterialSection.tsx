import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Link as LinkIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadFileMutation } from "@/store/services/uploadApi";
import { useGetMaterialTypesQuery } from "@/store/services/enumApi";
import type { Material } from "@/types/course";

interface MaterialSectionProps {
    materials: Material[];
    onUpdate: (materials: Material[]) => void;
    scope: "COURSE" | "PHASE" | "SESSION";
    phaseId?: string;
    sessionId?: string;
    title?: string;
}

export function MaterialSection({ materials, onUpdate, scope, phaseId, sessionId, title }: MaterialSectionProps) {
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    const { data: materialTypes = [] } = useGetMaterialTypesQuery();

    const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
        name: "",
        type: "", // Default to empty to allow auto-detect
        url: "",
    });

    const MATERIAL_EXTENSIONS: Record<string, string[]> = {
        DOCUMENT: [
            'pdf', 'doc', 'docx', 'txt', 'rtf', // Text
            'xls', 'xlsx', 'csv', 'ods', // Spreadsheet
            'ppt', 'pptx', 'key', // Slide
            'java', 'js', 'ts', 'py', 'c', 'cpp', 'h', 'html', 'css', 'json', 'xml', 'sql' // Code
        ],
        MEDIA: [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', // Image
            'mp4', 'mov', 'avi', 'mkv', 'webm', // Video
            'mp3', 'wav', 'ogg', 'm4a' // Audio
        ],
        ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
        LINK: [],
        OTHER: []
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (e.g., 500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 500MB.");
            return;
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || "";
        let detectedType = "OTHER";

        // Auto-detect type
        for (const [type, exts] of Object.entries(MATERIAL_EXTENSIONS)) {
            if (exts.includes(extension)) {
                detectedType = type;
                break;
            }
        }

        // Validate if type is already selected and not empty
        if (newMaterial.type && newMaterial.type !== detectedType && newMaterial.type !== "OTHER" && detectedType !== "OTHER") {
            // If user explicitly selected a type, warn them if it doesn't match
            // But maybe we should just auto-switch? 
            // Requirement: "Validate đuôi của loại tài liệu đó với trường Loại"
            // So if I selected PDF, and upload .docx, it should fail.

            const allowedExts = MATERIAL_EXTENSIONS[newMaterial.type];
            if (allowedExts && allowedExts.length > 0 && !allowedExts.includes(extension)) {
                toast.error(`Loại tài liệu đang chọn là ${newMaterial.type} nhưng file tải lên có đuôi .${extension}. Vui lòng chọn đúng loại hoặc file.`);
                return;
            }
        }

        try {
            const response = await uploadFile(file).unwrap();
            setNewMaterial((prev) => ({
                ...prev,
                url: response.url,
                name: prev.name || file.name,
                type: prev.type || detectedType, // Auto-set type if empty
            }));
            toast.success("Upload file thành công!");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Upload file thất bại. Vui lòng thử lại.");
        }
    };

    const addMaterial = () => {
        if (!newMaterial.name || !newMaterial.url) {
            toast.error("Vui lòng nhập tên tài liệu và URL/File.");
            return;
        }

        const material: Material = {
            id: crypto.randomUUID(),
            name: newMaterial.name,
            type: newMaterial.type || "OTHER", // Default to OTHER if not detected/selected
            scope: scope,
            url: newMaterial.url,
            phaseId: phaseId,
            sessionId: sessionId,
        };

        onUpdate([...materials, material]);
        setNewMaterial({ name: "", type: "", url: "" });
    };

    const removeMaterial = (id: string) => {
        onUpdate(materials.filter((m) => m.id !== id));
    };

    return (
        <div className="space-y-4 border rounded-md p-4 bg-slate-50/50">
            {title && <h4 className="font-medium text-sm text-muted-foreground mb-2">{title}</h4>}

            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                    <label className="text-xs font-medium mb-1 block">Tên tài liệu <span className="text-destructive">*</span></label>
                    <Input
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        placeholder="VD: Slide bài giảng..."
                        className="h-9 bg-white"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block">Loại</label>
                    <Select
                        value={newMaterial.type}
                        onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value })}
                    >
                        <SelectTrigger className="h-9 bg-white w-full">
                            <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            {materialTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-5">
                    <label className="text-xs font-medium mb-1 block">URL / File <span className="text-destructive">*</span></label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                value={newMaterial.url}
                                onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                placeholder={newMaterial.type === 'LINK' ? "Nhập đường dẫn (https://...)" : "https://..."}
                                className="h-9 bg-white pr-8 flex-1"
                            />
                            {newMaterial.url && (
                                <a
                                    href={newMaterial.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        {newMaterial.type !== 'LINK' && (
                            <div className="relative">
                                <input
                                    type="file"
                                    id={`file-upload-${scope}-${phaseId || ''}-${sessionId || ''}`}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    accept={
                                        newMaterial.type && MATERIAL_EXTENSIONS[newMaterial.type]?.length > 0
                                            ? MATERIAL_EXTENSIONS[newMaterial.type].map(ext => `.${ext}`).join(',')
                                            : undefined
                                    }
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 bg-white"
                                    asChild
                                    disabled={isUploading}
                                >
                                    <label htmlFor={`file-upload-${scope}-${phaseId || ''}-${sessionId || ''}`} className="cursor-pointer">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </label>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-span-1">
                    <Button onClick={addMaterial} size="icon" className="h-9 w-9 shrink-0">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {materials.length > 0 && (
                <div className="rounded-md border bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="h-8">
                                <TableHead className="h-8 py-0 text-xs w-[40%]">Tên tài liệu</TableHead>
                                <TableHead className="h-8 py-0 text-xs w-[20%]">Loại</TableHead>
                                <TableHead className="h-8 py-0 text-xs w-[30%]">URL</TableHead>
                                <TableHead className="h-8 py-0 text-xs w-[10%] text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                                <TableRow key={material.id} className="h-9">
                                    <TableCell className="py-1 text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-muted-foreground" />
                                            {material.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-1 text-xs">
                                        <Badge variant="secondary" className="font-normal text-[10px] h-5 px-1.5">
                                            {material.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-1 text-xs">
                                        <a
                                            href={material.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate block max-w-[200px]"
                                        >
                                            {material.url}
                                        </a>
                                    </TableCell>
                                    <TableCell className="py-1 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeMaterial(material.id!)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
