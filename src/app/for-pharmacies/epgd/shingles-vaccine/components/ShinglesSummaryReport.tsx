"use client";

import type { ShinglesConsultationState } from "../lib/shingles-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface ShinglesSummaryReportProps {
  state: ShinglesConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: ReturnType<typeof import("../lib/shingles-clinical-logic").calculateDoseRecommendation>;
}

export function ShinglesSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: ShinglesSummaryReportProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:shadow-none print:p-0">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h2 className="text-lg font-bold text-navy-900">
          Shingles Vaccination (Shingrix) ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Consultation Date: {state.summary.consultationDate} |{" "}
          {state.summary.consultationTime}
        </p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={`${state.patient.age} years`} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
      </div>

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Eligibility Assessment</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Aged 50 or older, eligible under national guidelines" value={state.assessment.ageEligible ? "Yes" : "No"} />
        <Row label="Immunosuppressed" value={state.assessment.immunosuppressed ? "Yes" : "No"} />
        <Row
          label="Pregnancy or breastfeeding"
          value={
            state.assessment.pregnancyStatus === "confirmed"
              ? "Pregnant (excluded)"
              : state.assessment.pregnancyStatus === "breastfeeding"
                ? "Breastfeeding (excluded)"
                : state.assessment.pregnancyStatus === "unknown"
                  ? "Unknown"
                  : state.assessment.pregnancyStatus === "not-pregnant"
                    ? "No"
                    : "Not recorded"
          }
        />
        <Row label="Two-dose course already completed" value={state.assessment.completedCourse ? "Yes (excluded)" : "No"} />
        <Row
          label="Dose 1 of Shingrix previously given"
          value={state.assessment.previousShingrix ? `Yes (${state.assessment.previousShingrixDate || "date not recorded"})` : "No"}
        />
        <Row label="Previous Zostavax" value={state.assessment.previousZostavax ? "Yes (not an exclusion)" : "No"} />
        <Row label="Shingles in the past 12 months" value={state.assessment.previousShinglesHistory ? "Yes (excluded)" : "No"} />
        <Row label="Other vaccine recently or today" value={state.assessment.recentOtherVaccine ? "Yes (spacing per clinical judgement)" : "No"} />
      </div>

      <SectionHeader>Contraindication Check</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.anaphylaxisToComponent ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.anaphylaxisToComponent && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No hypersensitivity to any component of the vaccine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.severeAcuteIllness ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.severeAcuteIllness && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No acute illness with fever at time of consultation</span>
        </div>
      </div>

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Explained 2-dose schedule (second dose 2 to 6 months after the first)", state.counselling.explainedDoseSchedule],
          ["Discussed local injection reactions", state.counselling.explainedLocalReactions],
          ["Systemic side effects common and self-limiting", state.counselling.explainedSystemicReactions],
          ["Explained vaccine effectiveness (over 90% protection)", state.counselling.explainedEffectiveness],
          ["Clarified NOT a live vaccine", state.counselling.explainedNotLiveVaccine],
          ["Patient information leaflet supplied", state.counselling.offeredWrittenInfo],
          ["Follow-up advice given", state.counselling.followUpAdviceGiven],
        ]}
      />

      <SectionHeader>Vaccine Supply</SectionHeader>
      {doseRecommendation ? (
        <div className="space-y-0.5">
          <Row label="Vaccine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Schedule" value={doseRecommendation.dosingRegimen || ""} />
          <Row label="Clinical Reason" value={doseRecommendation.reason} />
          <Row label="Dose number" value={state.supply.doseNumber ? `${state.supply.doseNumber} of 2` : "Not recorded"} />
          <Row label="Vaccination date" value={state.supply.vaccinationDate || "Not recorded"} />
          {state.supply.doseNumber === "1" && (
            <Row label="Second dose due" value={state.supply.nextDoseDue || "Not recorded"} />
          )}
          <Row label="Batch number" value={state.supply.batchNumber || "Not recorded"} />
          <Row label="Expiry date" value={state.supply.expiryDate || "Not recorded"} />
          <Row
            label="Anatomical site"
            value={
              state.supply.site === "left-deltoid"
                ? "Left deltoid (IM)"
                : state.supply.site === "right-deltoid"
                  ? "Right deltoid (IM)"
                  : "Not recorded"
            }
          />
        </div>
      ) : (
        <p className="text-xs text-gray-500">No vaccine recommendation (check alerts)</p>
      )}

      <SectionHeader>Clinical Notes</SectionHeader>
      <p className="text-xs text-gray-700 whitespace-pre-wrap">
        {state.summary.clinicalNotes || "(No additional notes)"}
      </p>

      <p className="text-[10px] text-gray-500 mt-4">
        Patient Group Direction for Shingrix (prevention of shingles), version 005, issued 11 September 2026.
      </p>

      <PharmacistDeclaration
        pgdName="Shingles Vaccination (Shingrix)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="Shingles Vaccination (Shingrix)" />
    </div>
  );
}
