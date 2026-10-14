import type { ReactNode } from "react";
import Link from "next/link";
import type {
  PatientFormConfig,
  PatientFormQuestion,
} from "@/data/patient-forms";
import { PrintFormButton } from "./PrintFormButton";

/**
 * A blank, printable A4 patient form for one PGD service.
 *
 * Patients complete it by hand before the consultation. It never makes the
 * clinical decision: the pharmacist enters the answers into the ePGD tool.
 */

// Hide the dashboard chrome (sidebars, nav, branch switcher, chat button)
// and let the page flow across A4 sheets when printing.
const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  aside, header, footer, nav, .fixed, main > .md\\:hidden { display: none !important; }
  main, main > div, .h-full { height: auto !important; overflow: visible !important; }
  #grh-patient-form { box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; max-width: none !important; color: #000 !important; }
  #grh-patient-form * { color: #000 !important; }
  #grh-patient-form .pf-avoid-break { break-inside: avoid; page-break-inside: avoid; }
  #grh-patient-form .pf-page-break { break-before: page; page-break-before: always; }
}
`;

function TickBox({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-5 h-5 border-2 border-gray-800 rounded-sm shrink-0"
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </span>
  );
}

function Field({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="whitespace-nowrap font-medium">{label}</span>
      <span className="flex-1 border-b border-gray-500 h-7" />
    </div>
  );
}

function Lines({ count }: { count: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-gray-500 h-8" />
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-bold border-b-2 border-gray-800 pb-1 mb-2 mt-5">
      {children}
    </h2>
  );
}

function QuestionRow({ q, n }: { q: PatientFormQuestion; n: number }) {
  if (q.type === "text") {
    return (
      <div className="pf-avoid-break py-2 border-b border-gray-200">
        <p className="font-medium">
          {n}. {q.text}
        </p>
        {q.help && <p className="text-xs text-gray-600 mt-0.5">{q.help}</p>}
        <Lines count={q.lines ?? 1} />
      </div>
    );
  }
  return (
    <div className="pf-avoid-break grid grid-cols-[1fr_auto] gap-4 items-center py-2 border-b border-gray-200">
      <div>
        <p className="font-medium">
          {n}. {q.text}
        </p>
        {q.help && <p className="text-xs text-gray-600 mt-0.5">{q.help}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 w-[11.5rem] justify-items-center">
        <TickBox />
        <TickBox />
        <TickBox />
      </div>
    </div>
  );
}

function AnswerHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 text-xs font-semibold text-gray-700">
      <span />
      <div className="grid grid-cols-3 gap-3 w-[11.5rem] text-center">
        <span>Yes</span>
        <span>No</span>
        <span>Not sure</span>
      </div>
    </div>
  );
}

export function PatientFormSheet({ form }: { form: PatientFormConfig }) {
  // Number questions continuously across sections.
  const offsets = form.sections.map((_, i) =>
    form.sections.slice(0, i).reduce((sum, s) => sum + s.questions.length, 0),
  );

  return (
    <div className="p-4 md:p-8">
      <style>{PRINT_CSS}</style>

      {/* Screen-only toolbar */}
      <div className="max-w-[210mm] mx-auto mb-6 print:hidden">
        <Link
          href="/for-pharmacies/dashboard/patient-forms"
          className="text-xs text-gray-500 hover:text-teal-600"
        >
          &larr; All patient forms
        </Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold mb-1">Blank form for patients to complete by hand</p>
            <p>
              Print this form for the patient to fill in before the
              consultation. The completed answers must still be entered into
              the{" "}
              <a
                href={`/for-pharmacies/epgd/${form.slug}`}
                className="underline font-medium"
              >
                ePGD tool
              </a>
              , which applies the PGD and makes the clinical decision. Keep the
              paper form with your records.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <PrintFormButton />
            <a
              href={`/api/patient-forms/${form.slug}/pdf`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-teal-600 bg-white text-teal-700 text-sm font-semibold hover:bg-teal-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Did the consultation on paper?{" "}
          <Link
            href={`/for-pharmacies/dashboard/records/paper/new?pgd=${form.slug}`}
            className="font-medium text-teal-600 hover:text-teal-700"
          >
            Record a paper consultation
          </Link>{" "}
          and attach a scan of the completed form.
        </p>
      </div>

      {/* The printable sheet */}
      <div
        id="grh-patient-form"
        className="max-w-[210mm] mx-auto bg-white text-gray-900 text-[13px] leading-snug shadow-md border border-gray-200 p-8"
      >
        {/* Header */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_14rem] gap-x-6 gap-y-2 mb-4 print:grid-cols-[1fr_14rem]">
          <Field label="Pharmacy:" />
          <Field label="Date:" />
        </div>
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-sm font-medium mt-1">Patient questionnaire. {form.ageNote}</p>
        {form.intro && <p className="text-sm mt-1">{form.intro}</p>}
        <p className="text-xs text-gray-600 mt-1">
          Tick one box for each question. If you are not sure, tick &ldquo;Not
          sure&rdquo; and the pharmacist will talk it through with you.
        </p>

        {/* About you */}
        <div className="pf-avoid-break">
          <SectionHeading>About you</SectionHeading>
          <div className="space-y-2">
            <Field label="Full name:" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <Field label="Date of birth:" />
              <Field label="Phone:" />
            </div>
            <Field label="Address:" />
            <div className="grid grid-cols-[1fr_12rem] gap-x-6">
              <span className="border-b border-gray-500 h-7" />
              <Field label="Postcode:" />
            </div>
            <Field label="Email:" />
            <Field label="GP practice:" />
            <Field label="NHS number (if known):" />
          </div>
        </div>

        {/* PGD-specific questions */}
        {form.sections.map((section, si) => (
          <div key={section.heading}>
            <SectionHeading>{section.heading}</SectionHeading>
            {section.intro && <p className="text-xs text-gray-700 mb-1">{section.intro}</p>}
            {section.questions.some((q) => q.type !== "text") && <AnswerHeader />}
            {section.questions.map((q, qi) => (
              <QuestionRow key={q.id} q={q} n={offsets[si] + qi + 1} />
            ))}
          </div>
        ))}

        {/* Medicines */}
        <div className="pf-avoid-break">
          <SectionHeading>Medicines you take</SectionHeading>
          <p className="text-xs text-gray-700">
            Please list every medicine you take, including ones you buy
            yourself, herbal remedies, inhalers, injections and contraception.
          </p>
          <div className="border-2 border-gray-800 rounded p-2 mt-1">
            <Lines count={4} />
          </div>
          <p className="font-medium mt-3">Is there anything else you would like the pharmacist to know?</p>
          <Lines count={2} />
        </div>

        {/* Consent */}
        <div className="pf-avoid-break">
          <SectionHeading>Your agreement</SectionHeading>
          <p className="text-sm">{form.consent}</p>
          <div className="grid grid-cols-[1fr_12rem] gap-x-6 gap-y-3 mt-3">
            <Field label="Signature:" />
            <Field label="Date:" />
          </div>
          {form.guardianLine && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold">
                Parent or guardian (only if the patient is under 16)
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <Field label="Name:" />
                <Field label="Relationship:" />
                <Field label="Signature:" />
                <Field label="Date:" />
              </div>
            </div>
          )}
          {form.under16Note && <p className="text-xs text-gray-700 mt-2">{form.under16Note}</p>}
        </div>

        {/* For pharmacy use only */}
        <div className="pf-avoid-break mt-6 border-[3px] border-gray-900 rounded p-4">
          <h2 className="text-base font-bold uppercase tracking-wide mb-1">
            For pharmacy use only
          </h2>
          <p className="text-xs text-gray-700 mb-3">
            This form does not make the clinical decision. Enter the answers
            into the ePGD tool, which applies the PGD.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Pharmacist name:" />
            <Field label="GPhC number:" />
          </div>

          <p className="font-semibold mt-3 mb-1">Pharmacist checks</p>
          <ul className="space-y-1.5">
            {form.pharmacyChecks.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <TickBox />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          <p className="font-semibold mt-3 mb-1">Decision</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <TickBox label={form.isVaccine ? "Vaccine given" : "Supplied"} />
            <TickBox label="Referred" />
            <TickBox label="Not suitable" />
            <TickBox label="Patient declined" />
          </div>
          <Field label="Referred to / reason:" className="mt-2" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
            <Field label="Product:" />
            <Field label="Dose / quantity:" />
            <Field label="Batch number:" />
            <Field label="Expiry date:" />
          </div>
          {form.isVaccine && (
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-3">
              <span className="font-medium">Site:</span>
              <TickBox label="Left upper arm" />
              <TickBox label="Right upper arm" />
              <Field label="Other:" className="flex-1 min-w-[8rem]" />
            </div>
          )}
          <div className="grid grid-cols-[1fr_12rem] gap-x-6 gap-y-2 mt-3">
            <Field label="Pharmacist signature:" />
            <Field label="Date:" />
          </div>
          <div className="mt-3">
            <TickBox label="Entered into the ePGD tool" />
          </div>
          <p className="text-[10px] text-gray-500 mt-3">
            Questions based on the signed PGD document {form.pgdDocument}. Get
            Real Health patient questionnaire.
          </p>
        </div>
      </div>
    </div>
  );
}
