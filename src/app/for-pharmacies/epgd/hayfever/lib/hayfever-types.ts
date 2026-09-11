// ─── Hayfever (Prescription Strength) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface HayfeverPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface HayfeverAssessment {
  symptomSeverity: string; // "mild" | "moderate" | "severe"
  affectedSystems: string[]; // "nasal" | "ocular" | "respiratory"
  seasonalOrPerennial: string; // "seasonal" | "perennial" | "both"
  previousOTCUse: string;
  symptomDuration: string;
  /** PGD v003 fexofenadine inclusion: previous diagnosis of allergic rhinitis
   *  or recurrence of known symptoms. */
  previousDiagnosisOrRecurrence: boolean;
}

export interface HayfeverMedicalHistory {
  asthmaOrLrti: boolean;
  severeHepaticImpairment: boolean;
  /** Severe renal impairment (fexofenadine exclusion, PGD v003). */
  renalImpairment: boolean;
  /** Recent nasal surgery or trauma (Dymista exclusion, PGD v003). */
  recentNasalSurgery: boolean;
  /** Untreated fungal, bacterial or viral nasal infection (Dymista exclusion). */
  untreatedNasalInfection: boolean;
  /** History of cardiovascular disease (fexofenadine caution). */
  cardiovascularDisease: boolean;
  /** Glaucoma (Dymista caution). */
  glaucoma: boolean;
  /** Tuberculosis (Dymista caution). */
  tuberculosis: boolean;
  phenylketonuria: boolean;
  otherConditions: string;
}

export interface HayfeverContraindications {
  pregnant: boolean;
  breastfeeding: boolean;
  childUnder12: boolean;
  /** Known hypersensitivity to fexofenadine or any component of the formulation. */
  hypersensitivityFexofenadine: boolean;
  /** Known hypersensitivity to azelastine, fluticasone or any excipient of Dymista. */
  hypersensitivityDymista: boolean;
  otherMedicines: string;
}

export interface HayfeverMedicineSupply {
  medicineSelected: string; // "fexofenadine" | "dymista" | "combination"
  fexofenadine120: boolean;
  dymistaNasalSpray: boolean;
  /** Brand supplied for fexofenadine 120 mg: "allevia" (P) or "generic" (POM). */
  fexofenadineBrand: string;
  /** Dymista inclusion: dual therapy required, monotherapy with an intranasal
   *  antihistamine or corticosteroid not sufficient. */
  dualTherapyRequired: boolean;
  dosageConfirmed: boolean;
}

export interface HayfeverCounselling {
  allergenAvoidance: boolean;
  nasalSprayTechnique: boolean;
  effectivenessTimeline: boolean;
  combinationRationale: boolean;
  wrapsunglasses: boolean;
  pollenForecastAdvice: boolean;
  /** Fexofenadine: avoid alcohol and other sedating antihistamines. */
  alcoholSedatingAdvice: boolean;
  /** Fexofenadine: non-sedating but occasional drowsiness may still occur. */
  drowsinessAdvice: boolean;
  /** Dymista: possible side effects and need for ongoing review if used long-term. */
  sideEffectsAdvice: boolean;
  /** Seek medical advice if symptoms worsen rapidly or significantly, do not
   *  improve in 3 to 4 weeks, or the patient becomes systemically very unwell. */
  followUpAdvice: boolean;
  /** Patient information leaflet supplied with the medication. */
  pilSupplied: boolean;
}

export interface HayfeverConsultationState {
  patient: HayfeverPatientDetails;
  consent: BaseConsent;
  assessment: HayfeverAssessment;
  medicalHistory: HayfeverMedicalHistory;
  contraindications: HayfeverContraindications;
  medicineSupply: HayfeverMedicineSupply;
  counselling: HayfeverCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type HayfeverAction =
  | { type: "UPDATE_PATIENT"; field: keyof HayfeverPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof HayfeverAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof HayfeverMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof HayfeverContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof HayfeverMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof HayfeverCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Symptom Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HayfeverConsultationState {
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
      femaleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      symptomSeverity: "",
      affectedSystems: [],
      seasonalOrPerennial: "",
      previousOTCUse: "",
      symptomDuration: "",
      previousDiagnosisOrRecurrence: false,
    },
    medicalHistory: {
      asthmaOrLrti: false,
      severeHepaticImpairment: false,
      renalImpairment: false,
      recentNasalSurgery: false,
      untreatedNasalInfection: false,
      cardiovascularDisease: false,
      glaucoma: false,
      tuberculosis: false,
      phenylketonuria: false,
      otherConditions: "",
    },
    contraindications: {
      pregnant: false,
      breastfeeding: false,
      childUnder12: false,
      hypersensitivityFexofenadine: false,
      hypersensitivityDymista: false,
      otherMedicines: "",
    },
    medicineSupply: {
      medicineSelected: "",
      fexofenadine120: false,
      dymistaNasalSpray: false,
      fexofenadineBrand: "",
      dualTherapyRequired: false,
      dosageConfirmed: false,
    },
    counselling: {
      allergenAvoidance: false,
      nasalSprayTechnique: false,
      effectivenessTimeline: false,
      combinationRationale: false,
      wrapsunglasses: false,
      pollenForecastAdvice: false,
      alcoholSedatingAdvice: false,
      drowsinessAdvice: false,
      sideEffectsAdvice: false,
      followUpAdvice: false,
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
