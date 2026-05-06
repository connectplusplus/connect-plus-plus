'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ChangelogEntry,
  OutcomeCategory,
  OutcomeCategoryRow,
  OutcomeTemplate,
} from '@/lib/types'
import { validateForPublish, bumpVersion } from '@/lib/configurator/validation'
import type { ValidationError } from '@/lib/configurator/validation'

const AUTHOR_ROLES = ['pm', 'delivery_lead'] as const

async function assertDeliveryAuthor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !AUTHOR_ROLES.includes(internalUser.role as typeof AUTHOR_ROLES[number])) {
    return { error: 'Forbidden' as const }
  }

  return { supabase, user, internalUser }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function createDraftTemplate(input: {
  slug: string
  title: string
  category: OutcomeCategory
}): Promise<{ slug?: string; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const slug = input.slug.trim().toLowerCase()
  const title = input.title.trim()

  if (!SLUG_RE.test(slug)) {
    return { error: 'Slug must be lowercase, hyphen-separated (e.g. "automated-testing").' }
  }
  if (title.length < 3) {
    return { error: 'Title is too short.' }
  }

  const { data, error } = await auth.supabase
    .from('outcome_templates')
    .insert({
      slug,
      title,
      subtitle: '',
      description: '',
      category: input.category,
      intake_schema: { fields: [] },
      author_id: auth.user.id,
      status: 'draft',
      version: '1.0.0',
    })
    .select('slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: `A template with slug "${slug}" already exists.` }
    }
    return { error: error.message }
  }

  revalidatePath('/internal/outcomes')
  return { slug: data.slug }
}

export async function createDraftAndRedirect(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const title = String(formData.get('title') ?? '')
  const category = String(formData.get('category') ?? 'custom') as OutcomeCategory

  const result = await createDraftTemplate({ slug, title, category })
  if (result.error) {
    // Surface error via query param so the page can render it
    redirect(`/internal/outcomes/new?error=${encodeURIComponent(result.error)}`)
  }
  redirect(`/internal/outcomes/${result.slug}/edit#overview`)
}

export async function saveTemplate(
  id: string,
  partial: Partial<OutcomeTemplate>
): Promise<{ ok?: true; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase
    .from('outcome_templates')
    .update(partial)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/internal/outcomes')
  return { ok: true }
}

export async function publishTemplate(
  id: string,
  options: { breakingChange?: boolean; notes?: string } = {}
): Promise<{
  ok?: true
  version?: string
  errors?: ValidationError[]
  error?: string
}> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  // Re-load the canonical row so validation runs against the stored copy,
  // not whatever the client-side editor thinks is true.
  const { data: row, error: fetchErr } = await auth.supabase
    .from('outcome_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !row) {
    return { error: fetchErr?.message ?? 'Template not found.' }
  }

  const template = row as OutcomeTemplate

  const result = validateForPublish(template)
  if (!result.ok) {
    return { errors: result.errors }
  }

  const nextVersion = bumpVersion(
    template.version ?? '1.0.0',
    options.breakingChange ? 'major' : 'minor'
  )

  const newEntry: ChangelogEntry = {
    version: nextVersion,
    changed_by: auth.user.id,
    changed_at: new Date().toISOString(),
    notes:
      options.notes?.trim() ||
      (options.breakingChange
        ? `Published ${nextVersion} (breaking change)`
        : `Published ${nextVersion}`),
  }

  const changelog = [...(template.changelog ?? []), newEntry]

  const { error: updateErr } = await auth.supabase
    .from('outcome_templates')
    .update({
      status: 'published',
      version: nextVersion,
      published_at: new Date().toISOString(),
      changelog,
    })
    .eq('id', id)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/internal/outcomes')
  revalidatePath(`/internal/outcomes/${template.slug}/edit`)
  revalidatePath(`/marketplace/outcomes/${template.slug}`)
  revalidatePath('/marketplace/outcomes')

  return { ok: true, version: nextVersion }
}

// ── Smart-intake: insert a fully-populated draft ─────────────────────────────
//
// Sibling of createDraftTemplate. Used by /api/internal/outcomes/extract
// after Claude returns. Auto-suffixes the slug on collision so simultaneous
// extractions for similarly-named outcomes don't trip on the unique index.

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled'
}

