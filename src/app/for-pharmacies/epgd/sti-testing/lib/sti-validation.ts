// ─── STI Testing Validation ───

import type { STIConsultationState } from "./sti-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: STIConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, {
        minAge: 16,
      });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Risk Assessment
      if (state.riskAssessment.numberOfPartners === null) {
        return "Number of partners is required";
      }
      if (!state.riskAssessment.condomUsage) {
        return "Condom usage must be specified";
      }
      return null;

    case 3: // Clinical Assessment
      // At least assess for symptoms
      return null; // Flexible assessment

    case 4: // Test Selection
      const testCount = [
        state.testSelection.ctGc,
        state.testSelection.hiv,
        state.testSelection.syphilis,
        state.testSelection.hepatitisB,
        state.testSelection.hepatitisC,
      ].filter(Boolean).length;

      if (testCount === 0) {
        return "At least one test must be selected";
      }

      if (state.testSelection.ctGc && !state.testSelection.ctGcSampleType) {
        return "Sample type for CT/GC must be specified";
      }

      if (state.testSelection.hiv && !state.testSelection.hivTestType) {
        return "HIV test type must be specified";
      }

      return null;

    case 5: // Counselling
      if (
        !state.counselling.windowPeriods ||
        !state.counselling.partnerNotification ||
        !state.counselling.safeSex ||
        !state.counselling.resultsTimeline ||
        !state.counselling.positiveTestMeaning ||
        !state.counselling.followUp
      ) {
        return "All counselling points must be covered";
      }
      return null;

    case 6: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
