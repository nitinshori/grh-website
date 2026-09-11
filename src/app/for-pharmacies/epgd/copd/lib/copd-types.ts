// ─── COPD Management ePGD Types ───
// Aligned to the signed PGD version 002, issued 11 September 2026:
// salbutamol 100mcg MDI (acute symptom relief) and amoxicillin 500mg capsules
// (infective exacerbation with purulent sputum), adults 18 and over.

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export const PGD_STRAPLINE = "COPD Management PGD version 002, issued 11 September 2026";

export interface COPDPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export type COPDPresentation = "" | "exacerbation" | "breathlessness";

export interface COPDAssessment {
  hasExistingDiagnosis: boolean; // documented spirometry and GOLD classification
  goldClassification: string; // "1" | "2" | "3" | "4" | ""
  presentation: COPDPresentation; // acute exacerbation, or breathlessness requiring symptom relief
  purulentSputum: boolean; // yellow/green: infective exacerbation (amoxicillin arm)
  spo2: number | null; // % on air; below 88 is an exclusion
  salbutamolSuppliesLast12Months: number | null; // max 2 supplies in 12 months under this PGD
  canUseInhalerOrSpacer: boolean; // inclusion, salbutamol arm
  ableToTakeOralMedication: boolean; // inclusion, amoxicillin arm
  mrcBreathlessnessScale: number | null; // 1-5
  exacerbationFrequency: string; // "none" | "1-2" | "3-4" | "frequent"
  currentInhalerRegimen: string;
}

export interface COPDMedicalHistory {
  copdDocumented: boolean;
  smokingStatus: string; // "current" | "former" | "never"
  otherRespiratoryConditions: string;
  otherConditions: string;
  // Salbutamol cautions (PGD v002)
  cardiovascularDisease: boolean;
  hypertension: boolean;
  coronaryDiseaseOrRecentMI: boolean;
  diabetes: boolean;
  hyperthyroidism: boolean;
  hypokalaemia: boolean;
  // Amoxicillin exclusions and cautions
  infectiousMononucleosis: boolean;
  severeRenalImpairment: boolean; // eGFR below 30: exclusion
  mildModerateRenalImpairment: boolean; // caution
  hepaticImpairment: boolean; // caution
  localResistanceConcern: boolean; // exclusion: antibiotic resistance suspected in local patterns
  pregnancy: boolean;
  breastfeeding: boolean;
}

export interface COPDCurrentMedications {
  salbutamolAllergy: boolean; // hypersensitivity to salbutamol or other beta-2 agonists
  penicillinAllergy: boolean; // penicillin or beta-lactam allergy
  oralContraceptive: boolean;
  otherMedicines: string;
}

export interface COPDRedFlags {
  mrcGrade5: boolean;
  severeHypoxia: boolean; // SpO2 below 88%: emergency referral and oxygen
  acuteDistress: boolean; // inability to speak, cyanosis, signs of respiratory failure
  newHaemoptysis: boolean;
  weightLoss: boolean;
  recurrentInfections: boolean;
}

export interface COPDMedicineSupply {
  medicinePrescribed: boolean; // at least one arm supplied
  supplySalbutamol: boolean;
  supplyAmoxicillin: boolean;
  salbutamolBrand: string;
  amoxicillinBrand: string;
  dosageConfirmed: boolean;
  notReplacementForMaintenance: boolean;
}

export interface COPDCounselling {
  notReplacementForMaintenance: boolean;
  gpReviewAdvised: boolean;
  inhalerTechniqueShown: boolean;
  smokingCessationAdvised: boolean;
  symptomMgmtExplained: boolean;
  // PGD v002 follow-up advice
  relieverUseAndLimits: boolean; // as needed; max 8 puffs in 24 hours; referral and 999 thresholds
  spacerAdvice: boolean;
  completeCourse: boolean;
  amoxicillinTiming: boolean; // 1 hour before or 2 hours after meals
  contraceptionAdvice: boolean;
  sputumColour: boolean;
  seekImmediateAttention: boolean; // worsen despite treatment, fever, chest pain, haemoptysis
  seekUrgentAssessment: boolean; // worsening breathlessness, difficulty speaking, confusion, cyanosis
  oximeterAdvice: boolean;
  allergicReactionAdvice: boolean;
}

export interface COPDConsultationState {
  patient: COPDPatientDetails;
  consent: BaseConsent;
  assessment: COPDAssessment;
  medicalHistory: COPDMedicalHistory;
  currentMedications: COPDCurrentMedications;
  redFlags: COPDRedFlags;
  medicineSupply: COPDMedicineSupply;
  counselling: COPDCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type COPDAction =
  | { type: "UPDATE_PATIENT"; field: keyof COPDPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof COPDAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof COPDMedicalHistory; value: any }
  | { type: "UPDATE_CURRENT_MEDICATIONS"; field: keyof COPDCurrentMedications; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof COPDRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof COPDMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof COPDCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "COPD Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): COPDConsultationState {
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
    assessment: {
      hasExistingDiagnosis: false,
      goldClassification: "",
      presentation: "",
      purulentSputum: false,
      spo2: null,
      salbutamolSuppliesLast12Months: null,
      canUseInhalerOrSpacer: false,
      ableToTakeOralMedication: false,
      mrcBreathlessnessScale: null,
      exacerbationFrequency: "",
      currentInhalerRegimen: "",
    },
    medicalHistory: {
      copdDocumented: false,
      smokingStatus: "",
      otherRespiratoryConditions: "",
      otherConditions: "",
      cardiovascularDisease: false,
      hypertension: false,
      coronaryDiseaseOrRecentMI: false,
      diabetes: false,
      hyperthyroidism: false,
      hypokalaemia: false,
      infectiousMononucleosis: false,
      severeRenalImpairment: false,
      mildModerateRenalImpairment: false,
      hepaticImpairment: false,
      localResistanceConcern: false,
      pregnancy: false,
      breastfeeding: false,
    },
    currentMedications: {
      salbutamolAllergy: false,
      penicillinAllergy: false,
      oralContraceptive: false,
      otherMedicines: "",
    },
    redFlags: {
      mrcGrade5: false,
      severeHypoxia: false,
      acuteDistress: false,
      newHaemoptysis: false,
      weightLoss: false,
      recurrentInfections: false,
    },
    medicineSupply: {
      medicinePrescribed: false,
      supplySalbutamol: false,
      supplyAmoxicillin: false,
      salbutamolBrand: "",
      amoxicillinBrand: "",
      dosageConfirmed: false,
      notReplacementForMaintenance: false,
    },
    counselling: {
      notReplacementForMaintenance: false,
      gpReviewAdvised: false,
      inhalerTechniqueShown: false,
      smokingCessationAdvised: false,
      symptomMgmtExplained: false,
      relieverUseAndLimits: false,
      spacerAdvice: false,
      completeCourse: false,
      amoxicillinTiming: false,
      contraceptionAdvice: false,
      sputumColour: false,
      seekImmediateAttention: false,
      seekUrgentAssessment: false,
      oximeterAdvice: false,
      allergicReactionAdvice: false,
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
