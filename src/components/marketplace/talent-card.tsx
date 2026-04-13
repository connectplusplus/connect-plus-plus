'use client'

import { useState } from 'react'
import { Zap, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { TalentProfile } from '@/lib/types'
import { formatCents, getInitials } from '@/lib/utils'
import Link from 'next/link'

const SENIORITY_COLORS: Record<string, string> = {
  mid: '#60A5FA',
  senior: '#A6F84C',
  staff: '#A78BFA',
  principal: '#FB923C',
}

const SENIORITY_LABELS: Record<string, string> = {
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
}

interface TalentCardProps {
  profile: TalentProfile
}

export function TalentCard({ profile }: TalentCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const initials = getInitials(profile.display_name)
  const seniorityColor = SENIORITY_COLORS[profile.seniority] ?? '#9CA3AF'
  const seniorityLabel = SENIORITY_LABELS[profile.seniority] ?? profile.seniority
  const displaySkills = profile.skills.slice(0, 4)
  const remainingSkills = profile.skills.length - 4

  return (
    <>
      <div
        className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-6 flex flex-col cursor-pointer hover:border-[#A6F84C]/30 hover:-translate-y-0.5 transition-all duration-150 group"
        onClick={() => setSheetOpen(true)}
      >
        {/* Avatar + header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-xl bg-[#1E1E24] flex items-center justify-center text-[#A6F84C] font-mono-brand font-semibold text-sm shrink-0"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-semibold text-white truncate group-hover:text-[#A6F84C] transition-colors duration-150">
                {profile.display_name}
              </h3>
              <Badge
                className="text-xs border shrink-0 bg-transparent px-2 py-0.5"
                style={{ color: seniorityColor, borderColor: `${seniorityColor}40` }}
              >
                {seniorityLabel}
              </Badge>
            </div>
            <p className="text-[#9CA3AF] text-sm truncate">{profile.title}</p>
          </div>
        </div>

        {/* AI Velocity Score */}
        {profile.ai_velocity_score && (
          <div className="flex items-center gap-1.5 mb-4 bg-[#A6F84C]/5 border border-[#A6F84C]/20 rounded-lg px-3 py-2 self-start">
            <Zap size={13} className="text-[#A6F84C]" strokeWidth={2} fill="#A6F84C" />
            <span className="text-[#A6F84C] font-mono-brand font-semibold text-sm">
              {profile.ai_velocity_score}x
            </span>
            <span className="text-[#6B7280] text-xs">AI velocity</span>
          </div>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displaySkills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-[#1E1E24] text-[#9CA3AF] rounded px-2 py-1 border border-[#2A2A30]"
            >
              {skill}
            </span>
          ))}
          {remainingSkills > 0 && (
            <span className="text-xs text-[#6B7280] px-1 py-1">
              +{remainingSkills} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#2A2A30]">
          <div className="text-[#9CA3AF] text-xs">
            {profile.years_experience} yrs experience
          </div>
          {profile.hourly_rate_cents && (
            <div className="font-mono-brand text-white text-sm font-medium">
              {formatCents(profile.hourly_rate_cents)}
              <span className="text-[#6B7280] font-sans text-xs">/hr</span>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg bg-[#16161C] border-l border-[#2A2A30] text-white overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#1E1E24] flex items-center justify-center text-[#A6F84C] font-mono-brand font-bold text-xl">
                {initials}
              </div>
              <div>
                <SheetTitle className="text-white font-heading font-bold text-xl">
                  {profile.display_name}
                </SheetTitle>
                <p className="text-[#9CA3AF] text-sm mt-0.5">{profile.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className="text-xs border bg-transparent"
                    style={{ color: seniorityColor, borderColor: `${seniorityColor}40` }}
                  >
                    {seniorityLabel}
                  </Badge>
                  {profile.ai_velocity_score && (
                    <div className="flex items-center gap-1 text-[#A6F84C] text-xs font-mono-brand font-semibold">
                      <Zap size={11} strokeWidth={2} fill="#A6F84C" />
                      {profile.ai_velocity_score}x
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="text-white text-sm font-semibold mb-2">About</h4>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Experience', value: `${profile.years_experience} yrs` },
                { label: 'AI Velocity', value: `${profile.ai_velocity_score ?? '—'}x` },
                { label: 'Rate', value: profile.hourly_rate_cents ? `${formatCents(profile.hourly_rate_cents)}/hr` : 'TBD' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#1E1E24] rounded-lg p-3 text-center">
                  <div className="font-mono-brand font-semibold text-white text-sm">{stat.value}</div>
                  <div className="text-[#6B7280] text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-[#1E1E24] text-[#9CA3AF] rounded-lg px-3 py-1.5 border border-[#2A2A30]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Highlight Projects */}
            {profile.highlight_projects && profile.highlight_projects.length > 0 && (
              <div>
                <h4 className="text-white text-sm font-semibold mb-3">Highlight Projects</h4>
                <div className="space-y-4">
                  {profile.highlight_projects.map((proj, i) => (
                    <div key={i} className="bg-[#1E1E24] rounded-lg p-4 border border-[#2A2A30]">
                      <h5 className="text-white text-sm font-medium mb-1.5">{proj.title}</h5>
                      <p className="text-[#9CA3AF] text-xs leading-relaxed mb-3">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tech.map((t) => (
                          <span
                            key={t}
                            className="text-xs text-[#A6F84C] bg-[#A6F84C]/5 border border-[#A6F84C]/20 rounded px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-[#2A2A30]">
              <Link href="/signup">
                <Button className="w-full bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold">
                  Request {profile.display_name}
                  <ExternalLink size={14} className="ml-2" />
                </Button>
              </Link>
              <p className="text-[#6B7280] text-xs text-center mt-3">
                Sign up to connect with this engineer
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
