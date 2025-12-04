import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
    Plus, 
    Trash2, 
    Upload, 
    Link as LinkIcon, 
    FileText, 
    Loader2,
    File,
    Image,
    Video,
    Music,
    Archive,
    ExternalLink,
    FolderOpen,
    ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useUploadFileMutation, useDeleteFileMutation, useDeleteMaterialMutation } from "@/store/services/uploadApi";
import type { Material } from "@/types/course";
import { cn } from "@/lib/utils";

interface MaterialSectionProps {
    materials: Material[];
    onUpdate: (materials: Material[]) => void;
    scope: "COURSE" | "PHASE" | "SESSION";
    phaseId?: string;
    sessionId?: string;
    title?: string;
    collapsible?: boolean;
    defaultOpen?: boolean;
}

type UploadMode = 'file' | 'link';

export function MaterialSection({ 
    materials, 
    onUpdate, 
    scope, 
    phaseId, 
    sessionId, 
    title,
    collapsible = false,
    defaultOpen = false
}: MaterialSectionProps) {
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    const [deleteFile] = useDeleteFileMutation();
    const [deleteMaterial] = useDeleteMaterialMutation();

    const [uploadMode, setUploadMode] = useState<UploadMode>('file');
    const [linkName, setLinkName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const MATERIAL_EXTENSIONS: Record<string, string[]> = {
        DOCUMENT: [
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            'xls', 'xlsx', 'csv', 'ods',
            'ppt', 'pptx', 'key',
            'java', 'js', 'ts', 'py', 'c', 'cpp', 'h', 'html', 'css', 'json', 'xml', 'sql'
        ],
        MEDIA: [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            'mp4', 'mov', 'avi', 'mkv', 'webm',
            'mp3', 'wav', 'ogg', 'm4a'
        ],
        ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
    };

    const getFileIcon = (type: string, fileName?: string) => {
        if (type === 'LINK') return <LinkIcon className="w-4 h-4" />;
        if (type === 'ARCHIVE') return <Archive className="w-4 h-4" />;
        if (type === 'MEDIA') {
            const ext = fileName?.split('.').pop()?.toLowerCase() || '';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                return <Image className="w-4 h-4" />;
            }
            if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
                return <Video className="w-4 h-4" />;
            }
            if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
                return <Music className="w-4 h-4" />;
            }
        }
        return <FileText className="w-4 h-4" />;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'MEDIA': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'ARCHIVE': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'LINK': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const detectFileType = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase() || "";
        for (const [type, exts] of Object.entries(MATERIAL_EXTENSIONS)) {
            if (exts.includes(extension)) {
                return type;
            }
        }
        return "OTHER";
    };

    const handleFileUpload = async (file: File) => {
        if (file.size > 500 * 1024 * 1024) {
            toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 500MB.");
            return;
        }

        const detectedType = detectFileType(file.name);

        try {
            const response = await uploadFile(file).unwrap();
            
            const material: Material = {
                id: crypto.randomUUID(),
                name: file.name,
                type: detectedType,
                scope: scope,
                url: response.url,
                phaseId: phaseId,
                sessionId: sessionId,
            };
            onUpdate([...materials, material]);
            toast.success("Thêm tài liệu thành công!");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Upload file thất bại. Vui lòng thử lại.");
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleFileUpload(file);
        }
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files?.[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const addLink = () => {
        if (!linkName.trim()) {
            toast.error("Vui lòng nhập tên tài liệu.");
            return;
        }
        if (!linkUrl.trim()) {
            toast.error("Vui lòng nhập đường dẫn URL.");
            return;
        }
        
        // Validate URL format
        try {
            new URL(linkUrl);
        } catch {
            toast.error("Đường dẫn URL không hợp lệ.");
            return;
        }

        const material: Material = {
            id: crypto.randomUUID(),
            name: linkName.trim(),
            type: "LINK",
            scope: scope,
            url: linkUrl.trim(),
            phaseId: phaseId,
            sessionId: sessionId,
        };

        onUpdate([...materials, material]);
        setLinkName("");
        setLinkUrl("");
        toast.success("Thêm liên kết thành công!");
    };

    const handleDeleteClick = (material: Material) => {
        setMaterialToDelete(material);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!materialToDelete) return;

        setIsDeleting(true);
        try {
            const isInDatabase = materialToDelete.id && !isNaN(Number(materialToDelete.id));

            if (isInDatabase) {
                await deleteMaterial(Number(materialToDelete.id)).unwrap();
                toast.success("Đã xóa tài liệu!");
            } else {
                if (materialToDelete.type !== 'LINK' && materialToDelete.url?.includes('.s3.')) {
                    await deleteFile(materialToDelete.url).unwrap();
                    toast.success("Đã xóa file!");
                }
            }
            
            onUpdate(materials.filter((m) => m.id !== materialToDelete.id));
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Xóa tài liệu thất bại. Vui lòng thử lại.");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setMaterialToDelete(null);
        }
    };

    const [isOpen, setIsOpen] = useState(defaultOpen);

    const renderContent = () => (
        <>
            {/* Upload Area */}
            <div className="border rounded-lg bg-card overflow-hidden">
                {/* Tab Switcher */}
                <div className="flex border-b bg-muted/30">
                    <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            uploadMode === 'file' 
                                ? "bg-background text-foreground border-b-2 border-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Upload className="w-4 h-4" />
                        Tải lên file
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            uploadMode === 'link' 
                                ? "bg-background text-foreground border-b-2 border-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <LinkIcon className="w-4 h-4" />
                        Thêm liên kết
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {uploadMode === 'file' ? (
                        /* File Upload Area */
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center transition-all",
                                isDragging 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                                isUploading && "opacity-50 pointer-events-none"
                            )}
                        >
                            <input
                                type="file"
                                id={`file-upload-${scope}-${phaseId || ''}-${sessionId || ''}`}
                                className="hidden"
                                onChange={handleFileInputChange}
                                disabled={isUploading}
                            />
                            
                            <div className="flex flex-col items-center gap-3">
                                {isUploading ? (
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                )}
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        {isUploading ? "Đang tải lên..." : "Kéo thả file vào đây"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        hoặc
                                    </p>
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    disabled={isUploading}
                                    className="cursor-pointer"
                                >
                                    <label htmlFor={`file-upload-${scope}-${phaseId || ''}-${sessionId || ''}`}>
                                        <File className="w-4 h-4 mr-2" />
                                        Chọn file từ máy tính
                                    </label>
                                </Button>
                                
                                <p className="text-xs text-muted-foreground mt-2">
                                    Hỗ trợ: PDF, Word, Excel, PowerPoint, Hình ảnh, Video, Audio, ZIP... (Tối đa 500MB)
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Link Input Area */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tên tài liệu <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={linkName}
                                    onChange={(e) => setLinkName(e.target.value)}
                                    placeholder="VD: Tài liệu tham khảo, Video hướng dẫn..."
                                    className="bg-background"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Đường dẫn URL <span className="text-destructive">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="bg-background pr-10"
                                        />
                                        {linkUrl && (
                                            <a
                                                href={linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <Button onClick={addLink} className="shrink-0">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Materials List */}
            {materials.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Danh sách tài liệu ({materials.length})
                    </p>
                    <div className="space-y-2">
                        {materials.map((material) => (
                            <div
                                key={material.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                    getTypeColor(material.type)
                                )}>
                                    {getFileIcon(material.type, material.name)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{material.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-normal", getTypeColor(material.type))}>
                                            {material.type}
                                        </Badge>
                                        <a
                                            href={material.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary truncate max-w-[200px] flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{material.type === 'LINK' ? material.url : 'Xem file'}</span>
                                        </a>
                                    </div>
                                </div>
                                
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => handleDeleteClick(material)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting && materialToDelete?.id === material.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {materials.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có tài liệu nào</p>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tài liệu <strong>"{materialToDelete?.name}"</strong>?
                            {materialToDelete?.type !== 'LINK' && materialToDelete?.url?.includes('.s3.') && (
                                <span className="block mt-2 text-destructive font-medium">
                                    ⚠️ File sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xóa"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );

    // If collapsible mode, wrap in Collapsible component
    if (collapsible && title) {
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-2 w-full p-3 rounded-lg border bg-white hover:bg-muted/50 transition-colors group"
                    >
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{title}</span>
                        <Badge variant="outline" className="ml-1 bg-slate-50">
                            {materials.length} tài liệu
                        </Badge>
                        <ChevronDown className={cn(
                            "w-4 h-4 ml-auto text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                    {renderContent()}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    // Non-collapsible mode (original behavior)
    return (
        <div className="space-y-4">
            {title && (
                <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    {title}
                </h4>
            )}
            {renderContent()}
        </div>
    );
}
