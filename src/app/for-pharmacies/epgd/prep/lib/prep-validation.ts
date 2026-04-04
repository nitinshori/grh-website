// ─── PrEP (HIV Pre-exposure Prophylaxis) Validation ───

import type { PrEPConsultationState } from "./prep-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { checkHivTestTiming } from "./prep-clinical-logic";

export function validateStep(state: PrEPConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, {
        minAge: 18,
      });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Risk Assessment
      const riskCount = [
        state.riskAssessment.msm,
        state.riskAssessment.transPerson,
        state.riskAssessment.heterosexualWithHivPartner,
        state.riskAssessment.sexWorkerOrPartner,
        state.riskAssessment.pwid,
        state.riskAssessment.chemsex,
      ].filter(Boolean).length;

      if (riskCount === 0) {
        return "At least one risk factor must be identified";
      }
      return null;

    case 3: // Baseline Testing
      if (!state.baselineTests.hivTestConfirmedNegative) {
        return "HIV negative confirmation is required";
      }
      if (!state.baselineTests.hivTestDate) {
        return "HIV test date is required";
      }
      if (!checkHivTestTiming(state.baselineTests.hivTestDate)) {
        return "HIV test must be within 4 weeks";
      }
      if (!state.baselineTests.hepatitisBAntigen) {
        return "Hepatitis B status must be assessed";
      }
      if (!state.baselineTests.hepatitisBAntigenResult) {
        return "Hepatitis B result must be specified";
      }
      if (state.baselineTests.eGfr === null) {
        return "eGFR result is required";
      }
      if (!state.baselineTests.stiScreening) {
        return "STI screening confirmation is required";
      }
      return null;

    case 4: // Medical History
      return null; // Mainly checkboxes

    case 5: // Contraindications
      return null; // Mainly checkboxes

    case 6: // Medicine Supply
      if (!state.medicineSupply.emtricitabineTenofovir200245) {
        return "Please confirm medicine supply";
      }
      if (!state.medicineSupply.dosingRegimen) {
        return "Dosing regimen (daily or event-based) must be specified";
      }
      if (state.medicineSupply.dosingRegimen === "daily" && !state.medicineSupply.understandsDailyDosing) {
        return "Please confirm patient understands daily dosing";
      }
      if (state.medicineSupply.dosingRegimen === "event-based" && !state.medicineSupply.understandsEventBased) {
        return "Please confirm patient understands event-based dosing";
      }
      if (!state.medicineSupply.renalMonitoring) {
        return "Please confirm renal monitoring will be done";
      }
      return null;

    case 7: // Counselling
      if (
        !state.counselling.notSubstituteForCondoms ||
        !state.counselling.regularHivTesting ||
        !state.counselling.renalMonitoring ||
        !state.counselling.takeWithFood ||
        !state.counselling.adherenceCritical ||
        !state.counselling.missedDose ||
        !state.counselling.pepAvailable
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
