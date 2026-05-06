import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowRight, Sparkles, Files, Pencil } from 'lucide-react'

export default async function NewTemplateChooserPage() {
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

  // Surface a Copy-from option only when at least one published template
  // exists; otherwise the path leads nowhere useful.
  const { count: publishedCount } = await supabase
    .from('outcome_templates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        href="/internal/outcomes"
        className="inline-flex items-center gap-1.5 text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to templates
      </Link>

      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
          New outcome template
        </h2>
        <p className="text-[#64748B] text-sm">
          Choose how to start. You can edit everything in the Configurator afterward.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChooserCard
          href="/internal/outcomes/new/ai"
          icon={<Sparkles size={20} className="text-[#7C3AED]" />}
          title="AI-guided"
          subtitle="Answer 3 questions, optionally upload a scope doc, get a 70%+ pre-populated draft."
          cta="Use AI to draft"
          accent="#7C3AED"
          recommended
        />
        <ChooserCard
          href="/internal/outcomes/new/copy"
          icon={<Files size={20} className="text-[#0F172A]" />}
          title="Copy from existing"
          subtitle={
            (publishedCount ?? 0) > 0
              ? 'Start from a published template. We clone everything except the slug, title, and version.'
              : 'No published templates yet — comes alive once you have at least one.'
          }
          cta="Pick a template"
          accent="#0F172A"
          disabled={(publishedCount ?? 0) === 0}
        />
        <ChooserCard
          href="/internal/outcomes/new/manual"
          icon={<Pencil size={20} className="text-[#64748B]" />}
          title="Manual"
          subtitle="Start from an empty draft. Edit every field by hand."
          cta="Start blank"
          accent="#64748B"
        />
      </div>
    </div>
  )
}

function ChooserCard({
  href,
  icon,
  title,
  subtitle,
  cta,
  accent,
  recommended = false,
  disabled = false,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  cta: string
  accent: string
  recommended?: boolean
  disabled?: boolean
}) {
  const card = (
    <div
      className={`bg-white border rounded-xl p-5 flex flex-col h-full transition-all ${
        disabled
          ? 'border-[#E2E8F0] opacity-50 cursor-not-allowed'
          : 'border-[#E2E8F0] hover:border-[#7C3AED]/30 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}10` }}
        >
          {icon}
        </div>
        {recommended && (
          <span className="text-[10px] font-mono-brand uppercase tracking-widest font-semibold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded-full">
            Recommended
          </span>
        )}
      </div>
      <h3 className="font-heading font-semibold text-[#0F172A] text-base mb-1">{title}</h3>
      <p className="text-[#64748B] text-xs leading-relaxed flex-1">{subtitle}</p>
      <div
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: disabled ? '#94A3B8' : accent }}
      >
        {cta}
        {!disabled && <ArrowRight size={12} />}
      </div>
    </div>
  )

  if (disabled) return card
  return <Link href={href}>{card}</Link>
}
