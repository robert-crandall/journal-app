import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Journal App - Personal Growth Through Reflection',
  description: 'A conversational journal app powered by AI to help you understand whether your self-experiments are actually improving your life.',
  keywords: ['journal', 'personal growth', 'self-improvement', 'reflection', 'AI'],
  authors: [{ name: 'Journal App Team' }],
  creator: 'Journal App',
  publisher: 'Journal App',
  robots: {
    index: false, // Don't index during development
    follow: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div id="root" className="min-h-screen bg-base-100">
          {children}
        </div>
      </body>
    </html>
  )
}
