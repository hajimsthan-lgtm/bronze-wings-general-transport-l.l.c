import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "relative overflow-hidden text-primary-foreground shadow-[0_4px_14px_-4px_rgba(var(--panel-accent-rgb),0.55)] hover:shadow-[0_8px_24px_-6px_rgba(var(--panel-accent-rgb),0.7)] hover:-translate-y-0.5 " +
          "bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] hover:brightness-110",
        destructive:
          "relative overflow-hidden text-destructive-foreground shadow-[0_4px_14px_-4px_hsl(var(--destructive)/0.55)] hover:shadow-[0_8px_24px_-6px_hsl(var(--destructive)/0.7)] hover:-translate-y-0.5 " +
          "bg-[linear-gradient(135deg,hsl(var(--destructive))_0%,hsl(var(--destructive)/0.85)_100%)] hover:brightness-110",
        outline:
          "border border-border/70 bg-card/40 backdrop-blur-sm text-foreground shadow-sm hover:bg-card/70 hover:border-[rgb(var(--panel-accent-rgb))]/45 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-6px_rgba(var(--panel-accent-rgb),0.35)]",
        secondary:
          "border border-border/60 bg-secondary/60 backdrop-blur-sm text-secondary-foreground shadow-sm hover:bg-secondary hover:border-[rgb(var(--panel-accent-rgb))]/30 hover:-translate-y-0.5",
        ghost: "text-foreground/80 hover:bg-white/[0.06] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
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