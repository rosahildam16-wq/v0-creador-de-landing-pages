"use client"

import { useTheme } from "@/lib/theme-context"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/30 text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-secondary/60 hover:text-foreground",
        className
      )}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div className="relative h-4 w-4">
        {/* Sun icon - visible in dark mode */}
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Moon icon - visible in light mode */}
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  )
}
