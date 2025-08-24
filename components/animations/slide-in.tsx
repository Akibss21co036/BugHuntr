"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface SlideInProps {
  children: ReactNode
  direction?: "left" | "right" | "up" | "down"
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({ children, direction = "up", delay = 0, duration = 0.5, className }: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { x: -50, y: 0 }
      case "right":
        return { x: 50, y: 0 }
      case "up":
        return { x: 0, y: 50 }
      case "down":
        return { x: 0, y: -50 }
      default:
        return { x: 0, y: 50 }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
