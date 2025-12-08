import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useUpdateLevelSortOrderMutation } from "@/store/services/curriculumApi";

interface Level {
    id: number;
    code: string;
    name: string;
    sortOrder: number;
}

interface SortLevelsDialogProps {
    subjectId: number;
    levels: Level[];
    onSuccess?: () => void;
}

function SortableItem({ id, code, name }: { id: number; code: string; name: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 mb-2 bg-card border rounded-md ${isDragging ? "shadow-lg ring-2 ring-primary" : ""
                }`}
        >
            <div className="flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab hover:text-primary active:cursor-grabbing"
                >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <span className="font-semibold mr-2">{code}</span>
                    <span className="text-muted-foreground">{name}</span>
                </div>
            </div>
        </div>
    );
}

export function SortLevelsDialog({ subjectId, levels, onSuccess }: SortLevelsDialogProps) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Level[]>([]);
    const [updateSortOrder, { isLoading }] = useUpdateLevelSortOrderMutation();

    useEffect(() => {
        if (open) {
            // Sort by current sortOrder initially
            const sortedLevels = [...levels].sort((a, b) => a.sortOrder - b.sortOrder);
            setItems(sortedLevels);
        }
    }, [open, levels]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        try {
            const levelIds = items.map((item) => item.id);
            await updateSortOrder({ subjectId, levelIds }).unwrap();
            toast.success("Cập nhật thứ tự thành công");
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Failed to update sort order:", error);
            toast.error("Cập nhật thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sắp xếp cấp độ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Sắp xếp thứ tự cấp độ</DialogTitle>
                    <DialogDescription>
                        Kéo và thả các cấp độ để thay đổi thứ tự hiển thị.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((level) => (
                                <SortableItem
                                    key={level.id}
                                    id={level.id}
                                    code={level.code}
                                    name={level.name}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
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
