import type { ReactNode } from 'react'

// Standalone white-label layout — no GRH navigation
export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head />
      <body className="bg-gray-50 min-h-screen">
        {children}
        <footer className="text-center py-6 text-xs text-gray-400">
          Powered by{' '}
          <a
            href="https://getrealhealth.co.uk"
            className="underline hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Real Health
          </a>
        </footer>
      </body>
    </html>
  )
}
