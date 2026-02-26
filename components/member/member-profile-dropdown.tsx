"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTeamMemberById } from "@/lib/team-data"
import Link from "next/link"
import { User, CreditCard, LogOut, ChevronDown, Settings } from "lucide-react"

export function MemberProfileDropdown() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const member = user?.memberId ? getTeamMemberById(user.memberId) : null
  const initials = member?.avatar_initials || user?.name?.slice(0, 2).toUpperCase() || "??"
  const displayName = member?.nombre || user?.name || "Miembro"
  const displayEmail = member?.email || user?.email || ""

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border/30 bg-card/60 px-3 py-1.5 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/80"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-[11px] font-bold text-primary-foreground">
          {initials}
        </div>
        <span className="hidden text-sm font-medium text-foreground sm:block">
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border/40 bg-card shadow-2xl shadow-black/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="border-b border-border/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-sm font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="p-1.5">
            <Link
              href="/member/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Mi perfil
            </Link>
            <Link
              href="/member/perfil?tab=suscripcion"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <CreditCard className="h-4 w-4" />
              Mi suscripcion
            </Link>
            <Link
              href="/member/perfil?tab=config"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Configuracion
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border/20 p-1.5">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
