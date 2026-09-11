import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// Aligned to the Shingrix PGD version 006, issued 11 September 2026.

export interface ShinglesAssessment {
  /** Aged 50 or older and eligible under national immunisation guidelines (PGD v006 inclusion). */
  ageEligible: boolean;
  immunosuppressed: boolean;
  /** Exclusion. Tri-state so the step cannot be passed without an explicit answer: "" (unanswered), "yes", "no". */
  anaphylaxisToComponent: "" | "yes" | "no";
  /** Defer in acute illness with fever. Tri-state, as above. */
  severeAcuteIllness: "" | "yes" | "no";
  /** "not-pregnant" | "unknown" | "confirmed" | "breastfeeding". Pregnancy or breastfeeding is an exclusion; unknown is a stop until established. */
  pregnancyStatus: string;
  /** Dose 1 of Shingrix already given (here or elsewhere). */
  previousShingrix: boolean;
  /** Date of dose 1, required when dose 2 is being given (PGD v006 inclusion: record the date of dose 1). */
  previousShingrixDate: string;
  /** Exclusion: has already completed the two-dose course. */
  completedCourse: boolean;
  /** Previous Zostavax is not an exclusion (PGD v006); recorded for the vaccine history. */
  previousZostavax: boolean;
  /** Inclusion: no history of shingles in the past 12 months. Ticked means shingles within 12 months. */
  previousShinglesHistory: boolean;
  /** Caution: allow appropriate spacing from other vaccines (COVID-19, influenza) based on clinical judgement. */
  recentOtherVaccine: boolean;
}

export interface ShinglesSupply {
  doseNumber: "" | "1" | "2";
  vaccinationDate: string;
  batchNumber: string;
  expiryDate: string;
  site: "" | "left-deltoid" | "right-deltoid";
  /** Date the second dose is due (2 to 6 months after dose 1). */
  nextDoseDue: string;
  /** Safety block: record that the 15 minute observation period was completed. */
  observedFifteenMinutes: boolean;
  /** Records row: details of any adverse drug reactions and actions taken. */
  adverseReaction: string;
  adverseReactionAction: string;
  yellowCardSubmitted: boolean;
}

export interface ShinglesCounselling {
  explainedDoseSchedule: boolean;
  explainedLocalReactions: boolean;
  /** PGD v006 caution: systemic side effects are common and generally self-limiting. */
  explainedSystemicReactions: boolean;
  explainedEffectiveness: boolean;
  explainedNotLiveVaccine: boolean;
  offeredWrittenInfo: boolean;
  /** PGD v006 follow-up advice given. */
  followUpAdviceGiven: boolean;
}

export interface ShinglesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ShinglesAssessment;
  supply: ShinglesSupply;
  counselling: ShinglesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type ShinglesAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_ASSESSMENT"; field: keyof ShinglesAssessment; value: string | boolean }
  | { type: "UPDATE_SUPPLY"; field: keyof ShinglesSupply; value: string | boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof ShinglesCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// Consent is taken before the vaccine is drawn up: the PGD lists informed
// consent as an inclusion criterion (adversarial review, 11 Sep 2026).
export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Eligibility Assessment",
  "Contraindications",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): ShinglesConsultationState {
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
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      ageEligible: false,
      immunosuppressed: false,
      anaphylaxisToComponent: "",
      severeAcuteIllness: "",
      pregnancyStatus: "",
      previousShingrix: false,
      previousShingrixDate: "",
      completedCourse: false,
      previousZostavax: false,
      previousShinglesHistory: false,
      recentOtherVaccine: false,
    },
    supply: {
      doseNumber: "",
      vaccinationDate: new Date().toISOString().split("T")[0],
      batchNumber: "",
      expiryDate: "",
      site: "",
      nextDoseDue: "",
      observedFifteenMinutes: false,
      adverseReaction: "",
      adverseReactionAction: "",
      yellowCardSubmitted: false,
    },
    counselling: {
      explainedDoseSchedule: false,
      explainedLocalReactions: false,
      explainedSystemicReactions: false,
      explainedEffectiveness: false,
      explainedNotLiveVaccine: false,
      offeredWrittenInfo: false,
      followUpAdviceGiven: false,
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
