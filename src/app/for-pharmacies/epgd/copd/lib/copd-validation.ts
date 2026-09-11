// ─── COPD Validation (PGD v002, 11 September 2026) ───

import type { COPDConsultationState } from "./copd-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { salbutamolArmBlockers, amoxicillinArmBlockers } from "./copd-clinical-logic";

export function validateStep(state: COPDConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 }); // adults aged 18 years and over

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingDiagnosis) {
        return "Confirm the patient has a confirmed COPD diagnosis (documented spirometry and GOLD classification)";
      }
      if (!["1", "2", "3", "4"].includes(state.assessment.goldClassification)) {
        return "Record the documented GOLD classification (1 to 4): it is part of the inclusion criterion";
      }
      if (!state.assessment.presentation) {
        return "Record the presentation: acute exacerbation, or breathlessness requiring symptom relief";
      }
      if (state.assessment.spo2 === null) {
        return "Record the oxygen saturation (SpO2 below 88% is an exclusion)";
      }
      if (state.assessment.salbutamolSuppliesLast12Months === null) {
        return "Record how many salbutamol supplies the patient has had under this PGD in the last 12 months";
      }
      if (state.assessment.mrcBreathlessnessScale === null) {
        return "MRC breathlessness scale is required";
      }
      if (!state.assessment.exacerbationFrequency) {
        return "Please specify exacerbation frequency";
      }
      return null;

    case 3:
      if (!state.medicalHistory.exclusionsAskedAndAnswered) {
        return "Confirm that every exclusion and caution question on this step was asked and answered by the patient";
      }
      return null;

    case 4:
      if (!state.currentMedications.allergyStatusConfirmed) {
        return "Confirm the patient's allergy status (salbutamol, penicillin and beta-lactam) was asked and confirmed";
      }
      return null;

    case 5:
      return null; // Red flags step: stops are enforced by isBlocked on every step

    case 6: {
      const ms = state.medicineSupply;
      if (!ms.medicinePrescribed) {
        return "Please confirm medicine to supply";
      }
      if (!ms.supplySalbutamol && !ms.supplyAmoxicillin) {
        return "Select at least one medicine to supply (salbutamol and/or amoxicillin)";
      }
      if (ms.supplySalbutamol && salbutamolArmBlockers(state).length > 0) {
        return "Salbutamol is excluded for this patient: " + salbutamolArmBlockers(state).join("; ");
      }
      if (ms.supplyAmoxicillin && amoxicillinArmBlockers(state).length > 0) {
        return "Amoxicillin is excluded for this patient: " + amoxicillinArmBlockers(state).join("; ");
      }
      if (!ms.dosageConfirmed) {
        return "Please confirm dosage";
      }
      if (ms.supplySalbutamol && !ms.salbutamolPilSupplied) {
        return "Confirm the patient information leaflet was supplied with the salbutamol inhaler";
      }
      if (ms.supplyAmoxicillin && !ms.amoxicillinPilSupplied) {
        return "Confirm the patient information leaflet was supplied with the amoxicillin capsules";
      }
      return null;
    }

    case 7: {
      const c = state.counselling;
      const ms = state.medicineSupply;
      if (!c.notReplacementForMaintenance) {
        return "Please confirm counselling on non-replacement status";
      }
      // Every line of the document's follow-up advice is required for the
      // arm supplied (PGD v002, Follow-up advice to be given to patient or carer).
      if (ms.supplySalbutamol && !c.relieverUseAndLimits) {
        return "Confirm the reliever use limits were explained (maximum 8 puffs in 24 hours, referral and 999 thresholds)";
      }
      if (ms.supplySalbutamol && !c.spacerAdvice) {
        return "Confirm the spacer advice was given";
      }
      if (ms.supplySalbutamol && !c.inhalerTechniqueShown) {
        return "Confirm inhaler technique was demonstrated";
      }
      if (ms.supplyAmoxicillin && !c.completeCourse) {
        return "Confirm the patient was told to complete the full course of amoxicillin";
      }
      if (ms.supplyAmoxicillin && !c.amoxicillinTiming) {
        return "Confirm the amoxicillin timing advice was given (1 hour before or 2 hours after meals)";
      }
      if (ms.supplyAmoxicillin && !c.contraceptionAdvice) {
        return "Confirm the additional contraception advice was given (during and for 7 days after the course)";
      }
      if (!c.sputumColour) {
        return "Confirm the sputum colour monitoring advice was given";
      }
      if (!c.seekImmediateAttention) {
        return "Confirm the immediate attention advice was given (worse despite treatment, fever, chest pain, haemoptysis)";
      }
      if (!c.seekUrgentAssessment) {
        return "Confirm the urgent assessment advice was given (worsening breathlessness, difficulty speaking in sentences, confusion, cyanosis)";
      }
      if (!c.oximeterAdvice) {
        return "Confirm the home pulse oximeter advice was given (report any drop below 88%)";
      }
      if (!c.gpFollowUpAdvice) {
        return "Confirm the patient was advised to have regular GP follow-up of their COPD management plan";
      }
      if (!c.allergicReactionAdvice) {
        return "Confirm the patient was told to report any allergic reaction immediately";
      }
      return null;
    }

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
