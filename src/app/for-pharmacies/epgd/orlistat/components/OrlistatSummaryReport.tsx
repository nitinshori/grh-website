"use client";

import type { OrlistatConsultationState } from "../lib/orlistat-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

export function OrlistatSummaryReport({ state }: { state: OrlistatConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">
          Orlistat ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500">Lipase inhibitor for weight management</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="GP Name" value={state.patient.gpName || "—"} />
      </div>

      <SectionHeader>Weight Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Height" value={state.weightAssessment.height ? `${state.weightAssessment.height} cm` : "—"} />
        <Row label="Weight" value={state.weightAssessment.weight ? `${state.weightAssessment.weight} kg` : "—"} />
        <Row label="BMI" value={state.weightAssessment.bmi ? `${state.weightAssessment.bmi} kg/m²` : "—"} />
        <Row label="BMI Category" value={state.weightAssessment.bmiCategory || "—"} />
        <Row
          label="Weight-Related Comorbidities"
          value={
            state.weightAssessment.comorbidities.length > 0
              ? state.weightAssessment.comorbidities.join(", ")
              : "None"
          }
        />
      </div>

      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid
        items={[
          ["Cholestasis", state.medicalHistory.cholestasis],
          ["Chronic malabsorption syndrome", state.medicalHistory.chronicMalabsorption],
          ["Currently pregnant", state.medicalHistory.pregnant],
          ["Currently breastfeeding", state.medicalHistory.breastfeeding],
          ["Gallbladder disease", state.medicalHistory.gallbladderDisease],
          ["Chronic diarrhoea", state.medicalHistory.chronic_diarrhea],
        ]}
      />

      <SectionHeader>Current Medications & Interactions</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Warfarin user" value={state.medications.takesWarfarin ? "Yes" : "No"} />
        <Row label="Levothyroxine user" value={state.medications.takesLevothyroxine ? "Yes" : "No"} />
        <Row label="Anti-epileptic medications" value={state.medications.takesAntiEpileptics ? "Yes" : "No"} />
        <Row label="Ciclosporin user" value={state.medications.takesCiclosporin ? "Yes" : "No"} />
        <Row label="Allergies" value={state.medications.allergies || "NKDA"} />
      </div>

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {state.doseRecommendation && (
        <>
          <SectionHeader>Dose Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency || "—"} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
          </div>
        </>
      )}

      <SectionHeader>Medicine Supply</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Dosage" value={state.medicineSupply.dosage} />
        <Row label="Quantity" value={state.medicineSupply.quantity ? `${state.medicineSupply.quantity} capsules` : "—"} />
        <Row label="Prescription Type" value={state.medicineSupply.prescriptionType} />
        <Row label="Refill Schedule" value={state.medicineSupply.refillSchedule} />
      </div>

      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["Low-fat diet explained", state.counselling.dietaryAdvice],
          ["Steatorrhoea discussed", state.counselling.steatorrhoea],
          ["Fat-soluble vitamins counselled", state.counselling.fatSolubleVitamins],
          ["Multivitamin at bedtime", state.counselling.multivitamin],
          ["Separation of medications", state.counselling.separationAdvice],
          ["3-month review scheduled", state.counselling.reviewSchedule],
          ["Weight loss target discussed", state.counselling.weightLossTarget],
          ["Follow-up protocol explained", state.counselling.followUpProtocol],
        ]}
      />

      <SectionHeader>Clinical Observations</SectionHeader>
      <div className="space-y-1.5">
        <Row
          label="Blood Pressure"
          value={
            state.observations.systolicBP && state.observations.diastolicBP
              ? `${state.observations.systolicBP}/${state.observations.diastolicBP} mmHg`
              : "—"
          }
        />
        <Row label="Weight (at consultation)" value={state.observations.weight ? `${state.observations.weight} kg` : "—"} />
      </div>

      <PharmacistDeclaration
        pgdName="Orlistat"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      <ReportFooter pgdName="Orlistat" />
    </div>
  );
}
