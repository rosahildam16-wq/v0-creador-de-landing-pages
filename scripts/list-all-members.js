const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function checkAllMembers() {
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

    const { data, error } = await supabase
        .from('community_members')
        .select('email, name, discount_code, community_id, role, created_at')
        .limit(50);

    if (error) {
        console.error('Error fetching members:', error);
        return;
    }

    console.log(`Listing first ${data.length} members:\n`);
    data.forEach(m => {
        console.log(`- ${m.name} (${m.email}) [Role: ${m.role}] [ID Comm: ${m.community_id}] [Code: ${m.discount_code}] [Joined: ${m.created_at || '?'}]`);
    });
}

checkAllMembers();
