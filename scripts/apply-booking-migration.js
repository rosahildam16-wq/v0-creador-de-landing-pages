
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

async function runMigration() {
    let connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        console.error("❌ Faltan POSTGRES_URL en .env.local");
        return;
    }

    // Limpiar sslmode de la URL para controlarlo por objeto
    connectionString = connectionString.split('?')[0];

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("✅ Conectado a la base de datos.");

        const sqlPath = path.resolve(process.cwd(), 'scripts/012-booking-module.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Ejecutando script de módulo de citas...");
        const res = await client.query(sql);
        console.log("📊 Resultado:", res.rows || res);

        console.log("✅ Tablas creadas exitosamente.");
    } catch (err) {
        console.error("❌ Error al ejecutar migración:", err.message);
    } finally {
        await client.end();
    }
}

runMigration();
