import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET /api/setup — Check if the database is set up
export async function GET() {
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

  if (!hasSupabase) {
    // Running without Supabase — using mock data
    return NextResponse.json({
      setup: true,
      tables: true,
      seeded: true,
      leadsCount: 35,
      mode: "mock",
      message: "Funcionando con datos de ejemplo (sin Supabase).",
    })
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()

    const { error: leadsError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })

    if (leadsError) {
      return NextResponse.json({
        setup: false,
        tables: false,
        seeded: false,
        message: "Las tablas no existen en la base de datos.",
      })
    }

    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })

    return NextResponse.json({
      setup: true,
      tables: true,
      seeded: (count || 0) > 0,
      leadsCount: count || 0,
      mode: "supabase",
    })
  } catch {
    return NextResponse.json({
      setup: true,
      tables: true,
      seeded: true,
      mode: "mock",
      message: "No se pudo conectar a Supabase. Usando datos de ejemplo.",
    })
  }
}

// POST /api/setup — Create tables (only works with Supabase)
export async function POST(request: Request) {
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

  if (!hasSupabase) {
    return NextResponse.json({
      success: true,
      message: "Funcionando con datos de ejemplo. No se necesita setup.",
      mode: "mock",
    })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { seed = true } = body as { seed?: boolean }

    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre text NOT NULL,
        email text NOT NULL,
        telefono text DEFAULT '',
        whatsapp text DEFAULT '',
        fuente text DEFAULT 'Organico',
        fecha_ingreso timestamptz DEFAULT now(),
        etapa text DEFAULT 'lead_nuevo',
        video_visto_pct integer DEFAULT 0,
        llamada_contestada boolean DEFAULT false,
        quiz_completado boolean DEFAULT false,
        respuestas_quiz text[] DEFAULT '{}',
        terminal_completado boolean DEFAULT false,
        whatsapp_leido boolean DEFAULT false,
        login_completado boolean DEFAULT false,
        feed_visto boolean DEFAULT false,
        sales_page_vista boolean DEFAULT false,
        cta_clicked boolean DEFAULT false,
        etapa_maxima_alcanzada integer DEFAULT 0,
        tiempo_total_segundos integer DEFAULT 0,
        ultimo_evento timestamptz DEFAULT now(),
        asignado_a text DEFAULT 'Sin asignar',
        campana text DEFAULT '',
        embudo_id text DEFAULT 'nomada-vip',
        tipo_embudo text DEFAULT 'cita',
        whatsapp_cita_enviado boolean DEFAULT false,
        compra_completada boolean DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS notas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
        texto text NOT NULL,
        autor text DEFAULT 'Sistema',
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS eventos_actividad (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
        tipo text NOT NULL,
        descripcion text NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ghl_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        embudo_id text NOT NULL DEFAULT '',
        embudo_nombre text,
        lead_email text NOT NULL,
        lead_nombre text NOT NULL,
        method text NOT NULL CHECK (method IN ('api', 'webhook')),
        action text NOT NULL,
        status text NOT NULL CHECK (status IN ('success', 'error', 'rejected')),
        http_code integer,
        contact_id text,
        attempt integer DEFAULT 1,
        max_attempts integer DEFAULT 1,
        elapsed text,
        tag text DEFAULT '',
        payload_sent jsonb DEFAULT '{}',
        response_body text,
        error text,
        created_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_ghl_logs_embudo ON ghl_logs(embudo_id);
      CREATE INDEX IF NOT EXISTS idx_ghl_logs_status ON ghl_logs(status);
      CREATE INDEX IF NOT EXISTS idx_ghl_logs_created ON ghl_logs(created_at DESC);

      CREATE TABLE IF NOT EXISTS ghl_config (
        id text PRIMARY KEY DEFAULT 'default',
        webhook_url text DEFAULT '',
        api_key text DEFAULT '',
        location_id text DEFAULT '',
        base_url text DEFAULT 'https://services.leadconnectorhq.com',
        api_version text DEFAULT '2021-07-28',
        default_source text DEFAULT 'magic-funnel',
        timeout_ms integer DEFAULT 10000,
        retry_count integer DEFAULT 2,
        updated_at timestamptz DEFAULT now()
      );

      INSERT INTO ghl_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
    `

    const { error: createError } = await supabase.rpc("exec_sql", { query: createTableSQL })

    if (createError) {
      const { error: checkError } = await supabase.from("leads").select("id", { count: "exact", head: true })
      if (checkError) {
        return NextResponse.json(
          { success: false, error: "No se pudieron crear las tablas automaticamente.", sql: createTableSQL.trim() },
          { status: 500 }
        )
      }
    }

    if (seed) {
      const { count } = await supabase.from("leads").select("id", { count: "exact", head: true })
      if ((count || 0) === 0) {
        const { error: insertError } = await supabase.from("leads").insert([
          { nombre: "Carlos Martinez", email: "carlos.martinez@demo.com", fuente: "TikTok", etapa: "contactado" },
          { nombre: "Maria Garcia", email: "maria.garcia@demo.com", fuente: "Meta Ads", etapa: "llamada_agendada" },
          { nombre: "Juan Lopez", email: "juan.lopez@demo.com", fuente: "Instagram", etapa: "cerrado" },
        ])
        if (insertError) {
          return NextResponse.json(
            { success: false, error: "Tablas creadas pero error al insertar datos: " + insertError.message },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: seed ? "Base de datos configurada con datos de ejemplo" : "Tablas creadas correctamente",
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Error: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 500 }
    )
  }
}
