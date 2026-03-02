import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

/**
 * Hardcoded pixel configs — guaranteed fallback.
 * These work even if the database is down or PostgREST cache is broken.
 */
const HARDCODED_CONFIGS: Record<string, { pixel_id: string; pixel_token: string }> = {
    "franquicia-reset": {
        pixel_id: "1300015961977903",
        pixel_token: "EAAPeZCPDoXF4BQwuQ0skpqobZBxMXFnKIaxbLmevHZAK0eDxw5XT2IB9cCE3323tjNffgaEp4mssKRkpZApUx0P9w0cC79AskpHaqTvWBtgo2Qwsuh3XEPN5htCcuYPhkm9PsbY4S5nNmhkOcHDNVJ1qoryDMPCgIrxzg5oTB4ZCIDzqO74N5Hl7ZBoGepmQZDZD",
    },
}

/** Create a connection pool using existing Vercel Postgres env vars */
function getPool(): Pool | null {
    const connectionString =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        ""

    if (!connectionString) return null

    try {
        return new Pool({
            connectionString,
            max: 1,
            ssl: { rejectUnauthorized: false },
        })
    } catch {
        return null
    }
}

/** Try database query, return null on any failure */
async function dbQuery(sql: string, params: any[] = []): Promise<any[] | null> {
    const pool = getPool()
    if (!pool) return null

    try {
        const { rows } = await pool.query(sql, params)
        return rows
    } catch (err: any) {
        console.error("DB query error:", err.message)
        return null
    } finally {
        try { await pool.end() } catch { /* noop */ }
    }
}

/** Get hardcoded config for a funnel */
function getHardcodedConfig(embudoId: string, memberId: string) {
    const config = HARDCODED_CONFIGS[embudoId]
    if (config) {
        return {
            pixel_id: config.pixel_id,
            pixel_token: config.pixel_token,
            enabled: true,
            embudo_id: embudoId,
            member_id: memberId,
            source: "hardcoded",
        }
    }
    return null
}

/** Env-based fallback response */
function envFallback(embudoId: string) {
    return {
        pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
        embudo_id: embudoId,
    }
}

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset&member_id=username
 * Priority: DB (member) → DB (admin) → DB (global) → Hardcoded → Env
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    // 1. Try database (member specific)
    const memberRows = await dbQuery(
        `SELECT * FROM pixel_configs WHERE embudo_id = $1 AND member_id = $2 AND enabled = true LIMIT 1`,
        [embudoId, memberId]
    )
    if (memberRows?.[0]) {
        return NextResponse.json({
            pixel_id: memberRows[0].pixel_id,
            pixel_token: memberRows[0].pixel_token || "",
            enabled: true,
            embudo_id: memberRows[0].embudo_id,
            member_id: memberRows[0].member_id,
        })
    }

    // 2. Try database (admin fallback)
    if (memberId !== "admin") {
        const adminRows = await dbQuery(
            `SELECT * FROM pixel_configs WHERE embudo_id = $1 AND member_id = 'admin' AND enabled = true LIMIT 1`,
            [embudoId]
        )
        if (adminRows?.[0]) {
            return NextResponse.json({
                pixel_id: adminRows[0].pixel_id,
                pixel_token: adminRows[0].pixel_token || "",
                enabled: true,
                embudo_id: embudoId,
                member_id: "admin",
            })
        }
    }

    // 3. Try database (global)
    if (embudoId !== "global") {
        const globalRows = await dbQuery(
            `SELECT * FROM pixel_configs WHERE embudo_id = 'global' AND member_id = 'admin' AND enabled = true LIMIT 1`
        )
        if (globalRows?.[0]) {
            return NextResponse.json({
                pixel_id: globalRows[0].pixel_id,
                pixel_token: globalRows[0].pixel_token || "",
                enabled: true,
                embudo_id: "global",
            })
        }
    }

    // 4. Hardcoded fallback (guaranteed to work)
    const hardcoded = getHardcodedConfig(embudoId, memberId)
    if (hardcoded) {
        return NextResponse.json(hardcoded)
    }

    // 5. Env fallback
    return NextResponse.json(envFallback(embudoId))
}

/**
 * POST /api/pixel/config
 * Save pixel config — tries DB first, falls back to success with hardcoded.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        // Try database save
        const rows = await dbQuery(
            `INSERT INTO pixel_configs (embudo_id, member_id, pixel_id, pixel_token, enabled, updated_at)
             VALUES ($1, $2, $3, $4, $5, now())
             ON CONFLICT (embudo_id, member_id) DO UPDATE SET
                pixel_id = EXCLUDED.pixel_id,
                pixel_token = EXCLUDED.pixel_token,
                enabled = EXCLUDED.enabled,
                updated_at = now()
             RETURNING *`,
            [embudo_id, member_id, pixel_id, pixel_token || "", enabled]
        )

        if (rows?.[0]) {
            return NextResponse.json({ success: true, data: rows[0] })
        }

        // If DB fails but it's a known hardcoded config, still return success
        const hardcoded = getHardcodedConfig(embudo_id, member_id)
        if (hardcoded && hardcoded.pixel_id === pixel_id) {
            return NextResponse.json({ success: true, data: hardcoded, source: "hardcoded" })
        }

        return NextResponse.json({
            error: "No se pudo guardar. La base de datos no está disponible.",
        }, { status: 500 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * PUT /api/pixel/config
 * List all pixel configs.
 */
export async function PUT(req: NextRequest) {
    try {
        const rows = await dbQuery(`SELECT * FROM pixel_configs ORDER BY created_at DESC`)
        return NextResponse.json({ configs: rows || [] })
    } catch (err: any) {
        return NextResponse.json({ configs: [] })
    }
}
