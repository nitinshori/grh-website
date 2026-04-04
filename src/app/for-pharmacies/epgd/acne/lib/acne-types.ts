import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface AcnePatientDetails extends BasePatientDetails {}

export interface AcneConsent extends BaseConsent {
  femaleConfirmed: boolean;
}

export interface AcneAssessment {
  severity: "mild" | "moderate" | "severe" | "";
  comedones: boolean;
  inflammatoryPapules: boolean;
  pustules: boolean;
  nodalCystic: boolean;
  affectedArea: string;
}

export interface AcneMedicalHistory {
  previousTreatments: string;
  allergies: string;
  sensitiveToRetinoids: boolean;
}

export interface AcneContraindications {
  pregnant: boolean;
  breastfeeding: boolean;
  ageUnder12: boolean;
}

export interface AcneMedicineSelection {
  medicineChoice: string;
  inadequateResponse: boolean;
  addLymecycline: boolean;
}

export interface AcneCounselling {
  improvementTimeline: boolean;
  photosensitivity: boolean;
  washingAdvice: boolean;
  productAdvice: boolean;
  courseCompletion: boolean;
}

export interface AcneConsultationSummary extends BaseSummary {
  severity: string;
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface AcneConsultationState {
  patient: AcnePatientDetails;
  consent: AcneConsent;
  assessment: AcneAssessment;
  medicalHistory: AcneMedicalHistory;
  contraindications: AcneContraindications;
  medicineSelection: AcneMedicineSelection;
  counselling: AcneCounselling;
  summary: AcneConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type AcneAction =
  | { type: "UPDATE_PATIENT"; field: keyof AcnePatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof AcneConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AcneAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AcneMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof AcneContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof AcneMedicineSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AcneCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof AcneConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Acne Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): AcneConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
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
      femaleConfirmed: false,
    },
    assessment: {
      severity: "",
      comedones: false,
      inflammatoryPapules: false,
      pustules: false,
      nodalCystic: false,
      affectedArea: "",
    },
    medicalHistory: {
      previousTreatments: "",
      allergies: "",
      sensitiveToRetinoids: false,
    },
    contraindications: {
      pregnant: false,
      breastfeeding: false,
      ageUnder12: false,
    },
    medicineSelection: {
      medicineChoice: "",
      inadequateResponse: false,
      addLymecycline: false,
    },
    counselling: {
      improvementTimeline: false,
      photosensitivity: false,
      washingAdvice: false,
      productAdvice: false,
      courseCompletion: false,
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
