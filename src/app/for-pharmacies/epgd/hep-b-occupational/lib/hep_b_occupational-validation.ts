import type { ClinicalAlert } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type { HepBState } from "./hep_b_occupational-types";
import { getDoseRule, parseLocalDate, isExpired } from "./hep_b_occupational-clinical-logic";

export function validateAssessment(state: HepBState, alerts: ClinicalAlert[]): string | null {
  const { assessment } = state;
  // The stop comes first: once an exclusion is on screen the pharmacist is
  // saving as not supplied, not filling in the rest of the step.
  const stop = alerts.find((a) => a.severity === "stop");
  if (stop) return `Exclusion present: ${stop.message}. Record the advice given and save as not supplied.`;
  if (!assessment.reasonForVaccination) return "Select the reason for vaccination";
  if (assessment.previousVaccination === "") return "Select an option under \"Previous Hepatitis B Vaccination\" (None, Partial course or Full course)";
  if (assessment.previousVaccination === "full-course" && assessment.antiHBsLevelChecked && !assessment.antiHBsLevel) return "\"Anti-HBs level checked\" is ticked: select the \"Anti-HBs Level\"";
  if (!assessment.eligibleUnderGuidance) return "Tick \"Eligible under national immunisation (Green Book chapter 18) or occupational health guidance\"";
  return null;
}

export function validateTreatment(state: HepBState, alerts: ClinicalAlert[]): string | null {
  const t = state.treatment;
  const stopFirst = alerts.find((a) => a.severity === "stop");
  if (stopFirst) return `Exclusion present: ${stopFirst.message}. Record the advice given and save as not supplied.`;
  if (!t.adrenalineAvailable) return "Confirm adrenaline 1 in 1,000 is immediately available in the room, in date, with a telephone and a written anaphylaxis protocol";
  if (!t.vaccine) return "Select the vaccine (the brand given is what a recall is searched on)";
  if (!t.schedule) return "Select the schedule";
  if (!t.doseNumber) return "Record the dose number";
  const rule = getDoseRule(t.schedule, t.doseNumber);
  if (rule && rule.minDays !== null && !parseLocalDate(t.previousDoseDate)) return "Record the date of the previous dose";
  const stop = alerts.find((a) => a.severity === "stop");
  if (stop) return `Exclusion present: ${stop.message}. Record the advice given and save as not supplied.`;
  if (!t.injectionSite) return "Record the injection site";
  if (!t.batchNumber) return "Record the batch number";
  if (!parseLocalDate(t.expiryDate)) return "Record the expiry date";
  if (isExpired(t.expiryDate)) return "Vaccine batch has expired: do not administer, quarantine the stock and select an in-date batch";
  if (!t.observationPeriodCompleted) return "Confirm the 15 minute post-vaccination observation was completed";
  if (t.adverseReaction && !t.adverseReactionDetails.trim()) return "Record the adverse reaction and the action taken";
  return null;
}

export function validateCounselling(state: HepBState): string | null {
  const c = state.counselling;
  if (!c.counsellingProvided) return "Tick \"Counselling provided to patient\"";
  if (!c.pilSupplied) return "Tick \"Patient information leaflet (PIL) supplied\"";
  if (!c.followUpAdviceGiven) return "Tick \"Follow-up advice given\"";
  if (!c.gpInformed) return "Select an option under \"GP informed\": GP informed, or patient declined GP notification";
  if (!c.counsellingNotes.trim()) return "Complete \"Counselling Notes\" (a line or two on what was discussed)";
  return null;
}

export function validateSummary(state: HepBState): string | null {
  const base = validateSummaryStep(state.summary);
  if (base) return base;
  if (!state.summary.pharmacyName.trim()) return "Pharmacy name is required";
  return null;
}

export function validateStep(step: number, state: HepBState, alerts: ClinicalAlert[]): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 16 });
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      return validateAssessment(state, alerts);
    case 3:
      return validateTreatment(state, alerts);
    case 4:
      return validateCounselling(state);
    case 5:
    case 6:
      return validateSummary(state);
    default:
      return null;
  }
}