export async function createPopulatedDraft(input: {
  template: Partial<OutcomeTemplate>
  ai_suggested_fields: string[]
  desired_slug?: string
}): Promise<{ slug?: string; id?: string; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const t = input.template
  if (!t.title) return { error: 'Extracted template is missing a title.' }
  if (!t.category) return { error: 'Extracted template is missing a category.' }

  const baseSlug = slugify(input.desired_slug || t.slug || t.title)

  // Find a free slug — try base, then base-2, base-3 etc. Cap retries so a
  // pathological collision doesn't loop.
  let slug = baseSlug
  for (let attempt = 0; attempt < 25; attempt++) {
    const { data, error } = await auth.supabase
      .from('outcome_templates')
      .insert({
        slug,
        title: t.title,
        subtitle: t.subtitle ?? '',
        description: t.description ?? '',
        icon: t.icon ?? null,
        category: t.category,
        intake_schema: t.intake_schema ?? { fields: [] },
        author_id: auth.user.id,
        status: 'draft',
        version: t.version ?? '0.1.0',
        published_at: null,
        pricing: t.pricing ?? {},
        timeline: t.timeline ?? {},
        price_range_low: t.price_range_low ?? null,
        price_range_high: t.price_range_high ?? null,
        timeline_range_low: t.timeline_range_low ?? null,
        timeline_range_high: t.timeline_range_high ?? null,
        deliverables: t.deliverables ?? [],
        milestone_templates: t.milestone_templates ?? [],
        delivery_config: t.delivery_config ?? {},
        audit_config_defaults: t.audit_config_defaults ?? {},
        guarantees: t.guarantees ?? [],
        changelog: [],
        ai_suggested_fields: input.ai_suggested_fields,
      })
      .select('id, slug')
      .single()

    if (!error && data) {
      revalidatePath('/internal/outcomes')
      return { slug: data.slug, id: data.id }
    }

    if (error?.code === '23505') {
      // Unique violation on slug — try the next suffix.
      slug = `${baseSlug}-${attempt + 2}`
      continue
    }

    return { error: error?.message ?? 'Failed to insert draft.' }
  }

  return {
    error: `Could not find a free slug after 25 attempts. Try a more specific title.`,
  }
}

// ── Smart-intake: dismiss an AI-suggested field marker ───────────────────────

export async function dismissAISuggestion(
  templateId: string,
  fieldPath: string
): Promise<{ ok?: true; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const { data: row, error: fetchErr } = await auth.supabase
    .from('outcome_templates')
    .select('ai_suggested_fields, slug')
    .eq('id', templateId)
    .single()

  if (fetchErr || !row) return { error: fetchErr?.message ?? 'Template not found.' }

  const current = (row.ai_suggested_fields ?? []) as string[]
  const next = current.filter((p) => p !== fieldPath)

  const { error } = await auth.supabase
    .from('outcome_templates')
    .update({ ai_suggested_fields: next })
    .eq('id', templateId)

  if (error) return { error: error.message }

  revalidatePath(`/internal/outcomes/${row.slug}/edit`)
  return { ok: true }
}

// ── Categories ───────────────────────────────────────────────────────────────

const CATEGORY_KEY_RE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export async function createCategory(input: {
  key: string
  label: string
  color: string
}): Promise<{ category?: OutcomeCategoryRow; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const key = input.key.trim().toLowerCase().replace(/-/g, '_')
  const label = input.label.trim()
  const color = input.color.trim()

  if (!CATEGORY_KEY_RE.test(key)) {
    return { error: 'Key must be lowercase, underscore-separated (e.g. "snowflake" or "open_ai").' }
  }
  if (label.length < 2 || label.length > 60) {
    return { error: 'Label must be 2–60 characters.' }
  }
  if (!HEX_RE.test(color)) {
    return { error: 'Color must be a 6-digit hex like #7C3AED.' }
  }

  const { data: maxRow } = await auth.supabase
    .from('outcome_categories')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const display_order = ((maxRow?.display_order as number | undefined) ?? -1) + 1

  const { data, error } = await auth.supabase
    .from('outcome_categories')
    .insert({ key, label, color, display_order, created_by: auth.user.id })
    .select('key, label, color, display_order, created_by, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: `A category with key "${key}" already exists.` }
    }
    return { error: error.message }
  }

  revalidatePath('/internal/outcomes/new')
  revalidatePath('/internal/outcomes')
  return { category: data as OutcomeCategoryRow }
}

export async function archiveTemplate(id: string): Promise<{ ok?: true; error?: string }> {
  const auth = await assertDeliveryAuthor()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase
    .from('outcome_templates')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/internal/outcomes')
  return { ok: true }
}
