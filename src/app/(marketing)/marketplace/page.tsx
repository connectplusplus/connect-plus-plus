import Link from 'next/link'
import { ArrowRight, Users, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">Marketplace</h1>
          <p className="text-[#64748B] text-lg">
            Choose how you want to engage with FullStack&apos;s AI-native engineering team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/marketplace/outcomes" className="group block">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 hover:border-[#7C3AED]/40 hover:-translate-y-0.5 transition-all duration-150 h-full">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mb-6">
                <Package size={22} className="text-[#7C3AED]" strokeWidth={1.5} />
              </div>
              <h2 className="font-heading font-semibold text-xl text-[#0F172A] mb-2">Predefined Outcomes</h2>
              <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                Fixed-price, fixed-timeline engineering projects. Browse the catalog and kick off in minutes.
              </p>
              <div className="flex items-center text-[#7C3AED] text-sm font-semibold gap-1 group-hover:gap-2 transition-all duration-150">
                Browse catalog <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <Link href="/marketplace/talent" className="group block">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 hover:border-[#EC4899]/40 hover:-translate-y-0.5 transition-all duration-150 h-full">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mb-6">
                <Users size={22} className="text-[#EC4899]" strokeWidth={1.5} />
              </div>
              <h2 className="font-heading font-semibold text-xl text-[#0F172A] mb-2">Individual Talent</h2>
              <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                Hire a single AI-accelerated engineer and embed them with your team. Full-stack, mobile, ML, DevOps.
              </p>
              <div className="flex items-center text-[#7C3AED] text-sm font-semibold gap-1 group-hover:gap-2 transition-all duration-150">
                Explore engineers <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Coming Soon */}
          {['Pods', 'Custom Outcomes'].map((name) => (
            <div key={name} className="bg-white border border-[#E2E8F0] rounded-xl p-8 opacity-50">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F1F5F9]" />
                <Badge className="bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] text-xs">Coming Soon</Badge>
              </div>
              <h2 className="font-heading font-semibold text-xl text-[#0F172A] mb-2">{name}</h2>
              <p className="text-[#64748B] text-sm">Coming soon.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
