"use client";

import type { HayfeverConsultationState } from "../lib/hayfever-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HayfeverSummaryReportProps {
  state: HayfeverConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function HayfeverSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: HayfeverSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          Hayfever (Prescription Strength) — Consultation Record
        </h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Row
            label="Name"
            value={`${state.patient.firstName} ${state.patient.lastName}`}
          />
          <Row label="Date of Birth" value={state.patient.dateOfBirth} />
          <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        </div>
        <div>
          <Row label="GP Name" value={state.patient.gpName || "—"} />
          <Row label="GP Practice" value={state.patient.gpPractice || "—"} />
          <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        </div>
      </div>

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Symptom Assessment</SectionHeader>
      <Row label="Symptom severity" value={state.assessment.symptomSeverity || "—"} />
      <Row label="Type" value={state.assessment.seasonalOrPerennial || "—"} />
      <Row label="Affected systems" value={state.assessment.affectedSystems.join(", ") || "—"} />
      <Row label="Previous OTC treatment" value={state.assessment.previousOTCUse || "—"} />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="Asthma or LRTI" value={state.medicalHistory.asthmaOrLrti ? "Yes" : "No"} />
      <Row
        label="Severe hepatic impairment"
        value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
      />
      <Row
        label="Renal impairment"
        value={state.medicalHistory.renalImpairment ? "Yes" : "No"}
      />
      <Row
        label="Recent nasal surgery"
        value={state.medicalHistory.recentNasalSurgery ? "Yes" : "No"}
      />
      <Row
        label="Phenylketonuria"
        value={state.medicalHistory.phenylketonuria ? "Yes" : "No"}
      />

      <SectionHeader>Contraindications Check</SectionHeader>
      <Row label="Pregnant" value={state.contraindications.pregnant ? "Yes" : "No"} />
      <Row label="Breastfeeding" value={state.contraindications.breastfeeding ? "Yes" : "No"} />
      <Row
        label="Child under 12 (if fexofenadine 180)"
        value={state.contraindications.childUnder12 ? "Yes" : "No"}
      />

      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Allergen avoidance measures discussed", state.counselling.allergenAvoidance],
          ["Nasal spray technique demonstrated", state.counselling.nasalSprayTechnique],
          ["Effectiveness timeline explained (2 weeks for nasal steroids)", state.counselling.effectivenessTimeline],
          ["Combination therapy rationale explained", state.counselling.combinationRationale],
          ["Wraparound sunglasses recommended", state.counselling.wrapsunglasses],
          ["Pollen forecast checking advised", state.counselling.pollenForecastAdvice],
        ]}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      <PharmacistDeclaration
        pgdName="Hayfever (Prescription Strength)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="Hayfever (Prescription Strength)" />
    </div>
  );
}
