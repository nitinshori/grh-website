import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface ShinglesAssessment {
  ageEligible: boolean;
  immunosuppressed: boolean;
  anaphylaxisToComponent: boolean;
  severeAcuteIllness: boolean;
  pregnancyStatus: string;
  previousShingrix: boolean;
  previousShinglesHistory: boolean;
}

export interface ShinglesCounselling {
  explainedDoseSchedule: boolean;
  explainedLocalReactions: boolean;
  explainedEffectiveness: boolean;
  explainedNotLiveVaccine: boolean;
  offeredWrittenInfo: boolean;
}

export interface ShinglesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ShinglesAssessment;
  counselling: ShinglesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type ShinglesAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_ASSESSMENT"; field: keyof ShinglesAssessment; value: string | boolean }
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
      previousShinglesHistory: false,
    },
    counselling: {
      explainedDoseSchedule: false,
      explainedLocalReactions: false,
      explainedEffectiveness: false,
      explainedNotLiveVaccine: false,
      offeredWrittenInfo: false,
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
