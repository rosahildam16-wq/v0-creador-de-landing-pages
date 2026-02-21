"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { TEAM_MEMBERS } from "./team-data"

export type UserRole = "admin" | "member"

export interface AuthUser {
  email: string
  name: string
  role: UserRole
  memberId?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

// Safe storage helpers that work in iframes / restricted contexts
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
  try { sessionStorage.setItem(key, value) } catch { /* noop */ }
}

function safeRemove(key: string) {
  try { localStorage.removeItem(key) } catch { /* noop */ }
  try { sessionStorage.removeItem(key) } catch { /* noop */ }
}

const PUBLIC_PATHS = ["/login", "/funnel", "/"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = safeGet("mf_auth")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        setIsAuthenticated(true)
      } catch {
        safeRemove("mf_auth")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

    if (!isAuthenticated && !isPublic && pathname !== "/") {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))

    const ADMIN_EMAIL = "iajorgeleon21@gmail.com"
    const ADMIN_PASSWORD = "Leon321$#"
    const MEMBER_DEFAULT_PASSWORD = "Member123$"

    const normalizedEmail = email.toLowerCase().trim()

    // Check admin credentials
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const userData: AuthUser = { email: ADMIN_EMAIL, name: "Jorge Leon", role: "admin" }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // Check team member credentials
    const member = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
    if (member && password === MEMBER_DEFAULT_PASSWORD) {
      const userData: AuthUser = {
        email: member.email,
        name: member.nombre,
        role: "member",
        memberId: member.id,
      }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    safeRemove("mf_auth")
    router.replace("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
