import { NextResponse } from "next/server"

/**
 * GET /api/pixel/setup
 * Creates the pixel_config table using the Supabase Management API (SQL endpoint).
 * This is a one-time setup endpoint.
 */
export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const CREATE_SQL = `
        CREATE TABLE IF NOT EXISTS pixel_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            embudo_id TEXT NOT NULL DEFAULT 'global',
            member_id TEXT NOT NULL DEFAULT 'admin',
            pixel_id TEXT NOT NULL DEFAULT '',
            pixel_token TEXT DEFAULT '',
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(embudo_id, member_id)
        );

        ALTER TABLE pixel_config ENABLE ROW LEVEL SECURITY;

        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename='pixel_config' AND policyname='allow_all_pixel'
            ) THEN
                CREATE POLICY "allow_all_pixel" ON pixel_config FOR ALL USING (true) WITH CHECK (true);
            END IF;
        END $$;

        GRANT ALL ON pixel_config TO anon, authenticated, service_role;
    `

    // Probar directamente con la REST API de Supabase (PostgREST)
    // Primero verificar si la tabla ya existe
    try {
        const checkRes = await fetch(`${supabaseUrl}/rest/v1/pixel_config?select=id&limit=1`, {
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
            },
        })

        if (checkRes.ok) {
            // Table exists and is accessible!
            return NextResponse.json({
                success: true,
                message: "✅ La tabla pixel_config ya existe y funciona correctamente.",
                status: "ready",
            })
        }

        // If we get here, the table doesn't exist or schema cache issue
        const errorText = await checkRes.text()

        // Try to reload schema cache
        try {
            await fetch(`${supabaseUrl}/rest/v1/`, {
                method: "HEAD",
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    "Cache-Control": "no-cache",
                },
            })
        } catch { /* noop */ }

        return NextResponse.json({
            success: false,
            message: "La tabla no es accesible vía la API REST de Supabase.",
            error: errorText,
            instructions: [
                "1. Ve a tu panel de Supabase (https://supabase.com/dashboard)",
                "2. Selecciona tu proyecto",
                "3. Entra al SQL Editor (icono >_ en la barra lateral)",
                "4. Haz clic en 'New Query'",
                "5. Pega este código SQL:",
                CREATE_SQL.trim(),
                "6. Haz clic en 'Run'",
                "7. Si ya existe la tabla, ve a Project Settings > API > click 'Reload Schema'",
            ],
        })
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message,
        }, { status: 500 })
    }
}
