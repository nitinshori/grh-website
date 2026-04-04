import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface HRTSymptomScore {
  hotFlushes: number; // 0-3
  nightSweats: number; // 0-3
  vaginDryness: number; // 0-3
  moodDisturbance: number; // 0-3
  sleepProblem: number; // 0-3
  jointMuscPain: number; // 0-3
  totalScore: number;
}

export interface HRTAssessment {
  menopauseStatus: string; // "perimenopause" | "postmenopause"
  lastMenstrualPeriod: string;
  yearsPostmenopause: number | null;
  symptomScore: HRTSymptomScore;
}

export interface HRTMedicalHistory {
  undiagnosedVaginalBleeding: boolean;
  currentBreastCancer: boolean;
  recentBreastCancer: boolean;
  activeLiverDisease: boolean;
  activeVTE: boolean;
  untreatEndometrialHyperplasia: boolean;
  familyHistBreastCancer: boolean;
  bmiOver30: boolean;
  migraineWithAura: boolean;
  historyVTE: boolean;
}

export interface HRTMedications {
  otherHormones: string;
  otherMedications: string;
  allergies: string;
}

export interface HRTHRTSelection {
  hrtType: string; // "seq-combined" | "cont-combined" | "oestrogen-only" | "local-vag"
  oestroaddressRoute: string; // "patch" | "gel" | "oral"
  progestogenType: string;
  doseRec: string;
}

export interface HRTCounselling {
  benefitsVsRisks: boolean;
  threeMonthTrial: boolean;
  breakthroughBleeding: boolean;
  transdermalAdvantage: boolean;
  breastAwareness: boolean;
  annualReview: boolean;
  lifeStyleAdvice: boolean;
  followUpArranged: boolean;
}

export interface HRTConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: HRTAssessment;
  medicalHistory: HRTMedicalHistory;
  medications: HRTMedications;
  hrtSelection: HRTHRTSelection;
  counselling: HRTCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type HRTAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_HRT_SELECTION"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Menopause Assessment",
  "Symptom Scoring",
  "Medical History",
  "Contraindications",
  "HRT Selection",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HRTConsultationState {
  return {
    currentStep: 0,
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
    },
    assessment: {
      menopauseStatus: "",
      lastMenstrualPeriod: "",
      yearsPostmenopause: null,
      symptomScore: {
        hotFlushes: 0,
        nightSweats: 0,
        vaginDryness: 0,
        moodDisturbance: 0,
        sleepProblem: 0,
        jointMuscPain: 0,
        totalScore: 0,
      },
    },
    medicalHistory: {
      undiagnosedVaginalBleeding: false,
      currentBreastCancer: false,
      recentBreastCancer: false,
      activeLiverDisease: false,
      activeVTE: false,
      untreatEndometrialHyperplasia: false,
      familyHistBreastCancer: false,
      bmiOver30: false,
      migraineWithAura: false,
      historyVTE: false,
    },
    medications: {
      otherHormones: "",
      otherMedications: "",
      allergies: "",
    },
    hrtSelection: {
      hrtType: "",
      oestroaddressRoute: "",
      progestogenType: "",
      doseRec: "",
    },
    counselling: {
      benefitsVsRisks: false,
      threeMonthTrial: false,
      breakthroughBleeding: false,
      transdermalAdvantage: false,
      breastAwareness: false,
      annualReview: false,
      lifeStyleAdvice: false,
      followUpArranged: false,
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
    alerts: [],
    doseRecommendation: null,
  };
}
