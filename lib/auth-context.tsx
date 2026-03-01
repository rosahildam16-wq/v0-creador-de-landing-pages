"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { TEAM_MEMBERS } from "./team-data"
import { getLeaderCommunity } from "./communities-data"

export type UserRole = "super_admin" | "member"

export interface AuthUser {
  email: string
  name: string
  username?: string
  role: UserRole
  memberId?: string
  communityId?: string
  planId?: string
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
    async function checkSession() {
      // 1. Instant UI: Check localStorage/sessionStorage for last session
      const stored = safeGet("mf_auth")
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser
          setUser(parsed)
          setIsAuthenticated(true)
        } catch { /* noop */ }
      }

      // 2. Shield Check: Verify with server (the real truth)
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
            safeSet("mf_auth", JSON.stringify(data.user))
          } else {
            throw new Error("Invalid session")
          }
        } else {
          throw new Error("No session")
        }
      } catch {
        // If server says no session, clear everything
        setUser(null)
        setIsAuthenticated(false)
        safeRemove("mf_auth")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // NOTE: Route protection is handled by individual layouts (AdminLayout, MemberLayout)
  // to avoid duplicate redirect conflicts that cause RSC payload loops.

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const userData: AuthUser = {
            email: normalizedEmail,
            name: data.name,
            username: data.username,
            role: data.role,
            memberId: data.memberId,
            communityId: data.communityId,
            planId: data.planId,
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
      const role: UserRole = "member"
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

  const logout = async () => {
    setUser(null)
    setIsAuthenticated(false)
    safeRemove("mf_auth")
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch { /* noop */ }
    router.replace("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

