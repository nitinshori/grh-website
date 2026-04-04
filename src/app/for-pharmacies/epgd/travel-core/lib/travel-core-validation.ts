import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type {
  TravelCoreDestinationAssessment,
  TravelCoreMalariaRisk,
  TravelCorePreventiveMeasures,
  TravelCoreMedicinesSupplied,
} from "./travel-core-types";

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient);
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
      return validateSummary(state.summary);
    default:
      return null;
  }
}
