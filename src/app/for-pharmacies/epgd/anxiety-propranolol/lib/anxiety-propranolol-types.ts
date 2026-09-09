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
  // Added at PGD v002, 9 September 2026. The document named these as red
  // flags in its guidance and none of them was an exclusion, and the tool
  // did not ask. Propranolol is cardiotoxic in overdose.
  suicidalOrSevereDepression: boolean;
  ptsdPanicOrAgoraphobia: boolean;
  substanceOrAlcoholMisuse: boolean;
  otherBetaBlocker: boolean;
  verapamilOrDiltiazem: boolean;
}

export interface AnxietyMedicineSupply {
  propranololDose: string;
  /**
   * 10mg or 40mg. The PGD authorises the SAME total propranolol either way,
   * 560mg: up to 56 x 10mg or up to 14 x 40mg. The 40mg strength is for a
   * patient whose single dose is established at 40mg by previous response.
   */
  strength: "10mg" | "40mg";
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
      suicidalOrSevereDepression: false,
      ptsdPanicOrAgoraphobia: false,
      substanceOrAlcoholMisuse: false,
      otherBetaBlocker: false,
      verapamilOrDiltiazem: false,
    },
    medicineSupply: {
      propranololDose: "10-40mg",
      strength: "10mg",
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
