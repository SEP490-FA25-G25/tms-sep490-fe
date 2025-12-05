import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 border-slate-200 [a&]:hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        destructive:
          "border-transparent bg-rose-100 text-rose-700 border-rose-200 [a&]:hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-100 text-emerald-700 border-emerald-200 [a&]:hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        warning:
          "border-transparent bg-amber-100 text-amber-700 border-amber-200 [a&]:hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        info:
          "border-transparent bg-blue-100 text-blue-700 border-blue-200 [a&]:hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        purple:
          "border-transparent bg-purple-100 text-purple-700 border-purple-200 [a&]:hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/* eslint-disable react-refresh/only-export-components */
export { Badge, badgeVariants }
