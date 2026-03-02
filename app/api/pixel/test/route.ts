import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pixel/test
 * Tests both RPC functions and returns detailed diagnostics.
 */
export async function GET(req: NextRequest) {
    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        tests: [],
    }

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No Supabase client", results })
        }

        // Test 1: Try get_pixel_config RPC
        try {
            const { data: getData, error: getError } = await supabase.rpc("get_pixel_config", {
                p_embudo_id: "test-diagnostic",
                p_member_id: "admin",
            })
            results.tests.push({
                test: "get_pixel_config RPC",
                success: !getError,
                data: getData,
                error: getError?.message || null,
                code: getError?.code || null,
            })
        } catch (e: any) {
            results.tests.push({
                test: "get_pixel_config RPC",
                success: false,
                error: e.message,
            })
        }

        // Test 2: Try upsert_pixel_config RPC
        try {
            const { data: upsertData, error: upsertError } = await supabase.rpc("upsert_pixel_config", {
                p_embudo_id: "test-diagnostic",
                p_member_id: "admin",
                p_pixel_id: "123456789",
                p_pixel_token: "test-token",
                p_enabled: true,
            })
            results.tests.push({
                test: "upsert_pixel_config RPC",
                success: !upsertError,
                data: upsertData,
                error: upsertError?.message || null,
                code: upsertError?.code || null,
            })
        } catch (e: any) {
            results.tests.push({
                test: "upsert_pixel_config RPC",
                success: false,
                error: e.message,
            })
        }

        // Test 3: Try direct table access (will likely fail with schema cache)
        try {
            const { data: directData, error: directError } = await supabase
                .from("pixel_config")
                .select("*")
                .limit(5)
            results.tests.push({
                test: "Direct table SELECT",
                success: !directError,
                data: directData,
                error: directError?.message || null,
                code: directError?.code || null,
            })
        } catch (e: any) {
            results.tests.push({
                test: "Direct table SELECT",
                success: false,
                error: e.message,
            })
        }

        // Test 4: Verify the function exists
        try {
            const { data: fnCheck, error: fnError } = await supabase.rpc("get_pixel_config", {
                p_embudo_id: "global",
                p_member_id: "admin",
            })
            results.tests.push({
                test: "Function exists check",
                success: !fnError,
                data: fnCheck,
                error: fnError?.message || null,
                code: fnError?.code || null,
                hint: fnError ? "Run the SQL functions in Supabase SQL Editor" : "Functions are registered correctly",
            })
        } catch (e: any) {
            results.tests.push({
                test: "Function exists check",
                success: false,
                error: e.message,
            })
        }

        // Clean up test data
        try {
            await supabase.rpc("upsert_pixel_config", {
                p_embudo_id: "test-diagnostic",
                p_member_id: "admin",
                p_pixel_id: "",
                p_pixel_token: "",
                p_enabled: false,
            })
        } catch { /* noop */ }

        // Summary
        const allPassed = results.tests.every((t: any) => t.success)
        results.summary = allPassed
            ? "✅ TODOS LOS TESTS PASARON - El sistema de Pixel está funcionando correctamente"
            : "❌ Algunos tests fallaron - revisa los detalles arriba"

        return NextResponse.json(results, { status: 200 })
    } catch (err: any) {
        return NextResponse.json({
            error: err.message,
            results,
        }, { status: 500 })
    }
}
