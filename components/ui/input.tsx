import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#111827]",
        "placeholder:text-[#9CA3AF]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB]",
        "disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]",
        "transition-all",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
