
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testConnection() {
    console.log("🔍 Probando conexión con Supabase...")
    console.log(`URL: ${supabaseUrl}`)

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Faltan las llaves de Supabase en .env.local")
        return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const { data, error } = await supabase.from('booking_calendars').select('count', { count: 'exact', head: true })

        if (error) {
            console.error("❌ Error al conectar con Supabase:", error.message)
            if (error.message.includes("relation") || error.message.includes("does not exist")) {
                console.log("💡 Sugerencia: Parece que las tablas no han sido creadas en la base de datos.")
            }
        } else {
            console.log("✅ Conexión exitosa con la base de datos de Supabase.")
            console.log(`Total de calendarios encontrados: ${data === null ? 0 : data}`)
        }
    } catch (err) {
        console.error("❌ Error inesperado:", err)
    }
}

testConnection()
