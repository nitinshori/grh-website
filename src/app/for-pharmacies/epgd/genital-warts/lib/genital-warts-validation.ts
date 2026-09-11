import type { GenitalWartsConsultationState } from "./genital-warts-types";
import { MAX_SUPPLIES, REVIEW_INTERVAL_DAYS, addDays } from "./genital-warts-types";

/**
 * Per-step validation. Returns the message to show, or null when the step is
 * complete. Indexed by step number so a rule can only block the step it
 * belongs to. Hard stops are enforced separately by the client on every step
 * (canProceed = !validationError && !hasStops), so this file only checks that
 * the step's own fields are complete.
 */
export function validateStep(
  step: number,
  state: GenitalWartsConsultationState,
): string | null {
  const { patient, consent, assessment, treatment, counselling } = state;

  switch (step) {
    // Patient details. Both PGDs: adults aged 18 years and over.
    case 0:
      if (!patient.firstName.trim()) return "Patient first name is required";
      if (!patient.lastName.trim()) return "Patient last name is required";
      if (!patient.dateOfBirth) return "Date of birth is required";
      if (patient.age === null) return "Date of birth is not valid";
      if (patient.age < 18) return "Both PGDs cover adults aged 18 and over";
      return null;

    // Consent
    case 1:
      if (!consent.informedConsentGiven) return "Informed consent must be obtained before proceeding";
      if (!consent.idVerified) return "ID verification is required";
      if (!consent.patientAwarePrivateService) return "Patient must be aware this is a private service";
      return null;

    // Wart assessment
    case 2:
      if (!assessment.externalWartsConfirmed) return "Confirm visible external genital warts on examination (PGD inclusion)";
      if (assessment.wartCount === null || assessment.wartCount < 1) return "Record the number of warts (at least 1)";
      if (assessment.treatmentAreaCm2 === null || assessment.treatmentAreaCm2 <= 0) return "Record the total treatment area in cm2 (greater than 0)";
      if (!assessment.ableToSelfApply) return "Confirm the patient can identify the warts and apply treatment to the warts only";
      if (!assessment.sexualHistoryTaken) return "Record that a sexual history was taken";
      if (!assessment.stiScreeningOffered) return "Record that full STI screening was offered or signposted";
      return null;

    // Eligibility
    case 3:
      if (!assessment.pregnancyStatus) return "Record pregnancy status";
      return null;

    // Treatment choice and plan
    case 4: {
      if (!treatment.agent) return "Select the agent supplied";
      if (treatment.agent === "podophyllotoxin" && !treatment.podophyllotoxinForm) return "Select the podophyllotoxin form (solution or cream)";
      if (!treatment.brand.trim()) return "Record the brand supplied";
      if (treatment.supplyNumber === null || treatment.supplyNumber < 1)
        return treatment.agent === "podophyllotoxin"
          ? "Record which treatment cycle this supply is for (1 to 4)"
          : "Record which dispensing this is in the course (1 to 4; 12 sachets each)";
      if (treatment.supplyNumber > MAX_SUPPLIES[treatment.agent])
        return treatment.agent === "podophyllotoxin"
          ? "The PGD authorises a maximum of 4 podophyllotoxin cycles"
          : "The PGD authorises a maximum of 16 weeks (4 dispensings) of imiquimod";
      if (treatment.supplyNumber >= 3 && !treatment.priorReviewOutcome)
        return treatment.agent === "podophyllotoxin"
          ? "Record the outcome of the review after 2 cycles before supplying a third cycle"
          : "Record the outcome of the 8-week review before the third dispensing";
      if (!treatment.quantitySupplied.trim()) return "Quantity is set by the PGD for the agent and form chosen";
      if (!treatment.batchNumber.trim()) return "Record the batch number";
      if (!treatment.expiryDate) return "Record the expiry date";
      if (!treatment.reviewDate) return "Record the review date";
      const consultationDate = state.summary.consultationDate;
      const latest = addDays(consultationDate, REVIEW_INTERVAL_DAYS[treatment.agent]);
      if (treatment.reviewDate <= consultationDate) return "The review date must be after today's consultation";
      if (latest && treatment.reviewDate > latest)
        return treatment.agent === "podophyllotoxin"
          ? `The PGD reviews podophyllotoxin after 2 cycles: the review date must be on or before ${latest}`
          : `The PGD reviews imiquimod at 8 weeks: the review date must be on or before ${latest}`;
      return null;
    }

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
        counselling.hpvVaccinationDiscussed &&
        counselling.yellowCardExplained &&
        counselling.pilSupplied &&
        counselling.safetyNettingGiven &&
        counselling.followUpAndScreeningAdvised;
      if (!core) return "Confirm every counselling point in the PGD has been covered (including HPV vaccination)";

      if (treatment.agent === "podophyllotoxin") {
        if (!counselling.contraceptionCounselled) return "Podophyllotoxin: teratogenicity and contraception must be counselled";
        if (treatment.podophyllotoxinForm === "solution" && !counselling.flammabilityWarningGiven)
          return "Podophyllotoxin solution: the flammability warning must be given";
      }

      if (treatment.agent === "imiquimod" && !counselling.condomWeakeningExplained)
        return "Imiquimod: explain that it weakens condoms and diaphragms";

      return null;
    }

    // Pharmacist summary
    case 6:
      if (!state.summary.pharmacistName.trim()) return "Pharmacist name is required";
      if (!state.summary.pharmacistGPhC.trim()) return "GPhC registration number is required";
      return null;

    // Complete: the same rules apply to Save & Print as to the summary step.
    case 7:
      if (!state.summary.pharmacistName.trim()) return "Pharmacist name is required";
      if (!state.summary.pharmacistGPhC.trim()) return "GPhC registration number is required";
      return null;

    default:
      return null;
  }
}
