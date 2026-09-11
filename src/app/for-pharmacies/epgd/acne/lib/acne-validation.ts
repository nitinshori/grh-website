import type { AcneConsultationState } from "./acne-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { isDuac, isEpiduo } from "./acne-clinical-logic";

export function validateStep(stepIndex: number, state: AcneConsultationState): string | null {
  const choice = state.medicineSelection.medicineChoice;

  switch (stepIndex) {
    case 0: // Patient Details
      {
        const base = validatePatientStep(state.patient, { minAge: 12 });
        if (base) return base;
        // The PGD record must contain the individual's name, address, date of
        // birth and GP; only the names and DOB were enforced before.
        if (!state.patient.address.trim()) return "Patient address is required for the PGD record";
        if (!state.patient.gpPractice.trim()) return "GP practice is required for the PGD record";
        return null;
      }

    case 1: // Consent
      {
        const base = validateConsentStep(state.consent);
        if (base) return base;
        // Under-16s: the record must say who consented.
        if (state.patient.age !== null && state.patient.age < 16) {
          if (!state.consent.consentBasis || state.consent.consentBasis === "patient") {
            return "For a patient under 16, record whether the child is Gillick competent or a person with parental responsibility gave consent";
          }
          if (state.consent.consentBasis === "parental") {
            if (!state.consent.consentGivenByName.trim()) return "Record the name of the person with parental responsibility who gave consent";
            if (!state.consent.consentGivenByRelationship.trim()) return "Record the relationship of the person who gave consent to the patient";
          }
        }
        return null;
      }

    case 2: // Acne Assessment
      if (!state.assessment.severity) return "Please select acne severity";
      if (
        !state.assessment.comedones &&
        !state.assessment.inflammatoryPapules &&
        !state.assessment.pustules &&
        !state.assessment.nodalCystic
      ) {
        return "Please select at least one acne manifestation";
      }
      if (!state.assessment.affectedArea.trim()) return "Please describe affected area";
      return null;

    case 3: // Medical History
      if (!state.medicalHistory.allergies.trim()) return "Please record allergy status";
      return null;

    case 4: // Contraindications
      if (!state.contraindications.questionsAsked) {
        return "Confirm that each of the exclusion questions above has been put to the patient";
      }
      return null;

    case 5: // Medicine Selection
      if (!choice) return "Please select a medicine";
      if (choice === "duac-5" && !state.medicineSelection.strengthRationale) {
        return "Please record the clinical reason for choosing the 10 mg/g + 50 mg/g strength";
      }
      if (state.medicineSelection.repeatCourse) {
        if (!state.medicineSelection.previousCourseStartDate) {
          return "Record the date the previous course started";
        }
        if (!state.medicineSelection.previousCourseEndDate) {
          return "Record the date the previous course ended (or the date of the last supply)";
        }
        if (state.medicineSelection.previousCourseEndDate < state.medicineSelection.previousCourseStartDate) {
          return "The previous course cannot end before it started";
        }
        if (!state.medicineSelection.repeatCourseReviewed) {
          return "A review is required for repeat courses (maximum 12 weeks continuous use). Please confirm the review has been completed.";
        }
      }
      if (!state.medicineSelection.quantitySupplied) {
        return "Record the quantity supplied";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.improvementTimeline ||
        !state.counselling.photosensitivity ||
        !state.counselling.washingAdvice ||
        !state.counselling.productAdvice ||
        !state.counselling.courseCompletion ||
        !state.counselling.applicationAdvice ||
        !state.counselling.irritationAdvice ||
        !state.counselling.followUpAdvice ||
        !state.counselling.scarringAdvice
      ) {
        return "Please confirm all counselling points have been covered";
      }
      if (isDuac(choice) && !state.counselling.storageAdvice) {
        return "Please confirm storage advice for benzoyl peroxide / clindamycin gel (store below 25 C once dispensed, use within 2 months)";
      }
      if (isEpiduo(choice) && !state.counselling.bleachingAdvice) {
        return "Please confirm bleaching and cosmetics advice for adapalene / benzoyl peroxide gel";
      }
      if (!state.counselling.pilSupplied) {
        return "Please confirm the patient information leaflet has been supplied";
      }
      return null;

    case 7: // Summary
      {
        const base = validateSummaryStep(state.summary);
        if (base) return base;
        if (!state.summary.consultationDate) return "Consultation date is required";
        return null;
      }

    default:
      return null;
  }
}
