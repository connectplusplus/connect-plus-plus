'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from 'lucide-react'
import { FileDropzone } from '@/components/internal/configurator/file-dropzone'
import {
  ExtractionProgress,
  type ProgressStage,
} from '@/components/internal/configurator/extraction-progress'
import type { OutcomeCategoryRow } from '@/lib/types'
import type { ExtractErrorCode } from '@/lib/files/types'

interface ServerError {
  code: ExtractErrorCode | string
  message: string
  details?: string
  retryable: boolean
  affected_file?: string
}

interface Props {
  categories: OutcomeCategoryRow[]
}

export function AIIntakeForm({ categories }: Props) {
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  const [serviceName, setServiceName] = useState('')
  const [category, setCategory] = useState(categories[0]?.key ?? 'custom')
  const [whatItDelivers, setWhatItDelivers] = useState('')
  const [budgetTimeline, setBudgetTimeline] = useState('')
  const [anythingElse, setAnythingElse] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const [extracting, setExtracting] = useState(false)
  const [stage, setStage] = useState<ProgressStage | null>(null)
  const [retryReason, setRetryReason] = useState<string | undefined>()
  const [error, setError] = useState<ServerError | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  function reset() {
    setExtracting(false)
    setStage(null)
    setRetryReason(undefined)
  }

  function handleCancel() {
    abortRef.current?.abort()
    reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setShowDetails(false)
    setExtracting(true)
    setStage('preparing')
    setRetryReason(undefined)

    const formData = new FormData()
    formData.set('service_name', serviceName.trim())
    formData.set('category', category)
    formData.set('what_it_delivers', whatItDelivers.trim())
    if (budgetTimeline.trim()) formData.set('budget_timeline', budgetTimeline.trim())
    if (anythingElse.trim()) formData.set('anything_else', anythingElse.trim())
    for (const f of files) formData.append('files', f)

    const ac = new AbortController()
    abortRef.current = ac

    let res: Response
    try {
      res = await fetch('/api/internal/outcomes/extract', {
        method: 'POST',
        body: formData,
        signal: ac.signal,
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        reset()
        return
      }
      reset()
      setError({
        code: 'API_ERROR',
        message: 'The request to the server failed before a response arrived.',
        details: err instanceof Error ? err.message : String(err),
        retryable: true,
      })
      return
    }

    // Non-streaming error path (auth / rate-limit / parse pre-flight)
    if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await res.json()
        reset()
        setError(body.error ?? {
          code: 'API_ERROR',
          message: 'The server returned an error.',
          retryable: true,
        })
      } catch {
        reset()
        setError({
          code: 'API_ERROR',
          message: `Server returned ${res.status}.`,
          retryable: true,
        })
      }
      return
    }

    if (!res.body) {
      reset()
      setError({
        code: 'API_ERROR',
        message: 'No response body — likely a network or proxy issue.',
        retryable: true,
      })
      return
    }

    // Stream SSE events
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let success: { slug: string } | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Parse SSE message frames split by \n\n
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          if (!frame.trim()) continue
          let eventName = 'message'
          let data = ''
          for (const line of frame.split('\n')) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim()
            else if (line.startsWith('data: ')) data += line.slice(6)
          }
          if (!data) continue

          let payload: unknown
          try {
            payload = JSON.parse(data)
          } catch {
            continue
          }

          if (eventName === 'status') {
            const stagePayload = payload as { stage: ProgressStage; reason?: string }
            setStage(stagePayload.stage)
            if (stagePayload.stage === 'retry') {
              setRetryReason(stagePayload.reason)
            }
          } else if (eventName === 'file_errors') {
            // Surface file-level errors but keep going — partial input is fine.
            const fe = (payload as { errors: Array<{ message: string }> }).errors
            console.warn('[smart-intake] file errors:', fe)
          } else if (eventName === 'error') {
            setError(payload as ServerError)
          } else if (eventName === 'done') {
            success = payload as { slug: string }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError({
          code: 'API_ERROR',
          message: 'The connection dropped while reading the response.',
          details: err instanceof Error ? err.message : String(err),
          retryable: true,
        })
      }
    } finally {
      abortRef.current = null
    }

    reset()

    if (success) {
      router.push(`/internal/outcomes/${success.slug}/edit?ai=1`)
    }
  }

  const canSubmit =
    serviceName.trim().length >= 3 &&
    whatItDelivers.trim().length >= 10 &&
    !!category

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Service name <span className="text-[#F87171]">*</span>
          </label>
          <Input
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Code Review Service"
            required
            minLength={3}
            maxLength={80}
            disabled={extracting}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Category <span className="text-[#F87171]">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={extracting}
            required
            className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none disabled:opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-[#94A3B8] text-xs">
            New categories can be added on the manual intake page.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            What does this service deliver? <span className="text-[#F87171]">*</span>
          </label>
          <Textarea
            value={whatItDelivers}
            onChange={(e) => setWhatItDelivers(e.target.value)}
            placeholder="In 1–2 sentences: what does the client get out of this engagement?"
            rows={3}
            required
            minLength={10}
            maxLength={500}
            disabled={extracting}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Approximate budget and timeline{' '}
            <span className="text-[#94A3B8] text-xs font-normal">(optional)</span>
          </label>
          <Input
            value={budgetTimeline}
            onChange={(e) => setBudgetTimeline(e.target.value)}
            placeholder="e.g. $4,500 fixed, 5 business days"
            disabled={extracting}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Anything else important?{' '}
            <span className="text-[#94A3B8] text-xs font-normal">(optional)</span>
          </label>
          <Textarea
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            placeholder="Constraints, partner stack, target client size, anything you'd tell a teammate scoping this for the first time."
            rows={2}
            disabled={extracting}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <label className="block text-sm font-medium text-[#0F172A]">
            Reference materials{' '}
            <span className="text-[#94A3B8] text-xs font-normal">(optional)</span>
          </label>
          <p className="text-[#94A3B8] text-xs">
            Scope docs, proposals, decks, anything Delivery already has. Claude reads them
            and pulls structure into the draft.
          </p>
          <FileDropzone files={files} onChange={setFiles} disabled={extracting} />
        </div>

        {error && (
          <ErrorCard
            error={error}
            showDetails={showDetails}
            toggleDetails={() => setShowDetails((v) => !v)}
            onDismiss={() => setError(null)}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/internal/outcomes/new"
            className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={!canSubmit || extracting}
            className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-11 px-5"
          >
            <Sparkles size={14} className="mr-2" />
            Extract template →
          </Button>
        </div>
      </form>

      {extracting && (
        <ExtractionProgress
          stage={stage}
          fileCount={files.length}
          retryReason={retryReason}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

function ErrorCard({
  error,
  showDetails,
  toggleDetails,
  onDismiss,
}: {
  error: ServerError
  showDetails: boolean
  toggleDetails: () => void
  onDismiss: () => void
}) {
  return (
    <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[#B91C1C] text-sm font-semibold">
            {error.message}
          </p>
          {error.affected_file && (
            <p className="text-[#B91C1C] text-xs mt-1">File: {error.affected_file}</p>
          )}
          <p className="text-[#94A3B8] text-[10px] mt-1 font-mono-brand">
            {error.code}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#94A3B8] hover:text-[#0F172A] text-xs"
        >
          Dismiss
        </button>
      </div>
      {error.details && (
        <div>
          <button
            type="button"
            onClick={toggleDetails}
            className="text-[#B91C1C] text-xs underline"
          >
            {showDetails ? 'Hide technical details' : 'Show technical details'}
          </button>
          {showDetails && (
            <pre className="mt-2 text-[#64748B] text-[11px] bg-white border border-[#E2E8F0] rounded p-2 whitespace-pre-wrap overflow-x-auto">
              {error.details}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
