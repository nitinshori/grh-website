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
            return "Consent basis: for a patient under 16, select whether the child was Gillick competent or a person with parental responsibility gave consent";
          }
          if (state.consent.consentBasis === "parental") {
            if (!state.consent.consentGivenByName.trim()) return "Name of person with parental responsibility: record who gave consent";
            if (!state.consent.consentGivenByRelationship.trim()) return "Relationship to patient: record the relationship of the person who gave consent";
          }
        }
        return null;
      }

    case 2: // Acne Assessment
      if (!state.assessment.severity) return "Acne Severity: select mild, moderate or severe";
      if (
        !state.assessment.comedones &&
        !state.assessment.inflammatoryPapules &&
        !state.assessment.pustules &&
        !state.assessment.nodalCystic
      ) {
        return "Acne manifestations: tick at least one (comedones, inflammatory papules, pustules or nodular/cystic lesions)";
      }
      if (!state.assessment.affectedArea.trim()) return "Affected Area: describe the location and extent";
      return null;

    case 3: // Medical History
      if (!state.medicalHistory.allergies.trim()) return "Allergies and sensitivities: record the allergy status (write NKDA if none known)";
      return null;

    case 4: // Contraindications
      if (!state.contraindications.questionsAsked) {
        return "Tick the confirmation at the bottom: I have asked the patient every question above (ticked boxes are Yes, unticked boxes are No)";
      }
      return null;

    case 5: // Medicine Selection
      if (!choice) return "Medicine Choice: select the product to supply";
      if (choice === "duac-5" && !state.medicineSelection.strengthRationale) {
        return "Clinical reason for the 10 mg/g + 50 mg/g strength: select the reason for choosing this strength";
      }
      if (state.medicineSelection.repeatCourse) {
        const today = new Date().toISOString().split("T")[0];
        if (!state.medicineSelection.previousCourseStartDate) {
          return "Previous course started: record the date the previous course started";
        }
        if (state.medicineSelection.previousCourseStartDate > today) {
          return "Previous course started: this date is in the future; check the date entered";
        }
        if (!state.medicineSelection.previousCourseEndDate) {
          return "Previous course ended / last supply: record the date the previous course ended (or the date of the last supply)";
        }
        if (state.medicineSelection.previousCourseEndDate > today) {
          return "Previous course ended / last supply: this date is in the future; check the date entered";
        }
        if (state.medicineSelection.previousCourseEndDate < state.medicineSelection.previousCourseStartDate) {
          return "Previous course ended / last supply: the previous course cannot end before it started";
        }
        if (!state.medicineSelection.repeatCourseReviewed) {
          return "Tick Review completed before this repeat course: a review is required for repeat courses (maximum 12 weeks continuous use)";
        }
      }
      if (!state.medicineSelection.quantitySupplied) {
        return "Quantity supplied: select the quantity";
      }
      return null;

    case 6: // Counselling
      {
        const c = state.counselling;
        const points: [boolean, string][] = [
          [c.improvementTimeline, "Improvement is not expected before 6 to 8 weeks"],
          [c.applicationAdvice, "Application: thin layer once daily in the evening"],
          [c.photosensitivity, "Use sunscreen and limit sun exposure"],
          [c.irritationAdvice, "Irritation: reduce frequency or interrupt"],
          [c.washingAdvice, "Avoid over-cleaning"],
          [c.productAdvice, "Avoid oil-based comedogenic skin care products"],
          [c.scarringAdvice, "Persistent picking or scratching of lesions"],
          [c.courseCompletion, "Treatment period: maximum 12 weeks continuous use"],
          [c.followUpAdvice, "Follow-up: seek advice if the skin reaction is severe"],
        ];
        const missing = points.find(([done]) => !done);
        if (missing) return `Counselling point not yet ticked: "${missing[1]}". Tick each point once it has been covered with the patient.`;
      }
      if (isDuac(choice) && !state.counselling.storageAdvice) {
        return "Counselling point not yet ticked: Storage (store below 25 C once dispensed, use within 2 months) for benzoyl peroxide / clindamycin gel";
      }
      if (isEpiduo(choice) && !state.counselling.bleachingAdvice) {
        return "Counselling point not yet ticked: Avoid contact with coloured material (bleaching) and cosmetics advice for adapalene / benzoyl peroxide gel";
      }
      if (!state.counselling.pilSupplied) {
        return "Tick Patient information leaflet (PIL) supplied with the medication";
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
