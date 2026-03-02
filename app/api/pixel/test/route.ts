import { NextResponse } from "next/server"
import { Pool } from "pg"

/**
 * GET /api/pixel/test
 * Tests direct PostgreSQL connection to pixel_configs table.
 */
export async function GET() {
    const connectionString =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        ""

    if (!connectionString) {
        return NextResponse.json({
            success: false,
            error: "No POSTGRES_URL_NON_POOLING or DATABASE_URL found",
        })
    }

    const pool = new Pool({
        connectionString,
        max: 1,
        ssl: { rejectUnauthorized: false },
    })

    try {
        // Test 1: Read
        const { rows } = await pool.query(`SELECT * FROM pixel_configs LIMIT 5`)

        // Test 2: Write
        await pool.query(
            `INSERT INTO pixel_configs (embudo_id, member_id, pixel_id, enabled)
             VALUES ('_test_', '_test_', '000', false)
             ON CONFLICT (embudo_id, member_id) DO UPDATE SET pixel_id = '000'`
        )
        await pool.query(`DELETE FROM pixel_configs WHERE embudo_id = '_test_'`)

        return NextResponse.json({
            success: true,
            message: "✅ TODO FUNCIONA — conexión directa a PostgreSQL operativa.",
            rows: rows.length,
            connection: "direct-pg",
        })
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message,
            connection: "direct-pg",
        })
    } finally {
        await pool.end()
    }
}
