import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Layers, Pencil } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { TemplateStatus } from '@/lib/types'

const STATUS_FILTERS: Array<{ key: 'all' | TemplateStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
]

const STATUS_PILL: Record<TemplateStatus, { color: string; bg: string; label: string }> = {
  published: { color: '#10B981', bg: '#10B98115', label: 'Published' },
  draft: { color: '#F59E0B', bg: '#F59E0B15', label: 'Draft' },
  archived: { color: '#94A3B8', bg: '#94A3B815', label: 'Archived' },
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function OutcomesListPage({ searchParams }: PageProps) {
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

  const { status: statusParam } = await searchParams
  const filter = (STATUS_FILTERS.find((f) => f.key === statusParam)?.key ?? 'all') as
    | 'all'
    | TemplateStatus

  let query = supabase
    .from('outcome_templates')
    .select('id, slug, title, subtitle, status, version, updated_at, icon, category, internal_users(full_name)')
    .order('updated_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data: templates } = await query

  const list = (templates ?? []) as unknown as Array<{
    id: string
    slug: string
    title: string
    subtitle: string | null
    status: TemplateStatus
    version: string
    updated_at: string
    icon: string | null
    category: keyof typeof CATEGORY_LABELS
    internal_users: { full_name: string } | { full_name: string }[] | null
  }>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
            Outcome Templates
          </h2>
          <p className="text-[#64748B] text-sm">
            Author and publish the outcome catalog. Published templates appear at /marketplace/outcomes.
          </p>
        </div>
        <Link href="/internal/outcomes/new">
          <Button className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold">
            <Plus size={14} className="mr-2" />
            New template
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key
          const href = f.key === 'all' ? '/internal/outcomes' : `/internal/outcomes?status=${f.key}`
          return (
            <Link
              key={f.key}
              href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-[#7C3AED]" />
          </div>
          <h3 className="font-heading font-semibold text-[#0F172A] text-lg mb-2">
            {filter === 'all' ? 'No templates yet' : `No ${filter} templates`}
          </h3>
          <p className="text-[#64748B] text-sm mb-5">
            {filter === 'all'
              ? 'Author the first outcome template. It will appear in the L1 marketplace once published.'
              : 'Adjust the filter or create a new draft.'}
          </p>
          {filter === 'all' && (
            <Link href="/internal/outcomes/new">
              <Button className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold">
                Create the first template
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const pill = STATUS_PILL[t.status]
            const updated = new Date(t.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const authorObj = Array.isArray(t.internal_users) ? t.internal_users[0] : t.internal_users
            const author = authorObj?.full_name ?? '—'
            return (
              <div
                key={t.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between hover:border-[#7C3AED]/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                    <span className="font-mono-brand text-[10px] font-semibold text-[#64748B] uppercase">
                      {t.icon ? t.icon.slice(0, 2) : t.title.slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[#0F172A] text-sm font-semibold truncate">{t.title}</p>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ color: pill.color, backgroundColor: pill.bg }}
                      >
                        {pill.label}
                      </span>
                      <span className="font-mono-brand text-[11px] text-[#94A3B8] shrink-0">
                        v{t.version}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-xs truncate">
                      {t.subtitle || CATEGORY_LABELS[t.category]} · updated {updated} by {author}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/internal/outcomes/${t.slug}/edit#overview`}
                  className="flex items-center gap-1.5 text-[#7C3AED] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#7C3AED]/5 transition-colors shrink-0 ml-3"
                >
                  <Pencil size={12} />
                  Edit
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
