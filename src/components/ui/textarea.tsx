import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[5px] border border-border bg-transparent px-3 py-2.5 text-sm transition-colors duration-200 outline-none placeholder:text-muted-foreground/60 focus-visible:border-[#333333] focus-visible:ring-1 focus-visible:ring-[#333333]/50 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
