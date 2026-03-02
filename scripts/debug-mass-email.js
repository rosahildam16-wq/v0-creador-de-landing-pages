const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function debugData() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = (envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/))[1].trim();
    const supabase = createClient(url, key);

    console.log('--- 1. Checking community_members table for DIAMANTECELION ---');
    const { data: members, error: mErr } = await supabase
        .from('community_members')
        .select('*');

    if (mErr) {
        console.error('Error fetching community_members:', mErr);
    } else {
        console.log(`Total members: ${members.length}`);
        const escalia = members.filter(m =>
            (m.discount_code && m.discount_code.toUpperCase() === 'DIAMANTECELION') ||
            (m.community_id === 'skalia-vip') ||
            (m.username && m.username.includes('escalia'))
        );
        console.log(`Escalia members found: ${escalia.length}`);
        escalia.forEach(e => console.log(`- ${e.name} (${e.email}) [Code: ${e.discount_code}] [Comm: ${e.community_id}]`));

        if (escalia.length === 0 && members.length > 0) {
            console.log('First 5 members raw:');
            console.log(members.slice(0, 5).map(m => ({ email: m.email, code: m.discount_code, comm: m.community_id })));
        }
    }

    console.log('\n--- 2. Checking communities table ---');
    const { data: comms } = await supabase.from('communities').select('*');
    console.log(comms);
}

debugData();
