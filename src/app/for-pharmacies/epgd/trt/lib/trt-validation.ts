import type { TRTConsultationState } from "./trt-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: TRTConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });
    case 1:
      if (!state.assessment.maleConfirmed) return "Confirm patient is male";
      return null;
    case 2:
      if (!state.assessment.labConfirmedLowTestosterone) return "Lab-confirmed low testosterone required";
      if (!state.assessment.symptomsPresent) return "Symptoms of low testosterone required";
      return null;
    case 4:
      if (state.assessment.psa === null) return "PSA level required";
      if (state.assessment.hematocrit === null) return "Hematocrit level required";
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
