import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type { RosaceaAssessment, RosaceaConsultationState, RosaceaContraindications, RosaceaCounselling, RosaceaTreatment } from "./rosacea-types";
import { PRODUCT_DETAILS } from "./rosacea-clinical-logic";

export function validatePatient(patient: BasePatientDetails): string | null {
  const base = validatePatientStep(patient, { minAge: 18 }); // adults aged 18 years and over, both arms
  if (base) return base;
  // The PGD record must contain name, address, date of birth and GP.
  if (!patient.address.trim()) return "Patient address is required for the PGD record";
  if (!patient.gpPractice.trim()) return "GP practice is required for the PGD record";
  return null;
}

export function validateAssessment(assessment: RosaceaAssessment): string | null {
  if (!assessment.subtype) return "Rosacea subtype must be identified";
  if (!assessment.severity) return "Please record severity (both arms are for mild to moderate rosacea)";
  return null;
}

export function validateContraindications(contraindications: RosaceaContraindications): string | null {
  if (contraindications.contraindicated) return "Patient meets exclusion criteria, cannot proceed";
  if (!contraindications.questionsAsked) return "Confirm that each of the exclusion questions above has been put to the patient";
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
  if (Number(treatment.supplyNumber) > 1) {
    if (!treatment.courseStartDate) return "Record the date this course started (required from the second supply)";
    if (!treatment.previousSupplyDate) return "Record the date of the previous supply in this course";
    if (treatment.previousSupplyDate < treatment.courseStartDate) return "The previous supply cannot be before the course start date";
    const courseWeeks = PRODUCT_DETAILS[treatment.product]?.courseWeeks ?? 8;
    const weeksSinceStart = (Date.now() - new Date(treatment.courseStartDate).getTime()) / (7 * 24 * 3600 * 1000);
    if (weeksSinceStart > courseWeeks + 4) {
      return `This course started more than ${courseWeeks + 4} weeks ago; the ${courseWeeks}-week course window has passed. Review the patient and start a new course (supply 1) rather than continuing this one.`;
    }
  }
  if (!treatment.brand.trim()) return "Record the brand dispensed (the PGD record requires name and brand)";
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
  const base = validateSummaryStep(summary);
  if (base) return base;
  if (!summary.consultationDate) return "Consultation date is required";
  return null;
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
      return validateContraindications(state.contraindications);
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
