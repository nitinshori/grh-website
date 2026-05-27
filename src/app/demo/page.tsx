import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "See a demo — Get Real Health PGD Platform",
  description:
    "Watch a 5-minute tour of the Get Real Health PGD platform — the ePGD consultation tools, training library, patient records, audit-ready governance — narrated by Dr Nitin Shori. Sign up immediately when you're ready.",
  alternates: { canonical: `${BASE_URL}/demo` },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: `${BASE_URL}/demo`,
    siteName: "Get Real Health",
    title: "See a demo — Get Real Health",
    description:
      "Watch a 5-minute tour of the ePGD platform, training and clinical governance. £100/month per pharmacy — every PGD included.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Get Real Health demo" }],
  },
};

const demoHighlights = [
  {
    title: "The ePGD consultation tool",
    body: "Walk through a Wegovy patient consultation end-to-end: eligibility, contraindications, dose-escalation logic, consent and the audit-ready digital record.",
  },
  {
    title: "Training and competency",
    body: "See the training modules, the quiz interface, and how every CPD certificate is logged automatically against each pharmacist's profile.",
  },
  {
    title: "Patient records and audit",
    body: "Browse the patient directory, pull a full consultation history, export records, and see exactly what your GPhC inspector will see when they arrive.",
  },
  {
    title: "The 10-minute sign-up",
    body: "End-to-end onboarding from the public form to your first consultation in under 10 minutes — including the GoCardless Direct Debit set-up.",
  },
];

export default function DemoPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-xs uppercase tracking-wider text-teal-300 font-semibold mb-3">
            Self-serve demo
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            See the GRH platform in 5 minutes
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
            No call needed. Dr Nitin Shori walks through the ePGD tool, training, patient records
            and clinical governance pack. When you&apos;re ready, sign up &mdash; you can be running
            consultations within the hour.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="bg-navy-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* Self-hosted MP4. When you drop the file at /public/demo-video.mp4 it
                will play automatically. While the file isn't there the browser
                shows the fallback poster + message. */}
            <video
              controls
              playsInline
              preload="metadata"
              poster="/demo-poster.png"
              className="w-full h-full object-cover"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser doesn&apos;t support embedded video. The demo video will be available
              shortly.
            </video>

            {/* Placeholder overlay shown while there's no video uploaded yet.
                Once /public/demo-video.mp4 is in place, the <video> will render
                and this overlay sits behind it. Style it to look intentional even
                during the gap. */}
            <noscript>
              <div className="absolute inset-0 flex items-center justify-center bg-navy-950/80 text-blue-100 text-sm">
                Demo video coming soon. Sign up to get notified the moment it&apos;s live.
              </div>
            </noscript>
          </div>
          <p className="text-xs text-blue-200/70 mt-3 text-center">
            Best watched at full screen with sound on. ~5 minutes.
          </p>
        </div>
      </section>

      {/* CTA strip — the primary action */}
      <section className="bg-teal-50 border-y border-teal-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Ready to start your private services?
              </h2>
              <p className="text-gray-700">
                £100/month per pharmacy &mdash; every PGD, all your locums, included. No setup fee.
                10-minute onboarding.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/onboard"
                className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold px-7 py-4 rounded-lg transition-colors text-lg shadow-lg"
              >
                Sign up now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll see */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          What&apos;s in the demo
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {demoHighlights.map((h, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{h.title}</h3>
              <p className="text-gray-700 leading-relaxed">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sign up and start seeing private patients this week
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            70+ PGDs. Training included. Locums included. £100 per pharmacy per month, flat.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start onboarding
            </Link>
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="inline-flex items-center justify-center border border-blue-300 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              See the full PGD catalogue
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
