// HTML preview that mimics the rendered PDF. Pure server-component-safe
// (no hooks, no client APIs). Phase 5's PDF renderer consumes the SAME
// SowContent shape and produces a layout that visually mirrors this one
// — they share the data, not the JSX, because @react-pdf/renderer's
// primitives are not HTML.
//
// The preview is deliberately authoritative-feeling: warm/sage palette,
// serif-weighted headings, paper-color background, generous whitespace.
// Per the sprint style notes, this is a contract document, not an app
// screen.

import type { Sow, SowContent, SowStatus } from '@/lib/types'

interface Props {
  // Either a full Sow row (preferred — we get version_number + status for
  // the document header) or just the content (used when previewing a
  // not-yet-saved draft in memory).
  sow: Pick<Sow, 'version_number' | 'status'> & SowContent
  companyName: string | null
  engagementTitle: string
  // For the legal-counter-signed render Phase 5 will pass these.
  legalSignedBy?: string | null
  legalSignedAt?: string | null
  clientSignedAt?: string | null
}

const STATUS_DISPLAY: Record<SowStatus, string> = {
  draft: 'DRAFT',
  awaiting_legal: 'PENDING LEGAL REVIEW',
  rejected_by_legal: 'REVISIONS REQUESTED',
  awaiting_client: 'AWAITING CLIENT SIGNATURE',
  rejected_by_client: 'REVISIONS REQUESTED',
  signed: 'SIGNED',
  superseded: 'SUPERSEDED',
  cancelled: 'CANCELLED',
}

