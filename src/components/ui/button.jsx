import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,#3b82f6,#60a5fa)] text-white shadow-[0_4px_16px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-300",
        destructive:
          "bg-destructive text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:brightness-110 transition-all duration-300",
        outline:
          "border border-white/10 bg-[#232636] text-[#a0a5b8] shadow-[-4px_-4px_8px_rgba(255,255,255,0.05),4px_4px_12px_rgba(0,0,0,0.3)] hover:text-white hover:border-white/15 hover:shadow-[-6px_-6px_12px_rgba(255,255,255,0.06),6px_6px_16px_rgba(0,0,0,0.4)] transition-all duration-300",
        secondary:
          "border border-white/10 bg-[#232636] text-[#a0a5b8] shadow-[-4px_-4px_8px_rgba(255,255,255,0.05),4px_4px_12px_rgba(0,0,0,0.3)] hover:text-white hover:border-white/15 transition-all duration-300",
        ghost: "text-[#a0a5b8] hover:text-white hover:bg-white/5 transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }