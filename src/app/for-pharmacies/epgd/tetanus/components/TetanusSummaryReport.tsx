"use client";

import type { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { SectionHeader, Row, CounsellingGrid, ReportFooter } from "../../shared/components/SummaryReportShell";
import { PGD_VERSION, type Clinical } from "../tetanus-types";

/**
 * Printed record for the Td/IPV ePGD. Until this existed, Save & Print
 * printed the last step's five checkboxes and two name fields: no batch, no
 * brand, no wound assessment, no consent basis (adversarial review,
 * 11 Sep 2026). Every item in the document's "Records to be kept" list is here,
 * including the written record of brand and batch the patient is to be given.
 */
export function TetanusSummaryReport({
  patient,
  consent,
  clinical: c,
  summary,
  alerts,
  doseText,
  immunoglobulinIndicated,
  offLabel,
}: {
  patient: BasePatientDetails;
  consent: BaseConsent;
  clinical: Clinical;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseText: string;
  immunoglobulinIndicated: boolean;
  offLabel: boolean;
}) {
  const hasStops = alerts.some((a) => a.severity === "stop");
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("en-GB") : "Not recorded");
  const underSixteen = patient.age !== null && patient.age < 16;

  const consentText = !consent.informedConsentGiven
    ? "Not recorded"
    : underSixteen
      ? c.consentBasis === "parental"
        ? `Valid informed consent given by a person with parental responsibility: ${c.parentName || "not recorded"}`
        : c.consentBasis === "gillick"
          ? `Valid informed consent given by the young person, assessed as Gillick competent. Basis: ${c.parentName || "not recorded"}`
          : "Under 16: consent basis not recorded"
      : "Valid informed consent given by the individual";

  const indicationText =
    c.indication === "adolescent-booster"
      ? "Adolescent booster following a primary course"
      : c.indication === "incomplete-history"
        ? `No history, or incomplete or uncertain history: ${c.primaryCourseContinuation ? "second or third" : "first"} dose of a primary course`
        : c.indication === "travel"
          ? `Travel booster: ${c.destination || "destination not recorded"}`
          : c.indication === "wound"
            ? "Tetanus-prone wound: reinforcing dose"
            : "Not recorded";

  const lastDoseText: Record<string, string> = {
    "over-10": "More than 10 years ago",
    "5-to-10": "5 to 10 years ago",
    "under-5": "Between 12 months and 5 years ago",
    "under-12-months": "Within the last 12 months",
    unknown: "Unknown or uncertain",
    "": "Not recorded",
  };

  const routeText = c.route === "deep-subcutaneous" ? "Deep subcutaneous" : c.route === "intramuscular" ? "Intramuscular" : "Not recorded";

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tetanus, Diphtheria and Polio (Td/IPV) Vaccination Record</h1>
          <p className="text-xs text-gray-500 mt-1">{PGD_VERSION}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">{summary.consultationDate}</p>
          <p>{summary.consultationTime}</p>
        </div>
      </div>

      <SectionHeader>Patient</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={`${fmtDate(patient.dateOfBirth)} (${patient.age ?? "?"} years)`} />
        <Row label="Address" value={patient.address || "Not recorded"} />
        <Row label="NHS number" value={patient.nhsNumber || "Not provided"} />
        <Row label="GP" value={patient.gpPractice || patient.gpName || "Not recorded"} />
        <Row label="Consent" value={consentText} />
        <Row label="Allergies" value={c.allergies || "Not recorded"} />
      </div>

      <SectionHeader>Indication and Dose History</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Indication" value={indicationText} />
        <Row label="Last tetanus-containing dose" value={lastDoseText[c.lastDose] ?? "Not recorded"} />
        <Row label="Date of most recent dose, and how established" value={c.lastDoseDate || "Not recorded"} />
        <Row label="Documented prior doses" value={c.dosesReceived || "Not recorded"} />
        <Row label="Source of the dose history" value={c.dosesSource || "Not recorded"} />
        {c.primaryCourseContinuation && <Row label="Prior primary dose under this PGD" value={fmtDate(c.priorPrimaryDoseDate)} />}
        {c.indication === "wound" && (
          <>
            <Row label="Wound tetanus-prone" value={c.woundProne ? "Yes" : "No"} />
            <Row label="Wound high risk" value={c.woundHighRisk ? "Yes" : "No"} />
            <Row label="Priming status" value={c.priming === "adequate" ? "Adequately primed (3 or more documented doses)" : c.priming === "incomplete" ? "Not adequately primed, or history uncertain" : "Not recorded"} />
            <Row label="Assessment against table 30.1 and conclusion on immunoglobulin" value={c.woundAssessmentNote || "Not recorded"} />
            <Row label="Immunoglobulin" value={immunoglobulinIndicated ? `Indicated: same-day referral ${c.immunoglobulinReferralArranged ? "arranged" : "NOT recorded as arranged"} (not a PGD supply)` : "Not indicated"} />
          </>
        )}
      </div>

      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <div className="space-y-1 mb-6">
            {alerts.map((a) => (
              <p key={a.code} className="text-xs text-gray-800">
                <span className="font-semibold uppercase">{a.severity}:</span> {a.message}
              </p>
            ))}
          </div>
        </>
      )}

      <SectionHeader>{hasStops ? "Outcome" : "Vaccine Administered under this PGD"}</SectionHeader>
      {hasStops ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Outcome" value="NOT VACCINATED: exclusion criteria met" />
          <Row label="Exclusion" value={alerts.filter((a) => a.severity === "stop").map((a) => a.message).join("; ")} />
          <Row label="Explained why and what happens next" value={c.exclusionExplained ? "Yes" : "Not recorded"} />
          <Row label="Referral" value={c.referralArranged ? `Arranged: ${c.referralDetails || "details not recorded"}` : "Not recorded as arranged"} />
          <Row label="Wound care advice" value={c.woundAdvice ? "Given" : "Not recorded"} />
          <Row label="GP informed" value={c.gpInformed ? "Yes" : "Not recorded"} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Vaccine (name and brand)" value="Revaxis (Td/IPV), adsorbed diphtheria (low dose), tetanus and inactivated poliomyelitis vaccine, suspension for injection in a pre-filled syringe" />
          <Row label="Dose" value={doseText} />
          <Row label="Route" value={routeText} />
          <Row label="Anatomical site" value={c.site || "Not recorded"} />
          <Row label="Quantity administered" value="1 x 0.5 mL dose" />
          <Row label="Date of administration" value={summary.consultationDate} />
          <Row label="Batch number" value={c.batchNumber || "Not recorded"} />
          <Row label="Expiry date" value={c.expiryDate || "Not recorded"} />
          <Row label="Adrenaline and anaphylaxis facilities confirmed before vaccination" value={c.anaphylaxisKit ? "Yes" : "No"} />
          <Row label="15 minute observation period completed" value={c.observationCompleted ? "Yes" : "No"} />
          {offLabel && <Row label="Off-label use" value={c.offLabelExplained ? "Explained and consent given on that basis" : "NOT recorded as explained"} />}
          <Row label="Administered under" value={PGD_VERSION} />
        </div>
      )}

      {!hasStops && (
        <>
          <SectionHeader>Advice Given</SectionHeader>
          <div className="mb-6">
            <CounsellingGrid
              items={[
                ["Written record of the vaccine (date, brand, batch) and PIL supplied; told to keep the record", c.recordAdvice],
                ["Next dose booked where a course is involved", c.courseAdvice],
                ["Common side effects and Yellow Card reporting explained", c.sideEffectAdvice],
                ["Wound care advice: clean any dirty, puncture or contaminated wound and seek medical advice", c.woundAdvice],
              ]}
            />
          </div>
        </>
      )}

      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <div className="bg-gray-50 rounded p-4 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <SectionHeader>Pharmacist Declaration</SectionHeader>
        <p className="text-xs text-gray-600 mb-4">
          {hasStops
            ? "I confirm that this consultation was conducted in accordance with the Patient Group Direction for tetanus, diphtheria and polio vaccine (Revaxis), that the patient met an exclusion criterion, that NO vaccine was administered, and that the assessment, referral and advice recorded above were made and given."
            : "I confirm that this vaccine was administered under the Patient Group Direction for tetanus, diphtheria and polio vaccine (Revaxis), that the patient met the inclusion criteria and no exclusion criteria applied, that the 15 minute observation period was completed, and that the advice recorded above was given."}
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
            <div className="border-b border-gray-300 min-h-[2rem]" />
          </div>
        </div>
      </div>

      <ReportFooter pgdName="Tetanus, Diphtheria and Polio ePGD" />
    </div>
  );
}
