import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validatePatient(patient: BasePatientDetails, ageConfirmed: boolean): string | null {
  const err = validatePatientStep(patient, { minAge: 55 });
  if (err) return err;
  if (!ageConfirmed) return "Please confirm patient is 55 years or older";
  return null;
}

export function validateAssessment(assessment: { sleepOnsetIssue: boolean; sleepMaintenanceIssue: boolean; durationOfInsomnia: string }): string | null {
  if (!assessment.sleepOnsetIssue && !assessment.sleepMaintenanceIssue) return "Sleep issue must be documented";
  if (!assessment.durationOfInsomnia) return "Duration of insomnia must be specified";
  return null;
}

export function validateContraindications(contraindicated: boolean): string | null {
  if (contraindicated) return "Patient meets exclusion criteria — cannot proceed";
  return null;
}

export function validateCounselling(counselling: { sleepHygieneReinforcedFirstLine: boolean; avoidScreensAdvised: boolean; taperedStoppingAdvised: boolean; notASedativeExplained: boolean }): string | null {
  if (!Object.values(counselling).every((v) => v === true)) return "All counselling points must be covered";
  return null;
}

export function validateSummary(summary: BaseSummary): string | null {
  return validateSummaryStep(summary);
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateStep(
  step: number,
  state: {
    patient: BasePatientDetails;
    consent: BaseConsent;
    assessment: { sleepOnsetIssue: boolean; sleepMaintenanceIssue: boolean; durationOfInsomnia: string };
    contraindications: { contraindicated: boolean };
    counselling: { sleepHygieneReinforcedFirstLine: boolean; avoidScreensAdvised: boolean; taperedStoppingAdvised: boolean; notASedativeExplained: boolean };
    summary: BaseSummary;
  }
): string | null {
  switch (step) {
    case 0:
      return validatePatient(state.patient, (state as any).assessment?.ageConfirmed ?? false);
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateAssessment(state.assessment);
    case 3:
      return validateContraindications(state.contraindications.contraindicated);
    case 4:
      return null;
    case 5:
      return validateCounselling(state.counselling);
    case 6:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
