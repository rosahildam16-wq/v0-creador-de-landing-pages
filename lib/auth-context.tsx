"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { TEAM_MEMBERS } from "./team-data"
import { getLeaderCommunity } from "./communities-data"

export type UserRole = "super_admin" | "leader" | "member"

export interface AuthUser {
  email: string
  name: string
  username?: string
  role: UserRole
  memberId?: string
  communityId?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, username: string, discountCode?: string, sponsorUsername?: string) => Promise<boolean>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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

  // NOTE: Route protection is handled by individual layouts (AdminLayout, MemberLayout)
  // to avoid duplicate redirect conflicts that cause RSC payload loops.

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))

    const ADMIN_EMAIL = "iajorgeleon21@gmail.com"
    const ADMIN_PASSWORD = "Leon321$#"
    const MEMBER_DEFAULT_PASSWORD = "Member123$"
    const LAUNCH_TEST_CODE = "LANZAMIENTO2026"

    const normalizedEmail = email.toLowerCase().trim()

    // Check Super Admin credentials
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const userData: AuthUser = { email: ADMIN_EMAIL, name: "Jorge Leon", role: "super_admin" }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // TEST SHORTCUT: Leader
    if (normalizedEmail === "test_leader@magic.com" && password === "test1234") {
      const userData: AuthUser = { email: normalizedEmail, name: "Lider de Prueba", role: "leader", communityId: "general" }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // TEST SHORTCUT: Member
    if (normalizedEmail === "test_member@magic.com" && password === "test1234") {
      const userData: AuthUser = { email: normalizedEmail, name: "Miembro de Prueba", role: "member", communityId: "general" }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // Check launch test code (free trial for team members)
    if (password === LAUNCH_TEST_CODE) {
      const existingMember = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
      const nameFromEmail = normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      const memberId = existingMember?.id || `test-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`

      // Check if this email is a community leader
      const leaderComm = getLeaderCommunity(normalizedEmail)
      if (leaderComm) {
        const userData: AuthUser = {
          email: normalizedEmail,
          name: existingMember?.nombre || nameFromEmail,
          role: "leader",
          memberId,
          communityId: leaderComm.id,
        }
        setUser(userData)
        setIsAuthenticated(true)
        safeSet("mf_auth", JSON.stringify(userData))
        setIsLoading(false)
        return true
      }

      const userData: AuthUser = {
        email: normalizedEmail,
        name: existingMember?.nombre || nameFromEmail,
        role: "member",
        memberId,
      }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // Check team member credentials
    const member = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
    if (member && password === MEMBER_DEFAULT_PASSWORD) {
      // Check if this member is a leader
      const leaderComm = getLeaderCommunity(normalizedEmail)
      const userData: AuthUser = {
        email: member.email,
        name: member.nombre,
        role: leaderComm ? "leader" : "member",
        memberId: member.id,
        communityId: leaderComm?.id,
      }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // Check registered users in Supabase
    try {
      const res = await fetch(`/api/communities/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const dbRole = data.role === "leader" ? "leader" : "member"
          const userData: AuthUser = {
            email: normalizedEmail,
            name: data.name,
            username: data.username,
            role: dbRole as UserRole,
            memberId: data.memberId,
            communityId: data.communityId,
          }
          setUser(userData)
          setIsAuthenticated(true)
          safeSet("mf_auth", JSON.stringify(userData))
          setIsLoading(false)
          return true
        }
      }
    } catch { /* noop */ }

    setIsLoading(false)
    return false
  }

  const register = async (name: string, email: string, password: string, username: string, discountCode?: string, sponsorUsername?: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/communities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, username, discountCode, sponsorUsername }),
      })

      const data = await res.json()

      if (!res.ok) {
        setIsLoading(false)
        return false
      }

      const normalizedEmail = email.toLowerCase().trim()
      const role: UserRole = data.role === "leader" ? "leader" : "member"
      const userData: AuthUser = {
        email: normalizedEmail,
        name: name.trim(),
        username: data.username,
        role,
        memberId: data.memberId,
        communityId: data.communityId,
      }

      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    } catch {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    safeRemove("mf_auth")
    router.replace("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
