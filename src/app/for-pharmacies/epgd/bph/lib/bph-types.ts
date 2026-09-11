// ─── BPH (Tamsulosin) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for BPH PGD ───

export interface BPHPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export interface BPHLutsAssessment {
  ipssScore: number | null; // 0-35
  frequency: boolean; // >8 times in 24h
  urgency: boolean; // Strong, persistent urge
  nocturia: boolean; // >1 time per night
  weakStream: boolean;
  hesitancy: boolean; // Difficulty starting
  incompletEmptying: boolean;
  lowerAbdominalDiscomfort: boolean;
}

export interface BPHMedicalHistory {
  /** PGD v003 exclusion: history of orthostatic hypotension. */
  orthostasisHistory: boolean;
  /** Exclusion: severe hepatic impairment (Child-Pugh C). */
  severeHepaticImpairment: boolean;
  /** Caution: mild to moderate hepatic impairment. */
  mildModerateHepaticImpairment: boolean;
  /** Exclusion: planned cataract or glaucoma surgery (IFIS). */
  plannedCataractSurgery: boolean;
  hypersensitivity: boolean;
  uncontrolledHypertension: boolean;
  /** Blood pressure reading, record only (the document sets no threshold),
   *  so the "uncontrolled hypertension" answer has a basis on the record. */
  bloodPressure: string;
  /** Exclusion: MS, Parkinson's, spinal cord disease, diabetic neuropathy. */
  neurologicalBladderDisease: boolean;
  /** Caution: history of syncope or fainting. */
  syncopeHistory: boolean;
  /** Caution: eGFR below 10. */
  severeRenalImpairment: boolean;
  /** Symptoms previously assessed by a GP or urologist. If not, the GP must be
   *  informed on the day and the patient must agree to attend within 6 weeks. */
  previouslyAssessedByGp: boolean;
  gpInformedToday: boolean;
  patientAgreesGpWithin6Weeks: boolean;
  otherConditions: string;
}

export interface BPHRedFlags {
  /** Visible or non-visible haematuria. */
  haematuria: boolean;
  acuteRetention: boolean;
  /** Palpable bladder, or symptoms suggesting chronic retention. */
  palpableBladder: boolean;
  chronicRetentionSymptoms: boolean;
  /** Known or suspected prostate cancer, abnormal DRE, or raised PSA. */
  psa4OrAbove: boolean;
  /** Current or recurrent UTI, or dysuria with fever. */
  urinaryTractInfection: boolean;
  weightLoss: boolean;
  bonePain: boolean;
}

export interface BPHContraindications {
  takingPde5Inhibitor: boolean;
  pde5Detail: string;
  /** Exclusion: concurrent use of another alpha-1 adrenoceptor antagonist. */
  otherAlphaBlocker: boolean;
  /** Caution: concurrent antihypertensive medication (orthostatic hypotension). */
  takingAntihypertensives: boolean;
  otherAntihypertensives: string;
}

export interface BPHMedicineSupply {
  tamsulosin400mcgMrOd: boolean;
  /** Initial 4-week supply, or a continuation supply after the 4 to 6 week review. */
  supplyType: "" | "initial" | "continuation";
  quantity: number | null;
  brand: string;
  // Continuation gate (PGD v003 maximum treatment period)
  previousIpss: number | null;
  gpExaminedSinceStart: boolean;
  monthsOnTreatment: number | null;
  afterFood30mins: boolean;
  sameTimeDaily: boolean;
  firstDoseHypotension: boolean;
}

export interface BPHCounselling {
  take30minsAfterFood: boolean;
  swallowWhole: boolean;
  firstDoseHypotension: boolean;
  reportDizzinessFainting: boolean;
  retrogradeEjaculation: boolean;
  informOphthalmologist: boolean;
  priapismWarning: boolean;
  urgentSymptoms: boolean;
  rashAllergy: boolean;
  reviewAt4To6Weeks: boolean;
  /** Written information row: PIL supplied. */
  pilSupplied: boolean;
}

export interface BPHConsultationState {
  patient: BPHPatientDetails;
  consent: BaseConsent;
  lutsAssessment: BPHLutsAssessment;
  medicalHistory: BPHMedicalHistory;
  redFlags: BPHRedFlags;
  contraindications: BPHContraindications;
  medicineSupply: BPHMedicineSupply;
  counselling: BPHCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type BPHAction =
  | { type: "UPDATE_PATIENT"; field: keyof BPHPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_LUTS_ASSESSMENT"; field: keyof BPHLutsAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof BPHMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof BPHRedFlags; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof BPHContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof BPHMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof BPHCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "LUTS Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): BPHConsultationState {
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
      maleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    lutsAssessment: {
      ipssScore: null,
      frequency: false,
      urgency: false,
      nocturia: false,
      weakStream: false,
      hesitancy: false,
      incompletEmptying: false,
      lowerAbdominalDiscomfort: false,
    },
    medicalHistory: {
      orthostasisHistory: false,
      severeHepaticImpairment: false,
      mildModerateHepaticImpairment: false,
      plannedCataractSurgery: false,
      hypersensitivity: false,
      uncontrolledHypertension: false,
      bloodPressure: "",
      neurologicalBladderDisease: false,
      syncopeHistory: false,
      severeRenalImpairment: false,
      previouslyAssessedByGp: false,
      gpInformedToday: false,
      patientAgreesGpWithin6Weeks: false,
      otherConditions: "",
    },
    redFlags: {
      haematuria: false,
      acuteRetention: false,
      palpableBladder: false,
      chronicRetentionSymptoms: false,
      psa4OrAbove: false,
      urinaryTractInfection: false,
      weightLoss: false,
      bonePain: false,
    },
    contraindications: {
      takingPde5Inhibitor: false,
      pde5Detail: "",
      otherAlphaBlocker: false,
      takingAntihypertensives: false,
      otherAntihypertensives: "",
    },
    medicineSupply: {
      tamsulosin400mcgMrOd: false,
      supplyType: "",
      quantity: null,
      brand: "",
      previousIpss: null,
      gpExaminedSinceStart: false,
      monthsOnTreatment: null,
      afterFood30mins: false,
      sameTimeDaily: false,
      firstDoseHypotension: false,
    },
    counselling: {
      take30minsAfterFood: false,
      swallowWhole: false,
      firstDoseHypotension: false,
      reportDizzinessFainting: false,
      retrogradeEjaculation: false,
      informOphthalmologist: false,
      priapismWarning: false,
      urgentSymptoms: false,
      rashAllergy: false,
      reviewAt4To6Weeks: false,
      pilSupplied: false,
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
