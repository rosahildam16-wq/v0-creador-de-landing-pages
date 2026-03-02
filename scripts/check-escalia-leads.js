const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function checkLeads() {
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

    console.log('Fetching leads for community: skalia-vip (DIAMANTECELION)...');

    const { data, error } = await supabase
        .from('leads')
        .select('email, nombre, community_id')
        .eq('community_id', 'skalia-vip');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} leads in Escalia community.`);
    data.forEach(l => {
        console.log(`- ${l.nombre} (${l.email})`);
    });
}

checkLeads();
