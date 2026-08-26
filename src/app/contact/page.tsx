import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  // Self-referencing canonical. A site-wide canonical in the root
  // layout once pointed every page at the homepage, which told Google
  // they were all duplicates of it. Declaring each page's own URL is
  // what undoes that.
  alternates: { canonical: "https://getrealhealthpgd.co.uk/contact" },
  title: "Contact Us — Get in Touch",
  description:
    "Get in touch with the Get Real Health team. We typically respond within one working day.",
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
            Got a question or ready to sign up? Drop us a line and we&apos;ll
            come back to you within one working day.
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
            {/* See a demo — replaces the old discovery-call card */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
              <h3 className="font-bold text-navy-900 mb-2">See the platform</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Watch a self-serve 5-minute walkthrough of the ePGD tool,
                training and patient records &mdash; narrated by Dr Nitin Shori.
                When you&apos;re ready, sign up directly.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Watch the demo
                </a>
                <a
                  href="/onboard"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white border border-teal-300 hover:bg-teal-100 text-teal-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Sign up now
                </a>
              </div>
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
                  <a
                    href="mailto:info@getrealhealthpgd.co.uk"
                    className="text-sm text-gray-600 hover:text-teal-700"
                  >
                    info@getrealhealthpgd.co.uk
                  </a>
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
                    10 minutes via the self-serve sign-up at{" "}
                    <a href="/onboard" className="text-teal-700 hover:underline">/onboard</a>.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    Is there a contract?
                  </p>
                  <p className="text-gray-500">
                    Minimum 12-month contract. Simple monthly subscription.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    Do you charge per consultation?
                  </p>
                  <p className="text-gray-500">
                    Never. Flat £100 per pharmacy per month, unlimited consultations.
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
