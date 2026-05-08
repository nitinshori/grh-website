import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface CovidBoosterAssessment {
  adultConfirmed: boolean;
  previousCovidVaccine: boolean;
  timelinessEligible: boolean;
  anaphylaxisToPreviousDose: boolean;
  anaphylaxisToPEG: boolean;
  anaphylaxisToPolysorbate: boolean;
  severeFebrilIllness: boolean;
  onAnticoagulants: boolean;
  myocarditisHistory: boolean;
}

export interface CovidBoosterCounselling {
  explainedBoosterRationale: boolean;
  discussedCommonReactions: boolean;
  explainedObservationPeriod: boolean;
  discussedSeriousReactions: boolean;
  providedWrittenInfo: boolean;
}

export interface CovidBoosterConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: CovidBoosterAssessment;
  counselling: CovidBoosterCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type CovidBoosterAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean }
  | { type: "UPDATE_ASSESSMENT"; field: keyof CovidBoosterAssessment; value: boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof CovidBoosterCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Vaccine Eligibility",
  "Allergy & Red Flags",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
  "Consultation Complete",
  "Review",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): CovidBoosterConsultationState {
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
      adultConfirmed: false,
      previousCovidVaccine: false,
      timelinessEligible: false,
      anaphylaxisToPreviousDose: false,
      anaphylaxisToPEG: false,
      anaphylaxisToPolysorbate: false,
      severeFebrilIllness: false,
      onAnticoagulants: false,
      myocarditisHistory: false,
    },
    counselling: {
      explainedBoosterRationale: false,
      discussedCommonReactions: false,
      explainedObservationPeriod: false,
      discussedSeriousReactions: false,
      providedWrittenInfo: false,
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
