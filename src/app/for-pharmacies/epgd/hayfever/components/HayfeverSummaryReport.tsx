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
          Hayfever (Prescription Strength), Consultation Record
        </h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
        <p className="text-gray-500">Fexofenadine and/or Dymista for Allergic Rhinitis PGD, version 003, issued 11 September 2026</p>
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
      <Row
        label="Previous diagnosis of allergic rhinitis or recurrence of known symptoms"
        value={state.assessment.previousDiagnosisOrRecurrence ? "Yes" : "No"}
      />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="Asthma or LRTI" value={state.medicalHistory.asthmaOrLrti ? "Yes" : "No"} />
      <Row
        label="Severe hepatic impairment"
        value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
      />
      <Row
        label="Severe renal impairment"
        value={state.medicalHistory.renalImpairment ? "Yes" : "No"}
      />
      <Row
        label="Recent nasal surgery or trauma"
        value={state.medicalHistory.recentNasalSurgery ? "Yes" : "No"}
      />
      <Row
        label="Untreated nasal infection"
        value={state.medicalHistory.untreatedNasalInfection ? "Yes" : "No"}
      />
      <Row
        label="History of cardiovascular disease"
        value={state.medicalHistory.cardiovascularDisease ? "Yes" : "No"}
      />
      <Row label="Glaucoma" value={state.medicalHistory.glaucoma ? "Yes" : "No"} />
      <Row label="Tuberculosis" value={state.medicalHistory.tuberculosis ? "Yes" : "No"} />
      <Row
        label="Phenylketonuria"
        value={state.medicalHistory.phenylketonuria ? "Yes" : "No"}
      />

      <SectionHeader>Contraindications Check</SectionHeader>
      <Row label="Pregnant" value={state.contraindications.pregnant ? "Yes" : "No"} />
      <Row label="Breastfeeding" value={state.contraindications.breastfeeding ? "Yes" : "No"} />
      <Row
        label="Child under 12"
        value={state.contraindications.childUnder12 ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to fexofenadine or any component"
        value={state.contraindications.hypersensitivityFexofenadine ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to azelastine, fluticasone or any excipient"
        value={state.contraindications.hypersensitivityDymista ? "Yes" : "No"}
      />

      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
          <Row label="Quantity and treatment period" value={doseRecommendation.duration || "—"} />
          <Row label="Dosage confirmed with patient" value={state.medicineSupply.dosageConfirmed ? "Yes" : "No"} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Allergen avoidance measures discussed", state.counselling.allergenAvoidance],
          ["Correct nasal spray technique advised (Dymista)", state.counselling.nasalSprayTechnique],
          ["Effectiveness timeline explained (Dymista: assess after 2 to 4 weeks; fexofenadine: refer if persisting beyond 7 days or worsening)", state.counselling.effectivenessTimeline],
          ["Combination therapy rationale explained", state.counselling.combinationRationale],
          ["Wraparound sunglasses recommended", state.counselling.wrapsunglasses],
          ["Pollen forecast checking advised", state.counselling.pollenForecastAdvice],
          ["Avoid alcohol and other sedating antihistamines (fexofenadine)", state.counselling.alcoholSedatingAdvice],
          ["Non-sedating but occasional drowsiness may still occur (fexofenadine)", state.counselling.drowsinessAdvice],
          ["Possible side effects and ongoing review if used long-term (Dymista)", state.counselling.sideEffectsAdvice],
          ["Follow-up advice: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or systemically very unwell", state.counselling.followUpAdvice],
          ["Patient information leaflet supplied", state.counselling.pilSupplied],
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
