"use client"

import { Toast, ToastProvider, ToastViewport, ToastClose } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open, onOpenChange, variant, type: _type, ...props }) {
        return (
          <Toast
            key={id}
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) dismiss(id);
              onOpenChange?.(isOpen);
            }}
            variant={variant as any}
            {...props}
          >
            <div className="grid gap-1 pr-4">
              {title && <div className="font-semibold text-sm">{title}</div>}
              {description && <div className="text-xs opacity-90 leading-relaxed">{description}</div>}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
