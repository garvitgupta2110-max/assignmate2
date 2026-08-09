"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  selectedValueLabel?: string
  setSelectedValueLabel: (label: string) => void
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  items: Array<{ value: string; label: string }>
  registerItem: (value: string, label: string) => void
  unregisterItem: (value: string) => void
  triggerId: string
  contentId: string
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export interface SelectProps {
  children?: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

export function Select({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const [open, setOpen] = React.useState(false)
  const [selectedValueLabel, setSelectedValueLabel] = React.useState<string>("")
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1)
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([])

  const triggerId = React.useId()
  const contentId = React.useId()

  const registerItem = React.useCallback((val: string, label: string) => {
    setItems((prev) => {
      if (prev.some((item) => item.value === val)) return prev
      return [...prev, { value: val, label }]
    })
  }, [])

  const unregisterItem = React.useCallback((val: string) => {
    setItems((prev) => prev.filter((item) => item.value !== val))
  }, [])

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  // Close when clicking outside
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Update selected value label when value or items change
  React.useEffect(() => {
    const activeItem = items.find((item) => item.value === value)
    if (activeItem) {
      setSelectedValueLabel(activeItem.label)
    } else if (!value) {
      setSelectedValueLabel("")
    }
  }, [value, items])

  // Keydown handler on container
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex((prev) => (prev + 1) % items.length)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setFocusedIndex(items.length - 1)
        } else {
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length)
        }
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setFocusedIndex(0)
        } else if (focusedIndex >= 0 && focusedIndex < items.length) {
          handleValueChange(items[focusedIndex].value)
          setOpen(false)
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
      case "Tab":
        setOpen(false)
        break
    }
  }

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedValueLabel,
        setSelectedValueLabel,
        focusedIndex,
        setFocusedIndex,
        items,
        registerItem,
        unregisterItem,
        triggerId,
        contentId,
      }}
    >
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="relative inline-block w-full"
      >
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used within a Select")

  return (
    <button
      ref={ref}
      id={context.triggerId}
      type="button"
      role="combobox"
      aria-expanded={context.open}
      aria-haspopup="listbox"
      aria-controls={context.contentId}
      disabled={props.disabled}
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used within a Select")

  return (
    <span className="block truncate">
      {context.selectedValueLabel || placeholder}
    </span>
  )
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectContent must be used within a Select")

  if (!context.open) return null

  return (
    <div
      ref={ref}
      id={context.contentId}
      role="listbox"
      aria-labelledby={context.triggerId}
      className={cn(
        "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 slide-in-from-top-1 mt-1 border-border",
        className
      )}
      {...props}
    >
      <div className="p-1 max-h-60 overflow-y-auto">{children}</div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used within a Select")

  const label = React.useMemo(() => {
    if (typeof children === "string") return children
    return children?.toString() || value
  }, [children, value])

  // Register item in parent select context
  React.useEffect(() => {
    context.registerItem(value, label)
    return () => context.unregisterItem(value)
  }, [value, label, context.registerItem, context.unregisterItem])

  const isSelected = context.value === value
  
  // Find our index in items to determine if we are currently focused
  const itemIndex = context.items.findIndex((item) => item.value === value)
  const isFocused = context.focusedIndex === itemIndex

  const handleSelect = () => {
    context.onValueChange?.(value)
    context.setOpen(false)
  }

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      onMouseEnter={() => context.setFocusedIndex(itemIndex)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
        isSelected && "bg-accent/50 text-accent-foreground",
        isFocused && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span className="block truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"
