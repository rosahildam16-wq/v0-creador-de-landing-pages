"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { NotificationBell } from "@/components/shared/notification-bell"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { SubscriptionGuard } from "@/components/subscription-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
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
        <div
          className="ambient-orb-3 absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(250 75% 60%), transparent 70%)" }}
        />
      </div>
      <AdminSidebar />
      <main className="relative z-10 flex-1 overflow-auto">
        {/* Top bar with notifications */}
        <div className="sticky top-0 z-30 flex items-center justify-end gap-2 px-6 py-3">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-6">
          {user?.role === "admin" ? children : (
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
          )}
        </div>
      </main>
    </div>
  )
}
