"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const toastManager = ToastPrimitive.createToastManager()

type ToastType = "success" | "error" | "loading" | "default"

const toastIcons: Record<ToastType, React.ElementType> = {
  success: CheckIcon,
  error: TriangleAlertIcon,
  loading: Loader2Icon,
  default: InfoIcon,
}

const toastIconStyles: Record<ToastType, string> = {
  success: "bg-success/10 text-success ring-success/25",
  error: "bg-destructive/10 text-destructive ring-destructive/30",
  loading: "bg-muted text-muted-foreground ring-border",
  default: "bg-muted text-foreground ring-border",
}

function resolveType(type: string | undefined): ToastType {
  return type === "success" || type === "error" || type === "loading"
    ? type
    : "default"
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => {
    const type = resolveType(toast.type)
    const Icon = toastIcons[type]

    return (
      <ToastPrimitive.Root
        key={toast.id}
        toast={toast}
        data-slot="toast"
        swipeDirection={["up", "right"]}
        className="toast-root flex w-full items-start gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg shadow-black/20 select-none"
      >
        <span
          className={cn(
            "mt-px flex size-5 shrink-0 items-center justify-center rounded-full ring-1",
            toastIconStyles[type]
          )}
        >
          <Icon className={cn("size-3", type === "loading" && "animate-spin")} />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <ToastPrimitive.Title
            data-slot="toast-title"
            className="text-sm leading-snug font-medium"
          />
          <ToastPrimitive.Description
            data-slot="toast-description"
            className="text-xs leading-relaxed text-muted-foreground"
          />
          <ToastPrimitive.Action
            data-slot="toast-action"
            render={<Button variant="outline" size="xs" className="mt-1" />}
          />
        </div>

        <ToastPrimitive.Close
          data-slot="toast-close"
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="-mt-0.5 -mr-1 shrink-0 text-muted-foreground hover:text-foreground"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    )
  })
}

function Toaster({ ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          className="toast-viewport"
        >
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

type ToastOptions = Parameters<typeof toastManager.add>[0]
type ToastInput = string | Omit<ToastOptions, "type">

function normalize(input: ToastInput): Omit<ToastOptions, "type"> {
  return typeof input === "string" ? { title: input } : input
}

const toast = {
  success: (input: ToastInput) =>
    toastManager.add({ ...normalize(input), type: "success" }),
  error: (input: ToastInput) =>
    toastManager.add({ ...normalize(input), type: "error" }),
  loading: (input: ToastInput) =>
    toastManager.add({ ...normalize(input), type: "loading" }),
  info: (input: ToastInput) =>
    toastManager.add({ ...normalize(input), type: "default" }),
  /**
   * Shows a loading toast that resolves into a success or error toast.
   * Rejects with the original error so callers keep their own error handling.
   */
  promise: <Value,>(
    promise: Promise<Value>,
    options: Parameters<typeof toastManager.promise<Value>>[1]
  ) => toastManager.promise(promise, options),
  update: (id: string, options: Parameters<typeof toastManager.update>[1]) =>
    toastManager.update(id, options),
  close: (id?: string) => toastManager.close(id),
}

export { Toaster, toast, toastManager }
