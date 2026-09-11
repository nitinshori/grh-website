import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type {
  SleepMelatoninAssessment,
  SleepMelatoninConsultationState,
  SleepMelatoninCounselling,
  SleepMelatoninPrescription,
  SleepMelatoninSecondaryCauses,
} from "./sleep-melatonin-types";
import { hasSecondaryCause, hasAssessmentStops, weeksTreated, maxTabletsThisSupply } from "./sleep-melatonin-clinical-logic";

export function validatePatient(patient: BasePatientDetails, ageConfirmed: boolean): string | null {
  const err = validatePatientStep(patient, { minAge: 55 });
  if (err) return err;
  if (!ageConfirmed) return "Please confirm patient is 55 years or older";
  return null;
}

export function validateAssessment(assessment: SleepMelatoninAssessment, secondaryCauses: SleepMelatoninSecondaryCauses): string | null {
  if (!assessment.ageConfirmed) return "Tick 'Age 55 years or older, confirmed'";
  if (!assessment.sleepOnsetIssue && !assessment.sleepMaintenanceIssue) return "Tick the type of sleep difficulty: 'Sleep onset difficulty' or 'Sleep maintenance difficulty' (at least one)";
  if (!assessment.durationOfInsomnia) return "Select the duration of insomnia";
  if (assessment.durationOfInsomnia === "less4w") return "Insomnia present for less than 4 weeks is excluded. Give sleep hygiene advice and review; do not supply";
  if (!assessment.daytimeFunctioningAffected) return "Tick 'Poor quality of sleep is affecting daytime functioning'. If daytime functioning is not affected the patient is outside this PGD: do not supply";
  if (!assessment.daytimeImpact.trim()) return "Complete 'How the insomnia affects daytime functioning' (required record)";
  if (!assessment.sleepHygieneAdviceGiven) return "Tick 'Sleep hygiene advice given (Appendix 1)': it must be given before supply";
  if (!secondaryCauses.historyTaken) return "Tick 'History taken covering mood, pain, snoring ... no secondary cause apparent' once each secondary cause has been asked about";
  if (hasSecondaryCause(secondaryCauses)) return "A secondary cause is apparent. Refer, do not supply";
  if (assessment.previousCircadin) {
    if (!assessment.weeksTreatedToDate.trim()) return "Record the total weeks of Circadin treatment to date";
    if (weeksTreated(assessment) === null) return "Weeks of Circadin treatment to date must be a number";
    if (!assessment.lastSupplyDate) return "Record the date of the last Circadin supply";
    const d = new Date(assessment.lastSupplyDate);
    if (isNaN(d.getTime()) || d.getTime() > Date.now()) return "The date of the last Circadin supply must be a valid date, not in the future";
    if (!assessment.previousCourseStatus) return "Record whether this continues the current course or the previous course was completed";
    if (hasAssessmentStops(assessment)) return "Treatment limit reached (13 weeks in total, or a completed course within 6 months). Refer, do not supply";
  }
  return null;
}

export function validateContraindications(contraindicated: boolean): string | null {
  if (contraindicated) return "Patient meets exclusion criteria, cannot proceed";
  return null;
}

export function validatePrescription(prescription: SleepMelatoninPrescription, assessment?: SleepMelatoninAssessment): string | null {
  const q = prescription.quantityTablets;
  if (q === null || q < 1) return "Enter the quantity to supply (up to 21 tablets)";
  if (!Number.isInteger(q)) return "Quantity must be a whole number of tablets";
  if (q > 21) return "Maximum 21 tablets per supply under this PGD (three weeks)";
  if (assessment) {
    const cap = maxTabletsThisSupply(assessment);
    if (q > cap) return `Maximum ${cap} tablets this supply: ${weeksTreated(assessment)} weeks already taken and the course may not exceed 13 weeks in total`;
  }
  return null;
}

const COUNSELLING_LABELS: Record<keyof SleepMelatoninCounselling, string> = {
  takeAfterFoodSwallowWhole: "One tablet a day, 1 to 2 hours before bed, after food; swallow whole",
  drowsinessDrivingAdvised: "Drowsiness and driving advised",
  alcoholAdvised: "Alcohol advised",
  notASedativeExplained: "Not a sleeping tablet in the usual sense",
  sleepHygieneReinforcedFirstLine: "Sleep hygiene reinforced",
  avoidScreensAdvised: "Avoid screens before bed",
  shortCourse13Weeks: "Short course, up to 13 weeks",
  whenToSeekAdvice: "When to see the GP rather than continuing",
};

export function validateCounselling(counselling: SleepMelatoninCounselling): string | null {
  // Name the unticked points in the words of their labels (walkthrough
  // review, 11 Sep 2026).
  const missing = (Object.keys(COUNSELLING_LABELS) as (keyof SleepMelatoninCounselling)[])
    .filter((k) => counselling[k] !== true)
    .map((k) => COUNSELLING_LABELS[k]);
  if (missing.length) return `Tick every counselling point. Not yet ticked: ${missing.join("; ")}`;
  return null;
}

export function validateSummary(summary: BaseSummary): string | null {
  return validateSummaryStep(summary);
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateStep(step: number, state: SleepMelatoninConsultationState): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 55 });
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateAssessment(state.assessment, state.secondaryCauses);
    case 3:
      return validateContraindications(state.contraindications.contraindicated);
    case 4:
      return validatePrescription(state.prescription, state.assessment);
    case 5:
      return validateCounselling(state.counselling);
    case 6:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
