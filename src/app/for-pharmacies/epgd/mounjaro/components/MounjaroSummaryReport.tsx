"use client";

import type { MounjaroConsultationState } from "../lib/mounjaro-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

export function MounjaroSummaryReport({ state }: { state: MounjaroConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      {/* Header */}
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">
          Mounjaro (Tirzepatide) ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500">Dual GIP/GLP-1 receptor agonist for weight management</p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="GP Name" value={state.patient.gpName || "—"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "—"} />
      </div>

      {/* Weight Assessment */}
      <SectionHeader>Weight Assessment & BMI</SectionHeader>
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

      {/* Medical History */}
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <p className="font-semibold text-navy-900">Exclusion Criteria Checked:</p>
        <CounsellingGrid
          items={[
            ["Personal MTC history", state.medicalHistory.personalMTCHistory],
            ["Family MTC history", state.medicalHistory.familyMTCHistory],
            ["MEN2", state.medicalHistory.men2],
            ["History of pancreatitis", state.medicalHistory.pancreatitisHistory],
            ["Severe GI disease", state.medicalHistory.severeGIDisease],
            ["Type 1 diabetes", state.medicalHistory.type1Diabetes],
            ["Currently pregnant", state.medicalHistory.pregnant],
            ["Currently breastfeeding", state.medicalHistory.breastfeeding],
          ]}
        />
        <p className="font-semibold text-navy-900 mt-3">Cautions & Monitoring:</p>
        <CounsellingGrid
          items={[
            ["Gallbladder disease", state.medicalHistory.gallbladderDisease],
            ["Renal impairment", state.medicalHistory.renalImpairment],
            ["Diabetic retinopathy", state.medicalHistory.diabeticRetinopathy],
            ["Depression/mental health", state.medicalHistory.depression],
            ["Thyroid disease", state.medicalHistory.thyroidDisease],
          ]}
        />
      </div>

      {/* Medications */}
      <SectionHeader>Current Medications & Interactions</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Taking insulin" value={state.medications.takesInsulin ? "Yes" : "No"} />
        {state.medications.takesInsulin && (
          <Row label="Insulin details" value={state.medications.insulinDetails || "—"} />
        )}
        <Row label="Other GLP-1 agonist" value={state.medications.currentGLP1 ? "Yes" : "No"} />
        <Row label="Warfarin user" value={state.medications.warfarinUser ? "Yes" : "No"} />
        <Row label="Oral contraceptives" value={state.medications.takesOralContraceptives ? "Yes" : "No"} />
        <Row label="Allergies" value={state.medications.allergies || "NKDA"} />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {/* Dose Recommendation */}
      {state.doseRecommendation && (
        <>
          <SectionHeader>Dose Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency || "—"} />
            <Row label="Duration" value={state.doseRecommendation.duration || "—"} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
            <Row label="Reason" value={state.doseRecommendation.reason} />
          </div>
        </>
      )}

      {/* Counselling */}
      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["Injection technique explained", state.counselling.injectionTechnique],
          ["Injection site rotation", state.counselling.injectionSiteRotation],
          ["Storage: refrigeration (2-8°C)", state.counselling.storageRefrigeration],
          ["Missed dose protocol", state.counselling.missedDoseProtocol],
          ["GI side effects discussed", state.counselling.giSideEffects],
          ["Pancreatitis warning signs", state.counselling.pancreatitisWarning],
          ["Gallbladder warning signs", state.counselling.gallbladderWarning],
          ["Retinopathy monitoring", state.counselling.retinopathyWarning],
          ["Pen device use", state.counselling.penDeviceUse],
          ["Follow-up schedule arranged", state.counselling.followUpSchedule],
          ["Diet & exercise advice", state.counselling.dietExerciseAdvice],
        ]}
      />

      {/* Observations */}
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
        <Row label="Heart Rate" value={state.observations.heartRate ? `${state.observations.heartRate} bpm` : "—"} />
        <Row label="Weight (at consultation)" value={state.observations.weight ? `${state.observations.weight} kg` : "—"} />
      </div>

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Mounjaro (Tirzepatide)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      {/* Footer */}
      <ReportFooter pgdName="Mounjaro (Tirzepatide)" />
    </div>
  );
}
