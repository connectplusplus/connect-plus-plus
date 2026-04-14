'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg" style={{ filter: "brightness(0) saturate(100%)" }}
            alt="FullStack"
            className="h-6 w-auto"
          />
          <span className="w-px h-5 bg-[#E2E8F0]" />
          <img
            src="/logo.png"
            alt="Glassbox"
            className="h-6 w-auto"
          />
        </Link>


        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-0 text-sm font-semibold">
          <Link
            href="/login"
            className="px-5 py-2 bg-[#F1F5F9] text-[#7C3AED] hover:bg-[#E2E8F0] rounded-l-lg border border-[#E2E8F0] transition-colors duration-150"
          >
            Existing Customer Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-[#7C3AED] text-white hover:bg-[#8B5CF6] rounded-r-lg transition-colors duration-150"
          >
            New Customer Onboarding
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-6 py-4 flex flex-col gap-4">
          <Link
            href="/marketplace/outcomes"
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors py-2"
            onClick={() => setMobileOpen(false)}
          >
            Outcomes
          </Link>
          <Link
            href="/marketplace/talent"
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors py-2"
            onClick={() => setMobileOpen(false)}
          >
            Talent
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors py-2"
            onClick={() => setMobileOpen(false)}
          >
            Marketplace
          </Link>
          <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0]">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
