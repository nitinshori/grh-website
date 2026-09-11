"use client";

import type { WegovyConsultationState } from "../lib/wegovy-types";
import { WEGOVY_PGD_VERSION } from "../lib/wegovy-types";
import {
  calculateBMI,
  getBMICategory,
  getMonthsOnTreatment,
  getPercentWeightLost,
} from "../lib/wegovy-clinical-logic";
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
  cardiovascularDisease: "Established cardiovascular disease",
};

const DOSE_PRODUCT: Record<string, string> = {
  "0.25mg": "Wegovy FlexTouch 0.25 mg solution for injection in pre-filled pen (4 doses)",
  "0.5mg": "Wegovy FlexTouch 0.5 mg solution for injection in pre-filled pen (4 doses)",
  "1mg": "Wegovy FlexTouch 1.0 mg solution for injection in pre-filled pen (4 doses)",
  "1.7mg": "Wegovy FlexTouch 1.7 mg solution for injection in pre-filled pen (4 doses)",
  "2.4mg": "Wegovy FlexTouch 2.4 mg solution for injection in pre-filled pen (4 doses)",
  "7.2mg": "Wegovy 7.2 mg solution for injection in pre-filled pen (four single use pens)",
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
    ["Storage advised (fridge 2°C to 8°C; 6 weeks below 30°C after first use; travel)", state.counselling.storageFridge],
    ["Missed dose protocol explained (within 5 days; more than 2 missed, re-escalate)", state.counselling.missedDose],
    [
      "GI side effects and adequate fluid intake discussed",
      state.counselling.giSideEffects,
    ],
    ["Pancreatitis warning signs explained", state.counselling.pancreatitisWarning],
    [
      "Gallbladder disease symptoms discussed",
      state.counselling.gallbladderWarning,
    ],
    [
      "Urgent warning symptoms explained (severe abdominal pain, persistent vomiting, jaundice, sudden visual loss, sustained rise in heart rate)",
      state.counselling.urgentWarningSymptoms,
    ],
    [
      "Mood and mental health: when to seek help explained",
      state.counselling.suicidalIdeationWarning,
    ],
    [
      "Contraception and pregnancy advice given (stop 2 months before planned pregnancy)",
      state.counselling.contraceptionAdvice,
    ],
    [
      "Hypoglycaemia signs and symptoms explained (type 2 diabetes)",
      state.counselling.hypoglycaemiaRisk,
    ],
    ["Diet and physical activity advice provided", state.counselling.dietExerciseAdvice],
    [
      "Written information given (PIL, lifestyle advice, agreed target weight)",
      state.counselling.writtenInformationGiven,
    ],
    ["Follow-up and review arranged", state.counselling.followUpSchedule],
    ["Patient told the NHS route exists and how to access it", state.counselling.nhsRouteExplained],
    ["GP informed of this initiation or review", state.counselling.gpInformed],
  ];

  const monthsOnTreatment = getMonthsOnTreatment(state);
  const percentLost = getPercentWeightLost(state);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 print:shadow-none print:border-0 print:p-0">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-lg font-bold text-navy-900">
          Wegovy (Semaglutide) Weight Management Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">{WEGOVY_PGD_VERSION}</p>
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
          label="Target Weight Agreed"
          value={state.weightAssessment.targetWeightLoss || "Not specified"}
        />
        <Row
          label="Initial Assessment Completed"
          value={state.weightAssessment.initialAssessmentCompleted ? "Yes" : "No"}
        />
        <Row
          label="Lifestyle Plan Agreed"
          value={state.weightAssessment.lifestylePlanAgreed ? "Yes" : "No"}
        />
        <Row
          label="Prescribed Medication Causing Weight Gain"
          value={state.weightAssessment.medicationInducedWeightGain ? "Yes (GP referral advised)" : "No"}
        />
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History: Key Points</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row
          label="Hypersensitivity to Semaglutide or Excipients"
          value={state.medicalHistory.semaglutideHypersensitivity ? "Yes" : "No"}
        />
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
          label="Pancreatitis History (acute or chronic)"
          value={state.medicalHistory.pancreatitisHistory ? "Yes" : "No"}
        />
        <Row
          label="Severe GI Disease (incl. gastroparesis)"
          value={state.medicalHistory.severeGIDisease ? "Yes" : "No"}
        />
        <Row
          label="Current Gallstones or Cholecystitis"
          value={state.medicalHistory.gallbladderDisease ? "Yes" : "No"}
        />
        <Row
          label="Cholecystectomy Within 3 Months"
          value={state.medicalHistory.recentCholecystectomy ? "Yes" : "No"}
        />
        <Row
          label="Obesity Caused by Endocrinological Disorder"
          value={state.medicalHistory.endocrineObesity ? "Yes" : "No"}
        />
        <Row
          label="Type 1 Diabetes"
          value={state.medicalHistory.type1Diabetes ? "Yes" : "No"}
        />
        <Row
          label="Diabetic Retinopathy"
          value={state.medicalHistory.diabeticRetinopathy ? "Yes" : "No"}
        />
        <Row
          label="Severe Renal Impairment (eGFR below 30) or ESRD"
          value={state.medicalHistory.severeRenal ? "Yes" : "No"}
        />
        <Row
          label="Mild to Moderate Renal Impairment"
          value={state.medicalHistory.mildModerateRenal ? "Yes" : "No"}
        />
        <Row
          label="Severe Hepatic Impairment"
          value={state.medicalHistory.severeHepatic ? "Yes" : "No"}
        />
        <Row
          label="Heart Failure with Reduced EF (below 40%)"
          value={state.medicalHistory.heartFailureReducedEF ? "Yes" : "No"}
        />
        <Row
          label="Active Eating Disorder"
          value={state.medicalHistory.eatingDisorder ? "Yes" : "No"}
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
          label="History of Suicidal Ideation or Active Severe Mental Illness"
          value={state.medicalHistory.depression ? "Yes" : "No"}
        />
        {state.medicalHistory.depression && (
          <>
            <Row
              label="Psychiatric Oversight in Place"
              value={state.medicalHistory.psychiatricOversightInPlace ? "Yes" : "No"}
            />
            <Row
              label="Concern About Current Mental State"
              value={state.medicalHistory.mentalHealthConcern ? "Yes" : "No"}
            />
          </>
        )}
        <Row
          label="Current Suicidal Ideation"
          value={state.medicalHistory.suicidalIdeation ? "Yes" : "No"}
        />
        <Row
          label="Planned General Anaesthesia or Deep Sedation"
          value={state.medicalHistory.plannedAnaesthesia ? "Yes" : "No"}
        />
        <Row
          label="Thyroid Disease"
          value={state.medicalHistory.thyroidDisease ? "Yes" : "No"}
        />
        <Row
          label="Not Suitable in Clinical Judgement"
          value={state.medicalHistory.clinicalJudgementUnsuitable ? "Yes" : "No"}
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
          label="Takes Sulfonylurea or Meglitinide"
          value={state.medications.takesSulphonylureas ? "Yes" : "No"}
        />
        {state.medications.takesSulphonylureas && (
          <Row
            label="Sulfonylurea / Meglitinide Details"
            value={state.medications.sulphonylureDetails || "N/A"}
          />
        )}
        <Row
          label="Already on GLP-1 Receptor Agonist (any indication)"
          value={state.medications.currentGLP1 ? "Yes" : "No"}
        />
        <Row
          label="Type 2 Diabetes on Metformin / SGLT2 / DPP-4 Only"
          value={state.medications.takesOtherDiabetesMeds ? "Yes (inform GP)" : "No"}
        />
        <Row
          label="Warfarin, Coumarin or Narrow Therapeutic Index Medicine"
          value={state.medications.takesWarfarinOrNTI ? "Yes" : "No"}
        />
        <Row label="Takes HRT" value={state.medications.takesHRT ? "Yes" : "No"} />
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
      <SectionHeader>Dose Selection & Supply</SectionHeader>
      <div className="space-y-1.5 mb-6">
        <Row label="Current Dose Stage" value={state.doseSelection.currentDoseStage} />
        <Row label="Selected Dose" value={state.doseSelection.dose || "Not selected"} />
        <Row
          label="Product Supplied (name, brand, form)"
          value={DOSE_PRODUCT[state.doseSelection.dose] || "Not selected"}
        />
        <Row label="Batch Number" value={state.doseSelection.batchNumber || "Not recorded"} />
        <Row
          label="Route and Frequency"
          value="Subcutaneous injection (abdomen, thigh or upper arm), once weekly"
        />
        <Row
          label="Quantity Supplied"
          value={
            state.doseSelection.dose === "7.2mg"
              ? "Four single use 7.2 mg pens (4 doses), one month of treatment"
              : "One pre-filled pen (4 doses) with 4 needles, one month of treatment"
          }
        />
        <Row
          label="Weeks on Previous Dose"
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
          label="Recommencing After Previous Use"
          value={state.doseSelection.recommencingAfterBreak ? "Yes (titrated again from 0.25 mg)" : "No"}
        />
        {state.doseSelection.treatmentStartDate && (
          <Row
            label="Treatment Start Date"
            value={`${state.doseSelection.treatmentStartDate}${
              monthsOnTreatment !== null ? ` (${monthsOnTreatment} months on treatment; maximum 24 under this PGD)` : ""
            }`}
          />
        )}
        {state.doseSelection.initialWeight !== null && (
          <Row
            label="Weight at Initiation"
            value={`${state.doseSelection.initialWeight} kg${
              percentLost !== null ? ` (${percentLost.toFixed(1)}% lost)` : ""
            }`}
          />
        )}
        {state.doseSelection.dose === "7.2mg" && (
          <Row
            label="Starting BMI (7.2 mg permitted only if 30 or above)"
            value={
              state.doseSelection.startingBMI !== null
                ? `${state.doseSelection.startingBMI} kg/m²`
                : "Not recorded"
            }
          />
        )}
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
