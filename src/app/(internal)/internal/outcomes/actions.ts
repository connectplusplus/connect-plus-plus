'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OutcomeCategory, OutcomeCategoryRow, OutcomeTemplate } from '@/lib/types'

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

export async function publishTemplate(_id: string): Promise<{ error: string }> {
  // Validation + version bump + changelog land in Phase 5.
  return { error: 'Publish flow lands in Phase 5.' }
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
