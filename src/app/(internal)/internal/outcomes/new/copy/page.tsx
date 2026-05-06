import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { CopyTemplateList } from './copy-list'
import { categoryColor, categoryLabel } from '@/lib/constants'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function CopyFromTemplatePage({ searchParams }: PageProps) {
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

  const { error: errorParam } = await searchParams

  const { data: templates } = await supabase
    .from('outcome_templates')
    .select('id, slug, title, subtitle, category, version, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const list = (templates ?? []).map((t) => ({
    slug: t.slug as string,
    title: t.title as string,
    subtitle: (t.subtitle as string | null) ?? null,
    category: t.category as string,
    version: (t.version as string | null) ?? '1.0.0',
    catLabel: categoryLabel(t.category as string),
    catColor: categoryColor(t.category as string),
  }))

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
          Copy from existing
        </h2>
        <p className="text-[#64748B] text-sm">
          Pick a published template as your starting point. We&apos;ll clone every field
          except the slug, title, version, and changelog.
        </p>
      </div>

      <CopyTemplateList templates={list} initialError={errorParam ?? null} />
    </div>
  )
}
