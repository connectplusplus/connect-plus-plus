'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function completeAccountSetup(companyName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Pre-generate the UUID so we never need INSERT...RETURNING,
  // which would trigger the SELECT RLS policy before the users row exists.
  const companyId = randomUUID()

  const { error: companyError } = await supabase
    .from('companies')
    .insert({ id: companyId, name: companyName })

  if (companyError) return { error: companyError.message }

  // Create user profile
  const { error: userError } = await supabase.from('users').insert({
    id: user.id,
    company_id: companyId,
    full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    role: 'owner',
  })

  if (userError) return { error: userError.message }

  revalidatePath('/dashboard')
  return { success: true }
}
