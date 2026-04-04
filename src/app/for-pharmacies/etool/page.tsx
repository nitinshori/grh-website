import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PGD Consultation eTools",
  description:
    "Digital consultation tools for pharmacists. Guided PGD workflows with clinical decision support, dose recommendations, counselling checklists, and printable consultation records.",
};

const etools = [
  {
    slug: "ed",
    title: "Erectile Dysfunction",
    subtitle: "Sildenafil & Tadalafil",
    category: "Men's Health",
    steps: 10,
    color: "bg-blue-500",
  },
  {
    slug: "uti",
    title: "UTI Treatment",
    subtitle: "Nitrofurantoin & Trimethoprim",
    category: "Women's Health",
    steps: 9,
    color: "bg-pink-500",
  },
  {
    slug: "sore-throat",
    title: "Sore Throat Test & Treat",
    subtitle: "FeverPAIN Score + Pen V / Clarithromycin",
    category: "Acute & Infection",
    steps: 9,
    color: "bg-orange-500",
  },
  {
    slug: "emergency-contraception",
    title: "Emergency Contraception",
    subtitle: "Levonorgestrel & Ulipristal",
    category: "Women's Health",
    steps: 9,
    color: "bg-purple-500",
  },
  {
    slug: "wegovy",
    title: "Weight Management — Wegovy",
    subtitle: "Semaglutide (GLP-1) with BMI Calculator",
    category: "Weight Management",
    steps: 10,
    color: "bg-emerald-500",
  },
  {
    slug: "impetigo",
    title: "Impetigo",
    subtitle: "Fusidic Acid & Flucloxacillin",
    category: "Skin",
    steps: 8,
    color: "bg-amber-500",
  },
  {
    slug: "shingles-treatment",
    title: "Shingles Acute Treatment",
    subtitle: "Valaciclovir & Aciclovir",
    category: "Minor Ailments",
    steps: 9,
    color: "bg-red-500",
  },
  {
    slug: "flu",
    title: "Flu Vaccination",
    subtitle: "Private Flu Vaccine Administration",
    category: "Vaccines",
    steps: 8,
    color: "bg-sky-500",
  },
  {
    slug: "smoking-varenicline",
    title: "Smoking Cessation",
    subtitle: "Varenicline with Fagerstr\u00F6m Score",
    category: "Mental Health",
    steps: 9,
    color: "bg-teal-500",
  },
];

export default function EToolIndexPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link
              href="/for-pharmacies"
              className="hover:text-teal-600 transition-colors"
            >
              For Pharmacies
            </Link>
            <span>/</span>
            <span className="text-navy-900 font-medium">
              PGD Consultation eTools
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            PGD Consultation eTools
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Digital clinical decision support tools for pharmacists. Each eTool
            guides you through a complete PGD consultation — from patient
            screening to medicine supply — with built-in safety checks and
            printable consultation records.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-8 text-sm">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-2xl font-bold text-teal-600">
              {etools.length}
            </span>
            <span className="text-gray-500 ml-2">eTools available</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-2xl font-bold text-navy-900">
              {new Set(etools.map((e) => e.category)).size}
            </span>
            <span className="text-gray-500 ml-2">clinical categories</span>
          </div>
        </div>

        {/* eTool grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {etools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/for-pharmacies/etool/${tool.slug}`}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all overflow-hidden"
            >
              {/* Color bar */}
              <div className={`h-1.5 ${tool.color}`} />
              <div className="p-5">
                {/* Category badge */}
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {tool.category}
                </span>
                {/* Title */}
                <h3 className="text-base font-bold text-navy-900 group-hover:text-teal-700 transition-colors">
                  {tool.title}
                </h3>
                {/* Subtitle */}
                <p className="text-xs text-gray-500 mt-1">{tool.subtitle}</p>
                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {tool.steps}-step consultation
                  </span>
                  <span className="text-xs font-medium text-teal-600 group-hover:text-teal-700">
                    Open eTool &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming soon note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            More eTools are being developed for additional PGDs. Each tool
            follows NICE guidelines and is designed as a clinical decision
            support aid — the pharmacist retains full clinical responsibility.
          </p>
        </div>
      </div>
    </div>
  );
}
