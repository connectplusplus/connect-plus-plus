// Server-side SOW PDF rendering. Pure Node — uses @react-pdf/renderer's
// PDF primitives (NOT HTML), so the visual layout is implemented twice:
// once here (PDF), once in src/components/sow/sow-preview.tsx (HTML).
// They share the underlying SowContent shape so they can never drift on
// substance, only on typography.
//
// Stages:
//   - 'legal_review': clean draft for FullStack Legal to counter-sign
//   - 'client_signature': legal-counter-signed copy for the client to
//     sign. Adds a "Signed by ... on ..." stamp at the bottom of the PDF
//     (no glyph signature — real eSignature comes with the eSign provider
//     integration, sprint TBD).

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer'
import React from 'react'
import type { Sow, SowContent, SowStatus } from '@/lib/types'

export type SowRenderStage = 'legal_review' | 'client_signature'

export interface RenderSowPdfInput {
  sow: Pick<Sow, 'version_number' | 'status'> & SowContent
  stage: SowRenderStage
  companyName: string | null
  engagementTitle: string
  // For client_signature stage when legal has signed.
  legalSignerName?: string | null
  legalSignedAt?: string | null
  // For the "this version is the contract" PDF written when both parties sign.
  clientSignerName?: string | null
  clientSignedAt?: string | null
}

// ─── Typography ───────────────────────────────────────────────────────────
// Times-Roman / Times-Bold are bundled glyphs in @react-pdf/renderer so
// there's no font fetch. Document feels appropriately formal.

Font.registerHyphenationCallback((word) => [word])

const SAGE = '#5C6B4D'
const SAGE_BORDER = '#7E8B6A'
const SAGE_BORDER_LIGHT = '#7E8B6A55'
const INK = '#1F2A1A'
const SUBINK = '#3D4A33'
const PAPER = '#FAF8F4'

const styles = StyleSheet.create({
  page: {
    padding: 48,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: INK,
    backgroundColor: PAPER,
    lineHeight: 1.45,
  },
  // Header
  metaLine: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: SAGE,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: SUBINK,
    marginBottom: 14,
  },
  hr: {
    borderBottomWidth: 0.5,
    borderColor: SAGE_BORDER,
    marginBottom: 16,
  },
  // Section
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: SAGE,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  paragraph: { marginBottom: 6 },
  // Deliverables
  deliverable: { marginBottom: 8 },
  deliverableName: { fontFamily: 'Times-Bold' },
  deliverableDesc: { color: SUBINK, marginTop: 1 },
  acceptanceList: { paddingLeft: 12, marginTop: 2 },
  acceptanceItem: { fontSize: 9, color: SUBINK, marginBottom: 1.5 },
  // Milestones table
  table: {
    borderTopWidth: 0.5,
    borderColor: SAGE_BORDER,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: SAGE_BORDER,
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    borderColor: SAGE_BORDER_LIGHT,
    paddingVertical: 4,
  },
  th: { fontFamily: 'Times-Bold', fontSize: 9 },
  td: { fontSize: 9 },
  thMilestone: { width: '32%' },
  thDescription: { width: '46%' },
  thDays: { width: '11%', textAlign: 'right' },
  thPay: { width: '11%', textAlign: 'right' },
  // Pricing
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metricLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: SAGE,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricValue: { fontFamily: 'Times-Bold', fontSize: 16 },
  metricUnit: { fontFamily: 'Times-Roman', fontSize: 10, fontWeight: 'normal' },
  // Signatures
  signatureSection: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 36,
  },
  signatureBlock: { width: '46%' },
  signatureLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: SAGE,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderColor: INK,
    height: 22,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  signedStamp: {
    fontSize: 13,
    fontFamily: 'Times-Italic',
    color: INK,
    paddingTop: 2,
  },
  signatureMeta: { fontSize: 8, color: SUBINK },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 8,
    color: SAGE,
  },
})

