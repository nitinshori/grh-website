import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Book a Demo",
  description:
    "Get in touch or book a 20-minute demo. See the full consultation platform in action.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Let&apos;s talk
          </h1>
          <p className="text-blue-200 text-lg max-w-xl">
            Whether you want a full demo, a quick question answered, or
            you&apos;re ready to sign up — we&apos;re here.
          </p>
        </div>
      </section>

      {/* Two-column: form + sidebar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          {/* Contact form */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-navy-900 mb-1">
              Send us a message
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              We typically respond within one working day.
            </p>
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            {/* Book a demo */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
              <h3 className="font-bold text-navy-900 mb-2">Book a demo</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                See the full platform in 20 minutes — consultations, patient
                records, superintendent dashboard, the lot. No obligation.
              </p>
              <p className="text-sm text-gray-600 mb-2">
                To book a demo, send us a message using the form and we&apos;ll
                come back to you with a few suggested times.
              </p>
            </div>

            {/* Direct contacts */}
            <div className="space-y-4">
              <h3 className="font-bold text-navy-900">Get in touch directly</h3>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-teal-500 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-navy-900">Email</p>
                  <p className="text-sm text-gray-600">
                    hello@getrealhealth.co.uk
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-teal-500 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-navy-900">Phone</p>
                  <p className="text-sm text-gray-600">
                    Available on request
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-teal-500 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-navy-900">Based in</p>
                  <p className="text-sm text-gray-600">United Kingdom</p>
                </div>
              </div>
            </div>

            {/* Quick questions */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-navy-900 text-sm mb-3">
                Quick answers
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-navy-900">
                    How long does onboarding take?
                  </p>
                  <p className="text-gray-500">
                    A structured onboarding process &mdash; days, not months.
                    We&apos;ll walk you through it on your demo call.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    Is there a contract?
                  </p>
                  <p className="text-gray-500">
                    Annual subscription. Cancel anytime — no exit fees.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    Do you charge per consultation?
                  </p>
                  <p className="text-gray-500">
                    Never. Flat annual fee, unlimited consultations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
