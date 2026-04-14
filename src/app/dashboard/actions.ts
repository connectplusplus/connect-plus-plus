'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeAccountSetup(companyName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName })
    .select('id')
    .single()

  if (companyError) return { error: companyError.message }

  // Create user profile
  const { error: userError } = await supabase.from('users').insert({
    id: user.id,
    company_id: company.id,
    full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    role: 'owner',
  })

  if (userError) return { error: userError.message }

  revalidatePath('/dashboard')
  return { success: true }
}
