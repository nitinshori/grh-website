// ─── Postnatal Contraception Validation ───

import type { PostnatalContraceptionState } from "./postnatal-contraception-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { getMedicineSupplyError, isBreastfeeding } from "./postnatal-contraception-clinical-logic";

export function validateStep(step: number, state: PostnatalContraceptionState): string | null {
  switch (step) {
    case 0: // Patient Details. PGD v005: women 16 and over (Depo-Provera 18 and over, gated at supply)
      return validatePatientStep(state.patient, { minAge: 16 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Postnatal Assessment
      if (!state.assessment.deliveryDate) {
        return "Delivery date is required";
      }
      if (state.assessment.daysPostpartum === null || state.assessment.daysPostpartum < 0) {
        return "The delivery date is in the future; check and correct it";
      }
      if (!state.assessment.deliveryType) {
        return "Delivery type must be specified";
      }
      if (!state.assessment.breastfeedingStatus) {
        return "Breastfeeding status must be specified";
      }
      if (state.assessment.daysPostpartum > 21 && state.assessment.unprotectedSexSinceDay21 === null) {
        return "Answer whether there has been unprotected intercourse since day 21 (required from day 21)";
      }
      return null;

    case 3: // Medical History
      if (!state.medicalHistory.exclusionsAsked) {
        return "Confirm that every exclusion and caution above was asked and the answers recorded";
      }
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: // Medicine Supply
      return getMedicineSupplyError(state);

    case 6: {
      // Counselling: PGD follow-up advice rows
      const c = state.counselling;
      const choice = state.medicineSupply.medicineChoice;
      if (!c.breakThroughBleedingAdvice) return "Explain that irregular bleeding is common, particularly in the first few months";
      if (isBreastfeeding(state) && !c.breastfeedingCompatibilityAdvice) return "Confirm the method is safe during breastfeeding";
      if (!c.dvtPeAdvice) return "Advise immediate medical attention for DVT/PE symptoms (calf pain, swelling, breathlessness)";
      if (!c.unexpectedBleedingAdvice) return "Advise the patient to report any unexpected vaginal bleeding";
      if (!c.sideEffectsExplained) return "Explain side effects and when to seek medical advice";
      if (choice === "desogestrel") {
        if (!c.dailyTakingAdvice) return "Advise taking the tablet at the same time each day";
        if (
          state.assessment.daysPostpartum !== null &&
          state.assessment.daysPostpartum > 21 &&
          !c.extraPrecautionsAdvice
        ) {
          return "Started after day 21: advise a barrier method for 2 days (FSRH; the SmPC states 7 days)";
        }
      }
      if (choice === "depo-provera") {
        if (!c.depoFertilityAdvice) return "Explain that fertility may take 5 to 6 months to return after the last injection";
        if (!c.depoRepeatAdvice) return "Advise return for repeat injection every 12 weeks";
      }
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
