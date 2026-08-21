import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface AlcoholReductionPatientDetails extends BasePatientDetails {}

export interface AlcoholReductionConsent extends BaseConsent {}

export interface AlcoholAssessment {
  auditScore: number | null;
  unitPerWeek: number | null;
  bingeDrinking: boolean;
  dependenceLevel: string;
  // ── Licence gates, added 21 Aug 2026 ───────────────────────────────
  // Nalmefene's indication is narrow and the tool did not encode it. The
  // licence requires a HIGH drinking risk level, which is defined per DAY
  // (over 60 g, i.e. over 7.5 units, for men; over 40 g, i.e. over 5
  // units, for women), and initiation only in patients who STILL have a
  // high level two weeks after an initial assessment. The tool captured
  // units per week only, which cannot express a daily risk level, and
  // asked nothing about the run-in.
  /** Units per day at this visit. The licence threshold is per day, not per week. */
  unitsPerDay: number | null;
  /** Sex used for the drinking risk level threshold, which differs. */
  sexForThreshold: "" | "male" | "female";
  /** Date of the initial assessment. Supply requires at least 14 days since. */
  initialAssessmentDate: string;
  /** Confirmed the patient still has a high drinking risk level at this second visit. */
  stillHighRiskAtReview: boolean;
  /** The patient kept a record of consumption during the run-in and it has been reviewed. */
  consumptionRecordReviewed: boolean;
  /** Treatment goal is reduction, not abstinence. Abstinence is a different medicine. */
  goalIsReduction: boolean;
}

export interface AlcoholMedicalHistory {
  recentWithdrawal: boolean;
  hepaticImpairment: boolean;
  renalImpairment: boolean;
  psychiatricComorbidity: boolean;
}

export interface AlcoholContraindications {
  opioidUse: boolean;
  opioidDependence: boolean;
  severeHepaticImpairment: boolean;
  severeRenalImpairment: boolean;
  activeWithdrawal: boolean;
  childUnder18: boolean;
}

export interface AlcoholMedicineSupply {
  nalmefeneDose: string;
  quantity: number | null;
  timing: string;
  psychosocialSupport: boolean;
}

export interface AlcoholCounselling {
  prnDosing: boolean;
  beforeDrinking: boolean;
  rewardMechanism: boolean;
  noDisulfiramReaction: boolean;
  avoidOpioids: boolean;
  psychosocialSupport: boolean;
}

export interface AlcoholConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface AlcoholReductionConsultationState {
  patient: AlcoholReductionPatientDetails;
  consent: AlcoholReductionConsent;
  assessment: AlcoholAssessment;
  medicalHistory: AlcoholMedicalHistory;
  contraindications: AlcoholContraindications;
  medicineSupply: AlcoholMedicineSupply;
  counselling: AlcoholCounselling;
  summary: AlcoholConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type AlcoholReductionAction =
  | { type: "UPDATE_PATIENT"; field: keyof AlcoholReductionPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof AlcoholReductionConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AlcoholAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AlcoholMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof AlcoholContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof AlcoholMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AlcoholCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof AlcoholConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Alcohol Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): AlcoholReductionConsultationState {
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
      auditScore: null,
      unitPerWeek: null,
      bingeDrinking: false,
      dependenceLevel: "",
      unitsPerDay: null,
      sexForThreshold: "",
      initialAssessmentDate: "",
      stillHighRiskAtReview: false,
      consumptionRecordReviewed: false,
      goalIsReduction: false,
    },
    medicalHistory: {
      recentWithdrawal: false,
      hepaticImpairment: false,
      renalImpairment: false,
      psychiatricComorbidity: false,
    },
    contraindications: {
      opioidUse: false,
      opioidDependence: false,
      severeHepaticImpairment: false,
      severeRenalImpairment: false,
      activeWithdrawal: false,
      childUnder18: false,
    },
    medicineSupply: {
      nalmefeneDose: "18mg",
      quantity: null,
      timing: "PRN",
      psychosocialSupport: false,
    },
    counselling: {
      prnDosing: false,
      beforeDrinking: false,
      rewardMechanism: false,
      noDisulfiramReaction: false,
      avoidOpioids: false,
      psychosocialSupport: false,
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
