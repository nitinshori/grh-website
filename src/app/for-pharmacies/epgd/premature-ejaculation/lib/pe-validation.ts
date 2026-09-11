// ─── Premature Ejaculation (Dapoxetine) Validation ───

import type { PEConsultationState } from "./pe-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: PEConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: { // Patient Details
      const base = validatePatientStep(state.patient, {
        minAge: 18,
        maxAge: 64,
        requireGender: true,
        genderConfirmed: state.patient.maleConfirmed,
      });
      if (base) return base;
      // Records row: name, address, date of birth and GP
      if (!state.patient.address.trim()) return "Patient address is required (PGD records row)";
      if (!state.patient.gpName.trim() && !state.patient.gpPractice.trim())
        return "Record the GP or practice with whom the patient is registered";
      return null;
    }

    case 1: { // Consent
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (!state.consent.writtenConsentObtained)
        return "Inclusion requires informed WRITTEN consent: confirm it has been obtained and filed";
      return null;
    }

    case 2: // Assessment
      if (!state.clinicalAssessment.peType) {
        return "PE type (lifelong or acquired) is required";
      }
      if (state.clinicalAssessment.ieltMinutes === null) {
        return "IELT (intravaginal ejaculation latency time) is required";
      }
      if (state.clinicalAssessment.ieltMinutes >= 2) {
        return "IELT must be under 2 minutes for PE diagnosis";
      }
      if (!state.clinicalAssessment.psychologicalDistress) {
        return "Inclusion requires premature ejaculation causing significant personal distress";
      }
      return null;

    case 3: // Medical History
      return null; // Mainly checkboxes, no hard requirement

    case 4: // Current Medications
      return null; // Mainly checkboxes

    case 5: // Contraindications
      return null; // Mainly checkboxes

    case 6: // Medicine Supply
      if (!state.medicineSupply.dapoxetine30mgSupplied) {
        return "Please confirm dapoxetine supply";
      }
      if (!state.medicineSupply.strengthSupplied) {
        return "Select the strength supplied (30mg starting dose; 60mg only where 30mg was insufficient and well tolerated)";
      }
      if (state.medicineSupply.strengthSupplied === "60mg" && !state.medicineSupply.mayIncreaseTo60mg) {
        return "60mg may be supplied only where the 30mg dose was insufficient and well tolerated";
      }
      // The tool's own caution says "do not increase to 60mg" for these
      // patients (Priligy SmPC); it used to permit it anyway.
      if (
        state.medicineSupply.strengthSupplied === "60mg" &&
        (state.currentMedications.moderateCyp3a4Inhibitor || state.medicalHistory.cyp2d6PoorMetaboliser)
      ) {
        return "60mg must not be supplied with a moderate CYP3A4 inhibitor or to a CYP2D6 poor metaboliser: maximum 30mg";
      }
      if (state.medicineSupply.quantity === null || state.medicineSupply.quantity < 1 || state.medicineSupply.quantity > 6) {
        return "Quantity must be between 1 and 6 tablets per supply";
      }
      if (!state.medicineSupply.brand.trim()) {
        return "Record the brand supplied";
      }
      if (!state.medicineSupply.understandsUsage) {
        return "Please confirm patient understands usage instructions";
      }
      if (!state.summary.lyingBP.trim() || !state.summary.standingBP.trim()) {
        return "Record the lying and standing blood pressure";
      }
      if (!state.medicineSupply.understandsOrthostatic) {
        return "Please confirm orthostatic hypotension assessment done";
      }
      if (!state.medicineSupply.pilSupplied) {
        return "Confirm the patient information leaflet was supplied";
      }
      return null;

    case 7: // Counselling
      if (
        !state.counselling.takeWithWater ||
        !state.counselling.maxOnePer24h ||
        !state.counselling.avoidAlcohol ||
        !state.counselling.standSlowly ||
        !state.counselling.hydration ||
        !state.counselling.noDrive2hrs ||
        !state.counselling.avoidGrapefruit ||
        !state.counselling.mayHaveSideEffects ||
        !state.counselling.reportChestPainHeadacheFainting ||
        !state.counselling.priapismWarning ||
        !state.counselling.informGp ||
        !state.counselling.notForDaily ||
        !state.counselling.review4weeks
      ) {
        return "All counselling points must be covered";
      }
      return null;

    case 8: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
