import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface SmokingNRTPatientDetails extends BasePatientDetails {}

export interface SmokingNRTConsent extends BaseConsent {}

export interface SmokingAssessment {
  cigarettesPerDay: number | null;
  timeToFirstCigarette: string;
  currentlySmokes: boolean;
  quitDate: string;
}

export interface SmokingMedicalHistory {
  recentMI: boolean;
  recentStroke: boolean;
  unstableAngina: boolean;
  cardiovascularDisease: boolean;
  diabetes: boolean;
  pheochromocytoma: boolean;
}

export interface SmokingContraindications {
  childUnder12: boolean;
  recentCardiacEvent: boolean;
  pheochromocytoma: boolean;
}

export interface SmokingNRTSelection {
  usePatches: boolean;
  patchStrength: string;
  useOralForm: boolean;
  oralFormType: string;
  combinationTherapy: boolean;
  behavioralSupport: boolean;
}

export interface SmokingCounselling {
  combinationBetter: boolean;
  quitDate: boolean;
  behavioralSupport: boolean;
  sideEffects: boolean;
  courseDuration: boolean;
}

export interface SmokingConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface SmokingNRTConsultationState {
  patient: SmokingNRTPatientDetails;
  consent: SmokingNRTConsent;
  assessment: SmokingAssessment;
  medicalHistory: SmokingMedicalHistory;
  contraindications: SmokingContraindications;
  nrtSelection: SmokingNRTSelection;
  counselling: SmokingCounselling;
  summary: SmokingConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type SmokingNRTAction =
  | { type: "UPDATE_PATIENT"; field: keyof SmokingNRTPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof SmokingNRTConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SmokingAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof SmokingMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof SmokingContraindications; value: any }
  | { type: "UPDATE_NRT_SELECTION"; field: keyof SmokingNRTSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof SmokingCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof SmokingConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Smoking Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "NRT Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): SmokingNRTConsultationState {
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
      cigarettesPerDay: null,
      timeToFirstCigarette: "",
      currentlySmokes: true,
      quitDate: "",
    },
    medicalHistory: {
      recentMI: false,
      recentStroke: false,
      unstableAngina: false,
      cardiovascularDisease: false,
      diabetes: false,
      pheochromocytoma: false,
    },
    contraindications: {
      childUnder12: false,
      recentCardiacEvent: false,
      pheochromocytoma: false,
    },
    nrtSelection: {
      usePatches: false,
      patchStrength: "",
      useOralForm: false,
      oralFormType: "",
      combinationTherapy: false,
      behavioralSupport: false,
    },
    counselling: {
      combinationBetter: false,
      quitDate: false,
      behavioralSupport: false,
      sideEffects: false,
      courseDuration: false,
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
      medicineRecommended: "",
      counsellingPoints: [],
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
