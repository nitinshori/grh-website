import type { EczemaConsultationState } from "./eczema-types";
import { QUANTITY_BY_AREA } from "./eczema-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { requiredArm } from "./eczema-clinical-logic";

export function validateStep(stepIndex: number, state: EczemaConsultationState): string | null {
  const age = state.patient.age;
  const a = state.assessment;
  const mh = state.medicalHistory;
  const ms = state.medicineSelection;
  const c = state.counselling;
  const thinSkin = a.thinSkinSite || state.contraindications.faceOrGroin;

  switch (stepIndex) {
    case 0:
      // Eczema and Dermatitis PGD v005: 12 years and over.
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: {
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (age !== null && age < 16) {
        if (!state.consent.consentBasis)
          return "Patient is under 16: record whether consent came from a person with parental responsibility or from the young person assessed as Gillick competent";
        if (!state.consent.consentBasisNotes.trim()) return "Record the basis of consent";
      }
      return null;
    }

    case 2:
      if (!a.severity) return "Please grade severity as mild or moderate against the document definitions";
      if (
        !a.isDry &&
        !a.isRed &&
        !a.isThickened &&
        !a.isCracked &&
        !a.isOozing
      ) {
        return "Please select at least one eczema manifestation";
      }
      if (!a.affectedSite.trim()) return "Please describe the site treated";
      if (!a.treatedArea) return "Please record the treated area in adult palms (it decides the quantity)";
      return null;

    case 3:
      if (!mh.allergies.trim()) return "Please record allergy status";
      if (!mh.coursesLast12Months) return "Record how many courses the patient has had in the last 12 months";
      return null;

    case 4:
      return null;

    case 5: {
      if (!ms.emollientFirst) return "Please confirm emollient as the base of treatment";
      if (!ms.steroidChoice) return "Please select the corticosteroid arm";
      const arm = requiredArm(state);
      if (arm && ms.steroidChoice !== arm)
        return arm === "clobetasone"
          ? "This presentation is Arm 1: clobetasone butyrate 0.05%"
          : "Moderate disease on the trunk or limbs is Arm 2: betamethasone valerate 0.1%";
      if (!ms.formulation) return "Please select cream or ointment";
      if (!ms.quantitySupplied) return "Please select the quantity supplied (sized to the treated area)";
      if (a.treatedArea && a.treatedArea !== "over-10-palms" && ms.quantitySupplied !== QUANTITY_BY_AREA[a.treatedArea])
        return `The document quantity for this treated area is ${QUANTITY_BY_AREA[a.treatedArea]}`;
      if (!ms.batchNumber.trim()) return "Please record the batch number";
      if (!ms.expiryDate.trim()) return "Please record the expiry date";
      return null;
    }

    case 6:
      if (!c.applyThinly) return "Confirm: steroid first, thin layer, wait at least 30 minutes, then emollient";
      if (!c.fingertipUnits) return "Confirm the fingertip unit was shown on the patient's own finger";
      if (!c.emollientFirst) return "Confirm the emollient every day advice";
      if (!c.fireRiskExplained) return "Confirm the fire risk from emollients was explained (must be recorded)";
      if (thinSkin && !c.sevenDayCapExplained) return "Face, flexures or genital skin: confirm the 7 day cap was explained";
      if (ms.steroidChoice === "betamethasone" && !c.notOnFaceAdvice)
        return "Betamethasone: confirm the patient was told not to use it on the face, eyelids, skin folds or genital skin";
      if (ms.steroidChoice === "betamethasone" && !c.stepDownApproach)
        return "Betamethasone: confirm the step-down advice";
      if (!c.followUpAdvice) return "Confirm the 7 day review and warning-sign advice";
      if (!c.urgentHelpAdvice) return "Confirm the urgent help advice (rapidly painful, clustered blisters, punched-out sores, unwell)";
      if (!c.avoidTriggers) return "Confirm trigger avoidance advice";
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
