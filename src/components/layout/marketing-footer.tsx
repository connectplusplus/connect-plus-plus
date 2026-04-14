import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg" style={{ filter: "brightness(0) saturate(100%)" }}
                alt="FullStack"
                className="h-5 w-auto"
              />
              <span className="text-[#7C3AED] font-heading font-semibold text-sm border-l border-[#E2E8F0] pl-2">
                Glassbox
              </span>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
              The AI-native platform where you procure engineering services with full transparency and measurable velocity.
            </p>
            <p className="text-[#94A3B8] text-xs mt-4">
              A product of{' '}
              <a
                href="https://www.fullstack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                FullStack
              </a>
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[#0F172A] text-sm font-semibold font-heading mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/marketplace/outcomes" className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors">
                  Predefined Outcomes
                </Link>
              </li>
              <li>
                <Link href="/marketplace/talent" className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors">
                  Individual Talent
                </Link>
              </li>
              <li>
                <span className="text-[#94A3B8] text-sm">Pods <span className="text-xs border border-[#E2E8F0] rounded px-1.5 py-0.5 ml-1">Soon</span></span>
              </li>
              <li>
                <span className="text-[#94A3B8] text-sm">Custom Outcomes <span className="text-xs border border-[#E2E8F0] rounded px-1.5 py-0.5 ml-1">Soon</span></span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#0F172A] text-sm font-semibold font-heading mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.fullstack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
                >
                  FullStack.com
                </a>
              </li>
              <li>
                <Link href="/login" className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#94A3B8] text-xs">
            © {new Date().getFullYear()} FullStack. All rights reserved.
          </p>
          <p className="text-[#94A3B8] text-xs">
            Built with AI-native engineering velocity.{' '}
            <span className="text-[#7C3AED] font-mono-brand">2.4x</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
