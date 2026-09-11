import type { BVConsultationState } from "./bv-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getMedicineSelectionError, isOralChoice } from "./bv-clinical-logic";

export function validateStep(step: number, state: BVConsultationState): string | null {
  switch (step) {
    case 0:
      // PGD v004: women aged 16 to 65 (oral arm); gel arm 18 to 65 is gated at medicine selection
      return validatePatientStep(state.patient, {
        minAge: 16,
        maxAge: 65,
        requireFemale: true,
        femaleConfirmed: state.medicalHistory.femaleConfirmed,
      });
    case 1:
      return validateConsentStep(state.consent);
    case 2: {
      // Only the typical BV features count towards the clinical diagnosis;
      // itch, soreness and the red flags do not.
      const a = state.assessment;
      if (!a.thinGrayishDischarge && !a.fishyOdour && !a.odourWorseSexOrMenses)
        return "Record at least one typical BV feature (thin greyish-white discharge, fishy odour, odour worse after sex or menstruation): the inclusion is a clinical diagnosis of BV";
      return null;
    }
    case 3:
      if (!state.medicalHistory.exclusionsAskedAndAnswered)
        return "Confirm that every exclusion and caution question on this step was asked and answered by the patient";
      return null;
    case 4:
      return null;
    case 5:
      return getMedicineSelectionError(state);
    case 6: {
      // The document's follow-up advice for the arm supplied (PGD v004,
      // Follow-up advice to be given to patient or carer).
      const c = state.counselling;
      const oral = isOralChoice(state.medicineSelection.medicineChoice);
      if (oral && !c.noAlcoholAdvice) return "Oral metronidazole: confirm the patient was told to avoid all alcohol during the course and for 48 hours after the last dose";
      if (!oral && !c.latexAdvice) return "Vaginal gel: confirm the patient was told the applicator may damage latex condoms and diaphragms and to use alternative contraception";
      if (!c.completesCourse) return "Confirm the patient was told to complete the full course even if symptoms resolve";
      if (!c.notSTI) return "Confirm the patient was told BV is not an STI and partners may not need treatment";
      if (!c.recurrenceAdvice) return "Confirm the patient was told BV may recur and to contact the GP if symptoms return within 3 months";
      if (!c.seekAdviceIfNotResolved) return "Confirm the patient was told to seek medical advice if symptoms do not resolve within 5 to 7 days of completing treatment, or new symptoms develop";
      if (!c.pilSupplied) return "Confirm the patient information leaflet was supplied with the medication";
      return null;
    }
    case 7:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}
