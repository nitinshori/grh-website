import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

/**
 * Hepatitis B (Engerix B / HBvaxPRO) ePGD, PGD version 005, issued 11
 * September 2026. Individuals aged 16 years and over; under 16 refers.
 * Standard (0, 1, 6 months) and accelerated (0, 1, 2, 12 months) schedules
 * only. The 40 microgram presentations (Fendrix, HBvaxPRO 40) are not covered.
 */
export const PGD_VERSION = "Hepatitis B (Engerix B / HBvaxPRO) PGD v005, issued 11 September 2026";

export type Vaccine = "" | "engerix-20" | "hbvaxpro-10";
export const VACCINE_LABEL: Record<Exclude<Vaccine, "">, string> = {
  "engerix-20": "Engerix B 20 micrograms/1 mL, 1 mL per dose (16 years and over)",
  "hbvaxpro-10": "HBvaxPRO 10 micrograms/1 mL, 1 mL per dose (16 years and over)",
};

export type Schedule = "" | "standard" | "accelerated";
export type DoseNumber = "" | "1st" | "2nd" | "3rd" | "booster";
export type PreviousVaccination = "" | "none" | "partial-course" | "full-course";
export type ExclusionReferral = "" | "gp" | "occupational-health" | "immunisation-service" | "declined";

export interface HepBState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: {
    reasonForVaccination: string;
    previousVaccination: PreviousVaccination;
    antiHBsLevelChecked: boolean;
    antiHBsLevel: string;
    knownHBPositive: boolean;
    knownHCVPositive: boolean;
    knownHIVPositive: boolean;
    currentAcuteIllness: boolean;
    allergyVaccineComponent: boolean;
    immunosuppressed: boolean;
    pregnancy: boolean;
    previousSevereReaction: boolean;
    bleedingDisorderOrAnticoagulant: boolean;
    eligibleUnderGuidance: boolean;
    /** Exclusion outcome: the document requires the advice given and the decision to be recorded. */
    exclusionAdvice: string;
    exclusionReferral: ExclusionReferral;
  };
  treatment: {
    vaccine: Vaccine;
    schedule: Schedule;
    doseNumber: DoseNumber;
    /** Required for any dose after the first: the interval is checked against the schedule. */
    previousDoseDate: string;
    injectionSite: string;
    batchNumber: string;
    expiryDate: string;
    adrenalineAvailable: boolean;
    observationPeriodCompleted: boolean;
    adverseReaction: boolean;
    adverseReactionDetails: string;
  };
  counselling: {
    counsellingProvided: boolean;
    pilSupplied: boolean;
    followUpAdviceGiven: boolean;
    /** Derived from the schedule and dose number; not typed. */
    nextDoseDate: string;
    courseComplete: boolean;
    serologyRecommended: boolean;
    postExposureProtocolExplained: boolean;
    gpInformed: "" | "informed" | "declined";
    counsellingNotes: string;
  };
  summary: BaseSummary;
}

export const STEP_LABELS = ["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Record"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Fresh state objects every time: nothing from the previous patient survives a reset. */
export function createInitialHepBOccupationalState(): HepBState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      reasonForVaccination: "",
      previousVaccination: "",
      antiHBsLevelChecked: false,
      antiHBsLevel: "",
      knownHBPositive: false,
      knownHCVPositive: false,
      knownHIVPositive: false,
      currentAcuteIllness: false,
      allergyVaccineComponent: false,
      immunosuppressed: false,
      pregnancy: false,
      previousSevereReaction: false,
      bleedingDisorderOrAnticoagulant: false,
      eligibleUnderGuidance: false,
      exclusionAdvice: "",
      exclusionReferral: "",
    },
    treatment: {
      vaccine: "",
      schedule: "",
      doseNumber: "",
      previousDoseDate: "",
      injectionSite: "",
      batchNumber: "",
      expiryDate: "",
      adrenalineAvailable: false,
      observationPeriodCompleted: false,
      adverseReaction: false,
      adverseReactionDetails: "",
    },
    counselling: {
      counsellingProvided: false,
      pilSupplied: false,
      followUpAdviceGiven: false,
      nextDoseDate: "",
      courseComplete: false,
      serologyRecommended: false,
      postExposureProtocolExplained: false,
      gpInformed: "",
      counsellingNotes: "",
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: formatLocalDate(new Date()),
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      clinicalNotes: "",
    },
  };
}
