"use client"

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type RevealProps = {
  as?: ElementType
  alwaysVisible?: boolean
  children: ReactNode
  className?: string
  delay?: number
  id?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style">

export function Reveal({ as: Component = "div", alwaysVisible = false, children, className, delay = 0, style, ...props }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(alwaysVisible)

  useEffect(() => {
    if (alwaysVisible) {
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [alwaysVisible])

  return (
    <Component
      ref={ref}
      className={cn("reveal-block", (alwaysVisible || isVisible) && "reveal-visible", className)}
      style={{ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </Component>
  )
}
