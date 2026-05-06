// Shared registry of Lucide icons that can be used as outcome-template icons.
// The L1 marketplace card and the Configurator's icon picker pull from the
// same list — adding an icon here makes it pickable AND renderable.
//
// Keys match the Lucide PascalCase export names so seed data using string
// names like 'TestTube' or 'Rocket' resolves directly.

import {
  BarChart3,
  Beaker,
  Bot,
  Brain,
  CircuitBoard,
  Cloud,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  TestTube,
  Wand,
  Workflow,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

type IconComponent = ComponentType<{
  size?: number
  strokeWidth?: number
  className?: string
}>

export const ICON_MAP: Record<string, IconComponent> = {
  BarChart3,
  Beaker,
  Bot,
  Brain,
  CircuitBoard,
  Cloud,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  TestTube,
  Wand,
  Workflow,
  Zap,
}

export const ICON_NAMES = Object.keys(ICON_MAP).sort()

export const FALLBACK_ICON: IconComponent = Zap

export function resolveIcon(name: string | null | undefined): IconComponent {
  if (!name) return FALLBACK_ICON
  return ICON_MAP[name] ?? FALLBACK_ICON
}
