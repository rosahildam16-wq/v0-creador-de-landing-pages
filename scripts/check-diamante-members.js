const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function checkMembers() {
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

    console.log('Fetching members with discount_code: DIAMANTECELION...');

    const { data, error } = await supabase
        .from('community_members')
        .select('email, name, discount_code, community_id')
        .eq('discount_code', 'DIAMANTECELION');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} members with this code.`);
    data.forEach(m => {
        console.log(`- ${m.name} (${m.email}) [Community: ${m.community_id}]`);
    });
}

checkMembers();
