'use client'

import { useRef, useState } from 'react'
import { File as FileIcon, Upload, X } from 'lucide-react'
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  SUPPORTED_EXTENSIONS,
} from '@/lib/files/types'

const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(',')

interface Props {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx < 0 ? '' : name.slice(idx + 1).toLowerCase()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropzone({ files, onChange, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [rejection, setRejection] = useState<string | null>(null)

  function pickFiles(incoming: FileList | File[] | null) {
    if (!incoming) return
    const list = Array.from(incoming)
    const errs: string[] = []
    const accepted: File[] = []

    for (const f of list) {
      const ext = getExt(f.name)
      if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
        errs.push(`${f.name}: unsupported format`)
        continue
      }
      if (f.size > MAX_FILE_BYTES) {
        errs.push(`${f.name}: exceeds 25 MB`)
        continue
      }
      accepted.push(f)
    }

    const combined = [...files, ...accepted]
    if (combined.length > MAX_FILES) {
      errs.push(`Maximum ${MAX_FILES} files; the rest were skipped.`)
      onChange(combined.slice(0, MAX_FILES))
    } else {
      onChange(combined)
    }

    setRejection(errs.length > 0 ? errs.join(' · ') : null)
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="ai-intake-files"
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(false)
          pickFiles(e.dataTransfer.files)
        }}
        className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          disabled
            ? 'border-[#E2E8F0] bg-[#F1F5F9] opacity-60 cursor-not-allowed'
            : dragOver
              ? 'border-[#7C3AED] bg-[#7C3AED]/5'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#7C3AED]/40'
        }`}
      >
        <input
          ref={inputRef}
          id="ai-intake-files"
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          onChange={(e) => pickFiles(e.target.files)}
          disabled={disabled}
          className="sr-only"
        />
        <Upload size={20} className="text-[#7C3AED] mx-auto mb-2" />
        <p className="text-[#0F172A] text-sm font-medium">
          Drop files or click to browse
        </p>
        <p className="text-[#94A3B8] text-xs mt-0.5">
          {SUPPORTED_EXTENSIONS.join(', ')} · max {MAX_FILES} files · 25 MB each
        </p>
      </label>

      {rejection && (
        <p className="text-[#F59E0B] text-xs">{rejection}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 flex items-center gap-3"
            >
              <FileIcon size={14} className="text-[#94A3B8] shrink-0" />
              <span className="text-[#0F172A] text-sm truncate flex-1">{f.name}</span>
              <span className="text-[#94A3B8] text-xs font-mono-brand shrink-0">
                {formatSize(f.size)}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                aria-label={`Remove ${f.name}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
