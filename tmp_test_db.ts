import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://viegyabgubbcfkxnwsga.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I' // from .env
)

async function run() {
    const { data: subs, error: subErr } = await supabase
        .from('user_subscriptions')
        .select(`
            id, 
            subscription, 
            device_type,
            user_id,
            users (
                full_name,
                email,
                program_id
            )
        `)
        .limit(2)
    
    console.log("Subs error:", subErr)
    console.log("Subs data:", JSON.stringify(subs, null, 2))
}

run()