const STATUS_BADGE: Record<SowStatus, string> = {
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
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function splitParagraphs(text: string): string[] {
  if (!text) return []
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
}

// Strip markdown bold + bullets for simple rendering. Could be replaced
// with a proper markdown→PDF renderer in a follow-up.
function stripMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').trim()
}

// Render markdown lines as a paragraph + simple bullet list.
function MarkdownBlock({ text }: { text: string }) {
  if (!text.trim()) return null
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return React.createElement(
    React.Fragment,
    null,
    ...lines.map((line, i) => {
      const bullet = line.match(/^[-*]\s+(.*)/)
      if (bullet) {
        return React.createElement(
          View,
          { key: i, style: { flexDirection: 'row', marginBottom: 1 } },
          React.createElement(Text, { style: { width: 12 } }, '•'),
          React.createElement(
            Text,
            { style: { flex: 1, fontSize: 9 } },
            stripMarkdown(bullet[1])
          )
        )
      }
      return React.createElement(
        Text,
        { key: i, style: { fontSize: 9, marginBottom: 2 } },
        stripMarkdown(line)
      )
    })
  )
}

// ─── Document ─────────────────────────────────────────────────────────────

function SowDocument(props: RenderSowPdfInput) {
  const {
    sow,
    stage,
    companyName,
    engagementTitle,
    legalSignerName,
    legalSignedAt,
    clientSignerName,
    clientSignedAt,
  } = props

  const totalCents = sow.pricing?.total_cents ?? 0
  const days = sow.timeline_business_days ?? 0
  const paymentTerms = sow.pricing?.payment_terms_md ?? ''

  // Determine signature display per stage.
  const showLegalSigned = !!legalSignedAt
  const showClientSigned = !!clientSignedAt

  return React.createElement(
    Document,
    {
      title: `Statement of Work — ${engagementTitle}`,
      author: 'FullStack Labs',
      subject: `SOW v${sow.version_number}`,
      creator: 'Glassbox',
    },
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // ── Header ──────────────────────────────────────────────────
      React.createElement(
        View,
        null,
        React.createElement(
          Text,
          { style: styles.metaLine },
          `Statement of Work · v${sow.version_number} · ${STATUS_BADGE[sow.status]}`
        ),
        React.createElement(Text, { style: styles.title }, engagementTitle),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `Between FullStack Labs and ${companyName ?? 'Client'}`
        ),
        React.createElement(View, { style: styles.hr })
      ),

      // ── 1. Scope ─────────────────────────────────────────────────
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, '1. Scope'),
        ...splitParagraphs(sow.scope_summary || '(Scope not yet drafted.)').map((p, i) =>
          React.createElement(Text, { key: i, style: styles.paragraph }, p)
        )
      ),

      // ── 2. Deliverables ─────────────────────────────────────────
      React.createElement(View, { style: { marginTop: 10 } },
        React.createElement(Text, { style: styles.sectionTitle }, '2. Deliverables'),
        ...(sow.deliverables ?? []).map((d, i) =>
          React.createElement(View, { key: i, style: styles.deliverable, wrap: false },
            React.createElement(Text, null,
              React.createElement(Text, { style: styles.deliverableName }, `${i + 1}. ${d.name}`)
            ),
            d.description
              ? React.createElement(Text, { style: styles.deliverableDesc }, d.description)
              : null,
            d.acceptance_criteria.length > 0
              ? React.createElement(
                  View,
                  { style: styles.acceptanceList },
                  ...d.acceptance_criteria.map((ac, j) =>
                    React.createElement(
                      Text,
                      { key: j, style: styles.acceptanceItem },
                      `• ${ac}`
                    )
                  )
                )
              : null
          )
        )
      ),

      // ── 3. Milestones table ─────────────────────────────────────
      React.createElement(View, { style: { marginTop: 10 } },
        React.createElement(Text, { style: styles.sectionTitle }, '3. Milestones & payment schedule'),
        React.createElement(
          View,
          { style: styles.table },
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: [styles.th, styles.thMilestone] }, 'Milestone'),
            React.createElement(Text, { style: [styles.th, styles.thDescription] }, 'Description'),
            React.createElement(Text, { style: [styles.th, styles.thDays] }, 'Days'),
            React.createElement(Text, { style: [styles.th, styles.thPay] }, 'Payment')
          ),
          ...(sow.milestones ?? []).map((m, i) =>
            React.createElement(
              View,
              { key: i, style: styles.tableRow, wrap: false },
              React.createElement(Text, { style: [styles.td, styles.thMilestone, { fontFamily: 'Times-Bold' }] }, m.name),
              React.createElement(Text, { style: [styles.td, styles.thDescription, { color: SUBINK }] }, m.description),
              React.createElement(Text, { style: [styles.td, styles.thDays] }, String(m.expected_business_days)),
              React.createElement(Text, { style: [styles.td, styles.thPay] }, `${m.payment_pct}%`)
            )
          )
        )
      ),

      // ── 4. Pricing & timeline ────────────────────────────────────
      React.createElement(View, { style: { marginTop: 14 } },
        React.createElement(View, { style: styles.twoCol },
          React.createElement(View, null,
            React.createElement(Text, { style: styles.metricLabel }, 'Total'),
            React.createElement(Text, { style: styles.metricValue },
              `${formatCents(totalCents)} ${sow.pricing?.currency ?? 'USD'}`
            )
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: styles.metricLabel }, 'Timeline'),
            React.createElement(Text, { style: styles.metricValue },
              String(days),
              React.createElement(Text, { style: styles.metricUnit }, ' business days')
            )
          )
        ),
        React.createElement(Text, { style: styles.metricLabel }, 'Payment terms'),
        React.createElement(MarkdownBlock, { text: paymentTerms })
      ),

      // ── 5. Terms ────────────────────────────────────────────────
      React.createElement(View, { style: { marginTop: 14 } },
        React.createElement(Text, { style: styles.sectionTitle }, '4. Terms'),
        React.createElement(MarkdownBlock, { text: sow.terms_md ?? '' })
      ),

      // ── Signature blocks ────────────────────────────────────────
      React.createElement(View, { style: styles.signatureSection, wrap: false },
        // FullStack Labs side
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, 'FullStack Labs'),
          React.createElement(View, { style: styles.signatureLine },
            showLegalSigned
              ? React.createElement(Text, { style: styles.signedStamp }, legalSignerName ?? 'Signed')
              : null
          ),
          React.createElement(Text, { style: styles.signatureMeta },
            showLegalSigned && legalSignedAt
              ? `Signed ${new Date(legalSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
              : 'Awaiting signature'
          )
        ),
        // Client side
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, companyName ?? 'Client'),
          React.createElement(View, { style: styles.signatureLine },
            showClientSigned
              ? React.createElement(Text, { style: styles.signedStamp }, clientSignerName ?? 'Signed')
              : null
          ),
          React.createElement(Text, { style: styles.signatureMeta },
            showClientSigned && clientSignedAt
              ? `Signed ${new Date(clientSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
              : 'Awaiting signature'
          )
        )
      ),

      // ── Page footer ─────────────────────────────────────────────
      React.createElement(Text, {
        style: styles.pageFooter,
        render: ({ pageNumber, totalPages }) =>
          `${engagementTitle} · v${sow.version_number} · ${stage === 'legal_review' ? 'Legal review' : 'Client signature'} · Page ${pageNumber} of ${totalPages}`,
        fixed: true,
      })
    )
  )
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function renderSowPdf(input: RenderSowPdfInput): Promise<Buffer> {
  // SowDocument always returns a <Document>, but TypeScript can't see
  // through the wrapper component to infer the right ReactElement
  // variant for renderToBuffer. The runtime is correct.
  const doc = React.createElement(SowDocument, input) as unknown as Parameters<
    typeof renderToBuffer
  >[0]
  return renderToBuffer(doc)
}
