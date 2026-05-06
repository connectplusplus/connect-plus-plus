// PPTX extractor — pulled by hand from the OOXML zip rather than via a
// third-party parser. PPTX is a ZIP containing slide XML at
// `ppt/slides/slide{N}.xml` and (optional) speaker notes at
// `ppt/notesSlides/notesSlide{N}.xml`. Slide text lives inside <a:t>
// elements (DrawingML "text run" namespace).
//
// Trade-offs vs a packaged parser:
//   + No native deps, ~50 lines of code we own.
//   + No reliance on libraries that go unmaintained for years.
//   - Doesn't handle text rendered as images, embedded objects, charts, or
//     SmartArt that's been flattened. Same limitation as any text-only
//     parser.
//
// If extraction is consistently weak on real decks, swap to officeparser or
// similar without changing the extractor's public contract.

import JSZip from 'jszip'
import { countWords } from '../truncate'
import type { ExtractedFile } from '../types'

const SLIDE_PATH = /^ppt\/slides\/slide\d+\.xml$/
const NOTES_PATH = /^ppt\/notesSlides\/notesSlide\d+\.xml$/
// Match <a:t>…</a:t> non-greedily; allows attributes on the open tag.
const TEXT_RUN = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
}

function decodeXmlText(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m] ?? m)
}

function textFromXml(xml: string): string[] {
  const out: string[] = []
  for (const match of xml.matchAll(TEXT_RUN)) {
    const decoded = decodeXmlText(match[1])
    if (decoded.trim()) out.push(decoded)
  }
  return out
}

// Sort slide paths in numeric order, not lexicographic, so slide10 comes
// after slide9 instead of after slide1.
function sortByNumericSuffix(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const na = Number(a.match(/(\d+)\.xml$/)?.[1] ?? 0)
    const nb = Number(b.match(/(\d+)\.xml$/)?.[1] ?? 0)
    return na - nb
  })
}

export async function extractPptx(buffer: Buffer, filename: string): Promise<ExtractedFile> {
  const zip = await JSZip.loadAsync(buffer)

  const slidePaths = sortByNumericSuffix(
    Object.keys(zip.files).filter((p) => SLIDE_PATH.test(p))
  )
  const notesPaths = sortByNumericSuffix(
    Object.keys(zip.files).filter((p) => NOTES_PATH.test(p))
  )

  const sections: string[] = []

  for (let i = 0; i < slidePaths.length; i++) {
    const slideXml = await zip.files[slidePaths[i]].async('string')
    const slideText = textFromXml(slideXml).join(' ').trim()

    const notesPath = notesPaths.find((p) =>
      p.match(new RegExp(`notesSlide${i + 1}\\.xml$`))
    )
    const notesText = notesPath
      ? textFromXml(await zip.files[notesPath].async('string')).join(' ').trim()
      : ''

    const block = [
      `--- Slide ${i + 1} ---`,
      slideText || '(no slide text)',
      notesText && `Notes: ${notesText}`,
    ]
      .filter(Boolean)
      .join('\n')

    sections.push(block)
  }

  const text = sections.join('\n\n').trim()

  return {
    filename,
    text,
    original_word_count: countWords(text),
    was_truncated: false,
  }
}
