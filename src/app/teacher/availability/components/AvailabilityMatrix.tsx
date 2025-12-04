import React from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AvailabilityDTO, type TeacherAvailabilityResponse } from "@/store/services/teacherAvailabilityApi";
import { type TimeSlot } from "@/store/services/resourceApi";

interface AvailabilityMatrixProps {
    timeSlots: TimeSlot[];
    availabilityData: TeacherAvailabilityResponse | undefined;
    onChange: (availabilities: AvailabilityDTO[]) => void;
    readOnly?: boolean;
}

const DAYS_OF_WEEK = [
    { id: 2, name: "Thứ 2" },
    { id: 3, name: "Thứ 3" },
    { id: 4, name: "Thứ 4" },
    { id: 5, name: "Thứ 5" },
    { id: 6, name: "Thứ 6" },
    { id: 7, name: "Thứ 7" },
    { id: 8, name: "Chủ Nhật" },
];

export const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
    timeSlots,
    availabilityData,
    onChange,
    readOnly = false,
}) => {
    const isAvailable = (dayId: number, slotId: number) => {
        return (availabilityData?.availabilities || []).some(
            (a) => a.dayOfWeek === dayId && a.timeSlotTemplateId === slotId
        );
    };

    const isLocked = (dayId: number, slotId: number) => {
        return (availabilityData?.lockedSlots || []).some(
            (l) => l.dayOfWeek === dayId && l.timeSlotId === slotId
        );
    };

    const handleToggle = (dayId: number, slotId: number) => {
        if (readOnly || isLocked(dayId, slotId)) return;

        const currentAvailabilities = availabilityData?.availabilities || [];
        const exists = currentAvailabilities.some(
            (a) => a.dayOfWeek === dayId && a.timeSlotTemplateId === slotId
        );

        let newAvailabilities;
        if (exists) {
            newAvailabilities = currentAvailabilities.filter(
                (a) => !(a.dayOfWeek === dayId && a.timeSlotTemplateId === slotId)
            );
        } else {
            newAvailabilities = [
                ...currentAvailabilities,
                { dayOfWeek: dayId, timeSlotTemplateId: slotId },
            ];
        }
        onChange(newAvailabilities);
    };

    const handleSelectRow = (slotId: number) => {
        if (readOnly) return;
        const currentAvailabilities = availabilityData?.availabilities || [];
        const allDaysSelected = DAYS_OF_WEEK.every((day) =>
            isLocked(day.id, slotId) || isAvailable(day.id, slotId)
        );

        let newAvailabilities = [...currentAvailabilities];

        if (allDaysSelected) {
            // Deselect all (except locked)
            newAvailabilities = newAvailabilities.filter(
                (a) => a.timeSlotTemplateId !== slotId
            );
        } else {
            // Select all (except locked)
            DAYS_OF_WEEK.forEach((day) => {
                if (!isLocked(day.id, slotId) && !isAvailable(day.id, slotId)) {
                    newAvailabilities.push({ dayOfWeek: day.id, timeSlotTemplateId: slotId });
                }
            });
        }
        onChange(newAvailabilities);
    };

    const handleSelectColumn = (dayId: number) => {
        if (readOnly) return;
        const currentAvailabilities = availabilityData?.availabilities || [];
        const allSlotsSelected = timeSlots.every((slot) =>
            isLocked(dayId, slot.id) || isAvailable(dayId, slot.id)
        );

        let newAvailabilities = [...currentAvailabilities];

        if (allSlotsSelected) {
            // Deselect all (except locked)
            newAvailabilities = newAvailabilities.filter(
                (a) => a.dayOfWeek !== dayId
            );
        } else {
            // Select all (except locked)
            timeSlots.forEach((slot) => {
                if (!isLocked(dayId, slot.id) && !isAvailable(dayId, slot.id)) {
                    newAvailabilities.push({ dayOfWeek: dayId, timeSlotTemplateId: slot.id });
                }
            });
        }
        onChange(newAvailabilities);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 border bg-gray-50 min-w-[150px]">Time Slot</th>
                        {DAYS_OF_WEEK.map((day) => (
                            <th
                                key={day.id}
                                className="p-2 border bg-gray-50 min-w-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSelectColumn(day.id)}
                                title="Click to select/deselect all day"
                            >
                                {day.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map((slot) => (
                        <tr key={slot.id}>
                            <td
                                className="p-2 border bg-gray-50 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSelectRow(slot.id)}
                                title="Click to select/deselect all week"
                            >
                                <div className="flex flex-col">
                                    <span>{slot.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {slot.startTime} - {slot.endTime}
                                    </span>
                                </div>
                            </td>
                            {DAYS_OF_WEEK.map((day) => {
                                const locked = isLocked(day.id, slot.id);
                                const available = isAvailable(day.id, slot.id);
                                return (
                                    <td key={day.id} className="p-1 border text-center">
                                        <button
                                            onClick={() => handleToggle(day.id, slot.id)}
                                            disabled={readOnly || locked}
                                            className={cn(
                                                "w-full h-12 rounded-md flex items-center justify-center transition-all duration-200",
                                                locked
                                                    ? "bg-gray-100 cursor-not-allowed opacity-70"
                                                    : available
                                                        ? "bg-green-100 hover:bg-green-200 border-2 border-green-500"
                                                        : "bg-white hover:bg-gray-50 border border-gray-200"
                                            )}
                                            title={
                                                locked
                                                    ? "Đang có lớp dạy (Locked)"
                                                    : available
                                                        ? "Đang chọn Rảnh"
                                                        : "Đang chọn Bận"
                                            }
                                        >
                                            {locked ? (
                                                <Lock className="w-4 h-4 text-gray-400" />
                                            ) : available ? (
                                                <Check className="w-5 h-5 text-green-600" />
                                            ) : null}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
