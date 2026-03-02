const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

async function test() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/RESEND_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error('RESEND_API_KEY not found in .env.local');
        return;
    }

    const resend = new Resend(apiKey);

    console.log('Sending welcome test email to skmetodo@gmail.com...');

    const { data, error } = await resend.emails.send({
        from: 'Magic Funnel <notificaciones@magicfunnel.app>',
        to: ['skmetodo@gmail.com'],
        subject: '¡Bienvenido a Magic Funnel! 🚀 (Prueba)',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #05010d; color: #ffffff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #a855f7; font-style: italic; font-weight: 900; text-transform: uppercase;">¡Hola, Socio de Prueba!</h1>
        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
          Bienvenido a la nueva era del marketing con IA. Este es un correo de prueba de <strong>Bienvenida</strong> para validar que los flujos de activación están funcionando correctamente.
        </p>
        <div style="margin: 30px 0; padding: 20px; background: rgba(168,85,247,0.1); border-left: 4px solid #a855f7; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold;">Acceso al Dashboard:</p>
          <a href="https://magicfunnel.app/login" style="color: #a855f7; text-decoration: none;">https://magicfunnel.app/login</a>
        </div>
        <p style="font-size: 14px; color: rgba(255,255,255,0.4);">
          Si recibes este correo, significa que la integración con Resend está lista para el despliegue.
        </p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
        <p style="font-size: 12px; text-align: center; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px;">
          © 2026 MAGIC FUNNEL - ESCALANDO CON IA
        </p>
      </div>
    `
    });

    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent successfully!', data);
    }
}

test();
