import type { CovidBoosterConsultationState } from "./covid-booster-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: CovidBoosterConsultationState, step: number): string | null {
  switch (step) {
    // PGD v004 covers 12 years and over. This tool previously enforced 18,
    // which turned away patients the PGD authorises.
    case 0:
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1:
      if (!state.assessment.ageConfirmed) {
        return "Please confirm patient is 12 years or older";
      }
      // A previous dose is NOT required. The SPC states the vaccine is given
      // regardless of prior vaccination status, and the PGD only excludes a
      // primary course where the patient is ALSO immunosuppressed.
      if (!state.assessment.previousCovidVaccine && state.assessment.immunosuppressed) {
        return "Primary course in an unvaccinated, immunosuppressed patient is excluded by the PGD. Refer.";
      }
      if (!state.assessment.timelinessEligible) {
        return "Please confirm at least 3 months since the last COVID-19 vaccine dose, or that this is a first dose";
      }
      return null;

    case 2:
      return null;

    case 3:
      if (
        !state.counselling.explainedBoosterRationale ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedObservationPeriod
      ) {
        return "All key counselling items must be completed";
      }
      return null;

    case 4: {
      const s = state.supply;
      if (!s.vaccineProduct) return "Select the vaccine product actually given";
      if (!s.batchNumber.trim()) return "Batch number is required. A recall cannot be actioned without it";
      if (!s.expiryDate) return "Vaccine expiry date is required";
      if (!s.administrationSite) return "Administration site is required";
      if (!s.administrationTime) return "Administration time is required";
      if (s.vaccineProduct === "comirnaty-lp81") {
        const age = state.patient.age;
        if (state.assessment.immunosuppressed || (age !== null && age >= 75)) {
          return "Comirnaty XFG must be given in preference to LP.8.1 for patients who are immunosuppressed or aged 75 and over. Use XFG, or rebook.";
        }
        if (!s.lp81FormulationExplained) {
          return "Confirm the patient was told this is the previous seasonal formulation and that XFG is the current one";
        }
      }
      return null;
    }

    case 5:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);

    case 6:
    case 7:
      return null;

    default:
      return null;
  }
}
