import type { GenitalWartsConsultationState } from "./genital-warts-types";
import { hasHardStops } from "./genital-warts-clinical-logic";

/**
 * Per-step validation.
 *
 * Indexed by step number rather than evaluated globally, so a rule can only
 * ever block the step it belongs to. That is what stops an unmet condition on
 * a later step from disabling Next before the pharmacist has reached it.
 */
export function validateStep(
  step: number,
  state: GenitalWartsConsultationState,
): boolean {
  const { patient, consent, assessment, treatment, counselling } = state;

  switch (step) {
    // Patient details
    case 0:
      return Boolean(
        patient.firstName.trim() &&
          patient.lastName.trim() &&
          patient.dateOfBirth,
      );

    // Consent
    case 1:
      return Boolean(
        consent.informedConsentGiven &&
          consent.idVerified &&
          consent.patientAwarePrivateService,
      );

    // Wart assessment
    case 2:
      return Boolean(
        assessment.externalWartsConfirmed &&
          assessment.wartCount !== null &&
          assessment.treatmentAreaCm2 !== null &&
          assessment.sexualHistoryTaken,
      );

    // Eligibility. A recorded hard exclusion blocks the consultation here,
    // which is the point at which the pharmacist has the information to know.
    case 3:
      return Boolean(assessment.pregnancyStatus) && !hasHardStops(state);

    // Treatment choice and plan
    case 4:
      return Boolean(
        treatment.agent &&
          (treatment.agent !== "podophyllotoxin" ||
            treatment.podophyllotoxinForm) &&
          treatment.batchNumber.trim() &&
          treatment.expiryDate &&
          treatment.reviewDate &&
          !hasHardStops(state),
      );

    // Counselling. Contraception and flammability are podophyllotoxin-only,
    // so they are required only when that agent has been chosen.
    case 5: {
      const core =
        counselling.applicationTechniqueExplained &&
        counselling.barrierProtectionExplained &&
        counselling.localReactionsDiscussed &&
        counselling.avoidSexualContactWhileApplied &&
        counselling.condomsCounselled &&
        counselling.partnerNotificationDiscussed &&
        counselling.completeCourseAdvised &&
        counselling.handWashingAdvised &&
        counselling.yellowCardExplained &&
        counselling.pilSupplied;

      if (treatment.agent === "podophyllotoxin") {
        return Boolean(
          core &&
            counselling.contraceptionCounselled &&
            (treatment.podophyllotoxinForm !== "solution" ||
              counselling.flammabilityWarningGiven),
        );
      }

      return Boolean(core);
    }

    // Pharmacist summary
    case 6:
      return Boolean(
        state.summary.pharmacistName.trim() &&
          state.summary.pharmacistGPhC.trim(),
      );

    // Complete
    case 7:
      return true;

    default:
      return true;
  }
}
