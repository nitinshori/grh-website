import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type { TestosteroneWomenAssessment, TestosteroneWomenPrescription, TestosteroneWomenMonitoring } from "./testosterone-women-types";

export function validatePatient(patient: BasePatientDetails, ageConfirmed: boolean): string | null {
  const err = validatePatientStep(patient, { minAge: 40 });
  if (err) return err;
  if (!ageConfirmed) return "Please confirm patient is 40 years or older";
  return null;
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateAssessment(assessment: TestosteroneWomenAssessment): string | null {
  if (!assessment.femaleConfirmed) return "Please confirm patient is female";
  if (assessment.onHRTDuration === null) return "Duration on HRT must be specified";
  if (assessment.onHRTDuration < 3) return "Patient must be on HRT for at least 3 months";
  if (!assessment.hrtType.trim()) return "Type of HRT must be documented";
  if (!assessment.libioDysfunction) return "Libido dysfunction must be documented as reason for treatment";
  return null;
}

export function validateContraindications(contraindicated: boolean): string | null {
  if (contraindicated) return "Patient meets exclusion criteria — cannot proceed";
  return null;
}

export function validatePrescription(prescription: TestosteroneWomenPrescription): string | null {
  if (!prescription.productName.trim()) return "Product name must be specified";
  if (!prescription.applicationSite.trim()) return "Application site must be specified";
  return null;
}

export function validateMonitoring(monitoring: TestosteroneWomenMonitoring): string | null {
  if (!monitoring.baselineTestosteroneLevel) return "Baseline testosterone level assessment must be documented";
  if (!monitoring.sixMonthFollowUpPlanned) return "6-month follow-up plan must be documented";
  if (!monitoring.sideEffectsDiscussed) return "Side effects must be discussed with patient";
  return null;
}

export function validateSummary(summary: BaseSummary): string | null {
  return validateSummaryStep(summary);
}

export function validateStep(
  step: number,
  state: {
    patient: BasePatientDetails;
    consent: BaseConsent;
    assessment: TestosteroneWomenAssessment;
    contraindications: { breastCancer: boolean; endometrialCancer: boolean; activeLiverDisease: boolean; pregnancy: boolean; contraindicated: boolean };
    prescription: TestosteroneWomenPrescription;
    monitoring: TestosteroneWomenMonitoring;
    summary: BaseSummary;
  }
): string | null {
  switch (step) {
    case 0:
      return validatePatient(state.patient, state.assessment.ageConfirmed);
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateAssessment(state.assessment);
    case 3:
      return validateContraindications(state.contraindications.contraindicated);
    case 4:
      return validatePrescription(state.prescription);
    case 5:
      return validateMonitoring(state.monitoring);
    case 6:
      return null;
    case 7:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
