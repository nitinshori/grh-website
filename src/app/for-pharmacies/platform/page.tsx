import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Platform — Built for PGD Delivery",
  description:
    "The consultation tool built for PGD delivery — not bolted on from a third party. Guided flows, patient records, superintendent oversight.",
};

const capabilities = [
  {
    title: "Guided consultation flow",
    description:
      "Every PGD has a step-by-step protocol built in. Your pharmacists follow the guided flow — inclusion criteria, exclusion criteria, counselling points, supply decision — all in one screen. No paper forms, no guesswork, no missed steps.",
    details: [
      "Structured clinical pathway for every PGD",
      "Automatic inclusion/exclusion checks",
      "Built-in counselling prompts",
      "Digital signature capture",
      "Complete audit trail for every consultation",
    ],
    icon: (
      <svg
        className="w-8 h-8 text-[color:var(--tenant-primary)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Patient record & history",
    description:
      "Every consultation is logged against a patient record. When a patient returns for a follow-up or a different service, their full history is right there. Your data stays yours — exportable, searchable, always accessible.",
    details: [
      "Persistent patient records across services",
      "Full consultation history at a glance",
      "Search and filter by patient, service, or date",
      "Exportable data — CSV, PDF reports",
      "GDPR-compliant data handling",
    ],
    icon: (
      <svg
        className="w-8 h-8 text-[color:var(--tenant-primary)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    title: "Superintendent oversight dashboard",
    description:
      "Multi-branch visibility without chasing spreadsheets. Superintendents see which pharmacists are trained, which PGDs are live at each branch, consultation volumes, and compliance status — all in one view.",
    details: [
      "Multi-branch overview in a single dashboard",
      "Training completion tracking per pharmacist",
      "PGD activation status per branch",
      "Consultation volume analytics",
      "Compliance and audit-readiness reports",
    ],
    icon: (
      <svg
        className="w-8 h-8 text-[color:var(--tenant-primary)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const comparisonPoints = [
  {
    label: "Consultation tool",
    grh: "Built in — included in every plan",
    competitor: "Third-party platform subscription required (extra cost)",
  },
  {
    label: "Patient data ownership",
    grh: "Your data — exportable anytime",
    competitor: "Locked into their platform",
  },
  {
    label: "Multi-branch oversight",
    grh: "Superintendent dashboard included",
    competitor: "Manual reporting or separate tools",
  },
  {
    label: "Training integration",
    grh: "Online training for every PGD in-platform",
    competitor: "Separate training provider",
  },
  {
    label: "Per-consultation fees",
    grh: "£0 — always",
    competitor: "£5–£7 per consultation",
  },
  {
    label: "Pricing model",
    grh: "Per store — covers your whole team",
    competitor: "Per pharmacist — costs multiply with staff",
  },
  {
    label: "PMR-ready architecture",
    grh: "Service platform designed to work alongside your PMR",
    competitor: "Siloed — no PMR consideration",
  },
];

export default function PlatformPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            One platform. Everything you need.
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            Built for PGD delivery from the ground up — not a bolt-on from a
            third party. Consultations, patient records, training, and
            superintendent oversight in one place. One fee per store covers
            everything.
          </p>
        </div>
      </section>

      {/* No Charac callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-6">
          <h2 className="font-bold text-navy-900 mb-2">
            No third-party platform contracts or lock-in
          </h2>
          <p className="text-gray-700 leading-relaxed">
            ECG requires a separate third-party platform subscription for the digital
            consultation workflow — that&apos;s an extra cost on top of their PGD
            fees. With GRH, the consultation platform is built in. One provider,
            one fee, one login.
          </p>
        </div>
      </section>

      {/* Three capabilities */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-start ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {cap.icon}
                  <h3 className="text-xl sm:text-2xl font-bold text-navy-900">
                    {cap.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-5">
                  {cap.description}
                </p>
                <ul className="space-y-2">
                  {cap.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="w-4 h-4 text-[color:var(--tenant-primary)] mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* See it in the demo video — replaces the placeholder
                  screenshot cards that used to live here. Until we have
                  per-feature screenshots, point at the single demo video. */}
              <div className="flex-1 w-full">
                <Link
                  href="/demo"
                  className="group block bg-gradient-to-br from-navy-900 to-navy-950 hover:from-navy-800 hover:to-navy-900 border border-navy-200 rounded-xl aspect-video flex items-center justify-center transition-colors shadow-md"
                >
                  <div className="text-center px-6">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[color:var(--tenant-primary)]/100 group-hover:bg-[color:var(--tenant-primary)]/15 flex items-center justify-center mb-3 transition-colors">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-white font-semibold">See it in the demo video</p>
                    <p className="text-xs text-blue-200 mt-1">{cap.title}</p>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2 text-center">
            How we compare
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Side-by-side with the traditional PGD provider model.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-navy-950 text-white text-sm font-semibold">
              <div className="px-4 sm:px-6 py-3"></div>
              <div className="px-4 sm:px-6 py-3 text-[color:var(--tenant-primary)]">
                Get Real Health
              </div>
              <div className="px-4 sm:px-6 py-3 text-gray-400">
                Traditional providers
              </div>
            </div>

            {/* Rows */}
            {comparisonPoints.map((point, i) => (
              <div
                key={point.label}
                className={`grid grid-cols-3 text-sm ${
                  i !== comparisonPoints.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="px-4 sm:px-6 py-4 font-medium text-navy-900">
                  {point.label}
                </div>
                <div className="px-4 sm:px-6 py-4 text-gray-700 flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[color:var(--tenant-primary)] mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {point.grh}
                </div>
                <div className="px-4 sm:px-6 py-4 text-gray-500 flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {point.competitor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PMR & service platform convergence */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-8 h-8 text-navy-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <h2 className="text-xl font-bold text-navy-900">
              Service platforms and PMRs — built to work together
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            The pharmacy world is moving toward combining service delivery
            platforms with patient medication records. We&apos;re building with
            that future in mind. Our platform is designed as a complementary
            clinical services layer that sits alongside your PMR — not as a
            replacement for it.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Appointment bookings, consultation records, and patient history live
            in one place, while your PMR continues to handle dispensing and NHS
            services. The result is a single view of your private clinical
            services without disrupting the workflows your team already knows.
          </p>
          <p className="text-gray-600 text-sm">
            As PMR integrations become available across the sector, our
            architecture is ready. Your data is structured, exportable, and
            built on open standards — so when the time comes to connect, the
            heavy lifting is already done.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
          See it in action
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Book a 20-minute demo and we&apos;ll walk you through the full
          platform — consultations, patient
          records, the superintendent dashboard, everything.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/demo"
            className="px-8 py-3 bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            See a demo
          </Link>
          <Link
            href="/for-pharmacies/pricing"
            className="px-8 py-3 bg-white border border-gray-200 hover:border-gray-300 text-navy-900 font-semibold rounded-lg transition-colors text-sm"
          >
            View pricing
          </Link>
        </div>
      </section>
    </>
  );
}
