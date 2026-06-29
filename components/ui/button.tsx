import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm",
        outline:     "border border-[#D9D9D9] bg-white text-[#111827] hover:bg-[#F9FAFB]",
        secondary:   "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]",
        ghost:       "text-[#374151] hover:bg-[#F3F4F6]",
        link:        "text-[#2563EB] underline-offset-4 hover:underline",
        success:     "bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm",
        warning:     "bg-[#D97706] text-white hover:bg-[#B45309] shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-11 rounded-lg px-6 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
