"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LeaderSidebar } from "@/components/leader/leader-sidebar"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
    if (!isLoading && isAuthenticated && user?.role !== "leader" && user?.role !== "super_admin") {
      router.replace("/member")
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading || !isAuthenticated || (user?.role !== "leader" && user?.role !== "super_admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <MagicFunnelLogo size="md" animated />
          <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
          </div>
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen bg-background overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="ambient-orb-1 absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, hsl(260 70% 58%), transparent 70%)" }}
        />
        <div
          className="ambient-orb-2 absolute right-0 top-0 h-[600px] w-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, hsl(280 65% 55%), transparent 70%)" }}
        />
      </div>
      <LeaderSidebar />
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="sticky top-0 z-30 flex items-center justify-end gap-2 px-6 py-3 backdrop-blur-sm">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
