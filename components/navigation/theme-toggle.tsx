"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    console.log("[v0] Theme toggle clicked. Current theme:", theme, "New theme:", newTheme)
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleThemeToggle} className="hover:bg-accent transition-colors">
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  )
}
