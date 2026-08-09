"use client"

import * as React from "react"
import { useToastStore, type Toast } from "@/store/toast-store"

const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = Toast

export function useToast() {
  const store = useToastStore()

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)

      const dismiss = () => store.removeToast(id)

      store.addToast({
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
        ...props,
      })

      setTimeout(() => {
        dismiss()
      }, TOAST_REMOVE_DELAY)

      return {
        id: id,
        dismiss,
        update: (newProps: ToasterToast) =>
          store.updateToast(newProps),
      }
    },
    [store]
  )

  return {
    toast,
    toasts: store.toasts,
    dismiss: (toastId?: string) => {
      if (toastId) {
        store.removeToast(toastId)
      } else {
        store.toasts.forEach((toast) => {
          store.removeToast(toast.id)
        })
      }
    },
  }
}
