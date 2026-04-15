'use client'

import { useState } from 'react'
import { getHealthLabel, getHealthColor } from '@/lib/types'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'

interface HealthScoreDisplayProps {
  score: number
  reasoning: string
  baselineScore: number
  onScoreChange: (score: number, overrideReason?: string) => void
}

export function HealthScoreDisplay({ score, reasoning, baselineScore, onScoreChange }: HealthScoreDisplayProps) {
  const [showReasoning, setShowReasoning] = useState(true)
  const [showOverride, setShowOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  const label = getHealthLabel(score)
  const color = getHealthColor(score)

  return (
    <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl overflow-hidden">
      {/* Score header */}
      <div className="p-5">
        <p className="text-[#B0ADA6] text-[10px] uppercase tracking-widest mb-3">Health Score</p>
        <div className="flex items-end gap-3 mb-1">
          <span className="font-mono-brand font-bold text-5xl leading-none" style={{ color }}>
            {score}
          </span>
          <span className="text-sm font-semibold mb-1.5" style={{ color }}>{label}</span>
        </div>
        {baselineScore !== score && (
          <p className="text-[#B0ADA6] text-xs mt-1">
            Baseline: {baselineScore} · AI suggested: {score}
          </p>
        )}
      </div>

      {/* Reasoning panel */}
      <div className="border-t border-[#E0DDD6]">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F5F3EE] transition-colors"
        >
          <span className="text-xs font-medium text-[#8B8781]">AI Reasoning</span>
          {showReasoning ? <ChevronUp size={14} className="text-[#B0ADA6]" /> : <ChevronDown size={14} className="text-[#B0ADA6]" />}
        </button>
        {showReasoning && (
          <div className="px-5 pb-4">
            <div className="border-l-2 pl-4 py-1" style={{ borderColor: color }}>
              <p className="text-[#8B8781] text-sm leading-relaxed">{reasoning}</p>
            </div>
          </div>
        )}
      </div>

      {/* Override toggle */}
      <div className="border-t border-[#E0DDD6]">
        {!showOverride ? (
          <button
            onClick={() => setShowOverride(true)}
            className="w-full flex items-center gap-2 px-5 py-3 text-left text-xs text-[#B0ADA6] hover:text-[#8B8781] hover:bg-[#F5F3EE] transition-colors"
          >
            <SlidersHorizontal size={12} />
            Override AI score
          </button>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={100}
                value={score}
                onChange={(e) => onScoreChange(Number(e.target.value))}
                className="flex-1 h-2 bg-[#E0DDD6] rounded-full appearance-none cursor-pointer accent-[#6B8F5E]"
              />
              <span className="font-mono-brand font-bold text-lg w-10 text-right" style={{ color: getHealthColor(score) }}>
                {score}
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#B0ADA6] uppercase tracking-widest">Reason for override</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value)
                  onScoreChange(score, e.target.value)
                }}
                placeholder="Why are you changing the AI's assessment?"
                className="w-full h-8 px-3 rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-xs placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setShowOverride(false)}
              className="text-xs text-[#B0ADA6] hover:text-[#8B8781] transition-colors"
            >
              Close override
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
