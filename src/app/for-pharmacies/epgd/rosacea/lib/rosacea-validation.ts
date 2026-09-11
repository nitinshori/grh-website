import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type { RosaceaAssessment, RosaceaConsultationState, RosaceaCounselling, RosaceaTreatment } from "./rosacea-types";
import { PRODUCT_DETAILS } from "./rosacea-clinical-logic";

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 18 }); // adults aged 18 years and over, both arms
}

export function validateAssessment(assessment: RosaceaAssessment): string | null {
  if (!assessment.subtype) return "Rosacea subtype must be identified";
  if (!assessment.severity) return "Please record severity (both arms are for mild to moderate rosacea)";
  return null;
}

export function validateContraindications(contraindicated: boolean): string | null {
  if (contraindicated) return "Patient meets exclusion criteria, cannot proceed";
  return null;
}

export function validateTreatment(treatment: RosaceaTreatment, assessment: RosaceaAssessment): string | null {
  if (!treatment.product) return "Please select the product to supply";
  if (!(assessment.papulesPostules || assessment.subtype === "papulopustular")) {
    return "Both arms require inflammatory lesions: metronidazole gel is for rosacea with inflammatory lesions and azelaic acid gel for papulopustular rosacea. Record papules/pustules on the assessment step or refer.";
  }
  if (!treatment.supplyNumber) return "Please record which supply of the course this is (each supply is one 30 g tube)";
  const max = PRODUCT_DETAILS[treatment.product]?.maxSupplies ?? 1;
  if (Number(treatment.supplyNumber) > max) return `Maximum ${max} x 30 g per course for this product; further supply needs a review`;
  return null;
}

export function validateCounselling(c: RosaceaCounselling): string | null {
  if (!c.applicationAdvised) return "Please confirm application advice has been given";
  if (!c.sunProtectionAdvised) return "Please confirm sun protection advice (and avoiding sunbeds) has been given";
  if (!c.triggerAvoidanceAdvised) return "Please confirm trigger avoidance has been discussed";
  if (!c.diaryAdvised) return "Please confirm a trigger diary has been suggested";
  if (!c.skinCareAdvised) return "Please confirm emollient and camouflage cosmetic advice has been given";
  if (!c.reviewAdvised) return "Please confirm the review interval and treatment period have been explained";
  if (!c.followUpAdvised) return "Please confirm follow-up advice has been given";
  if (!c.pilSupplied) return "Please confirm the patient information leaflet has been supplied";
  return null;
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateSummary(summary: BaseSummary): string | null {
  return validateSummaryStep(summary);
}

export function validateStep(step: number, state: RosaceaConsultationState): string | null {
  switch (step) {
    case 0:
      return validatePatient(state.patient);
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateAssessment(state.assessment);
    case 3:
      return validateContraindications(state.contraindications.contraindicated);
    case 4:
      return validateTreatment(state.treatment, state.assessment);
    case 5:
      return validateCounselling(state.counselling);
    case 6:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
