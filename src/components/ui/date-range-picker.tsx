"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePreset {
  label: string
  getValue: () => DateRange
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const presets: DateRangePreset[] = [
  {
    label: "Hôm nay",
    getValue: () => {
      const today = new Date()
      return { from: today, to: today }
    }
  },
  {
    label: "7 ngày qua",
    getValue: () => {
      const today = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(today.getDate() - 7)
      return { from: sevenDaysAgo, to: today }
    }
  },
  {
    label: "30 ngày qua",
    getValue: () => {
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      return { from: thirtyDaysAgo, to: today }
    }
  },
  {
    label: "Tháng này",
    getValue: () => {
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: firstDayOfMonth, to: today }
    }
  },
  {
    label: "Quý này",
    getValue: () => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3
      const firstDayOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
      return { from: firstDayOfQuarter, to: today }
    }
  },
  {
    label: "Tùy chỉnh",
    getValue: () => {
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      return { from: thirtyDaysAgo, to: today }
    }
  }
]

function DateRangePicker({
  value,
  onChange,
  placeholder = "Chọn khoảng thời gian",
  className,
  disabled = false
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(value)
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>()

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = preset.getValue()
    setSelectedRange(range)
    setSelectedPreset(preset.label)
    onChange?.(range)

    // Close popover for all presets except "Tùy chỉnh"
    if (preset.label !== "Tùy chỉnh") {
      setOpen(false)
    }
  }

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      const newRange = { from: range.from, to: range.to }
      setSelectedRange(newRange)
      setSelectedPreset("Tùy chỉnh")
      onChange?.(newRange)
      setOpen(false) // Close popover when range is selected
    }
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder
    if (!range.to) return format(range.from, "dd/MM/yyyy", { locale: vi })

    const sameMonth = range.from.getMonth() === range.to.getMonth() &&
                      range.from.getFullYear() === range.to.getFullYear()

    if (sameMonth) {
      return `${format(range.from, "dd", { locale: vi })} - ${format(range.to, "dd/MM/yyyy", { locale: vi })}`
    }

    return `${format(range.from, "dd/MM/yyyy", { locale: vi })} - ${format(range.to, "dd/MM/yyyy", { locale: vi })}`
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedRange && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(selectedRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-3 p-3">
            {/* Preset Options */}
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={selectedPreset === preset.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs h-7"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar */}
            {selectedPreset === "Tùy chỉnh" && (
              <div className="border-t pt-3">
                <Calendar
                  mode="range"
                  defaultMonth={selectedRange?.from}
                  selected={{
                    from: selectedRange?.from,
                    to: selectedRange?.to,
                  }}
                  onSelect={handleCalendarSelect}
                  locale={vi}
                  numberOfMonths={2}
                  className="rounded-md border"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DateRangePicker }
export type { DateRange }