function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$—'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function SowPreview({
  sow,
  companyName,
  engagementTitle,
  legalSignedBy,
  legalSignedAt,
  clientSignedAt,
}: Props) {
  return (
    <article
      className="bg-[#FAF8F4] border border-[#7E8B6A]/30 rounded-lg shadow-sm p-10 font-serif text-[#1F2A1A] leading-relaxed"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {/* ── Document header ──────────────────────────────────────────── */}
      <header className="border-b border-[#7E8B6A]/30 pb-5 mb-6">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#7E8B6A] font-sans font-semibold mb-2">
          Statement of Work · v{sow.version_number} · {STATUS_DISPLAY[sow.status]}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {engagementTitle}
        </h1>
        <p className="text-sm text-[#3D4A33] mt-1.5">
          Between <strong>FullStack Labs</strong> and <strong>{companyName ?? 'Client'}</strong>
        </p>
      </header>

      {/* ── Scope summary ────────────────────────────────────────────── */}
      <section className="mb-7">
        <h2 className="text-[15px] font-semibold tracking-wide uppercase text-[#5C6B4D] mb-2.5 font-sans">
          1. Scope
        </h2>
        <div className="space-y-3 text-[14px]">
          {(sow.scope_summary || '(Scope not yet drafted.)').split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      </section>

      {/* ── Deliverables ─────────────────────────────────────────────── */}
      <section className="mb-7">
        <h2 className="text-[15px] font-semibold tracking-wide uppercase text-[#5C6B4D] mb-2.5 font-sans">
          2. Deliverables
        </h2>
        {(sow.deliverables ?? []).length === 0 ? (
          <p className="text-[#7E8B6A] text-[14px] italic">No deliverables listed.</p>
        ) : (
          <ol className="list-decimal pl-5 space-y-3 text-[14px]">
            {sow.deliverables.map((d, i) => (
              <li key={i}>
                <strong className="font-semibold">{d.name}</strong>
                {d.description && <span className="block text-[#3D4A33] mt-0.5">{d.description}</span>}
                {d.acceptance_criteria.length > 0 && (
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[13px] text-[#3D4A33]">
                    {d.acceptance_criteria.map((ac, j) => (
                      <li key={j}>{ac}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ── Milestones ───────────────────────────────────────────────── */}
      <section className="mb-7">
        <h2 className="text-[15px] font-semibold tracking-wide uppercase text-[#5C6B4D] mb-2.5 font-sans">
          3. Milestones &amp; payment schedule
        </h2>
        {(sow.milestones ?? []).length === 0 ? (
          <p className="text-[#7E8B6A] text-[14px] italic">No milestones listed.</p>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#7E8B6A]/30">
                <th className="text-left py-1.5 font-semibold w-1/3">Milestone</th>
                <th className="text-left py-1.5 font-semibold">Description</th>
                <th className="text-right py-1.5 font-semibold w-20">Days</th>
                <th className="text-right py-1.5 font-semibold w-20">Payment</th>
              </tr>
            </thead>
            <tbody>
              {sow.milestones.map((m, i) => (
                <tr key={i} className="border-b border-[#7E8B6A]/10 align-top">
                  <td className="py-2 pr-2 font-semibold">{m.name}</td>
                  <td className="py-2 pr-2 text-[#3D4A33]">{m.description}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{m.expected_business_days}</td>
                  <td className="py-2 text-right tabular-nums">{m.payment_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Pricing & timeline ──────────────────────────────────────── */}
      <section className="mb-7 grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-[12px] font-semibold tracking-widest uppercase text-[#5C6B4D] mb-1 font-sans">
            Total
          </h3>
          <p className="text-[20px] font-bold tabular-nums">
            {formatCents(sow.pricing?.total_cents ?? 0)} {sow.pricing?.currency ?? 'USD'}
          </p>
        </div>
        <div>
          <h3 className="text-[12px] font-semibold tracking-widest uppercase text-[#5C6B4D] mb-1 font-sans">
            Timeline
          </h3>
          <p className="text-[20px] font-bold tabular-nums">
            {sow.timeline_business_days || 0} <span className="text-[14px] font-normal">business days</span>
          </p>
        </div>
        <div className="col-span-2">
          <h3 className="text-[12px] font-semibold tracking-widest uppercase text-[#5C6B4D] mb-1 font-sans">
            Payment terms
          </h3>
          <SimpleMarkdown text={sow.pricing?.payment_terms_md ?? ''} />
        </div>
      </section>

      {/* ── Terms ───────────────────────────────────────────────────── */}
      <section className="mb-7">
        <h2 className="text-[15px] font-semibold tracking-wide uppercase text-[#5C6B4D] mb-2.5 font-sans">
          4. Terms
        </h2>
        <SimpleMarkdown text={sow.terms_md ?? ''} />
      </section>

      {/* ── Signature blocks ────────────────────────────────────────── */}
      <footer className="grid grid-cols-2 gap-8 pt-5 border-t border-[#7E8B6A]/30">
        <SignatureBlock
          party="FullStack Labs"
          signedBy={legalSignedBy ?? null}
          signedAt={legalSignedAt ?? null}
        />
        <SignatureBlock
          party={companyName ?? 'Client'}
          signedBy={clientSignedAt ? companyName : null}
          signedAt={clientSignedAt ?? null}
        />
      </footer>
    </article>
  )
}

function SignatureBlock({
  party,
  signedBy,
  signedAt,
}: {
  party: string
  signedBy: string | null
  signedAt: string | null
}) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-[#7E8B6A] font-semibold mb-3 font-sans">
        {party}
      </p>
      <div className="border-b border-[#1F2A1A] mb-1 h-7">
        {signedAt && (
          <span
            className="inline-block px-1 italic text-[16px] text-[#1F2A1A]"
            style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}
          >
            {signedBy ?? 'Signed'}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#3D4A33] font-sans">
        {signedAt
          ? `Signed ${new Date(signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
          : 'Awaiting signature'}
      </p>
    </div>
  )
}

// Minimal markdown rendering for SOW body sections. Handles **bold**, line
// breaks, and bullet/numeric list items. The PDF stage will ship a more
// proper renderer; this is enough for the inline preview.
function SimpleMarkdown({ text }: { text: string }) {
  if (!text.trim()) return <p className="text-[#7E8B6A] text-[14px] italic">(Not yet drafted.)</p>
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5 text-[14px]">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return null
        const bullet = trimmed.match(/^[-*]\s+(.*)/)
        if (bullet) {
          return (
            <div key={i} className="pl-4 relative">
              <span className="absolute left-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: applyBold(bullet[1]) }} />
            </div>
          )
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: applyBold(trimmed) }} />
      })}
    </div>
  )
}

function applyBold(s: string): string {
  // Naive — sufficient for SOW terms which use **bold** for clause headings.
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
