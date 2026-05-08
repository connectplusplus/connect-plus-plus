import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { AIIntakeForm } from './ai-intake-form'
import type { OutcomeCategoryRow } from '@/lib/types'

export default async function AIIntakePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !['pm', 'delivery_lead'].includes(internalUser.role)) {
    redirect('/internal')
  }

  const { data: categories } = await supabase
    .from('outcome_categories')
    .select('key, label, color, display_order, created_by, created_at')
    .order('display_order', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/internal/outcomes/new"
        className="inline-flex items-center gap-1.5 text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to options
      </Link>

      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
          AI-guided intake
        </h2>
        <p className="text-[#64748B] text-sm">
          Answer a few questions and optionally upload reference materials. Glassbox drafts the
          template; you review and refine it in the Configurator.
        </p>
      </div>

      <AIIntakeForm categories={(categories ?? []) as OutcomeCategoryRow[]} />
    </div>
  )
}
