import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface SmokingNRTPatientDetails extends BasePatientDetails {}

export interface SmokingNRTConsent extends BaseConsent {}

export interface SmokingAssessment {
  cigarettesPerDay: number | null;
  timeToFirstCigarette: string;
  currentlySmokes: boolean;
  quitDate: string;
  /** PGD inclusion: motivated to quit smoking and set a quit date. */
  motivated: boolean;
}

export interface SmokingMedicalHistory {
  recentMI: boolean;
  recentStroke: boolean;
  unstableAngina: boolean;
  cardiovascularDisease: boolean;
  diabetes: boolean;
  pheochromocytoma: boolean;
  // PGD v002 cautions
  hepaticRenalImpairment: boolean;
  pepticUlcer: boolean;
  oralUlcerationOrDentalWork: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
}

export interface SmokingContraindications {
  childUnder12: boolean;
  recentCardiacEvent: boolean;
  pheochromocytoma: boolean;
  // PGD v002 exclusions
  hypersensitivity: boolean;
  nonSmokerOrOccasional: boolean;
  /** Generalised skin disorder that may affect absorption: excludes the patch arm. */
  generalisedSkinDisorder: boolean;
}

export interface SmokingNRTSelection {
  usePatches: boolean;
  patchStrength: string;
  useOralForm: boolean;
  /** PGD 2: nicotine lozenges or gum, 2mg and 4mg only. */
  oralFormType: string;
  oralStrength: "" | "2mg" | "4mg";
  /** 28 patches (4-week supply). */
  patchQuantity: number | null;
  /** Up to 4-week supply, maximum 120 pieces. */
  oralQuantity: number | null;
  combinationTherapy: boolean;
  behavioralSupport: boolean;
}

export interface SmokingCounselling {
  combinationBetter: boolean;
  quitDate: boolean;
  behavioralSupport: boolean;
  sideEffects: boolean;
  courseDuration: boolean;
  // PGD v002 follow-up advice row
  correctTechnique: boolean;
  useEnough: boolean;
  doNotSmoke: boolean;
  withdrawalSymptoms: boolean;
  drivingWarning: boolean;
  cardiovascularSymptoms: boolean;
  reportReactions: boolean;
  pregnancyAdvice: boolean;
  followUpSchedule: boolean;
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
      cigarettesPerDay: null,
      timeToFirstCigarette: "",
      currentlySmokes: true,
      quitDate: "",
      motivated: false,
    },
    medicalHistory: {
      recentMI: false,
      recentStroke: false,
      unstableAngina: false,
      cardiovascularDisease: false,
      diabetes: false,
      pheochromocytoma: false,
      hepaticRenalImpairment: false,
      pepticUlcer: false,
      oralUlcerationOrDentalWork: false,
      pregnant: false,
      breastfeeding: false,
    },
    contraindications: {
      childUnder12: false,
      recentCardiacEvent: false,
      pheochromocytoma: false,
      hypersensitivity: false,
      nonSmokerOrOccasional: false,
      generalisedSkinDisorder: false,
    },
    nrtSelection: {
      usePatches: false,
      patchStrength: "",
      useOralForm: false,
      oralFormType: "",
      oralStrength: "",
      patchQuantity: null,
      oralQuantity: null,
      combinationTherapy: false,
      behavioralSupport: false,
    },
    counselling: {
      combinationBetter: false,
      quitDate: false,
      behavioralSupport: false,
      sideEffects: false,
      courseDuration: false,
      correctTechnique: false,
      useEnough: false,
      doNotSmoke: false,
      withdrawalSymptoms: false,
      drivingWarning: false,
      cardiovascularSymptoms: false,
      reportReactions: false,
      pregnancyAdvice: false,
      followUpSchedule: false,
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
