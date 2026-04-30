import type { ReactNode } from 'react'

// White-label booking layout — hides the main site Header/Footer
export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Hide the parent layout's header, footer, and cookie consent */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer:not(.booking-footer), [data-cookie-consent] { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; }
            body { background-color: #f9fafb !important; }
          `,
        }}
      />
      <div className="min-h-screen bg-gray-50">
        {children}
        <footer className="booking-footer text-center py-6 text-xs text-gray-400">
          Powered by{' '}
          <a
            href="https://getrealhealthpgd.co.uk"
            className="underline hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Real Health
          </a>
        </footer>
      </div>
    </>
  )
}
