import type { Metadata } from 'next'
import BookingForm from './BookingForm'

export const metadata: Metadata = {
  title: 'Book a Discovery Call — Get Real Health',
  description:
    'Schedule a free 30-minute discovery call with Nitin Shori. See the GRH platform in action, ask questions about PGDs, and find the right plan for your pharmacy.',
}

export default function BookPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Book a Discovery Call
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Pick a time that works for you. Nitin Shori, GRH&rsquo;s founder,
            will walk you through the platform, answer your questions, and help
            you find the right plan for your pharmacy.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            30 minutes &middot; Free &middot; No obligation
          </p>
        </div>
      </section>

      {/* Booking form */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <BookingForm />
      </section>
    </>
  )
}
