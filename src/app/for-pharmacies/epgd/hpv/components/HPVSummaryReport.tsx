"use client";

import type { HPVConsultationState } from "../lib/hpv-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HPVSummaryReportProps {
  state: HPVConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: ReturnType<typeof import("../lib/hpv-clinical-logic").calculateDoseRecommendation>;
}

export function HPVSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: HPVSummaryReportProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:shadow-none print:p-0">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h2 className="text-lg font-bold text-navy-900">
          HPV Vaccination (Gardasil 9) ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Consultation Date: {state.summary.consultationDate} |{" "}
          {state.summary.consultationTime}
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={`${state.patient.age} years`} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Vaccine Assessment */}
      <SectionHeader>Vaccine Assessment</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Age Criteria Met" value={state.assessment.ageCriteriaMet ? "Yes" : "No"} />
        <Row label="Pregnancy Status" value={state.assessment.pregnancyStatus} />
        <Row label="Current Febrile Illness" value={state.assessment.currentFebrileIllness ? "Yes" : "No"} />
        <Row label="Previous Gardasil Dose" value={state.assessment.previousGardasilDose ? "Yes" : "No"} />
      </div>

      {/* Exclusions Check */}
      <SectionHeader>Exclusions Check</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.anaphylaxisToYeast ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.anaphylaxisToYeast && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No anaphylaxis to yeast documented</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.anaphylaxisToPreviousDose ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.anaphylaxisToPreviousDose && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No anaphylaxis to previous HPV dose</span>
        </div>
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Explained 3-dose schedule (0, 2, 6 months)", state.counselling.explainedDoseSchedule],
          ["Discussed HPV types protected (6, 11, 16, 18, 31, 33, 45, 52, 58)", state.counselling.explainedProtection],
          ["Counselled on common reactions (arm soreness, mild fever)", state.counselling.discussedCommonReactions],
          ["Clarified vaccine not treatment for existing infection", state.counselling.explainedNotTreatment],
          ["Offered written information leaflet", state.counselling.offeredWrittenInfo],
        ]}
      />

      {/* Medicine Supply */}
      <SectionHeader>Vaccine Supply</SectionHeader>
      {doseRecommendation ? (
        <div className="space-y-0.5">
          <Row label="Vaccine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Schedule" value={doseRecommendation.dosingRegimen || ""} />
          <Row label="Clinical Reason" value={doseRecommendation.reason} />
        </div>
      ) : (
        <p className="text-xs text-gray-500">No vaccine recommendation (check alerts)</p>
      )}

      {/* Clinical Notes */}
      <SectionHeader>Clinical Notes</SectionHeader>
      <p className="text-xs text-gray-700 whitespace-pre-wrap">
        {state.summary.clinicalNotes || "(No additional notes)"}
      </p>

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="HPV Vaccination (Gardasil 9)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="HPV Vaccination (Gardasil 9)" />
    </div>
  );
}
