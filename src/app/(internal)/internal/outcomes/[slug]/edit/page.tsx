import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OutcomeTemplate, OutcomeCategoryRow } from '@/lib/types'
import { ConfiguratorShell } from './configurator-shell'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ConfiguratorEditPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !['pm', 'delivery_lead'].includes(internalUser.role)) {
    redirect('/internal')
  }

  const { slug } = await params

  const [{ data: template }, { data: categories }] = await Promise.all([
    supabase
      .from('outcome_templates')
      .select('*, internal_users(full_name)')
      .eq('slug', slug)
      .single(),
    supabase
      .from('outcome_categories')
      .select('key, label, color, display_order, created_by, created_at')
      .order('display_order', { ascending: true }),
  ])

  if (!template) notFound()

  const raw = template as unknown as OutcomeTemplate & {
    internal_users: { full_name: string } | { full_name: string }[] | null
  }
  const authorObj = Array.isArray(raw.internal_users) ? raw.internal_users[0] : raw.internal_users
  const normalized = { ...raw, internal_users: authorObj ?? null }

  return (
    <ConfiguratorShell
      template={normalized}
      categories={(categories ?? []) as OutcomeCategoryRow[]}
      currentUserName={internalUser.full_name}
    />
  )
}
