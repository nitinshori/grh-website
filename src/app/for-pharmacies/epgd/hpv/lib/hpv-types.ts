import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface HPVPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface HPVVaccineAssessment {
  ageCriteriaMet: boolean;
  pregnancyStatus: string;
  currentFebrileIllness: boolean;
  previousGardasilDose: boolean;
  anaphylaxisToYeast: boolean;
  anaphylaxisToPreviousDose: boolean;
}

export interface HPVCounselling {
  explainedDoseSchedule: boolean;
  explainedProtection: boolean;
  discussedCommonReactions: boolean;
  explainedNotTreatment: boolean;
  offeredWrittenInfo: boolean;
}

export interface HPVConsultationState {
  patient: HPVPatientDetails;
  consent: BaseConsent;
  assessment: HPVVaccineAssessment;
  counselling: HPVCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type HPVAction =
  | { type: "UPDATE_PATIENT"; field: keyof HPVPatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_ASSESSMENT"; field: keyof HPVVaccineAssessment; value: string | boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof HPVCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Vaccine Assessment",
  "Red Flags & Exclusions",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
  "Consultation Complete",
  "Review",
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
      femaleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      ageCriteriaMet: false,
      pregnancyStatus: "",
      currentFebrileIllness: false,
      previousGardasilDose: false,
      anaphylaxisToYeast: false,
      anaphylaxisToPreviousDose: false,
    },
    counselling: {
      explainedDoseSchedule: false,
      explainedProtection: false,
      discussedCommonReactions: false,
      explainedNotTreatment: false,
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
