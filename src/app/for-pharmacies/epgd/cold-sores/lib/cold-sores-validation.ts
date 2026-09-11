import type { ColdSoresConsultationState } from "./cold-sores-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: ColdSoresConsultationState): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Symptom Assessment
      if (!state.symptomAssessment.isRecurrent && !state.symptomAssessment.isFirstEpisode) {
        return "Please confirm whether this is a recurrent episode (PGD inclusion) or a first episode (refer)";
      }
      if (!state.symptomAssessment.currentSymptoms.trim()) {
        return "Please describe current symptoms";
      }
      if (state.symptomAssessment.prodromeSigns && state.symptomAssessment.hoursFromProdrome === null) {
        return "Please enter hours since prodrome";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.renalImpairment && !state.medicalHistory.renalFunction.trim()) {
        return "Please describe renal function status";
      }
      return null;

    case 4: // Contraindications
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.product) return "Select aciclovir 5% cream or aciclovir 200 mg tablets";
      if (state.medicineSupply.product === "cream" && !state.medicineSupply.tubeSize) {
        return "Select the tube size (2 g or 5 g; one tube per episode)";
      }
      if (state.medicineSupply.product === "tablets" && state.medicineSupply.doseChoice !== "200") {
        return "The PGD dose is aciclovir 200 mg five times daily for 5 days";
      }
      if (state.medicineSupply.quantity === null || state.medicineSupply.quantity <= 0) {
        return "Please enter quantity to supply";
      }
      if (state.medicineSupply.product === "tablets" && state.medicineSupply.quantity !== 25) {
        return "The PGD quantity for tablets is 25 per episode (200 mg five times daily for 5 days)";
      }
      if (state.medicineSupply.product === "cream" && state.medicineSupply.quantity !== 1) {
        return "The PGD quantity for cream is one tube per episode";
      }
      if (!state.medicineSupply.brand.trim()) return "Record the brand of the product supplied (PGD records requirement)";
      return null;

    case 6: // Counselling
      if (
        !state.counselling.startASAP ||
        !state.counselling.completeCourse ||
        !state.counselling.contagious ||
        !state.counselling.avoidSharing ||
        !state.counselling.sunExposure ||
        !state.counselling.safetyNetting ||
        !state.counselling.symptomRelief ||
        !state.counselling.hygieneMeasures ||
        !state.counselling.providedPIL
      ) {
        return "Please confirm all counselling points have been covered";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
