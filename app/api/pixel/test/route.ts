import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pixel/test
 * Quick diagnostic — tests if pixel_configs table is accessible.
 */
export async function GET() {
    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No Supabase client" }, { status: 500 })
        }

        // Test: read from pixel_configs
        const { data, error } = await supabase
            .from("pixel_configs")
            .select("*")
            .limit(5)

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
            })
        }

        // Test: write to pixel_configs
        const { data: writeData, error: writeError } = await supabase
            .from("pixel_configs")
            .upsert(
                {
                    embudo_id: "_test_",
                    member_id: "_test_",
                    pixel_id: "000",
                    enabled: false,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "embudo_id,member_id" }
            )
            .select()
            .single()

        // Clean up
        await supabase.from("pixel_configs").delete().eq("embudo_id", "_test_").eq("member_id", "_test_")

        if (writeError) {
            return NextResponse.json({
                success: false,
                read: "✅ OK",
                write: `❌ ${writeError.message}`,
            })
        }

        return NextResponse.json({
            success: true,
            message: "✅ TODO FUNCIONA — pixel_configs está lista para leer y escribir.",
            rows: data?.length || 0,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
