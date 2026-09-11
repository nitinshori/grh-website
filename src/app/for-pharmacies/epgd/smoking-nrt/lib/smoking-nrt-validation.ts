import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { startingPatchStrength, oralStrengthFor } from "./smoking-nrt-clinical-logic";

export function validateStep(stepIndex: number, state: SmokingNRTConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      // PGD v002: adults aged 18 years and over.
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      return validateConsentStep(state.consent);

    case 2: {
      const cigs = state.assessment.cigarettesPerDay;
      if (cigs === null) return "Please enter cigarettes per day";
      if (cigs < 1) return "Non-smokers are excluded under this PGD: record at least 1 cigarette a day, or tick the exclusion and advise on alternatives";
      if (!state.assessment.timeToFirstCigarette) return "Please select time to first cigarette";
      if (!state.assessment.quitDate) return "Please set a quit date";
      const qd = new Date(state.assessment.quitDate);
      const today = new Date(new Date().toISOString().split("T")[0]);
      if (isNaN(qd.getTime())) return "Enter a valid quit date";
      if (qd.getTime() < today.getTime()) return "The quit date must be today or later";
      if (!state.assessment.motivated) return "The PGD requires the patient to be motivated to quit smoking and to have set a quit date";
      return null;
    }

    case 3:
      return null;

    case 4:
      if (!state.medicalHistory.currentMedications.trim())
        return "Record the patient's current medicines and doses (enter 'none' if nothing)";
      return null;

    case 5:
      return null;

    case 6: {
      const sel = state.nrtSelection;
      if (!sel.usePatches && !sel.useOralForm) {
        return "Please select at least one form of NRT";
      }
      if (sel.usePatches) {
        if (state.contraindications.generalisedSkinDisorder) {
          return "Generalised skin disorder that may affect absorption excludes nicotine patches. Select oral products only, or refer";
        }
        if (!sel.patchStage) return "Select whether this is the starting patch or a step-down supply";
        if (!sel.patchStrength) return "Please select the patch strength";
        // The document ties strength to consumption. The option labels used
        // to say so while any strength could be picked for any patient
        // (adversarial review, 11 Sep 2026).
        const start = startingPatchStrength(state.assessment.cigarettesPerDay);
        if (sel.patchStage === "start" && start && sel.patchStrength !== start) {
          return `The PGD starts a patient smoking ${state.assessment.cigarettesPerDay} a day on the ${start} patch (21mg for more than 10 a day; 14mg for 10 or fewer)`;
        }
        if (sel.patchStage === "stepdown" && sel.patchStrength === "21mg") {
          return "21mg is the starting strength for heavier smokers, not a step-down strength (14mg then 7mg)";
        }
        if (!sel.patchBrand.trim()) return "Record the brand of 24-hour patch supplied (PGD record: name and brand of medication)";
        if (/invisi|16[- ]?h/i.test(sel.patchBrand)) return "Nicorette Invisi and other 16-hour patches are not the product authorised by this PGD (24-hour patches 7mg, 14mg, 21mg, e.g. NiQuitin Clear)";
        if (sel.patchQuantity === null || sel.patchQuantity < 1) return "Please enter the number of patches supplied";
        if (!Number.isInteger(sel.patchQuantity)) return "Number of patches must be a whole number";
        if (sel.patchQuantity > 28) return "Maximum 28 patches (4-week supply) under this PGD";
      }
      if (sel.useOralForm) {
        if (!sel.oralFormType) return "Please select gum or lozenge";
        if (!sel.oralStrength) return "Please select the oral product strength (2mg or 4mg)";
        const oral = oralStrengthFor(state.assessment.cigarettesPerDay);
        if (oral && sel.oralStrength !== oral) {
          return `The PGD directs the ${oral} lozenge or gum for a patient smoking ${state.assessment.cigarettesPerDay} a day (2mg for 20 or fewer; 4mg for more than 20)`;
        }
        if (!sel.oralBrand.trim()) return "Record the brand of gum or lozenge supplied (PGD record: name and brand of medication)";
        if (sel.oralQuantity === null || sel.oralQuantity < 1) return "Please enter the number of pieces supplied";
        if (!Number.isInteger(sel.oralQuantity)) return "Number of pieces must be a whole number";
        if (sel.oralQuantity > 120) return "Maximum 120 pieces (up to 4-week supply) under this PGD";
      }
      if (!sel.behavioralSupport) {
        return "Please confirm behavioural support arranged";
      }
      return null;
    }

    case 7: {
      const c = state.counselling;
      if (
        !c.combinationBetter ||
        !c.quitDate ||
        !c.behavioralSupport ||
        !c.sideEffects ||
        !c.courseDuration ||
        !c.correctTechnique ||
        !c.useEnough ||
        !c.doNotSmoke ||
        !c.withdrawalSymptoms ||
        !c.drivingWarning ||
        !c.cardiovascularSymptoms ||
        !c.reportReactions ||
        !c.pregnancyAdvice ||
        !c.followUpSchedule
      ) {
        return "Please confirm all counselling points have been covered";
      }
      return null;
    }

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
