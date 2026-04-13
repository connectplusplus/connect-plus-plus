import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Connect++ | AI-Native Engineering Services',
  description:
    'Connect++ is the AI-native platform where you procure engineering services — from individual talent to complete product builds — with full transparency and measurable velocity.',
  openGraph: {
    title: 'Connect++ | AI-Native Engineering Services',
    description: 'Engineering outcomes, not headcount.',
    siteName: 'Connect++',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full" style={{ colorScheme: 'dark' }}>
      <body className="min-h-full flex flex-col bg-[#0B0B0F] text-white antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161C',
              border: '1px solid #2A2A30',
              color: '#FFFFFF',
            },
          }}
        />
      </body>
    </html>
  )
}
