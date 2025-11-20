import * as React from "react"
import { cn } from "@/lib/utils"

const Stepper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full items-center justify-between",
      className
    )}
    {...props}
  />
))
Stepper.displayName = "Stepper"

export { Stepper }