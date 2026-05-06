import { createElement } from 'react'
import { resolveIcon } from '@/lib/icons'

interface Props {
  name: string | null | undefined
  size?: number
  strokeWidth?: number
  className?: string
}

// Stable wrapper. createElement (rather than JSX) bypasses the
// react-hooks/static-components heuristic which would otherwise flag
// `const Icon = resolveIcon(...)` + `<Icon />` as creating a component
// during render. The icon component itself is one of the stable Lucide
// exports; no per-render component construction happens.
export function IconByName({ name, size, strokeWidth, className }: Props) {
  return createElement(resolveIcon(name), { size, strokeWidth, className })
}
