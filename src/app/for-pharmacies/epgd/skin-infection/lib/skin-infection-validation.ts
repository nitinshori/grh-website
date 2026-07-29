import type { SkinInfectionConsultationState } from "./skin-infection-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(
  stepIndex: number,
  state: SkinInfectionConsultationState,
): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 2 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.infectionType) return "Please select the infection type";
      if (!state.assessment.severity) return "Please assess severity";
      if (!state.assessment.affectedSite.trim()) return "Please describe the affected site";
      if (!state.assessment.durationDays.trim()) return "Please record how long symptoms have been present";
      return null;

    case 3:
      if (!state.medicalHistory.allergies.trim())
        return "Please record allergy status (write 'NKDA' if none known)";
      return null;

    case 4:
      if (!state.antibioticSelection.choice) return "Please select the antibiotic";
      if (!state.antibioticSelection.courseDays) return "Please select the course length";
      if (!state.antibioticSelection.quantitySupplied.trim())
        return "Please record the quantity supplied";
      return null;

    case 5:
      if (!state.counselling.completeCourse) return "Please confirm course-completion counselling";
      if (!state.counselling.administrationAdvice)
        return "Please confirm administration advice was given";
      if (!state.counselling.sideEffects) return "Please confirm side-effect counselling";
      if (!state.counselling.worseningAdvice)
        return "Please confirm worsening/no-improvement advice (48-72 hours)";
      if (
        state.antibioticSelection.choice === "doxycycline" &&
        !state.counselling.sunProtection
      )
        return "Please confirm sun-protection advice for doxycycline";
      return null;

    case 6:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
