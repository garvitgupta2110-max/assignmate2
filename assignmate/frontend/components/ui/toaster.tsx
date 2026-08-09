"use client"

import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open, onOpenChange, variant, ...props }) {
        return (
          <Toast
            key={id}
            open={open}
            onOpenChange={onOpenChange}
            variant={variant as any}
            {...props}
          >
            <div className="grid gap-1">
              {title && <div className="font-semibold">{title}</div>}
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
