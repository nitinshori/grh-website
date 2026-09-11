import type { GonorrhoeaConsultationState } from "./gonorrhoea-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getAllAlerts, validateAdministration } from "./gonorrhoea-clinical-logic";

export function validateStep(state: GonorrhoeaConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 }); // PGD v003: adults aged 18 years or over
    case 1:
      if (!state.assessment.neatPositive && !state.assessment.epidemiologicalLink)
        return "Positive NAAT for N. gonorrhoeae, or strong clinical suspicion with a clear epidemiological link, is required";
      if (state.assessment.pharyngealGonorrhoea) return "Pharyngeal gonorrhoea: this tool refers to a sexual health specialist";
      if (!state.assessment.ableToAttendTestOfCure) return "Patient must be able to attend the test of cure appointment at 2 weeks";
      return null;
    case 3: {
      const stop = getAllAlerts(state).find((a) => a.severity === "stop");
      return stop ? stop.message : null;
    }
    case 5:
      return validateAdministration(state);
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
