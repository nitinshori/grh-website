import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type {
  TravelCoreDestinationAssessment,
  TravelCoreMalariaRisk,
  TravelCorePreventiveMeasures,
  TravelCoreMedicinesSupplied,
  TravelCoreVaccineAdministration,
} from "./travel-core-types";
import { getVaccineAlerts, parseLocalDate } from "./travel-core-clinical-logic";

export function validateVaccines(
  v: TravelCoreVaccineAdministration,
  age: number | null,
  departureDate: string
): string | null {
  const anyGiven = v.hepAGiven || v.typhoidGiven || v.choleraGiven;
  if (!anyGiven) {
    if (!v.noVaccineToday) return "Select the vaccine(s) administered, or confirm that no vaccine was administered at this visit";
    return null;
  }
  const stops = getVaccineAlerts(v, age, departureDate).filter((a) => a.severity === "stop");
  if (stops.length > 0) return `Exclusion present: ${stops[0].message}. Record the advice given and save as not supplied, or resolve the exclusion.`;
  if (v.hepAGiven && !v.hepAInclusionAnswer) return "Hepatitis A: answer \"Does the destination have high or intermediate hepatitis A prevalence...?\" (Yes or No)";
  if (v.typhoidGiven && !v.typhoidInclusionAnswer) return "Typhoid: answer \"Does the destination have high or intermediate typhoid prevalence...?\" (Yes or No)";
  if (v.choleraGiven && !v.choleraInclusionAnswer) return "Cholera: answer \"Does the traveller meet a Dukoral inclusion criterion...?\" (Yes or No)";
  if (!v.adrenalineAvailable) return "Tick \"Adrenaline (epinephrine) 1 in 1,000 injection immediately available in the room...\"";
  if (v.hepAGiven) {
    if (!v.hepAProduct) return "Select the hepatitis A \"Product\" (Havrix or Avaxim)";
    if (!v.hepADose) return "Record whether this is the hepatitis A primary dose or the 6 to 12 month booster";
    if (v.hepADose === "booster" && !parseLocalDate(v.hepAPrimaryDoseDate)) return "Record the date of the hepatitis A primary dose";
    if (v.hepADose === "booster" && !v.hepAPrimaryProduct) return "Record the product used for the hepatitis A primary dose";
    if (!v.hepABatch.trim()) return "Record the hepatitis A vaccine batch number";
    if (!parseLocalDate(v.hepAExpiry)) return "Record the hepatitis A vaccine expiry date";
    if (!v.hepASite) return "Record the hepatitis A injection site";
  }
  if (v.typhoidGiven) {
    if (v.typhoidPreviousDose && !parseLocalDate(v.typhoidPreviousDoseDate)) return "Record the date of the previous typhoid dose";
    if (!v.typhoidBatch.trim()) return "Record the Typhim Vi batch number";
    if (!parseLocalDate(v.typhoidExpiry)) return "Record the Typhim Vi expiry date";
    if (!v.typhoidSite) return "Record the Typhim Vi injection site";
  }
  if (v.choleraGiven) {
    if (!v.choleraDose) return "Record the Dukoral dose number (1, 2 or booster)";
    if (v.choleraDose === "2" && !parseLocalDate(v.choleraDose1Date)) return "Record the date of Dukoral dose 1";
    if (v.choleraDose === "booster" && !parseLocalDate(v.choleraLastCourseDate)) return "Record the date the last Dukoral course or booster was completed";
    if (!v.choleraBatch.trim()) return "Record the Dukoral batch number";
    if (!parseLocalDate(v.choleraExpiry)) return "Record the Dukoral expiry date";
  }
  if (!v.observationCompleted) return "Tick \"Observed for 15 minutes after vaccination...\" once the 15 minutes have elapsed";
  if (v.adverseReaction && !v.adverseReactionDetails.trim()) return "\"Adverse reaction and action taken\" is required when \"Adverse reaction observed\" is ticked";
  if (!v.pilSupplied) return "Tick \"Patient information leaflet supplied for each vaccine...\" once done";
  if (!v.followUpAdviceGiven) return "Tick \"Follow-up advice given...\" once the advice has been given";
  return null;
}

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateDestination(
  destination: TravelCoreDestinationAssessment
): string | null {
  if (!destination.destination.trim()) return "Destination country/region is required";
  if (!destination.departureDate) return "Departure date is required";
  if (!destination.returnDate) return "Return date is required";
  const dep = parseLocalDate(destination.departureDate);
  const ret = parseLocalDate(destination.returnDate);
  if (!dep || !ret) return "Enter the departure and return dates";
  if (dep >= ret) {
    return "Return date must be after departure date";
  }
  return null;
}

/**
 * Malaria chemoprophylaxis is outside this PGD (three vaccines). The step is
 * a risk assessment: where the destination is a malaria zone the traveller
 * must be sent somewhere (anti-malarials PGD, GP, travel clinic) or the
 * decision recorded. No drug is suggested here.
 */
export function validateMalariaRisk(
  malariaRisk: TravelCoreMalariaRisk
): string | null {
  if (malariaRisk.malariaZone && !malariaRisk.chemoprophylaxisPlan) {
    return "Malaria zone: record the chemoprophylaxis plan (supplied under the anti-malarials PGD, referred, not required, or declined)";
  }
  return null;
}

/** Advice is recorded, never forced: an advice-only tick list must not block a vaccine consultation. */
export function validatePreventiveMeasures(
  _measures: TravelCorePreventiveMeasures
): string | null {
  return null;
}

/** Non-PGD supplies are optional and never required to proceed. */
export function validateMedicinesSupplied(
  _medicines: TravelCoreMedicinesSupplied
): string | null {
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
    destination: TravelCoreDestinationAssessment;
    malariaRisk: TravelCoreMalariaRisk;
    preventiveMeasures: TravelCorePreventiveMeasures;
    medicinesSupplied: TravelCoreMedicinesSupplied;
    vaccines: TravelCoreVaccineAdministration;
    summary: BaseSummary;
  }
): string | null {
  switch (step) {
    case 0:
      return validatePatient(state.patient);
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateDestination(state.destination);
    case 3:
      return validateMalariaRisk(state.malariaRisk);
    case 4:
      return validatePreventiveMeasures(state.preventiveMeasures);
    case 5:
      return validateMedicinesSupplied(state.medicinesSupplied);
    case 6:
      return validateVaccines(state.vaccines, state.patient.age, state.destination.departureDate);
    case 7:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
