// ─── Premature Ejaculation (Dapoxetine) Validation ───

import type { PEConsultationState } from "./pe-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: PEConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: { // Patient Details
      if (state.patient.dateOfBirth && state.patient.dateOfBirth > new Date().toISOString().split("T")[0])
        return "Date of birth cannot be in the future: check the date";
      const base = validatePatientStep(state.patient, {
        minAge: 18,
        maxAge: 64,
      });
      if (base) return base;
      // Unanswered is "not yet answered": a message naming the control. The
      // "No" answer is a stop in the clinical logic (stop audit, 11 Sep 2026).
      if (!state.patient.sexAnswered)
        return "Select Yes or No to 'Is the patient male?' (this PGD is for male patients only)";
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
        return "Tick 'Informed WRITTEN consent obtained and filed' (inclusion criterion: verbal consent alone does not meet it)";
      return null;
    }

    case 2: // Assessment
      if (!state.clinicalAssessment.peType) {
        return "PE type (lifelong or acquired) is required";
      }
      if (state.clinicalAssessment.ieltMinutes === null) {
        return "Enter the IELT in minutes";
      }
      if (state.clinicalAssessment.ieltMinutes < 0) {
        return "IELT cannot be negative: check the figure";
      }
      if (state.clinicalAssessment.ieltMinutes >= 2) {
        return "IELT must be under 2 minutes for the PE diagnosis (inclusion criterion): if it is 2 minutes or more the patient is not eligible";
      }
      if (!state.clinicalAssessment.psychologicalDistress) {
        return "Tick 'Premature ejaculation causes significant personal distress' (inclusion criterion). If it does not, the patient is not eligible";
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
        return "Tick 'Dapoxetine supplied under this PGD'";
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
        return "Type the 'Brand supplied'";
      }
      if (!state.medicineSupply.understandsUsage) {
        return "Tick 'Patient understands usage'";
      }
      if (!state.summary.lyingBP.trim() || !state.summary.standingBP.trim()) {
        return "Enter both 'Lying BP' and 'Standing BP' as systolic/diastolic, e.g. 120/80";
      }
      if (!/^\s*\d{2,3}\s*\/\s*\d{2,3}\s*$/.test(state.summary.lyingBP) || !/^\s*\d{2,3}\s*\/\s*\d{2,3}\s*$/.test(state.summary.standingBP)) {
        return "'Lying BP' and 'Standing BP' must be written as systolic/diastolic in mmHg, e.g. 120/80";
      }
      if (!state.medicineSupply.understandsOrthostatic) {
        return "Tick 'Orthostatic hypotension assessment completed'";
      }
      if (!state.medicineSupply.pilSupplied) {
        return "Tick 'Patient information leaflet (PIL) supplied with Priligy'";
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
        return "Tick every counselling point on this page (each one must be covered with the patient)";
      }
      return null;

    case 8: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
