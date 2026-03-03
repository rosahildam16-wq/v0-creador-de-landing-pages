const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function seedNotebookExamples() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const getEnv = (key) => {
        const match = envContent.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!url || !key) {
        console.error('Supabase config missing');
        return;
    }

    const supabase = createClient(url, key);

    const examples = [
        {
            community_id: 'general',
            name: 'PDF: Plan Maestro Skalia Elite',
            type: 'documento',
            file_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2630&auto=format&fit=crop',
            description: 'Manual oficial con los 12 pasos para cerrar ventas de alto valor, manejo de objeciones típicas y el guion de llamada de 4 etapas.',
            category: 'Estrategia',
            is_public: true
        },
        {
            community_id: 'general',
            name: 'Video: Entrenamiento Prospecion en Frio 2.0',
            type: 'video',
            file_url: 'https://vimeo.com/76979871',
            description: 'Clase maestra sobre cómo usar Instagram para conectar con 5 prospectos calificados al día sin quemar tu lista de contactos.',
            category: 'Entrenamiento',
            is_public: true
        },
        {
            community_id: 'general',
            name: 'Imagen: Funnel Inmortal (Arquitectura)',
            type: 'imagen',
            file_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
            description: 'Infografía técnica de la estructura del embudo: Gancho magnético -> Video educativo -> Agendamiento de cita.',
            category: 'Diseño',
            is_public: true
        }
    ];

    console.log('Seeding notebook examples for community "general"...');

    const { data, error } = await supabase
        .from('community_resources')
        .insert(examples);

    if (error) {
        console.error('Error seeding resources:', error);
    } else {
        console.log('Successfully seeded 3 pro-level examples for Notebook AI! 🥂');
    }
}

seedNotebookExamples();
