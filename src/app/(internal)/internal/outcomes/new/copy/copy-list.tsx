'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Files, X } from 'lucide-react'
import { cloneTemplateAndRedirect } from '../../actions'

interface TemplateRow {
  slug: string
  title: string
  subtitle: string | null
  category: string
  version: string
  catLabel: string
  catColor: string
}

interface Props {
  templates: TemplateRow[]
  initialError: string | null
}

export function CopyTemplateList({ templates, initialError }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  if (templates.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-3">
          <Files size={20} className="text-[#7C3AED]" />
        </div>
        <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
          No published templates yet
        </h3>
        <p className="text-[#64748B] text-xs max-w-sm mx-auto">
          Use AI-guided or manual intake to publish your first template, then come back here
          for copy-from.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {initialError && (
        <p className="text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-4 py-3">
          {initialError}
        </p>
      )}
      {templates.map((t) => (
        <div
          key={t.slug}
          className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[#0F172A] text-sm font-semibold truncate">{t.title}</p>
                <span
                  className="text-[10px] font-medium border rounded-full px-1.5 py-0.5 shrink-0"
                  style={{ color: t.catColor, borderColor: `${t.catColor}40` }}
                >
                  {t.catLabel}
                </span>
                <span className="font-mono-brand text-[11px] text-[#94A3B8] shrink-0">
                  v{t.version}
                </span>
              </div>
              {t.subtitle && (
                <p className="text-[#64748B] text-xs truncate">{t.subtitle}</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant={openSlug === t.slug ? 'ghost' : 'default'}
              onClick={() => setOpenSlug(openSlug === t.slug ? null : t.slug)}
              className={
                openSlug === t.slug
                  ? 'text-[#64748B] hover:text-[#0F172A] h-9 ml-3'
                  : 'bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9 ml-3'
              }
            >
              {openSlug === t.slug ? (
                <>
                  <X size={12} className="mr-1" /> Cancel
                </>
              ) : (
                'Use as starting point'
              )}
            </Button>
          </div>

          {openSlug === t.slug && (
            <form
              action={cloneTemplateAndRedirect}
              className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3"
            >
              <input type="hidden" name="source_slug" value={t.slug} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#64748B] text-[11px] font-medium">
                    New title
                  </label>
                  <Input
                    name="new_title"
                    required
                    minLength={3}
                    maxLength={80}
                    defaultValue={`${t.title} (copy)`}
                    className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#64748B] text-[11px] font-medium">
                    New slug
                  </label>
                  <Input
                    name="new_slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    defaultValue={`${t.slug}-copy`}
                    className="bg-white border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-9"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9"
                >
                  Clone and edit
                </Button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}
