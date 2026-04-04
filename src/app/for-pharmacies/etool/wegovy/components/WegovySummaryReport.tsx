"use client";

import type { WegovyConsultationState } from "../lib/wegovy-types";
import { calculateBMI, getBMICategory } from "../lib/wegovy-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

const COMORBIDITY_LABELS: Record<string, string> = {
  hypertension: "Hypertension",
  type2diabetes: "Type 2 Diabetes",
  sleepApnoea: "Sleep Apnoea",
  osteoarthritis: "Osteoarthritis",
  pcos: "PCOS",
  dyslipidaemia: "Dyslipidaemia",
};

export function WegovySummaryReport({ state }: { state: WegovyConsultationState }) {
  const bmi = state.weightAssessment.bmi || calculateBMI(
    state.weightAssessment.height,
    state.weightAssessment.weight
  );
  const bmiCategory = getBMICategory(bmi);

  const getBMICategoryLabel = () => {
    switch (bmiCategory) {
      case "underweight":
        return "Underweight";
      case "normal":
        return "Normal";
      case "overweight":
        return "Overweight";
      case "obese-i":
        return "Obese Class I";
      case "obese-ii":
        return "Obese Class II";
      case "obese-iii":
        return "Obese Class III";
      default:
        return "Unknown";
    }
  };

  const counsellingItems: [string, boolean][] = [
    ["Injection technique explained", state.counselling.injectionTechnique],
    ["Storage (fridge 2-8°C) advised", state.counselling.storageFridge],
    ["Missed dose protocol explained", state.counselling.missedDose],
    [
      "GI side effects (nausea, constipation) discussed",
      state.counselling.giSideEffects,
    ],
    ["Pancreatitis warning signs explained", state.counselling.pancreatitisWarning],
    [
      "Gallbladder disease symptoms discussed",
      state.counselling.gallbladderWarning,
    ],
    [
      "Suicidal ideation warning signs explained",
      state.counselling.suicidalIdeationWarning,
    ],
    [
      "OCP efficacy reduction and backup contraception advised",
      state.counselling.contraceptionAdvice,
    ],
    [
      "Hypoglycaemia risk (if on insulin/SU) explained",
      state.counselling.hypoglycaemiaRisk,
    ],
    ["Diet and exercise advice provided", state.counselling.dietExerciseAdvice],
    ["Follow-up schedule arranged", state.counselling.followUpSchedule],
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 print:shadow-none print:border-0 print:p-0">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-lg font-bold text-navy-900">
          Wegovy (Semaglutide) Weight Management Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Consultation Date: {state.summary.consultationDate} |{" "}
          {state.summary.consultationTime}
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row
          label="Full Name"
          value={`${state.patient.firstName} ${state.patient.lastName}`}
        />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age?.toString() || "N/A"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
        <Row label="GP" value={state.patient.gpName || "Not provided"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
      </div>

      {/* Weight Assessment */}
      <SectionHeader>Weight Assessment</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row label="Height" value={`${state.weightAssessment.height} cm`} />
        <Row label="Weight" value={`${state.weightAssessment.weight} kg`} />
        <Row
          label="BMI"
          value={
            bmi
              ? `${bmi.toFixed(1)} kg/m² (${getBMICategoryLabel()})`
              : "Not calculated"
          }
        />
        <Row
          label="Waist Circumference"
          value={
            state.weightAssessment.waistCircumference
              ? `${state.weightAssessment.waistCircumference} cm`
              : "Not measured"
          }
        />
        <Row
          label="Previous Weight Loss Attempts"
          value={state.weightAssessment.previousWeightLossAttempts ? "Yes" : "No"}
        />
        {state.weightAssessment.previousWeightLossAttempts && (
          <Row
            label="Details"
            value={state.weightAssessment.previousAttemptDetails || "Not detailed"}
          />
        )}
        <Row
          label="Weight-Related Comorbidities"
          value={
            state.weightAssessment.weightRelatedComorbidities.length > 0
              ? state.weightAssessment.weightRelatedComorbidities
                  .map((c) => COMORBIDITY_LABELS[c] || c)
                  .join(", ")
              : "None"
          }
        />
        <Row
          label="Target Weight Loss"
          value={state.weightAssessment.targetWeightLoss || "Not specified"}
        />
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History — Key Points</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row
          label="Medullary Thyroid Carcinoma (personal)"
          value={state.medicalHistory.personalMTCHistory ? "Yes" : "No"}
        />
        <Row
          label="MTC History (family)"
          value={state.medicalHistory.familyMTCHistory ? "Yes" : "No"}
        />
        <Row label="MEN2 Syndrome" value={state.medicalHistory.men2 ? "Yes" : "No"} />
        <Row
          label="Severe GI Disease"
          value={state.medicalHistory.severeGIDisease ? "Yes" : "No"}
        />
        <Row
          label="Pancreatitis History"
          value={state.medicalHistory.pancreatitisHistory ? "Yes" : "No"}
        />
        <Row
          label="Gallbladder Disease"
          value={state.medicalHistory.gallbladderDisease ? "Yes" : "No"}
        />
        <Row
          label="Diabetic Retinopathy"
          value={state.medicalHistory.diabeticRetinopathy ? "Yes" : "No"}
        />
        <Row
          label="Active Eating Disorder"
          value={state.medicalHistory.eatingDisorder ? "Yes" : "No"}
        />
        <Row
          label="Severe Hepatic Impairment"
          value={state.medicalHistory.severeHepatic ? "Yes" : "No"}
        />
        <Row
          label="Severe Renal Impairment"
          value={state.medicalHistory.severeRenal ? "Yes" : "No"}
        />
        <Row label="Pregnant" value={state.medicalHistory.pregnant ? "Yes" : "No"} />
        <Row
          label="Breastfeeding"
          value={state.medicalHistory.breastfeeding ? "Yes" : "No"}
        />
        <Row
          label="Planning Pregnancy"
          value={state.medicalHistory.planningPregnancy ? "Yes" : "No"}
        />
        <Row
          label="Depression / Mental Health"
          value={state.medicalHistory.depression ? "Yes" : "No"}
        />
        <Row
          label="Suicidal Ideation"
          value={state.medicalHistory.suicidalIdeation ? "Yes" : "No"}
        />
        <Row
          label="Thyroid Disease"
          value={state.medicalHistory.thyroidDisease ? "Yes" : "No"}
        />
      </div>

      {/* Medications */}
      <SectionHeader>Current Medications</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row label="Takes Insulin" value={state.medications.takesInsulin ? "Yes" : "No"} />
        {state.medications.takesInsulin && (
          <Row label="Insulin Details" value={state.medications.insulinDetails || "N/A"} />
        )}
        <Row
          label="Takes Sulphonylureas"
          value={state.medications.takesSulphonylureas ? "Yes" : "No"}
        />
        {state.medications.takesSulphonylureas && (
          <Row
            label="Sulphonylurea Details"
            value={state.medications.sulphonylureDetails || "N/A"}
          />
        )}
        <Row
          label="Takes Oral Contraceptives"
          value={state.medications.takesOralContraceptives ? "Yes" : "No"}
        />
        <Row
          label="Already on GLP-1 Agonist"
          value={state.medications.currentGLP1 ? "Yes" : "No"}
        />
        <Row
          label="Other Medications"
          value={state.medications.otherMedications || "None reported"}
        />
        <Row label="Allergies" value={state.medications.allergies || "NKDA"} />
      </div>

      {/* Observations */}
      <SectionHeader>Clinical Observations</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row
          label="Blood Pressure"
          value={
            state.observations.systolicBP && state.observations.diastolicBP
              ? `${state.observations.systolicBP}/${state.observations.diastolicBP} mmHg`
              : "Not recorded"
          }
        />
        <Row
          label="Heart Rate"
          value={
            state.observations.heartRate
              ? `${state.observations.heartRate} bpm`
              : "Not recorded"
          }
        />
        <Row
          label="Weight (at consultation)"
          value={
            state.observations.weight
              ? `${state.observations.weight} kg`
              : "Not recorded"
          }
        />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts & Assessment</SectionHeader>
      <div className="mb-6">
        <AlertSummary alerts={state.alerts} />
      </div>

      {/* Dose Recommendation */}
      {state.doseRecommendation && (
        <>
          <SectionHeader>Dose Recommendation</SectionHeader>
          <div className="space-y-1.5 mb-6">
            <Row label="Stage" value={state.doseRecommendation.stage} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Reason" value={state.doseRecommendation.reason} />
            <Row label="Schedule" value={state.doseRecommendation.titrationSchedule} />
          </div>
        </>
      )}

      {/* Dose Selection */}
      <SectionHeader>Dose Selection & Initiation</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row label="Current Dose Stage" value={state.doseSelection.currentDoseStage} />
        <Row label="Selected Dose" value={state.doseSelection.dose || "Not selected"} />
        <Row
          label="Weeks at Current Dose"
          value={
            state.doseSelection.weeksAtCurrentDose
              ? `${state.doseSelection.weeksAtCurrentDose} weeks`
              : "New patient"
          }
        />
        <Row
          label="Previous Dose"
          value={state.doseSelection.previousDose || "None (new patient)"}
        />
        <Row
          label="Injection Site"
          value={state.doseSelection.injectionSite || "Not selected"}
        />
        {state.doseSelection.pharmacistOverride && (
          <Row
            label="Pharmacist Override Reason"
            value={state.doseSelection.overrideReason || "Not provided"}
          />
        )}
      </div>

      {/* Counselling */}
      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <div className="mb-6">
        <CounsellingGrid items={counsellingItems} />
      </div>

      {/* Additional Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <div className="mb-6 text-xs text-navy-900 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </div>
        </>
      )}

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Wegovy (Semaglutide) Weight Management"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="Wegovy (Semaglutide) Weight Management" />
    </div>
  );
}
