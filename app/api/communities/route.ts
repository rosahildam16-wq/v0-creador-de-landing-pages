import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const communityId = req.nextUrl.searchParams.get("communityId")

    // Get all communities
    const { data: communities, error: commError } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false })

    if (commError) throw commError

    // Get members, optionally filtered by community
    let membersQuery = supabase.from("community_members").select("*").order("created_at", { ascending: false })
    if (communityId) {
      membersQuery = membersQuery.eq("community_id", communityId)
    }
    const { data: members, error: memError } = await membersQuery
    if (memError) throw memError

    // Count members per community
    const communitiesWithCounts = (communities || []).map((c) => ({
      ...c,
      member_count: (members || []).filter((m) => m.community_id === c.id).length,
    }))

    return NextResponse.json({
      communities: communitiesWithCounts,
      members: members || [],
    })
  } catch (err) {
    console.error("Communities GET error:", err)
    return NextResponse.json({ error: "Error al cargar comunidades" }, { status: 500 })
  }
}
