"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
  animation?: "scale" | "lift" | "shine" | "none"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, animation = "scale", children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const Comp = asChild ? Slot : "button"
    const MotionComp = motion(Comp) as any

    const motionProps = React.useMemo(() => {
      if (shouldReduceMotion || animation === "none" || props.disabled) {
        return {}
      }

      switch (animation) {
        case "lift":
          return {
            whileHover: { y: -2 },
            whileTap: { y: 0, scale: 0.98 },
            transition: { type: "spring", stiffness: 400, damping: 15 }
          }
        case "shine":
        case "scale":
        default:
          return {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.97 },
            transition: { type: "spring", stiffness: 500, damping: 15 }
          }
      }
    }, [animation, shouldReduceMotion, props.disabled])

    const buttonClass = cn(
      buttonVariants({ variant, size, className }),
      animation === "shine" && !asChild && "relative overflow-hidden"
    )

    return (
      <MotionComp
        ref={ref}
        className={buttonClass}
        {...motionProps}
        {...props}
      >
        {children}
        {animation === "shine" && !asChild && !shouldReduceMotion && !props.disabled && (
          <motion.span
            initial={{ left: "-100%" }}
            whileHover={{ left: "120%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 h-full w-[40px] bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
          />
        )}
      </MotionComp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
