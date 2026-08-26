import type { Metadata } from "next";
import Link from "next/link";
import { PgdPageActions } from "@/components/PgdPageActions";
import PgdGate from "../PgdGate";

/**
 * TRT entry point.
 *
 * Until 26 Aug 2026 this route was a "Coming Soon" placeholder saying the
 * tool was in development. It was not. Four complete 8-step consultation
 * tools already existed, one per preparation, each gated on the 'trt' slug:
 * Testogel, Tostran, Sustanon 250 and Nebido.
 *
 * Nothing anywhere in the codebase linked to any of them. The ePGD index
 * lists 'trt' and 'trt' alone, and it pointed here, so the six pharmacies
 * holding TRT had a service they had signed off, four working tools behind
 * it, and no way to reach any of them short of guessing the URL.
 *
 * There is deliberately no fifth "generic TRT" tool. Supply under this PGD
 * is preparation-specific: the route, the frequency, the application site
 * and the exclusions all differ, and Sustanon carries a peanut and soya
 * contraindication the gels do not. Choosing the preparation first, then
 * running that preparation's consultation, is the clinically correct order
 * and is what the signed PGD describes.
 */

export const metadata: Metadata = {
  title: "TRT — Testosterone Replacement Therapy ePGD | Pharmacy PGD",
  description:
    "UK Pharmacy Patient Group Direction for testosterone replacement therapy. Choose the preparation — Testogel, Tostran, Sustanon 250 or Nebido — to begin the consultation.",
};

const preparations = [
  {
    slug: "testogel",
    name: "Testogel",
    form: "Transdermal gel, daily",
    strength: "16.2 mg/g pump or 40.5 mg sachet",
    detail:
      "Applied each morning to both shoulders or upper arms. Start at 2 actuations (40.5 mg), titrate to response and bloods, maximum 4 actuations (81 mg) daily.",
    accent: "bg-blue-500",
  },
  {
    slug: "tostran",
    name: "Tostran",
    form: "Transdermal gel, daily",
    strength: "20 mg/g",
    detail:
      "Applied to the abdomen or inner thighs, rotating daily. Start 3 g (60 mg), maximum 4 g (80 mg). Not for shoulders or upper arms, which is what distinguishes it from Testogel.",
    accent: "bg-blue-500",
  },
  {
    slug: "sustanon",
    name: "Sustanon 250",
    form: "Deep IM injection, every 3 weeks",
    strength: "250 mg/mL",
    detail:
      "Combined testosterone esters. Contains arachis (peanut) oil, so it is contraindicated in peanut or soya allergy. Check before every supply.",
    accent: "bg-indigo-500",
  },
  {
    slug: "nebido",
    name: "Nebido",
    form: "IM depot injection, every 10 to 14 weeks",
    strength: "1000 mg / 4 mL",
    detail:
      "Long acting. Loading dose, second dose at 6 weeks, then maintenance guided by trough testosterone taken at the end of the injection interval.",
    accent: "bg-indigo-500",
  },
];

export default function TRTToolPage() {
  return (
    <PgdGate slug="trt" title="Testosterone Replacement Therapy">
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PgdPageActions />

          <div className="mb-4 print:hidden">
            <Link
              href="/for-pharmacies/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Link
                href="/for-pharmacies/epgd"
                className="hover:text-[color:var(--tenant-primary)]"
              >
                ePGD Consultations
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">TRT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Testosterone Replacement Therapy
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Adults aged 25 to 65 with biochemically and clinically confirmed
              male hypogonadism. Indefinite use with annual pharmacy review and
              bloods.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Choose the preparation
            </h2>
            <p className="text-sm text-gray-600">
              One PGD covers all four, but the consultation differs by
              preparation: route, frequency, application site and exclusions are
              not the same. Pick the preparation and the consultation for it
              opens, including its own eligibility and counselling steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {preparations.map((p) => (
              <Link
                key={p.slug}
                href={`/for-pharmacies/epgd/${p.slug}`}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[color:var(--tenant-primary)] transition-all overflow-hidden"
              >
                <div className={`h-1.5 ${p.accent}`} />
                <div className="p-5">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[color:var(--tenant-primary)] transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {p.form}
                  </p>
                  <p className="text-xs text-gray-500">{p.strength}</p>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    {p.detail}
                  </p>
                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-[color:var(--tenant-primary)]">
                      Start consultation &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-900">
              <strong>Sustanon 250 contains arachis (peanut) oil.</strong> It is
              contraindicated in patients with a peanut or soya allergy. Confirm
              allergy status before every supply, not only at initiation.
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Get Real Health ePGD — Testosterone Replacement Therapy |
              Confidential Patient Information
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
