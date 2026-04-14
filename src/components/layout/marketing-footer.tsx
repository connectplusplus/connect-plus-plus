import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#E0DDD6] bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="Glassbox"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-[#8B8781] text-sm leading-relaxed max-w-xs">
              The AI-native platform where you procure engineering services with full transparency and measurable velocity.
            </p>
            <p className="text-[#B0ADA6] text-xs mt-4">
              A product of{' '}
              <a
                href="https://www.fullstack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B8781] hover:text-[#2D2B27] transition-colors"
              >
                FullStack
              </a>
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[#2D2B27] text-sm font-semibold font-heading mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/marketplace/outcomes" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  Predefined Outcomes
                </Link>
              </li>
              <li>
                <Link href="/marketplace/talent" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  Individual Talent
                </Link>
              </li>
              <li>
                <Link href="/marketplace/pods" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  Pods
                </Link>
              </li>
              <li>
                <Link href="/marketplace/custom" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  Custom Outcomes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#2D2B27] text-sm font-semibold font-heading mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.fullstack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors"
                >
                  FullStack.com
                </a>
              </li>
              <li>
                <Link href="/login" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  Existing Customer Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors">
                  New Customer Onboarding
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E0DDD6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#B0ADA6] text-xs">
            © {new Date().getFullYear()} FullStack. All rights reserved.
          </p>
          <p className="text-[#B0ADA6] text-xs">
            Built with AI-native engineering velocity.{' '}
            <span className="text-[#6B8F5E] font-mono-brand">2.4x</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
