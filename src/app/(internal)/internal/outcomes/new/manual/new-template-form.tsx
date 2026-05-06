'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, X } from 'lucide-react'
import { createCategory, createDraftAndRedirect } from '../../actions'
import type { OutcomeCategoryRow } from '@/lib/types'

const ADD_NEW = '__add_new__'

interface Props {
  categories: OutcomeCategoryRow[]
  initialError: string | null
}

export function NewTemplateForm({ categories: initial, initialError }: Props) {
  const [categories, setCategories] = useState(initial)
  const [selected, setSelected] = useState<string>(initial[0]?.key ?? 'custom')
  const [showAddCategory, setShowAddCategory] = useState(false)

  // New-category panel state
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#7C3AED')
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  function handleSelectChange(value: string) {
    if (value === ADD_NEW) {
      setShowAddCategory(true)
      setCategoryError(null)
      // selected stays on the previous valid value so the form's submitted value remains valid
    } else {
      setSelected(value)
      setShowAddCategory(false)
    }
  }

  function deriveKeyFromLabel(label: string) {
    // Suggest a key from the label as the user types — only if the user hasn't
    // hand-edited the key field.
    return label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  function handleLabelChange(label: string) {
    setNewLabel(label)
    // Only auto-fill the key while it matches the previously-suggested form
    if (newKey === '' || newKey === deriveKeyFromLabel(newLabel)) {
      setNewKey(deriveKeyFromLabel(label))
    }
  }

  async function handleSaveCategory() {
    setSavingCategory(true)
    setCategoryError(null)
    const result = await createCategory({ key: newKey, label: newLabel, color: newColor })
    setSavingCategory(false)

    if (result.error) {
      setCategoryError(result.error)
      return
    }

    if (result.category) {
      setCategories([...categories, result.category])
      setSelected(result.category.key)
      setShowAddCategory(false)
      setNewKey('')
      setNewLabel('')
      setNewColor('#7C3AED')
    }
  }

  function cancelAddCategory() {
    setShowAddCategory(false)
    setCategoryError(null)
  }

  return (
    <form
      action={createDraftAndRedirect}
      className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
    >
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
        {/* The select is a UI control only; the hidden input is what the form posts.
            That keeps the "+ Add new" sentinel out of the submitted FormData. */}
        <select
          value={showAddCategory ? ADD_NEW : selected}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          {categories.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value={ADD_NEW}>+ Add new category…</option>
        </select>
        <input type="hidden" name="category" value={selected} />

        {showAddCategory && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[#0F172A] text-sm font-semibold">New category</p>
              <button
                type="button"
                onClick={cancelAddCategory}
                className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#64748B] text-xs">Display label</label>
              <Input
                value={newLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Snowflake"
                className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#64748B] text-xs">Key</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="snowflake"
                className="bg-white border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-9"
              />
              <p className="text-[#94A3B8] text-[11px]">
                Lowercase, underscore-separated. Auto-derived from the label; edit if needed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#64748B] text-xs">Brand color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-9 rounded-md border border-[#E2E8F0] bg-white cursor-pointer p-1"
                  aria-label="Color picker"
                />
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#7C3AED"
                  className="bg-white border-[#E2E8F0] text-[#0F172A] font-mono-brand uppercase focus:border-[#7C3AED] h-9 flex-1"
                  maxLength={7}
                />
              </div>
            </div>

            {categoryError && (
              <p className="text-[#F87171] text-xs bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-3 py-2">
                {categoryError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelAddCategory}
                className="text-[#64748B] text-xs hover:text-[#0F172A] transition-colors px-2 h-8"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleSaveCategory}
                disabled={savingCategory || !newLabel || !newKey}
                size="sm"
                className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-8 px-3"
              >
                {savingCategory ? (
                  <Loader2 size={12} className="mr-1.5 animate-spin" />
                ) : (
                  <Plus size={12} className="mr-1.5" />
                )}
                Save category
              </Button>
            </div>
          </div>
        )}
      </div>

      {initialError && (
        <p className="text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-4 py-3">
          {initialError}
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
  )
}
