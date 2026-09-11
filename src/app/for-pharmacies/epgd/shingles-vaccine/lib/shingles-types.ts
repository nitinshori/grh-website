import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// Aligned to the Shingrix PGD version 005, issued 11 September 2026.

export interface ShinglesAssessment {
  /** Aged 50 or older and eligible under national immunisation guidelines (PGD v005 inclusion). */
  ageEligible: boolean;
  immunosuppressed: boolean;
  anaphylaxisToComponent: boolean;
  severeAcuteIllness: boolean;
  /** "not-pregnant" | "unknown" | "confirmed" | "breastfeeding". Pregnancy or breastfeeding is an exclusion. */
  pregnancyStatus: string;
  /** Dose 1 of Shingrix already given (here or elsewhere). */
  previousShingrix: boolean;
  /** Date of dose 1, required when dose 2 is being given (PGD v005 inclusion: record the date of dose 1). */
  previousShingrixDate: string;
  /** Exclusion: has already completed the two-dose course. */
  completedCourse: boolean;
  /** Previous Zostavax is not an exclusion (PGD v005); recorded for the vaccine history. */
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
}

export interface ShinglesCounselling {
  explainedDoseSchedule: boolean;
  explainedLocalReactions: boolean;
  /** PGD v005 caution: systemic side effects are common and generally self-limiting. */
  explainedSystemicReactions: boolean;
  explainedEffectiveness: boolean;
  explainedNotLiveVaccine: boolean;
  offeredWrittenInfo: boolean;
  /** PGD v005 follow-up advice given. */
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
  | { type: "UPDATE_SUPPLY"; field: keyof ShinglesSupply; value: string }
  | { type: "UPDATE_COUNSELLING"; field: keyof ShinglesCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Eligibility Assessment",
  "Contraindications",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
  "Consultation Complete",
  "Review",
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
      anaphylaxisToComponent: false,
      severeAcuteIllness: false,
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
