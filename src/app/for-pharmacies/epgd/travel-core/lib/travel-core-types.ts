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

export interface TravelCoreMalariaRisk {
  malariaZone: boolean;
  resistanceProfile: string; // e.g., "CQ-resistant", "MDR"
  chemoprophylaxisAdvised: boolean;
  recommendedDrug: string;
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

export interface TravelCoreConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  destination: TravelCoreDestinationAssessment;
  malariaRisk: TravelCoreMalariaRisk;
  preventiveMeasures: TravelCorePreventiveMeasures;
  medicinesSupplied: TravelCoreMedicinesSupplied;
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
  | { type: "UPDATE_SUMMARY"; field: keyof TravelCoreConsultationSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Destination & Duration",
  "Malaria Risk Assessment",
  "Preventive Measures",
  "Medicines & Supplies",
  "Summary & Record",
  "Consultation Complete",
];

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
      recommendedDrug: "",
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
      destinationSummary: "",
      preventiveAdviceSummary: "",
    },
    completedSteps: new Set(),
  };
}
