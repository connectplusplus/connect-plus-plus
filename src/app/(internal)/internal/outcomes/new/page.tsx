import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'
import { createDraftAndRedirect } from '../actions'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function NewOutcomeTemplatePage({ searchParams }: PageProps) {
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

  const { error } = await searchParams

  return (
    <div className="max-w-xl mx-auto space-y-6">
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
          Start a draft. You&apos;ll fill in the rest of the configuration in the Configurator.
        </p>
      </div>

      <form action={createDraftAndRedirect} className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Title <span className="text-[#F87171]">*</span>
          </label>
          <Input
            name="title"
            placeholder="e.g. Automated Testing Setup"
            required
            minLength={3}
            maxLength={80}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Slug <span className="text-[#F87171]">*</span>
          </label>
          <Input
            name="slug"
            placeholder="automated-testing"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
          />
          <p className="text-[#94A3B8] text-xs">
            Lowercase, hyphen-separated. This becomes the URL at /marketplace/outcomes/[slug].
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Category <span className="text-[#F87171]">*</span>
          </label>
          <select
            name="category"
            required
            defaultValue="custom"
            className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/internal/outcomes"
            className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold"
          >
            Create draft
          </Button>
        </div>
      </form>
    </div>
  )
}
