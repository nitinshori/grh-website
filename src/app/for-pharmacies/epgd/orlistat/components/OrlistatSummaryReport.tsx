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

const NOT_RECORDED = "Not recorded";

export function OrlistatSummaryReport({ state }: { state: OrlistatConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">
          Orlistat ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500">Lipase inhibitor for weight management</p>
        <p className="text-xs text-gray-500">
          Orlistat 120mg capsules PGD, version 004, issued 11 September 2026
        </p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : NOT_RECORDED} />
        <Row label="Address" value={state.patient.address || NOT_RECORDED} />
        <Row label="NHS Number" value={state.patient.nhsNumber || NOT_RECORDED} />
        <Row label="GP Name" value={state.patient.gpName || NOT_RECORDED} />
        <Row label="GP Practice" value={state.patient.gpPractice || NOT_RECORDED} />
      </div>

      <SectionHeader>Weight Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Visit" value={state.weightAssessment.visitType === "continuation" ? `Continuation (treatment started ${state.weightAssessment.treatmentStartDate || NOT_RECORDED})` : state.weightAssessment.visitType === "initiation" ? "First supply" : NOT_RECORDED} />
        <Row label="Height" value={state.weightAssessment.height ? `${state.weightAssessment.height} cm` : NOT_RECORDED} />
        {state.weightAssessment.visitType === "continuation" && (
          <Row label="Baseline Weight (start of treatment)" value={state.weightAssessment.baselineWeight ? `${state.weightAssessment.baselineWeight} kg` : NOT_RECORDED} />
        )}
        <Row label={state.weightAssessment.visitType === "continuation" ? "Weight at this visit" : "Baseline Weight"} value={state.weightAssessment.weight ? `${state.weightAssessment.weight} kg` : NOT_RECORDED} />
        {state.weightAssessment.visitType === "continuation" && state.weightAssessment.baselineWeight && state.weightAssessment.weight && (
          <Row label="Weight change from baseline" value={`${Math.round(((state.weightAssessment.baselineWeight - state.weightAssessment.weight) / state.weightAssessment.baselineWeight) * 1000) / 10}% lost`} />
        )}
        <Row label="BMI" value={state.weightAssessment.bmi ? `${state.weightAssessment.bmi} kg/m²` : NOT_RECORDED} />
        <Row label="BMI Category" value={state.weightAssessment.bmiCategory || NOT_RECORDED} />
        <Row
          label="Baseline Waist Circumference"
          value={
            state.weightAssessment.waistCircumference
              ? `${state.weightAssessment.waistCircumference} cm`
              : NOT_RECORDED
          }
        />
        <Row
          label="Weight-Related Comorbidities"
          value={
            state.weightAssessment.comorbidities.length > 0
              ? state.weightAssessment.comorbidities.join(", ")
              : "None"
          }
        />
        <Row
          label="Motivated, structured reduced-calorie diet"
          value={state.weightAssessment.motivatedStructuredDiet ? "Confirmed" : "Not confirmed"}
        />
      </div>

      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid
        items={[
          ["Cholestasis or severe hepatic impairment", state.medicalHistory.cholestasis],
          ["Chronic malabsorption syndrome", state.medicalHistory.chronicMalabsorption],
          ["Currently pregnant", state.medicalHistory.pregnant],
          ["Currently breastfeeding", state.medicalHistory.breastfeeding],
          ["Hypersensitivity to orlistat or any component", state.medicalHistory.hypersensitivityToOrlistat],
          ["Uncontrolled or newly diagnosed diabetes", state.medicalHistory.uncontrolledOrNewDiabetes],
          ["Gallstone disease", state.medicalHistory.gallbladderDisease],
          ["History of oxalate kidney stones", state.medicalHistory.oxalateKidneyStones],
          ["Chronic liver disease or elevated LFTs", state.medicalHistory.chronicLiverDisease],
          ["Chronic diarrhoea", state.medicalHistory.chronic_diarrhea],
          ["Chronic kidney disease / volume depletion", state.medicalHistory.chronicKidneyDisease],
        ]}
      />

      <SectionHeader>Current Medications & Interactions</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Warfarin" value={state.medications.takesWarfarin ? "Yes" : "No"} />
        <Row label="Other anticoagulant" value={state.medications.takesOtherAnticoagulant ? "Yes" : "No"} />
        <Row label="Levothyroxine" value={state.medications.takesLevothyroxine ? "Yes" : "No"} />
        <Row label="Antiepileptic medicines (exclusion)" value={state.medications.takesAntiEpileptics ? "Yes" : "No"} />
        <Row label="Ciclosporin" value={state.medications.takesCiclosporin ? "Yes" : "No"} />
        <Row label="Bile acid sequestrant" value={state.medications.takesBileAcidSequestrants ? "Yes" : "No"} />
        <Row label="Oral contraceptives" value={state.medications.takesOralContraceptives ? "Yes" : "No"} />
        <Row label="HIV antiretrovirals (exclusion)" value={state.medications.takesHIVAntiretrovirals ? "Yes" : "No"} />
        <Row label="Amiodarone (exclusion)" value={state.medications.takesAmiodarone ? "Yes" : "No"} />
        <Row label="Other unmanageable SmPC interaction (exclusion)" value={state.medications.otherSignificantInteraction ? "Yes" : "No"} />
        <Row label="Other medications" value={state.medications.otherMedications || "None recorded"} />
        <Row label="Allergies" value={state.medications.allergies.trim() ? state.medications.allergies : state.medications.nkda ? "No known drug allergies (confirmed)" : NOT_RECORDED} />
      </div>

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {state.doseRecommendation && (
        <>
          <SectionHeader>Dose Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency || NOT_RECORDED} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || NOT_RECORDED} />
            <Row label="Treatment Period" value={state.doseRecommendation.duration || NOT_RECORDED} />
          </div>
        </>
      )}

      <SectionHeader>Medicine Supply</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Medicine" value="Orlistat 120mg capsules" />
        <Row label="Brand" value={state.medicineSupply.brand || NOT_RECORDED} />
        <Row label="Form and Route" value="Capsule, oral" />
        <Row label="Dosage" value={state.medicineSupply.dosage} />
        <Row label="Quantity" value={state.medicineSupply.quantity ? `${state.medicineSupply.quantity} capsules` : NOT_RECORDED} />
        <Row label="Date of Supply" value={state.summary.consultationDate || NOT_RECORDED} />
        <Row label="Prescription Type" value={state.medicineSupply.prescriptionType} />
        <Row label="Refill Schedule" value={state.medicineSupply.refillSchedule} />
      </div>

      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["PIL supplied", state.counselling.pilSupplied],
          ["Reduced-calorie, low-fat diet explained", state.counselling.dietaryAdvice],
          ["Steatorrhoea discussed", state.counselling.steatorrhoea],
          ["Fat-soluble vitamins counselled", state.counselling.fatSolubleVitamins],
          ["Multivitamin at least 2 hours apart from orlistat", state.counselling.multivitamin],
          ["Omit dose if meal missed or fat-free", state.counselling.missedMealAdvice],
          ["Levothyroxine at least 4 hours before orlistat", state.counselling.separationAdvice],
          ["Red flag symptoms to report to GP", state.counselling.redFlagSymptoms],
          ["Expected weight loss discussed", state.counselling.expectedWeightLoss],
          ["Diabetes medication: inform GP", state.counselling.diabetesMedicationAdvice],
          ["Anticoagulant: GP aware, INR monitored", state.counselling.anticoagulantAdvice],
          ["12-week (3-month) review arranged", state.counselling.reviewSchedule],
          ["5% weight loss target discussed", state.counselling.weightLossTarget],
          ["Follow-up protocol explained", state.counselling.followUpProtocol],
          ["Yellow Card reporting advised", state.counselling.yellowCard],
        ]}
      />

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
