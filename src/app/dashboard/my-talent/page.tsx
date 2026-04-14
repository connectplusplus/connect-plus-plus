import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyTalentClient } from './my-talent-client'

export default async function MyTalentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, companies(name)')
    .eq('id', user.id)
    .single()

  const companyName = (userProfile?.companies as { name?: string } | null)?.name ?? 'Your Company'

  return <MyTalentClient companyName={companyName} />
}
