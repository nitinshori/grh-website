"use client";

import type { COPDConsultationState } from "../lib/copd-types";
import { PGD_STRAPLINE } from "../lib/copd-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SALBUTAMOL_RECOMMENDATION,
  AMOXICILLIN_RECOMMENDATION,
} from "../lib/copd-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface COPDSummaryReportProps {
  state: COPDConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function COPDSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: COPDSummaryReportProps) {
  const ms = state.medicineSupply;
  void doseRecommendation;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          COPD Management: Consultation Record
        </h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
        <p className="text-gray-500">{PGD_STRAPLINE}</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Row
            label="Name"
            value={`${state.patient.firstName} ${state.patient.lastName}`}
          />
          <Row label="Date of Birth" value={state.patient.dateOfBirth} />
          <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "Not recorded"} />
        </div>
        <div>
          <Row label="GP Name" value={state.patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={state.patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        </div>
      </div>

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />
      <Row label="Informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>COPD Assessment</SectionHeader>
      <Row label="Confirmed COPD diagnosis (spirometry and GOLD)" value={state.assessment.hasExistingDiagnosis ? "Yes" : "No"} />
      <Row label="GOLD classification" value={state.assessment.goldClassification ? `GOLD ${state.assessment.goldClassification}` : "Not recorded"} />
      <Row
        label="Presentation"
        value={
          state.assessment.presentation === "exacerbation"
            ? "Acute exacerbation"
            : state.assessment.presentation === "breathlessness"
              ? "Breathlessness requiring symptom relief"
              : "Not recorded"
        }
      />
      <Row label="Purulent sputum" value={state.assessment.purulentSputum ? "Yes" : "No"} />
      <Row label="SpO2 on air" value={state.assessment.spo2 !== null ? `${state.assessment.spo2}%` : "Not recorded"} />
      <Row
        label="Salbutamol supplies under this PGD in last 12 months"
        value={state.assessment.salbutamolSuppliesLast12Months !== null ? String(state.assessment.salbutamolSuppliesLast12Months) : "Not recorded"}
      />
      <Row label="Can use inhaler or willing to use spacer" value={state.assessment.canUseInhalerOrSpacer ? "Yes" : "No"} />
      <Row label="Able to take oral medication" value={state.assessment.ableToTakeOralMedication ? "Yes" : "No"} />
      <Row
        label="MRC breathlessness scale"
        value={state.assessment.mrcBreathlessnessScale ? `Grade ${state.assessment.mrcBreathlessnessScale}` : "Not recorded"}
      />
      <Row
        label="Exacerbation frequency"
        value={state.assessment.exacerbationFrequency || "Not recorded"}
      />
      <Row
        label="Current inhaler regimen"
        value={state.assessment.currentInhalerRegimen || "Not recorded"}
      />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="COPD documented" value={state.medicalHistory.copdDocumented ? "Yes" : "No"} />
      <Row label="Smoking status" value={state.medicalHistory.smokingStatus || "Not recorded"} />
      <Row
        label="Other respiratory conditions"
        value={state.medicalHistory.otherRespiratoryConditions || "None"}
      />
      <Row label="Other conditions" value={state.medicalHistory.otherConditions || "None"} />
      <CounsellingGrid
        items={[
          ["Cardiovascular disease", state.medicalHistory.cardiovascularDisease],
          ["Hypertension", state.medicalHistory.hypertension],
          ["Coronary artery disease / recent MI", state.medicalHistory.coronaryDiseaseOrRecentMI],
          ["Diabetes", state.medicalHistory.diabetes],
          ["Hyperthyroidism", state.medicalHistory.hyperthyroidism],
          ["Hypokalaemia", state.medicalHistory.hypokalaemia],
          ["Infectious mononucleosis", state.medicalHistory.infectiousMononucleosis],
          ["Severe renal impairment (eGFR below 30)", state.medicalHistory.severeRenalImpairment],
          ["Mild to moderate renal impairment", state.medicalHistory.mildModerateRenalImpairment],
          ["Hepatic impairment", state.medicalHistory.hepaticImpairment],
          ["Local resistance concern", state.medicalHistory.localResistanceConcern],
          ["Pregnant", state.medicalHistory.pregnancy],
          ["Breastfeeding", state.medicalHistory.breastfeeding],
          ["Salbutamol / beta-2 agonist allergy", state.currentMedications.salbutamolAllergy],
          ["Penicillin / beta-lactam allergy", state.currentMedications.penicillinAllergy],
          ["Oral contraception", state.currentMedications.oralContraceptive],
        ]}
      />
      <Row label="Other medicines" value={state.currentMedications.otherMedicines || "None recorded"} />

      <SectionHeader>Exclusions and Red Flags</SectionHeader>
      <Row label="Severe hypoxia (SpO2 below 88%)" value={state.redFlags.severeHypoxia ? "Yes: STOP" : "No"} />
      <Row label="Acute distress / respiratory failure" value={state.redFlags.acuteDistress ? "Yes: STOP" : "No"} />
      <Row label="MRC Grade 5" value={state.redFlags.mrcGrade5 ? "Yes: STOP" : "No"} />
      <Row label="New haemoptysis" value={state.redFlags.newHaemoptysis ? "Yes: Refer" : "No"} />
      <Row label="Weight loss" value={state.redFlags.weightLoss ? "Yes: Refer" : "No"} />
      <Row label="Recurrent infections" value={state.redFlags.recurrentInfections ? "Yes: Refer" : "No"} />

      {ms.medicinePrescribed && (ms.supplySalbutamol || ms.supplyAmoxicillin) && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          {ms.supplySalbutamol && (
            <>
              <Row label="Medicine" value={SALBUTAMOL_RECOMMENDATION.medicine} />
              <Row label="Brand" value={ms.salbutamolBrand || "Not recorded"} />
              <Row label="Dose" value={SALBUTAMOL_RECOMMENDATION.dose} />
              <Row label="Frequency and limits" value={SALBUTAMOL_RECOMMENDATION.frequency || ""} />
              <Row label="Quantity" value={SALBUTAMOL_RECOMMENDATION.duration || ""} />
            </>
          )}
          {ms.supplyAmoxicillin && (
            <>
              <Row label="Medicine" value={AMOXICILLIN_RECOMMENDATION.medicine} />
              <Row label="Brand" value={ms.amoxicillinBrand || "Not recorded"} />
              <Row label="Dose" value={AMOXICILLIN_RECOMMENDATION.dose} />
              <Row label="How to take" value={AMOXICILLIN_RECOMMENDATION.frequency || ""} />
              <Row label="Quantity" value={AMOXICILLIN_RECOMMENDATION.duration || ""} />
            </>
          )}
          <Row label="Supplied under" value={PGD_STRAPLINE} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Not replacement for maintenance therapy", state.counselling.notReplacementForMaintenance],
          ["GP review advised", state.counselling.gpReviewAdvised],
          ["Inhaler technique demonstrated", state.counselling.inhalerTechniqueShown],
          ["Smoking cessation advice given", state.counselling.smokingCessationAdvised],
          ["Symptom management explained", state.counselling.symptomMgmtExplained],
          ["Reliever use and limits (max 8 puffs/24 h, referral and 999 thresholds)", state.counselling.relieverUseAndLimits],
          ["Spacer advice", state.counselling.spacerAdvice],
          ["Complete amoxicillin course", state.counselling.completeCourse],
          ["Amoxicillin timing with meals", state.counselling.amoxicillinTiming],
          ["Additional contraception for 7 days", state.counselling.contraceptionAdvice],
          ["Sputum colour monitoring", state.counselling.sputumColour],
          ["Seek immediate attention (worse, fever, chest pain, haemoptysis)", state.counselling.seekImmediateAttention],
          ["Seek urgent assessment (breathlessness, speech, confusion, cyanosis)", state.counselling.seekUrgentAssessment],
          ["Home oximeter: report below 88%", state.counselling.oximeterAdvice],
          ["Report allergic reactions immediately", state.counselling.allergicReactionAdvice],
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
        pgdName="COPD Management"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="COPD Management" />
    </div>
  );
}
