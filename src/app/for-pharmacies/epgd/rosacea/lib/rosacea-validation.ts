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
  if (!assessment.subtype) return "Rosacea subtype: select the subtype";
  if (!assessment.severity) return "Severity: select mild, moderate or severe (both arms are for mild to moderate rosacea)";
  if (!assessment.papulesPostules) return "Are papules or pustules (inflammatory lesions) present? Select Yes or No";
  if (assessment.papulesPostules === "no" && assessment.subtype !== "papulopustular") {
    return "No papules or pustules: neither product can be supplied without inflammatory lesions (metronidazole gel is for rosacea with inflammatory lesions; azelaic acid gel is for papulopustular rosacea). Use Save as not supplied and refer.";
  }
  return null;
}

export function validateContraindications(contraindications: RosaceaContraindications): string | null {
  if (contraindications.contraindicated) return "Patient meets exclusion criteria, cannot proceed. Record the advice given in the box above and use Save as not supplied.";
  if (!contraindications.questionsAsked) return "Tick the confirmation at the bottom: I have asked the patient every question above (ticked boxes are Yes, unticked boxes are No)";
  return null;
}

export function validateTreatment(treatment: RosaceaTreatment, assessment: RosaceaAssessment): string | null {
  if (!treatment.product) return "Treatment product: select the product to supply";
  if (!(assessment.papulesPostules === "yes" || assessment.subtype === "papulopustular")) {
    return "Both arms require inflammatory lesions: metronidazole gel is for rosacea with inflammatory lesions and azelaic acid gel for papulopustular rosacea. Go back to Rosacea Assessment and answer Are papules or pustules present?, or refer.";
  }
  if (!treatment.supplyNumber) return "Supply number within this course: select which supply this is (each supply is one 30 g tube)";
  const max = PRODUCT_DETAILS[treatment.product]?.maxSupplies ?? 1;
  if (Number(treatment.supplyNumber) > max) return `Maximum ${max} x 30 g per course for this product; further supply needs a review`;
  if (Number(treatment.supplyNumber) > 1) {
    const today = new Date().toISOString().split("T")[0];
    if (!treatment.courseStartDate) return "Date this course started: required from the second supply";
    if (treatment.courseStartDate > today) return "Date this course started: this date is in the future; check the date entered";
    if (!treatment.previousSupplyDate) return "Date of previous supply: record the date of the previous supply in this course";
    if (treatment.previousSupplyDate > today) return "Date of previous supply: this date is in the future; check the date entered";
    if (treatment.previousSupplyDate < treatment.courseStartDate) return "Date of previous supply: the previous supply cannot be before the date this course started";
    const courseWeeks = PRODUCT_DETAILS[treatment.product]?.courseWeeks ?? 8;
    const weeksSinceStart = (Date.now() - new Date(treatment.courseStartDate).getTime()) / (7 * 24 * 3600 * 1000);
    if (weeksSinceStart > courseWeeks + 4) {
      return `This course started more than ${courseWeeks + 4} weeks ago; the ${courseWeeks}-week course window has passed. Review the patient and start a new course (supply 1) rather than continuing this one.`;
    }
  }
  if (!treatment.brand.trim()) return "Brand dispensed: record the brand (the PGD record requires name and brand)";
  return null;
}

export function validateCounselling(c: RosaceaCounselling): string | null {
  if (!c.applicationAdvised) return "Tick Application advice given once it has been covered";
  if (!c.sunProtectionAdvised) return "Tick Effective sun protection advised; avoid sunbeds once it has been covered";
  if (!c.triggerAvoidanceAdvised) return "Tick Importance of avoiding trigger factors discussed once it has been covered";
  if (!c.diaryAdvised) return "Tick Trigger diary suggested once it has been covered";
  if (!c.skinCareAdvised) return "Tick Regular non-oily emollients / tinted cosmetics once it has been covered";
  if (!c.reviewAdvised) return "Tick Review interval and treatment period explained once it has been covered";
  if (!c.followUpAdvised) return "Tick Follow-up advice given once it has been covered";
  if (!c.pilSupplied) return "Tick Patient information leaflet (PIL) supplied with the medication";
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
