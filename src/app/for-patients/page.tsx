import Link from "next/link";
import type { Metadata } from "next";
import { patientCategories } from "@/data/patient-services";

export const metadata: Metadata = {
  // Self-referencing canonical. A site-wide canonical in the root
  // layout once pointed every page at the homepage, which told Google
  // they were all duplicates of it. Declaring each page's own URL is
  // what undoes that.
  alternates: { canonical: "https://getrealhealthpgd.co.uk/for-patients" },
  title: "Private Health Services at Your Local Pharmacy",
  description:
    "Find private healthcare services at a pharmacy near you. Travel vaccinations, weight management, sexual health, and more — no GP referral needed.",
};

const howItWorks = [
  {
    step: "1",
    title: "Find a service",
    description:
      "Browse our services or search by condition. See what's available at pharmacies near you.",
  },
  {
    step: "2",
    title: "Book an appointment",
    description:
      "Contact the pharmacy directly to book a time that works for you. Many offer same-day or next-day appointments.",
  },
  {
    step: "3",
    title: "Get treated",
    description:
      "A qualified pharmacist will consult with you, provide treatment, and follow up if needed. No GP referral required.",
  },
];

export default function ForPatientsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Private health services at your local pharmacy.
          </h1>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto mb-8">
            No GP referral. No waiting weeks. Over 60 services available at
            pharmacies across the UK — from travel jabs to weight management.
          </p>
          <Link
            href="/for-patients/find-service"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition-colors text-lg"
          >
            Find a service near me
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 text-center mb-10">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {howItWorks.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-navy-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Service categories grid */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 text-center mb-3">
            Browse by category
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Tap a category to see what services are available and find a pharmacy
            near you.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patientCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/for-patients/${cat.slug}`}
                className={`${cat.color} rounded-xl p-5 hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" role="img" aria-label={cat.name}>
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold ${cat.textColor} group-hover:underline mb-1`}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-snug">
                      {cat.tagline}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust points */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 text-center mb-10">
          Why choose your pharmacy?
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              title: "No GP referral needed",
              desc: "Walk in or book ahead. You don't need a letter from your doctor.",
            },
            {
              title: "Qualified pharmacists",
              desc: "Every consultation is led by a trained, registered pharmacist following clinical guidelines.",
            },
            {
              title: "Fast access",
              desc: "Most pharmacies offer same-day or next-day appointments. No more two-week waits.",
            },
            {
              title: "Private & confidential",
              desc: "All consultations are carried out in a private room. Your information is kept securely.",
            },
          ].map((point) => (
            <div
              key={point.title}
              className="flex items-start gap-3 p-4 rounded-lg"
            >
              <svg
                className="w-6 h-6 text-teal-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-navy-900 mb-1">
                  {point.title}
                </h3>
                <p className="text-gray-600 text-sm">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to skip the GP wait?
          </h2>
          <p className="text-blue-200 mb-8">
            Find a service near you and book your appointment today.
          </p>
          <Link
            href="/for-patients/find-service"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
          >
            Find a service near me
          </Link>
        </div>
      </section>
    </>
  );
}
