import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface EczemaPatientDetails extends BasePatientDetails {}

export interface EczemaConsent extends BaseConsent {}

export interface EczemaAssessment {
  severity: "mild" | "moderate" | "severe" | "";
  isDry: boolean;
  isRed: boolean;
  isThickened: boolean;
  isCracked: boolean;
  isOozing: boolean;
  affectedSite: string;
}

export interface EczemaMedicalHistory {
  previousTreatments: string;
  allergies: string;
}

export interface EczemaContraindications {
  bacterialInfection: boolean;
  viralInfection: boolean;
  faceOrGroin: boolean;
  childUnder1: boolean;
  rosaceaOrAcne: boolean;
}

export interface EczemaMedicineSelection {
  emollientFirst: boolean;
  steroidChoice: string;
  hasFungalInfection: boolean;
  addFusicidAcid: boolean;
}

export interface EczemaCounselling {
  emollientFirst: boolean;
  fingertipUnits: boolean;
  applyThinly: boolean;
  stepDownApproach: boolean;
  avoidTriggers: boolean;
}

export interface EczemaConsultationSummary extends BaseSummary {
  severity: string;
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface EczemaConsultationState {
  patient: EczemaPatientDetails;
  consent: EczemaConsent;
  assessment: EczemaAssessment;
  medicalHistory: EczemaMedicalHistory;
  contraindications: EczemaContraindications;
  medicineSelection: EczemaMedicineSelection;
  counselling: EczemaCounselling;
  summary: EczemaConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type EczemaAction =
  | { type: "UPDATE_PATIENT"; field: keyof EczemaPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof EczemaConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof EczemaAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof EczemaMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof EczemaContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof EczemaMedicineSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof EczemaCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof EczemaConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Eczema Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): EczemaConsultationState {
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
      severity: "",
      isDry: false,
      isRed: false,
      isThickened: false,
      isCracked: false,
      isOozing: false,
      affectedSite: "",
    },
    medicalHistory: {
      previousTreatments: "",
      allergies: "",
    },
    contraindications: {
      bacterialInfection: false,
      viralInfection: false,
      faceOrGroin: false,
      childUnder1: false,
      rosaceaOrAcne: false,
    },
    medicineSelection: {
      emollientFirst: false,
      steroidChoice: "",
      hasFungalInfection: false,
      addFusicidAcid: false,
    },
    counselling: {
      emollientFirst: false,
      fingertipUnits: false,
      applyThinly: false,
      stepDownApproach: false,
      avoidTriggers: false,
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
      severity: "",
      medicineRecommended: "",
      counsellingPoints: [],
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
