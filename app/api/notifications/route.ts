import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get("role") || "member"
    const username = req.nextUrl.searchParams.get("username") || ""
    const supabase = await createClient()

    // Build filter: show "all" + role-specific + "admin" for super_admin/leader + user-specific
    let query = supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    const { data, error } = await query
    if (error) throw error

    // Filter in JS for complex OR logic
    const filtered = (data || []).filter((n) => {
      if (n.destinatario === "all") return true
      if (n.destinatario === role) return true
      if (n.destinatario === "admin" && role === "super_admin") return true
      if (username && n.destinatario === username) return true
      return false
    })

    return NextResponse.json({ notifications: filtered })
  } catch (err) {
    console.error("Notifications GET error:", err)
    return NextResponse.json({ error: "Error al cargar notificaciones" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids } = body as { ids: string[] }
    const supabase = await createClient()

    if (ids && ids.length > 0) {
      await supabase
        .from("admin_notifications")
        .update({ leida: true })
        .in("id", ids)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Notifications PATCH error:", err)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}
