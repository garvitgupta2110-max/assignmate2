import { create } from "zustand"

export interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning" | "error"
  type?: "default" | "destructive" | "success" | "warning" | "error" | string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type ToastInput = Omit<Toast, "id"> & { id?: string }

export interface ToastStore {
  toasts: Toast[]
  addToast: (toast: ToastInput) => void
  removeToast: (id: string) => void
  updateToast: (toast: Toast) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [{ ...toast, id: toast.id || Math.random().toString(36).substring(2, 9) }, ...state.toasts].slice(0, 1),
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  updateToast: (toast) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === toast.id ? toast : t)),
    })),
}))
