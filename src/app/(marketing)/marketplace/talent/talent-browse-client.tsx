'use client'

import { useState, useMemo } from 'react'
import { TalentCard } from '@/components/marketplace/talent-card'
import type { TalentProfile, Seniority } from '@/lib/types'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TalentBrowseClientProps {
  profiles: TalentProfile[]
}

const SENIORITY_OPTIONS: Array<{ value: Seniority | 'all'; label: string }> = [
  { value: 'all', label: 'All seniority levels' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
]

export function TalentBrowseClient({ profiles }: TalentBrowseClientProps) {
  const [search, setSearch] = useState('')
  const [seniority, setSeniority] = useState<Seniority | 'all'>('all')
  const [activeSkills, setActiveSkills] = useState<string[]>([])
  const [availableOnly, setAvailableOnly] = useState(false)

  // Build all unique skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>()
    profiles.forEach((p) => p.skills.forEach((s) => skillSet.add(s)))
    return Array.from(skillSet).sort()
  }, [profiles])

  // Popular skills (top 10 by frequency)
  const popularSkills = useMemo(() => {
    const freq: Record<string, number> = {}
    profiles.forEach((p) => p.skills.forEach((s) => { freq[s] = (freq[s] ?? 0) + 1 }))
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([s]) => s)
  }, [profiles])

  function toggleSkill(skill: string) {
    setActiveSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (availableOnly && !p.is_available) return false
      if (seniority !== 'all' && p.seniority !== seniority) return false
      if (activeSkills.length > 0 && !activeSkills.every((s) => p.skills.includes(s))) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.display_name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q)) ||
          (p.bio ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [profiles, search, seniority, activeSkills, availableOnly])

  return (
    <div>
      {/* Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or title..."
              className="pl-9 bg-[#16161C] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
            />
          </div>

          {/* Seniority dropdown */}
          <Select value={seniority} onValueChange={(v) => setSeniority((v ?? 'all') as Seniority | 'all')}>
            <SelectTrigger className="w-full sm:w-56 bg-[#16161C] border-[#2A2A30] text-white focus:border-[#A6F84C]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#16161C] border-[#2A2A30]">
              {SENIORITY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-white hover:bg-[#1E1E24] focus:bg-[#1E1E24] cursor-pointer"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Availability toggle */}
          <button
            onClick={() => setAvailableOnly((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
              availableOnly
                ? 'bg-[#A6F84C]/10 border-[#A6F84C] text-[#A6F84C]'
                : 'bg-[#16161C] border-[#2A2A30] text-[#9CA3AF] hover:border-[#3A3A40]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-[#A6F84C]' : 'bg-[#6B7280]'}`}
            />
            Available now
          </button>
        </div>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-2">
          {popularSkills.map((skill) => {
            const active = activeSkills.includes(skill)
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors duration-150 ${
                  active
                    ? 'bg-[#A6F84C]/10 border-[#A6F84C] text-[#A6F84C]'
                    : 'bg-[#16161C] border-[#2A2A30] text-[#9CA3AF] hover:border-[#3A3A40]'
                }`}
              >
                {skill}
              </button>
            )
          })}
          {activeSkills.length > 0 && (
            <button
              onClick={() => setActiveSkills([])}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#F87171]/30 text-[#F87171] hover:bg-[#F87171]/10 transition-colors duration-150"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#9CA3AF] text-sm">
          {filtered.length === profiles.length
            ? `${profiles.length} engineers available`
            : `${filtered.length} of ${profiles.length} engineers`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#9CA3AF] text-lg mb-2">No engineers match your filters.</p>
          <button
            onClick={() => { setSearch(''); setSeniority('all'); setActiveSkills([]); setAvailableOnly(false) }}
            className="text-[#A6F84C] text-sm underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((profile) => (
            <TalentCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
