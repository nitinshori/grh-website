import type { EczemaConsultationState } from "./eczema-types";
import { QUANTITY_BY_AREA } from "./eczema-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { requiredArm } from "./eczema-clinical-logic";

/** The secondary-infection panel: the management answer, then the concurrent supply record where chosen. */
function concurrentInfectionError(state: EczemaConsultationState): string | null {
  const ci = state.contraindications;
  const signs = ci.bacterialInfection || state.assessment.isOozing;
  if (!signs) return null;
  if (!ci.infectionManagement)
    return "Answer 'Secondary bacterial infection: how is it managed?' (mild and localised, treated concurrently under the Skin and Soft Tissue Infection PGD; or refer)";
  if (ci.infectionManagement === "concurrent") {
    if (!ci.concurrentInfectionMildLocalised) return "Tick 'The infection is MILD and LOCALISED' in the Secondary bacterial infection panel";
    if (!ci.concurrentAntibioticSupplied) return "Tick 'Concurrent supply: an oral antibiotic is supplied at this consultation' in the Secondary bacterial infection panel";
    if (!ci.concurrentAntibioticName.trim()) return "Complete 'Antibiotic supplied (name and strength)' in the Secondary bacterial infection panel";
    if (!ci.concurrentAntibioticDose.trim()) return "Complete 'Dose and duration' of the concurrent antibiotic";
    if (!ci.concurrentAntibioticQuantity.trim()) return "Complete 'Quantity' of the concurrent antibiotic";
    if (!ci.concurrentAntibioticBatch.trim()) return "Complete 'Batch number' of the concurrent antibiotic";
    if (!ci.concurrentAntibioticExpiry.trim()) return "Complete 'Expiry date' of the concurrent antibiotic";
  }
  return null;
}

export function validateStep(stepIndex: number, state: EczemaConsultationState): string | null {
  const age = state.patient.age;
  const a = state.assessment;
  const mh = state.medicalHistory;
  const ms = state.medicineSelection;
  const c = state.counselling;
  const thinSkin = a.thinSkinSite;

  switch (stepIndex) {
    case 0:
      // Eczema and Dermatitis PGD v006: 12 years and over.
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: {
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (age !== null && age < 16) {
        if (!state.consent.consentBasis)
          return "Patient is under 16: select who consented under 'Consent given by' (a person with parental responsibility, or the young person assessed as Gillick competent)";
        if (!state.consent.consentBasisNotes.trim()) return "Patient is under 16: complete 'Basis recorded'";
      }
      return null;
    }

    case 2:
      if (!a.severity) return "Select the 'Eczema Severity' (mild or moderate against the document definitions)";
      if (
        !a.isDry &&
        !a.isRed &&
        !a.isThickened &&
        !a.isCracked &&
        !a.isOozing
      ) {
        return "Tick at least one box under 'Eczema Manifestations'";
      }
      if (a.sites.length === 0) return "Tick at least one box under 'Sites treated' (severity and site together decide the arm)";
      if (a.sites.includes("other") && !a.affectedSite.trim()) return "'Other' is ticked under Sites treated: complete 'Site detail'";
      if (!a.treatedArea) return "Select the 'Treated area, in adult palms' (it decides the quantity)";
      return concurrentInfectionError(state);

    case 3:
      if (!mh.allergies.trim()) return "Complete 'Allergies/Sensitivities' (write NKDA if none known)";
      if (!mh.coursesLast12Months) return "Select 'Courses of topical corticosteroid supplied in the last 12 months'";
      if (mh.coursesLast12Months === "3-or-more" && !mh.gpReviewSinceLastCourse)
        return "Answer 'Has the GP reviewed the patient since the last course?': Yes or No";
      if (mh.lastCourseEndDate && new Date(mh.lastCourseEndDate).getTime() > Date.now()) return "'Date the last course ended' is in the future";
      return null;

    case 4:
      return concurrentInfectionError(state);

    case 5: {
      if (!ms.emollientFirst) return "Tick 'Emollient confirmed as the base of treatment'";
      if (!ms.steroidChoice) return "Select the 'Corticosteroid arm'";
      const arm = requiredArm(state);
      if (arm && ms.steroidChoice !== arm)
        return arm === "clobetasone"
          ? "This presentation is Arm 1: clobetasone butyrate 0.05%"
          : "Moderate disease on the trunk or limbs is Arm 2: betamethasone valerate 0.1%";
      if (!ms.formulation) return "Select the 'Formulation' (cream or ointment)";
      if (!ms.quantitySupplied) return "Select the 'Quantity supplied' (sized to the treated area)";
      if (a.treatedArea && a.treatedArea !== "over-10-palms" && ms.quantitySupplied !== QUANTITY_BY_AREA[a.treatedArea])
        return `The document quantity for this treated area is ${QUANTITY_BY_AREA[a.treatedArea]}`;
      if (!ms.batchNumber.trim()) return "Complete 'Batch number'";
      if (!ms.expiryDate.trim()) return "Complete 'Expiry date'";
      return null;
    }

    case 6:
      // Each message quotes the opening words of the checkbox it refers to.
      if (!c.applyThinly) return "Tick 'Apply the steroid FIRST, in a thin layer' once given";
      if (!c.fingertipUnits) return "Tick 'Fingertip unit shown on the patient's own finger' once done";
      if (!c.emollientFirst) return "Tick 'Keep using the emollient every day' once given";
      if (!c.fireRiskExplained) return "Tick 'FIRE RISK FROM EMOLLIENTS explained' once given (must be recorded)";
      if (thinSkin && !c.sevenDayCapExplained) return "Face, flexures or genital skin: tick 'On the face, in skin folds or on genital skin, use this for no more than 7 days' once given";
      if (ms.steroidChoice === "betamethasone" && !c.notOnFaceAdvice)
        return "Betamethasone: tick 'Do NOT use this on the face, eyelids, skin folds or genital skin' once given";
      if (ms.steroidChoice === "betamethasone" && !c.stepDownApproach)
        return "Betamethasone: tick 'Step down to a moderate potency once the flare settles' once given";
      if (!c.followUpAdvice) return "Tick 'Come back or see your GP if it is no better after 7 days' once given";
      if (!c.urgentHelpAdvice) return "Tick 'Seek urgent help if the rash becomes rapidly painful' once given";
      if (!c.avoidTriggers) return "Tick 'Avoid known triggers' once given";
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
