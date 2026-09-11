import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type {
  TravelCoreDestinationAssessment,
  TravelCoreMalariaRisk,
  TravelCorePreventiveMeasures,
  TravelCoreMedicinesSupplied,
  TravelCoreVaccineAdministration,
} from "./travel-core-types";
import { getVaccineAlerts } from "./travel-core-clinical-logic";

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
  if (stops.length > 0) return `Exclusion present: ${stops[0].message}. Deselect the vaccine or resolve the exclusion.`;
  if (!v.adrenalineAvailable) return "Confirm adrenaline 1 in 1,000 is immediately available, in date, with a telephone and a written anaphylaxis protocol";
  if (v.hepAGiven) {
    if (!v.hepAProduct) return "Select the hepatitis A product (Havrix or Avaxim)";
    if (!v.hepADose) return "Record whether this is the hepatitis A primary dose or the 6 to 12 month booster";
    if (!v.hepABatch.trim()) return "Record the hepatitis A vaccine batch number";
    if (!v.hepAExpiry.trim()) return "Record the hepatitis A vaccine expiry date";
    if (!v.hepASite) return "Record the hepatitis A injection site";
  }
  if (v.typhoidGiven) {
    if (!v.typhoidBatch.trim()) return "Record the Typhim Vi batch number";
    if (!v.typhoidExpiry.trim()) return "Record the Typhim Vi expiry date";
    if (!v.typhoidSite) return "Record the Typhim Vi injection site";
  }
  if (v.choleraGiven) {
    if (!v.choleraDose) return "Record the Dukoral dose number (1, 2 or booster)";
    if (!v.choleraBatch.trim()) return "Record the Dukoral batch number";
    if (!v.choleraExpiry.trim()) return "Record the Dukoral expiry date";
  }
  if (!v.observationCompleted) return "Confirm the 15 minute seated observation period was completed";
  if (!v.pilSupplied) return "Confirm the patient information leaflet was supplied and the booster schedule explained";
  if (!v.followUpAdviceGiven) return "Confirm the follow-up advice was given";
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
  if (new Date(destination.departureDate) >= new Date(destination.returnDate)) {
    return "Return date must be after departure date";
  }
  return null;
}

export function validateMalariaRisk(
  malariaRisk: TravelCoreMalariaRisk,
  isEndemicZone: boolean
): string | null {
  if (isEndemicZone && !malariaRisk.resistanceProfile.trim()) {
    return "Resistance profile must be specified for malaria-endemic zones";
  }
  if (malariaRisk.malariaZone && !malariaRisk.chemoprophylaxisAdvised) {
    return "Chemoprophylaxis recommendation must be documented";
  }
  return null;
}

export function validatePreventiveMeasures(
  measures: TravelCorePreventiveMeasures
): string | null {
  const anyMeasureTaken = Object.values(measures).some(
    (v) => typeof v === "boolean" && v
  );
  if (!anyMeasureTaken && !measures.travellersVaccineNotes.trim()) {
    return "At least one preventive measure must be advised";
  }
  return null;
}

export function validateMedicinesSupplied(
  medicines: TravelCoreMedicinesSupplied
): string | null {
  const anyMedicineSupplied = Object.values(medicines).some(
    (v) => typeof v === "boolean" && v
  );
  if (!anyMedicineSupplied && !medicines.otherMedicinesNotes.trim()) {
    return "At least one medicine or supply must be documented";
  }
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
      return validateMalariaRisk(state.malariaRisk, state.destination.isEndemicMalariaZone);
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
