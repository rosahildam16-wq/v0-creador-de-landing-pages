import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

/** Create a connection pool using existing Vercel Postgres env vars */
function getPool() {
    const connectionString =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        ""

    if (!connectionString) return null

    return new Pool({
        connectionString,
        max: 1,
        ssl: { rejectUnauthorized: false },
    })
}

/** Env-based fallback response */
function envFallback(embudoId: string) {
    return NextResponse.json({
        pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
        embudo_id: embudoId,
    })
}

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset&member_id=username
 * Direct PostgreSQL connection — bypasses PostgREST completely.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    const pool = getPool()
    if (!pool) return envFallback(embudoId)

    try {
        // 1. Try specific member + embudo
        const { rows } = await pool.query(
            `SELECT * FROM pixel_configs WHERE embudo_id = $1 AND member_id = $2 AND enabled = true LIMIT 1`,
            [embudoId, memberId]
        )

        if (rows[0]) {
            return NextResponse.json({
                pixel_id: rows[0].pixel_id,
                pixel_token: rows[0].pixel_token || "",
                enabled: rows[0].enabled,
                embudo_id: rows[0].embudo_id,
                member_id: rows[0].member_id,
            })
        }

        // 2. Fallback to admin
        if (memberId !== "admin") {
            const admin = await pool.query(
                `SELECT * FROM pixel_configs WHERE embudo_id = $1 AND member_id = 'admin' AND enabled = true LIMIT 1`,
                [embudoId]
            )
            if (admin.rows[0]) {
                return NextResponse.json({
                    pixel_id: admin.rows[0].pixel_id,
                    pixel_token: admin.rows[0].pixel_token || "",
                    enabled: true,
                    embudo_id: embudoId,
                    member_id: "admin",
                })
            }
        }

        // 3. Fallback to global
        if (embudoId !== "global") {
            const global = await pool.query(
                `SELECT * FROM pixel_configs WHERE embudo_id = 'global' AND member_id = 'admin' AND enabled = true LIMIT 1`
            )
            if (global.rows[0]) {
                return NextResponse.json({
                    pixel_id: global.rows[0].pixel_id,
                    pixel_token: global.rows[0].pixel_token || "",
                    enabled: true,
                    embudo_id: "global",
                })
            }
        }

        return envFallback(embudoId)
    } catch (err: any) {
        console.error("Pixel GET error:", err.message)
        return envFallback(embudoId)
    } finally {
        await pool.end()
    }
}

/**
 * POST /api/pixel/config
 * Save pixel config using direct PostgreSQL.
 */
export async function POST(req: NextRequest) {
    const pool = getPool()
    if (!pool) return NextResponse.json({ error: "No database connection" }, { status: 500 })

    try {
        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        const { rows } = await pool.query(
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

        return NextResponse.json({ success: true, data: rows[0] })
    } catch (err: any) {
        console.error("Pixel POST error:", err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        await pool.end()
    }
}

/**
 * PUT /api/pixel/config
 * List all pixel configs.
 */
export async function PUT(req: NextRequest) {
    const pool = getPool()
    if (!pool) return NextResponse.json({ configs: [] })

    try {
        const { rows } = await pool.query(
            `SELECT * FROM pixel_configs ORDER BY created_at DESC`
        )
        return NextResponse.json({ configs: rows })
    } catch (err: any) {
        console.error("Pixel PUT error:", err.message)
        return NextResponse.json({ configs: [] })
    } finally {
        await pool.end()
    }
}
