import type { ThrushConsultationState } from "./thrush-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getMedicineSelectionError } from "./thrush-clinical-logic";

export function validateStep(step: number, state: ThrushConsultationState): string | null {
  switch (step) {
    case 0:
      // PGD v003: women aged 16 to 60 (exclusion row: under 16 or over 60)
      return validatePatientStep(state.patient, {
        minAge: 16,
        maxAge: 60,
        requireFemale: true,
        femaleConfirmed: state.medicalHistory.femaleConfirmed,
      });
    case 1:
      return validateConsentStep(state.consent);
    case 2: {
      // Only the four presenting symptoms count towards the diagnosis; the
      // exclusion flags are not symptoms of uncomplicated candidiasis.
      const a = state.assessment;
      const symptomsCount = [a.vulvalItching, a.vulvalSoreness, a.thickWhiteDischarge, a.dyspareunia].filter(Boolean).length;
      if (symptomsCount === 0) return "At least one presenting symptom of vulvovaginal candidiasis must be selected";
      if (!a.exclusionsAsked) return "Confirm that every exclusion question above was asked and the answers recorded";
      return null;
    }
    case 3:
      if (!state.medicalHistory.exclusionsAsked) return "Confirm that every exclusion and caution above was asked and the answers recorded";
      return null;
    case 4:
      return null;
    case 5: {
      const err = getMedicineSelectionError(state);
      if (err) return err;
      if (!state.medicineSelection.brand.trim()) return "Record the brand (or manufacturer) of the product supplied";
      return null;
    }
    case 6: {
      // Every follow-up item in the document, plus the PIL. The pessary
      // insertion advice is mandatory when the pessary is supplied.
      const c = state.counselling;
      if (!c.typicalSymptoms) return "Confirm typical symptoms were explained";
      if (!c.timelineToRelief) return "Confirm the 5 to 7 day timeline and when to contact the GP was given";
      if (!c.avoidPerfumedProducts) return "Confirm the advice to avoid irritants was given";
      if (!c.cottonUnderwear) return "Confirm the cotton underwear advice was given";
      if (!c.avoidIntercourse) return "Confirm the advice to avoid intercourse for at least 5 days was given";
      if (state.medicineSelection.medicineChoice === "clotrimazole-pessary" && !c.insertWithFingers) return "Confirm the patient was advised to insert the pessary with fingers rather than the applicator";
      if (!c.recurrenceAdvice) return "Confirm the recurrent infection advice was given";
      if (!c.completesTreatment) return "Confirm the patient was advised to complete the treatment";
      if (!c.yellowCardAdvice) return "Confirm the Yellow Card advice was given";
      if (!c.pilSupplied) return "Confirm the patient information leaflet was supplied";
      return null;
    }
    case 7:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}
