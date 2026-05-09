import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface ColdSoresPatientDetails extends BasePatientDetails {}

export interface ColdSoresConsent extends BaseConsent {}

export interface ColdSoresSymptomAssessment {
  isRecurrent: boolean;
  isFirstEpisode: boolean;
  prodromeSigns: boolean;
  hoursFromProdrome: number | null;
  currentSymptoms: string;
}

export interface ColdSoresMedicalHistory {
  immunosuppressed: boolean;
  recentlyImmunosuppressed: boolean;
  renalImpairment: boolean;
  renalFunction: string;
}

export interface ColdSoresContraindications {
  pregnant: boolean;
  immunosuppressed: boolean;
  childUnder12: boolean;
  renalImpairmentSevere: boolean;
}

export interface ColdSoresMedicineSupply {
  doseChoice: string;
  quantity: number | null;
  frequency: string;
  duration: string;
}

export interface ColdSoresCounselling {
  startASAP: boolean;
  completeCourse: boolean;
  contagious: boolean;
  avoidSharing: boolean;
  sunExposure: boolean;
}

export interface ColdSoresConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface ColdSoresConsultationState {
  patient: ColdSoresPatientDetails;
  consent: ColdSoresConsent;
  symptomAssessment: ColdSoresSymptomAssessment;
  medicalHistory: ColdSoresMedicalHistory;
  contraindications: ColdSoresContraindications;
  medicineSupply: ColdSoresMedicineSupply;
  counselling: ColdSoresCounselling;
  summary: ColdSoresConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type ColdSoresAction =
  | { type: "UPDATE_PATIENT"; field: keyof ColdSoresPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof ColdSoresConsent; value: any }
  | { type: "UPDATE_SYMPTOM_ASSESSMENT"; field: keyof ColdSoresSymptomAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof ColdSoresMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof ColdSoresContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof ColdSoresMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof ColdSoresCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof ColdSoresConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Symptom Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): ColdSoresConsultationState {
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
    symptomAssessment: {
      isRecurrent: false,
      isFirstEpisode: false,
      prodromeSigns: false,
      hoursFromProdrome: null,
      currentSymptoms: "",
    },
    medicalHistory: {
      immunosuppressed: false,
      recentlyImmunosuppressed: false,
      renalImpairment: false,
      renalFunction: "",
    },
    contraindications: {
      pregnant: false,
      immunosuppressed: false,
      childUnder12: false,
      renalImpairmentSevere: false,
    },
    medicineSupply: {
      doseChoice: "",
      quantity: null,
      frequency: "5 times daily",
      duration: "5 days",
    },
    counselling: {
      startASAP: false,
      completeCourse: false,
      contagious: false,
      avoidSharing: false,
      sunExposure: false,
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
