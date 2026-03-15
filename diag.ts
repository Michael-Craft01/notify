import { createClient } from './src/utils/supabase/server'
import { cookies } from 'next/headers'

async function check() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('--- DIAGNOSTIC ---')
  console.log('Current User ID:', user?.id)
  
  if (user) {
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    console.log('Profile:', profile)
  }
  
  const { data: programs } = await supabase.from('programs').select('id, name, is_public')
  console.log('Programs:', programs)
  console.log('--- END ---')
}

check()
