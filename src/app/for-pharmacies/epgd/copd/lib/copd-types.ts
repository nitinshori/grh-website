// ─── COPD Management ePGD Types ───
// Aligned to the signed PGD version 004, issued 11 September 2026:
// salbutamol 100mcg MDI (acute symptom relief) and amoxicillin 500mg capsules
// (infective exacerbation with purulent sputum), adults 18 and over.

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export const PGD_STRAPLINE = "COPD Management PGD version 004, issued 11 September 2026";

export type COPDPatientDetails = BasePatientDetails;

export type COPDPresentation = "" | "exacerbation" | "breathlessness";

export interface COPDAssessment {
  /** The answer to "confirmed diagnosis of COPD?": recorded, never assumed. "not-confirmed" is a stop. */
  diagnosisStatus: "" | "confirmed" | "not-confirmed";
  hasExistingDiagnosis: boolean; // documented spirometry and GOLD classification (true when diagnosisStatus is "confirmed")
  goldClassification: string; // "1" | "2" | "3" | "4" | ""
  presentation: COPDPresentation; // acute exacerbation, or breathlessness requiring symptom relief
  purulentSputumAnswer: "" | "yes" | "no"; // the answer recorded: Yes or No, no default
  purulentSputum: boolean; // yellow/green: infective exacerbation (amoxicillin arm); true when purulentSputumAnswer is "yes"
  spo2: number | null; // % on air; below 88 is an exclusion
  respiratoryRate: number | null; // breaths per minute, measured and recorded before supply; 25 or more is an exclusion in both arms
  salbutamolSuppliesLast12Months: number | null; // max 2 supplies in 12 months under this PGD (as told by the patient)
  platformSalbutamolSupplies12Months: number | null; // counted from this pharmacy's saved COPD records
  inhalerAbilityAnswer: "" | "yes" | "no"; // the patient's answer, recorded
  canUseInhalerOrSpacer: boolean; // inclusion, salbutamol arm (true when inhalerAbilityAnswer is "yes")
  oralAbilityAnswer: "" | "yes" | "no"; // the patient's answer, recorded
  ableToTakeOralMedication: boolean; // inclusion, amoxicillin arm (true when oralAbilityAnswer is "yes")
  mrcBreathlessnessScale: number | null; // 1-5
  exacerbationFrequency: string; // "none" | "1-2" | "3-4" | "frequent"
  currentInhalerRegimen: string;
}

export interface COPDMedicalHistory {
  exclusionsAskedAndAnswered: boolean; // attestation: every exclusion and caution question was put to the patient
  smokingStatus: string; // "current" | "former" | "never"
  otherRespiratoryConditions: string;
  otherConditions: string;
  // Salbutamol cautions (PGD v004)
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
  allergyStatusConfirmed: boolean; // attestation: allergy status asked and confirmed with the patient
  salbutamolAllergy: boolean; // hypersensitivity to salbutamol or other beta-2 agonists
  penicillinAllergy: boolean; // penicillin or beta-lactam allergy
  oralContraceptive: boolean;
  otherMedicines: string;
}

export interface COPDRedFlags {
  mrcGrade5: boolean;
  severeHypoxia: boolean; // SpO2 below 88%: emergency referral and oxygen
  highRespiratoryRate: boolean; // respiratory rate 25 or more: exclusion in both arms, emergency referral
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
  salbutamolPilSupplied: boolean; // PIL supplied with the salbutamol inhaler
  amoxicillinPilSupplied: boolean; // PIL supplied with the amoxicillin capsules
}

export interface COPDCounselling {
  notReplacementForMaintenance: boolean;
  gpReviewAdvised: boolean;
  inhalerTechniqueShown: boolean;
  smokingCessationAdvised: boolean;
  symptomMgmtExplained: boolean;
  // PGD v004 follow-up advice
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
  gpFollowUpAdvice: boolean; // regular GP follow-up to review the COPD management plan
}

export interface COPDExclusionOutcome {
  adviceGiven: string; // advice given and decision reached when excluded or declines (PGD: Actions if patient is excluded)
  referredTo: string; // "" | "gp" | "urgent-care" | "999" | "other"
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
  exclusionOutcome: COPDExclusionOutcome;
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
  | { type: "UPDATE_EXCLUSION_OUTCOME"; field: keyof COPDExclusionOutcome; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

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
      deliveryDetails: "",
      consultationNotes: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      diagnosisStatus: "",
      hasExistingDiagnosis: false,
      goldClassification: "",
      presentation: "",
      purulentSputumAnswer: "",
      purulentSputum: false,
      spo2: null,
      respiratoryRate: null,
      salbutamolSuppliesLast12Months: null,
      platformSalbutamolSupplies12Months: null,
      inhalerAbilityAnswer: "",
      canUseInhalerOrSpacer: false,
      oralAbilityAnswer: "",
      ableToTakeOralMedication: false,
      mrcBreathlessnessScale: null,
      exacerbationFrequency: "",
      currentInhalerRegimen: "",
    },
    medicalHistory: {
      exclusionsAskedAndAnswered: false,
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
      allergyStatusConfirmed: false,
      salbutamolAllergy: false,
      penicillinAllergy: false,
      oralContraceptive: false,
      otherMedicines: "",
    },
    redFlags: {
      mrcGrade5: false,
      severeHypoxia: false,
      highRespiratoryRate: false,
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
      salbutamolPilSupplied: false,
      amoxicillinPilSupplied: false,
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
      gpFollowUpAdvice: false,
    },
    exclusionOutcome: {
      adviceGiven: "",
      referredTo: "",
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
