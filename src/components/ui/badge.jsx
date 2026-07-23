import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[linear-gradient(135deg,#3b82f6,#60a5fa)] text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]",
        secondary:
          "border border-white/10 bg-[#232636] text-[#a0a5b8] shadow-[-3px_-3px_6px_rgba(255,255,255,0.04),3px_3px_8px_rgba(0,0,0,0.25)]",
        destructive:
          "border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.12)] text-[#ef4444]",
        outline: "border border-white/10 text-[#a0a5b8]",
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
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }