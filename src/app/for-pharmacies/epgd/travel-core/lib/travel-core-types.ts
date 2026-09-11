import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Travel Core Specific Types ───

export interface TravelCoreDestinationAssessment {
  destination: string;
  departureDate: string;
  returnDate: string;
  duration: number | null; // days
  isEndemicMalariaZone: boolean;
  vaccinationRequirementsIdentified: boolean;
  foodWaterRiskLevel: "low" | "moderate" | "high";
  sunExposureRisk: "low" | "moderate" | "high";
}

export type ChemoprophylaxisPlan =
  | ""
  | "not-required"
  | "supplied-antimalarials-pgd"
  | "referred-antimalarials-pgd"
  | "referred-gp-travel-clinic"
  | "declined";

/**
 * Malaria is outside this PGD (it authorises three vaccines). The step records
 * the risk assessment and where the traveller was sent for chemoprophylaxis;
 * it never suggests a drug. Supply is under the anti-malarials PGD.
 */
export interface TravelCoreMalariaRisk {
  malariaZone: boolean;
  resistanceProfile: string; // optional note, e.g. "chloroquine-resistant" per TravelHealthPro
  chemoprophylaxisAdvised: boolean;
  chemoprophylaxisPlan: ChemoprophylaxisPlan;
}

export interface TravelCorePreventiveMeasures {
  insectRepellentAdvised: boolean;
  bedNetAdvised: boolean;
  lightClothingAdvised: boolean;
  vaccineCheckAdvised: boolean;
  sunProtectionAdvised: boolean;
  foodWaterPrecautionsAdvised: boolean;
  travellersVaccineNotes: string;
}

export interface TravelCoreMedicinesSupplied {
  biteAvoidanceKitSupplied: boolean;
  antidiarrhoealsAdvised: boolean;
  firstAidKitAdvised: boolean;
  antihistamineSupplied: boolean;
  skinCreamSupplied: boolean;
  otherMedicinesNotes: string;
}

export interface TravelCoreConsultationSummary extends BaseSummary {
  destinationSummary: string;
  preventiveAdviceSummary: string;
}

/** PGD version strapline shown on the page and printed on the record. */
export const TRAVEL_CORE_PGD_VERSION =
  "Hepatitis A (Havrix/Avaxim), Typhoid (Typhim Vi) and Cholera (Dukoral) Travel Health PGD v004, issued 11 September 2026";

export type HepAProduct = "havrix" | "avaxim" | "";
export type HepADose = "primary" | "booster" | "";
export type CholeraDose = "1" | "2" | "booster" | "";
export type InjectionSite = "left-deltoid" | "right-deltoid" | "";
export type ExclusionReferral = "" | "gp-informed" | "gp-referred" | "travel-clinic" | "declined";

/**
 * Vaccine administration under the signed PGD: Hepatitis A (Havrix Monodose
 * 1440 EL.U/1.0 mL or Avaxim 160 U/0.5 mL), Typhoid (Typhim Vi 25 mcg/0.5 mL)
 * and Cholera (Dukoral, oral). Adults 18 and over.
 */
export interface TravelCoreVaccineAdministration {
  noVaccineToday: boolean;
  // Exclusions and cautions common to the three PGDs
  hypersensitivity: boolean;
  acuteFebrileIllness: boolean;
  pregnant: boolean;
  immunocompromised: boolean;
  bleedingDisorder: boolean;
  // Cholera-specific exclusions and cautions
  giSymptoms: boolean;
  severeImmunocompromise: boolean;
  recentAntibiotics: boolean;
  // Hepatitis A
  hepAGiven: boolean;
  /** Inclusion: destination has high or intermediate hepatitis A prevalence (TravelHealthPro). */
  hepAInclusionMet: boolean;
  hepAProduct: HepAProduct;
  hepADose: HepADose;
  /** Booster only: date and product of the primary dose. */
  hepAPrimaryDoseDate: string;
  hepAPrimaryProduct: HepAProduct;
  hepAPreviousCompleteCourse: boolean;
  hepAImmunityDocumented: boolean;
  hepABatch: string;
  hepAExpiry: string; // yyyy-mm-dd
  hepASite: InjectionSite;
  // Typhoid
  typhoidGiven: boolean;
  /** Inclusion: destination has high or intermediate typhoid prevalence (TravelHealthPro). */
  typhoidInclusionMet: boolean;
  typhoidPreviousDose: boolean;
  typhoidPreviousDoseDate: string;
  typhoidBatch: string;
  typhoidExpiry: string; // yyyy-mm-dd
  typhoidSite: InjectionSite;
  // Cholera
  choleraGiven: boolean;
  choleraRiskCriteriaMet: boolean;
  choleraDose: CholeraDose;
  /** Dose 2 only: date of dose 1 (must be 1 to 6 weeks earlier). */
  choleraDose1Date: string;
  /** Booster only: date the last course or booster was completed. */
  choleraLastCourseDate: string;
  choleraBatch: string;
  choleraExpiry: string; // yyyy-mm-dd
  // Safety block and counselling
  adrenalineAvailable: boolean;
  observationCompleted: boolean;
  pilSupplied: boolean;
  followUpAdviceGiven: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  // Exclusion outcome (document: record the advice given and the decision)
  exclusionAdvice: string;
  exclusionReferral: ExclusionReferral;
}

export interface TravelCoreConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  destination: TravelCoreDestinationAssessment;
  malariaRisk: TravelCoreMalariaRisk;
  preventiveMeasures: TravelCorePreventiveMeasures;
  medicinesSupplied: TravelCoreMedicinesSupplied;
  vaccines: TravelCoreVaccineAdministration;
  summary: TravelCoreConsultationSummary;
  completedSteps: Set<number>;
}

export type TravelCoreAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_DESTINATION"; field: keyof TravelCoreDestinationAssessment; value: unknown }
  | { type: "UPDATE_MALARIA_RISK"; field: keyof TravelCoreMalariaRisk; value: unknown }
  | { type: "UPDATE_PREVENTIVE_MEASURES"; field: keyof TravelCorePreventiveMeasures; value: unknown }
  | { type: "UPDATE_MEDICINES_SUPPLIED"; field: keyof TravelCoreMedicinesSupplied; value: unknown }
  | { type: "UPDATE_VACCINES"; field: keyof TravelCoreVaccineAdministration; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof TravelCoreConsultationSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Destination & Duration",
  "Malaria Risk (advice only)",
  "Preventive Measures",
  "Other Supplies (optional)",
  "Vaccine Administration",
  "Summary & Record",
  "Consultation Complete",
];

export function createInitialVaccineAdministration(): TravelCoreVaccineAdministration {
  return {
    noVaccineToday: false,
    hypersensitivity: false,
    acuteFebrileIllness: false,
    pregnant: false,
    immunocompromised: false,
    bleedingDisorder: false,
    giSymptoms: false,
    severeImmunocompromise: false,
    recentAntibiotics: false,
    hepAGiven: false,
    hepAInclusionMet: false,
    hepAProduct: "",
    hepADose: "",
    hepAPrimaryDoseDate: "",
    hepAPrimaryProduct: "",
    hepAPreviousCompleteCourse: false,
    hepAImmunityDocumented: false,
    hepABatch: "",
    hepAExpiry: "",
    hepASite: "",
    typhoidGiven: false,
    typhoidInclusionMet: false,
    typhoidPreviousDose: false,
    typhoidPreviousDoseDate: "",
    typhoidBatch: "",
    typhoidExpiry: "",
    typhoidSite: "",
    choleraGiven: false,
    choleraRiskCriteriaMet: false,
    choleraDose: "",
    choleraDose1Date: "",
    choleraLastCourseDate: "",
    choleraBatch: "",
    choleraExpiry: "",
    adrenalineAvailable: false,
    observationCompleted: false,
    pilSupplied: false,
    followUpAdviceGiven: false,
    adverseReaction: false,
    adverseReactionDetails: "",
    exclusionAdvice: "",
    exclusionReferral: "",
  };
}

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialTravelCoreState(): TravelCoreConsultationState {
  return {
    currentStep: 0,
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
    destination: {
      destination: "",
      departureDate: "",
      returnDate: "",
      duration: null,
      isEndemicMalariaZone: false,
      vaccinationRequirementsIdentified: false,
      foodWaterRiskLevel: "moderate",
      sunExposureRisk: "moderate",
    },
    malariaRisk: {
      malariaZone: false,
      resistanceProfile: "",
      chemoprophylaxisAdvised: false,
      chemoprophylaxisPlan: "",
    },
    preventiveMeasures: {
      insectRepellentAdvised: false,
      bedNetAdvised: false,
      lightClothingAdvised: false,
      vaccineCheckAdvised: false,
      sunProtectionAdvised: false,
      foodWaterPrecautionsAdvised: false,
      travellersVaccineNotes: "",
    },
    medicinesSupplied: {
      biteAvoidanceKitSupplied: false,
      antidiarrhoealsAdvised: false,
      firstAidKitAdvised: false,
      antihistamineSupplied: false,
      skinCreamSupplied: false,
      otherMedicinesNotes: "",
    },
    vaccines: createInitialVaccineAdministration(),
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })(),
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
      destinationSummary: "",
      preventiveAdviceSummary: "",
    },
    completedSteps: new Set(),
  };
}
