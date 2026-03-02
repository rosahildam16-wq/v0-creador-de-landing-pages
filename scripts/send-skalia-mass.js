const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const React = require('react');

// Mocking React and components for a pure Node script is tricky
// I'll use the API route via a local fetch if it's running, or just use the logic directly.

// For now, I'll create a script that just uses the Resend API directly to send a test to the user first.

async function massEmail() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (key) => {
        const match = envContent.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };

    const resendKey = getEnv('RESEND_API_KEY');
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!resendKey || !supabaseUrl || !supabaseKey) {
        console.error('Missing config');
        return;
    }

    const resend = new Resend(resendKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- MASS EMAIL SKALIA (DIAMANTECELION) ---');

    const { data: members, error } = await supabase
        .from('community_members')
        .select('email, name')
        .eq('discount_code', 'DIAMANTECELION');

    if (error) {
        console.error('Error fetching members:', error);
        return;
    }

    if (!members || members.length === 0) {
        console.log('0 members found with code DIAMANTECELION.');
        console.log('Sending a single test email to the user provided address to verify the NEW Skalia design...');

        // Test to the user
        await resend.emails.send({
            from: 'Magic Funnel <notificaciones@magicfunnel.app>',
            to: ['skmetodo@gmail.com'],
            subject: '¡Bienvenido a la Élite! Skalia + Magic Funnel 🚀',
            html: `
        <div style="background-color: #05010d; color: white; padding: 40px; font-family: sans-serif; border-radius: 20px;">
          <h1 style="color: #a855f7;">¡HOLA TEST!</h1>
          <p style="font-size: 18px; color: rgba(255,255,255,0.8);">
            Prepárate, porque <strong>la nueva era del marketing para networkers ha comenzado</strong>.
          </p>
          <p>Hemos renovado nuestra plataforma con un <strong>nuevo dominio y un diseño élite</strong>.</p>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin: 20px 0;">
             <p>🚀 <b>Nuevo Dominio:</b> magicfunnel.app</p>
             <p>🚀 <b>Diseño Pro:</b> Interfaz optimizada.</p>
             <p>🚀 <b>Poder IA:</b> Embudos automáticos.</p>
          </div>
          <a href="https://magicfunnel.app/login" style="background: #a855f7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block;">ACCEDER AHORA</a>
        </div>
      `
        });
        console.log('Test email sent to skmetodo@gmail.com with NEW design.');
        return;
    }

    console.log(`Sending to ${members.length} members...`);
    // Mass sending logic would go here
}

massEmail();
