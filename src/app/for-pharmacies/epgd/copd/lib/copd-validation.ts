// ─── COPD Validation (PGD v004, 11 September 2026) ───

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
      if (!state.assessment.diagnosisStatus) {
        return "Confirmed diagnosis of COPD: select Yes or No";
      }
      if (!["1", "2", "3", "4"].includes(state.assessment.goldClassification)) {
        return "Record the documented GOLD classification (1 to 4): it is part of the inclusion criterion";
      }
      if (!state.assessment.presentation) {
        return "Record the presentation: acute exacerbation, or breathlessness requiring symptom relief";
      }
      if (state.assessment.presentation === "exacerbation" && !state.assessment.purulentSputumAnswer) {
        return "Purulent sputum (yellow/green): select Yes or No";
      }
      if (state.assessment.spo2 === null) {
        return "Record the oxygen saturation (SpO2 below 88% is an exclusion)";
      }
      if (state.assessment.respiratoryRate === null) {
        return "Measure and record the respiratory rate (25 breaths per minute or more is an exclusion in both arms)";
      }
      if (state.assessment.salbutamolSuppliesLast12Months === null) {
        return "Record how many salbutamol supplies the patient has had under this PGD in the last 12 months";
      }
      if (!state.assessment.inhalerAbilityAnswer) {
        return "Capable of using an inhaler device, or willing to use a spacer: select Yes or No";
      }
      if (!state.assessment.oralAbilityAnswer) {
        return "Able to take oral medication: select Yes or No";
      }
      if (state.assessment.mrcBreathlessnessScale === null) {
        return "MRC breathlessness scale: select the grade (1 to 5)";
      }
      if (!state.assessment.exacerbationFrequency) {
        return "Exacerbation frequency: select an option";
      }
      return null;

    case 3:
      if (!state.medicalHistory.exclusionsAskedAndAnswered) {
        return "Tick 'Every exclusion and caution question on this step was asked and answered by the patient' (an unticked condition means the patient answered no)";
      }
      return null;

    case 4:
      if (!state.currentMedications.allergyStatusConfirmed) {
        return "Tick 'Allergy status confirmed with the patient'";
      }
      return null;

    case 5:
      return null; // Red flags step: stops are enforced by isBlocked on every step

    case 6: {
      const ms = state.medicineSupply;
      if (!ms.medicinePrescribed || (!ms.supplySalbutamol && !ms.supplyAmoxicillin)) {
        return "Tick at least one medicine to supply (salbutamol inhaler and/or amoxicillin capsules)";
      }
      if (!state.assessment.presentation) {
        return "Record the presentation on the COPD Assessment step: acute exacerbation, or breathlessness requiring symptom relief";
      }
      if (ms.supplySalbutamol && !state.assessment.inhalerAbilityAnswer) {
        return "Capable of using an inhaler device, or willing to use a spacer: select Yes or No on the COPD Assessment step";
      }
      if (ms.supplyAmoxicillin && !state.assessment.purulentSputumAnswer) {
        return "Purulent sputum (yellow/green): select Yes or No on the COPD Assessment step";
      }
      if (ms.supplyAmoxicillin && !state.assessment.oralAbilityAnswer) {
        return "Able to take oral medication: select Yes or No on the COPD Assessment step";
      }
      if (ms.supplySalbutamol && salbutamolArmBlockers(state).length > 0) {
        return "Salbutamol is excluded for this patient: " + salbutamolArmBlockers(state).join("; ");
      }
      if (ms.supplyAmoxicillin && amoxicillinArmBlockers(state).length > 0) {
        return "Amoxicillin is excluded for this patient: " + amoxicillinArmBlockers(state).join("; ");
      }
      if (!ms.dosageConfirmed) {
        return "Tick 'Dosage confirmed with patient'";
      }
      if (ms.supplySalbutamol && !ms.salbutamolPilSupplied) {
        return "Tick 'Patient information leaflet supplied with the salbutamol inhaler'";
      }
      if (ms.supplyAmoxicillin && !ms.amoxicillinPilSupplied) {
        return "Tick 'Patient information leaflet supplied with the amoxicillin capsules'";
      }
      return null;
    }

    case 7: {
      const c = state.counselling;
      const ms = state.medicineSupply;
      if (!c.notReplacementForMaintenance) {
        return "Tick 'Counselled: Not replacement for maintenance therapy'";
      }
      // Every line of the document's follow-up advice is required for the
      // arm supplied (PGD v004, Follow-up advice to be given to patient or carer).
      if (ms.supplySalbutamol && !c.relieverUseAndLimits) {
        return "Tick the reliever use advice (1 to 2 puffs, maximum 8 puffs in 24 hours, referral and 999 thresholds)";
      }
      if (ms.supplySalbutamol && !c.spacerAdvice) {
        return "Tick 'Use a spacer device if you have difficulty coordinating MDI actuation'";
      }
      if (ms.supplySalbutamol && !c.inhalerTechniqueShown) {
        return "Tick 'Inhaler technique demonstrated'";
      }
      if (ms.supplyAmoxicillin && !c.completeCourse) {
        return "Tick 'Complete the full course of amoxicillin even if symptoms improve'";
      }
      if (ms.supplyAmoxicillin && !c.amoxicillinTiming) {
        return "Tick 'Take amoxicillin at regular intervals, ideally 1 hour before or 2 hours after meals'";
      }
      if (ms.supplyAmoxicillin && !c.contraceptionAdvice) {
        return "Tick 'If using oral contraception, use additional contraceptive methods'";
      }
      if (!c.sputumColour) {
        return "Tick 'Monitor your sputum colour'";
      }
      if (!c.seekImmediateAttention) {
        return "Tick 'Seek immediate medical attention if symptoms worsen despite treatment...'";
      }
      if (!c.seekUrgentAssessment) {
        return "Tick 'Seek urgent assessment if you experience worsening breathlessness...'";
      }
      if (!c.oximeterAdvice) {
        return "Tick 'Monitor your oxygen saturation if you have a pulse oximeter at home'";
      }
      if (!c.gpFollowUpAdvice) {
        return "Tick 'Ensure you have regular follow-up with your GP'";
      }
      if (!c.allergicReactionAdvice) {
        return "Tick 'Report any allergic reactions immediately'";
      }
      return null;
    }

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
