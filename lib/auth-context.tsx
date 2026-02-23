"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { TEAM_MEMBERS } from "./team-data"
import { addNotification } from "./notifications-data"
import { getCommunityByCode, setMemberCommunity } from "./communities-data"
import { updateMemberFunnels } from "./team-data"

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
  register: (name: string, email: string, password: string, discountCode?: string) => Promise<boolean>
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

    // Check admin credentials
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const userData: AuthUser = { email: ADMIN_EMAIL, name: "Jorge Leon", role: "admin" }
      setUser(userData)
      setIsAuthenticated(true)
      safeSet("mf_auth", JSON.stringify(userData))
      setIsLoading(false)
      return true
    }

    // Check launch test code (free trial for team members)
    if (password === LAUNCH_TEST_CODE) {
      // Create a dynamic member from their email
      const existingMember = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
      const nameFromEmail = normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      const userData: AuthUser = {
        email: normalizedEmail,
        name: existingMember?.nombre || nameFromEmail,
        role: "member",
        memberId: existingMember?.id || `test-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`,
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

    // Check registered users
    try {
      const registryRaw = safeGet("mf_registry") || "[]"
      const registry = JSON.parse(registryRaw) as Array<{ email: string; name: string; password: string }>
      const registered = registry.find((r) => r.email === normalizedEmail && r.password === password)
      if (registered) {
        const memberId = `reg-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`
        const userData: AuthUser = {
          email: normalizedEmail,
          name: registered.name,
          role: "member",
          memberId,
        }
        setUser(userData)
        setIsAuthenticated(true)
        safeSet("mf_auth", JSON.stringify(userData))
        setIsLoading(false)
        return true
      }
    } catch { /* noop */ }

    setIsLoading(false)
    return false
  }

  const register = async (name: string, email: string, password: string, discountCode?: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()
    const code = discountCode?.trim().toUpperCase() || ""

    if (!trimmedName || !normalizedEmail || password.length < 6) {
      setIsLoading(false)
      return false
    }

    // Check if already exists as admin
    if (normalizedEmail === "iajorgeleon21@gmail.com") {
      setIsLoading(false)
      return false
    }

    // Save registered user to localStorage registry
    try {
      const registryRaw = safeGet("mf_registry") || "[]"
      const registry = JSON.parse(registryRaw) as Array<{ email: string; name: string; password: string; discountCode?: string; registeredAt?: string }>
      
      // Check duplicate
      if (registry.some((r) => r.email === normalizedEmail)) {
        setIsLoading(false)
        return false
      }

      registry.push({
        email: normalizedEmail,
        name: trimmedName,
        password,
        discountCode: code || undefined,
        registeredAt: new Date().toISOString(),
      })
      safeSet("mf_registry", JSON.stringify(registry))
    } catch { /* noop */ }

    const memberId = `reg-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`

    // Assign community based on discount code
    const community = code ? getCommunityByCode(code) : undefined
    const communityId = community?.id || "general"
    const communityName = community?.nombre || "General"

    setMemberCommunity({
      memberId,
      communityId,
      email: normalizedEmail,
      name: trimmedName,
    })

    // Auto-enable community default funnels
    if (community?.embudos_default && community.embudos_default.length > 0) {
      updateMemberFunnels(memberId, community.embudos_default)
    }

    // Send notification to admin
    const codeLabel = code ? ` | Codigo: ${code}` : ""
    addNotification({
      tipo: "team",
      titulo: "Nuevo registro de miembro",
      mensaje: `${trimmedName} (${normalizedEmail}) se unio a la comunidad ${communityName}${codeLabel}. Ve a Comunidades para gestionar su acceso.`,
      timestamp: new Date().toISOString(),
      leida: false,
      destinatario: "admin",
    })

    const userData: AuthUser = {
      email: normalizedEmail,
      name: trimmedName,
      role: "member",
      memberId,
    }

    setUser(userData)
    setIsAuthenticated(true)
    safeSet("mf_auth", JSON.stringify(userData))
    setIsLoading(false)
    return true
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
