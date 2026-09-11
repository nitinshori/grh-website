import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: SmokingNRTConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      // PGD v002: adults aged 18 years and over.
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (state.assessment.cigarettesPerDay === null) return "Please enter cigarettes per day";
      if (!state.assessment.timeToFirstCigarette) return "Please select time to first cigarette";
      if (!state.assessment.quitDate) return "Please set a quit date";
      if (!state.assessment.motivated) return "The PGD requires the patient to be motivated to quit smoking and to have set a quit date";
      return null;

    case 3:
      return null;

    case 4:
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
        if (!sel.patchStrength) return "Please select the patch strength";
        if (sel.patchQuantity === null || sel.patchQuantity < 1) return "Please enter the number of patches supplied";
        if (sel.patchQuantity > 28) return "Maximum 28 patches (4-week supply) under this PGD";
      }
      if (sel.useOralForm) {
        if (!sel.oralFormType) return "Please select gum or lozenge";
        if (!sel.oralStrength) return "Please select the oral product strength (2mg or 4mg)";
        if (sel.oralQuantity === null || sel.oralQuantity < 1) return "Please enter the number of pieces supplied";
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
