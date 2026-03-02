const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableSettings() {
    // First, fetch the current community to see if its settings exist
    const { data: community, error: fetchErr } = await supabase
        .from('communities')
        .select('*')
        .eq('id', 'skalia-vip')
        .single();

    if (fetchErr) {
        console.error('Error fetching skalia-vip:', fetchErr.message);
        return;
    }

    const newSettings = {
        zoom_enabled: true,
        calendar_enabled: true,
        whatsapp_reminders_enabled: true,
        agenda_enabled: true,
        mailing_enabled: true
    };

    const { error: updateErr } = await supabase
        .from('communities')
        .update({ settings: newSettings })
        .eq('id', 'skalia-vip');

    if (updateErr) {
        console.error('Error updating settings (the column might not exist):', updateErr.message);
    } else {
        console.log('Successfully enabled all settings for Skalia VIP!');
    }
}

enableSettings();
