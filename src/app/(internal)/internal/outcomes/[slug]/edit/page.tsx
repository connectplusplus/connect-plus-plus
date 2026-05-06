import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OutcomeTemplate, OutcomeCategoryRow } from '@/lib/types'
import { ConfiguratorShell } from './configurator-shell'
import { AISuggestedProvider } from '@/components/internal/configurator/ai-suggested-context'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ai?: string }>
}

export default async function ConfiguratorEditPage({ params, searchParams }: PageProps) {
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
  const { ai: aiParam } = await searchParams

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

  const aiSuggestedActive = aiParam === '1'
  const aiSuggestedFields = (normalized.ai_suggested_fields ?? []) as string[]

  return (
    <AISuggestedProvider
      templateId={normalized.id}
      initialPaths={aiSuggestedFields}
      active={aiSuggestedActive}
    >
      <ConfiguratorShell
        template={normalized}
        categories={(categories ?? []) as OutcomeCategoryRow[]}
        currentUserName={internalUser.full_name}
      />
    </AISuggestedProvider>
  )
}
