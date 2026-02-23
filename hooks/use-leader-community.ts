"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export interface LeaderCommunity {
  id: string
  nombre: string
  color: string
  codigo: string | null
  owner_username: string | null
  leader_name: string | null
  leader_email: string | null
  free_trial_days: number
  activa: boolean
}

export interface CommunityMember {
  id: number
  member_id: string
  name: string
  email: string
  username: string | null
  sponsor_username: string | null
  discount_code: string | null
  role: string
  activo: boolean
  trial_ends_at: string | null
  created_at: string
}

export function useLeaderCommunity() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<LeaderCommunity | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    const fetchCommunity = async () => {
      try {
        const res = await fetch(`/api/communities/my-community?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setCommunity(data.community || null)
          setMembers(data.members || [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [user?.email])

  const refetch = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/my-community?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setCommunity(data.community || null)
        setMembers(data.members || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return { community, members, loading, refetch, user }
}
