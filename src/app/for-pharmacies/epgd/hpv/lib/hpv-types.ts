import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─────────────────────────────────────────────────────────────────────────
// HPV consultation state.
//
// Rebuilt 8 Sep 2026 alongside PGD v002. Version 001 of this tool:
//   - required a "patient is female" tick before it would proceed, and
//     returned no dose recommendation at all for a male patient, in a
//     service whose signed PGD names the GBMSM cohort up to 45 years;
//   - hard-stopped on yeast allergy, which Green Book chapter 18a states
//     is NOT a contraindication;
//   - recommended three doses at 0, 2 and 6 months to every patient
//     regardless of age or immune status, when national policy is a
//     single dose under 25;
//   - never asked about immunosuppression or HIV, which is the one
//     question that determines the schedule;
//   - captured no batch number, expiry, site, observation period or
//     off-label consent.
// ─────────────────────────────────────────────────────────────────────────

/** Sex recorded for the clinical record. Does not gate eligibility. */
export type HPVSex = "" | "female" | "male" | "other";

export interface HPVPatientDetails extends BasePatientDetails {
  /** Recorded for the clinical record only. Every sex is eligible. */
  sex: HPVSex;
}

export interface HPVVaccineAssessment {
  pregnancyStatus: string;
  currentFebrileIllness: boolean;
  /** Determines the schedule: three doses at 0, 1 and 4 to 6 months. Kept in step with immuneStatusAnswer. */
  immunosuppressedOrHIV: boolean;
  /**
   * The answer to "immunosuppressed, or known to be living with HIV?" as the
   * pharmacist recorded it. It was a tick box, so "not asked" and "no" were
   * the same thing (walkthrough review, 11 Sep 2026).
   */
  immuneStatusAnswer: "" | "yes" | "no";
  /** Prior HPV vaccine history. */
  priorDoses: string;
  /**
   * A single dose before the 25th birthday completes the course for an
   * immunocompetent patient only (decision 17, 11 Sep 2026). For an
   * immunosuppressed or HIV positive patient it counts as a prior dose of the
   * three dose course.
   */
  doseBefore25: boolean;
  /**
   * Exclusions asked as explicit yes/no answers. They were booleans
   * defaulting to false, rendered as pre-ticked "NOT documented" boxes, so
   * the step could be passed without reading it (adversarial review, 11 Sep 2026).
   */
  anaphylaxisToPreviousDose: "" | "yes" | "no";
  anaphylaxisToComponent: "" | "yes" | "no";
  /** Bleeding disorder / anticoagulation: technique caution, not a stop. */
  bleedingDisorderOrAnticoagulated: boolean;
  /** Immunoglobulin or blood products in the previous three months: not a contraindication, record it (PGD v006 cautions). */
  bloodProductsLast3Months: boolean;
  /** Told whether they could have this free on the NHS. */
  nhsEligibilityDiscussed: boolean;
}

export interface HPVConsent16 {
  /** Under 16 only: who gave consent. */
  basis: string;
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
  /** Off-label schedule consent, required for the 1-dose and 2-dose courses. */
  offLabelExplained: boolean;
  offLabelConsentGiven: boolean;
}

export interface HPVCounselling {
  explainedDoseSchedule: boolean;
  explainedProtection: boolean;
  discussedCommonReactions: boolean;
  explainedNotTreatment: boolean;
  explainedScreeningStillNeeded: boolean;
  offeredWrittenInfo: boolean;
}

export interface HPVAdministration {
  productName: string;
  batchNumber: string;
  expiryDate: string;
  site: string;
  /** Derived from the prior dose count (prior doses + 1), not a free choice. */
  doseNumber: string;
  /** Date of the previous dose in this course; required for dose 2 or 3 so the minimum interval can be checked. */
  previousDoseDate: string;
  nextDoseDue: string;
  /** Where another vaccine was given at the same visit, its name and site (PGD v006 records row). */
  otherVaccineSameVisit: string;
  adrenalineAvailable: boolean;
  observedFifteenMinutes: boolean;
}

export interface HPVConsultationState {
  patient: HPVPatientDetails;
  consent: BaseConsent;
  consent16: HPVConsent16;
  assessment: HPVVaccineAssessment;
  counselling: HPVCounselling;
  administration: HPVAdministration;
  summary: BaseSummary;
  currentStep: number;
}

export type HPVAction =
  | { type: "UPDATE_PATIENT"; field: keyof HPVPatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_CONSENT16"; field: keyof HPVConsent16; value: string | boolean }
  | { type: "UPDATE_ASSESSMENT"; field: keyof HPVVaccineAssessment; value: string | boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof HPVCounselling; value: boolean }
  | { type: "UPDATE_ADMINISTRATION"; field: keyof HPVAdministration; value: string | boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// General informed consent is taken on the Schedule & Consent step, before
// administration (adversarial review, 11 Sep 2026).
export const STEP_LABELS = [
  "Patient Details",
  "Vaccine Assessment",
  "Red Flags & Exclusions",
  "Schedule & Consent",
  "Counselling",
  "Administration",
  "Summary & Declaration",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HPVConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
      gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
      sex: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    consent16: {
      basis: "",
      parentName: "",
      parentRelationship: "",
      gillickBasis: "",
      offLabelExplained: false,
      offLabelConsentGiven: false,
    },
    assessment: {
      pregnancyStatus: "",
      currentFebrileIllness: false,
      immunosuppressedOrHIV: false,
      immuneStatusAnswer: "",
      priorDoses: "",
      doseBefore25: false,
      anaphylaxisToPreviousDose: "",
      anaphylaxisToComponent: "",
      bleedingDisorderOrAnticoagulated: false,
      bloodProductsLast3Months: false,
      nhsEligibilityDiscussed: false,
    },
    counselling: {
      explainedDoseSchedule: false,
      explainedProtection: false,
      discussedCommonReactions: false,
      explainedNotTreatment: false,
      explainedScreeningStillNeeded: false,
      offeredWrittenInfo: false,
    },
    administration: {
      productName: "Gardasil 9",
      batchNumber: "",
      expiryDate: "",
      site: "",
      doseNumber: "",
      previousDoseDate: "",
      nextDoseDue: "",
      otherVaccineSameVisit: "",
      adrenalineAvailable: false,
      observedFifteenMinutes: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
    currentStep: 0,
  };
}
