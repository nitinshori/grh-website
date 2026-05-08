import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface AnxietyPropranololPatientDetails extends BasePatientDetails {}

export interface AnxietyPropranololConsent extends BaseConsent {}

export interface AnxietyAssessment {
  anxietyType: string;
  triggerSituation: string;
  physicalSymptoms: string;
  frequencyOfEvents: string;
}

export interface AnxietyMedicalHistory {
  asthmaOrCOPD: boolean;
  cardiacConduction: boolean;
  bradycardia: boolean;
  heartFailure: boolean;
  prinzmetalsAngina: boolean;
  pheochromocytoma: boolean;
  diabetes: boolean;
  raynauds: boolean;
  hepaticImpairment: boolean;
}

export interface AnxietyContraindications {
  asthmaWithBronchospasm: boolean;
  heartBlock: boolean;
  severeBradycardia: boolean;
  uncontrolledHeartFailure: boolean;
  prinzmetalsAngina: boolean;
  pheochromocytoma: boolean;
  childUnder12: boolean;
}

export interface AnxietyMedicineSupply {
  propranololDose: string;
  quantity: number | null;
  timing: string;
}

export interface AnxietyCounselling {
  prnUseOnly: boolean;
  physicalSymptoms: boolean;
  noDependence: boolean;
  noSuddenWithdrawal: boolean;
  avoidVerapamil: boolean;
}

export interface AnxietyConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface AnxietyPropranololConsultationState {
  patient: AnxietyPropranololPatientDetails;
  consent: AnxietyPropranololConsent;
  assessment: AnxietyAssessment;
  medicalHistory: AnxietyMedicalHistory;
  contraindications: AnxietyContraindications;
  medicineSupply: AnxietyMedicineSupply;
  counselling: AnxietyCounselling;
  summary: AnxietyConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type AnxietyPropranololAction =
  | { type: "UPDATE_PATIENT"; field: keyof AnxietyPropranololPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof AnxietyPropranololConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AnxietyAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AnxietyMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof AnxietyContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof AnxietyMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AnxietyCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof AnxietyConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Anxiety Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): AnxietyPropranololConsultationState {
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
      anxietyType: "",
      triggerSituation: "",
      physicalSymptoms: "",
      frequencyOfEvents: "",
    },
    medicalHistory: {
      asthmaOrCOPD: false,
      cardiacConduction: false,
      bradycardia: false,
      heartFailure: false,
      prinzmetalsAngina: false,
      pheochromocytoma: false,
      diabetes: false,
      raynauds: false,
      hepaticImpairment: false,
    },
    contraindications: {
      asthmaWithBronchospasm: false,
      heartBlock: false,
      severeBradycardia: false,
      uncontrolledHeartFailure: false,
      prinzmetalsAngina: false,
      pheochromocytoma: false,
      childUnder12: false,
    },
    medicineSupply: {
      propranololDose: "10-40mg",
      quantity: null,
      timing: "PRN 30-60 minutes before anxiety-provoking situation",
    },
    counselling: {
      prnUseOnly: false,
      physicalSymptoms: false,
      noDependence: false,
      noSuddenWithdrawal: false,
      avoidVerapamil: false,
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
