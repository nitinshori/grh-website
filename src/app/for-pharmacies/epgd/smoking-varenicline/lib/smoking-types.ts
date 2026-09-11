/**
 * Smoking Cessation ePGD - Type Definitions
 * UK Pharmacy PGD Consultation Tool for Varenicline 0.5mg and 1mg tablets
 * (any UK-licensed generic; Champix is no longer marketed in the UK).
 * Aligned to PGD version 003, issued 11 September 2026.
 */

export type AlertSeverity = "stop" | "caution" | "red-flag";

export interface ClinicalAlert {
  severity: AlertSeverity;
  code: string;
  message: string;
  detail: string;
}

export interface SmokingAssessment {
  // Smoking history
  cigarettesPerDay: number | null;
  yearsSmoked: number | null;
  previousQuitAttempts: number | null;
  previousQuitMethods: string;
  previousVarenicline: boolean;
  previousVareniclineOutcome: string;
  nrtCurrentlyUsing: boolean;
  nrtDetails: string;
  motivationLevel: "low" | "moderate" | "high" | "";
  quitDate: string;
  readyToQuit: boolean;

  // Fagerström Test fields
  timeToFirstCigarette: "within-5" | "6-30" | "31-60" | ">60" | "";
  difficultToRefrain: boolean;
  whichCigaretteMostHateToGiveUp: "first-morning" | "other" | "";
  howManyPerDay: "10-or-less" | "11-20" | "21-30" | "31+" | "";
  smokeMoreInMorning: boolean;
  smokeWhenIll: boolean;
  fagerstromScore: number;
}

export interface SmokingMedicalHistory {
  psychiatricHistory: boolean;
  psychiatricDetails: string;
  seizureHistory: boolean;
  /** Known hypersensitivity to varenicline or excipients: exclusion. */
  hypersensitivityVarenicline: boolean;
  /** none: eGFR above 50; moderate: eGFR 30 to 50 (caution); severe: eGFR below 30 or end-stage renal disease (exclusion). */
  renalImpairment: "none" | "moderate" | "severe" | "";
  hepaticImpairment: "none" | "mild-moderate" | "severe" | "";
  pregnant: boolean;
  breastfeeding: boolean;
  cardiovascularDisease: boolean;
  eatingDisorder: boolean;
  currentDepression: boolean;
  suicidalIdeation: boolean;
}

export interface SmokingMedications {
  currentMedications: string;
  allergies: string;
  takesWarfarin: boolean;
  takesInsulin: boolean;
  takesClopidogrel: boolean;
  takesTheophylline: boolean;
  takesAntipsychotics: boolean;
  takesAntidepressants: boolean;
}

export interface SmokingDosePlan {
  startDate: string;
  quitDate: string;
  phase: "titration" | "maintenance" | "";
  currentDose: string;
  weeksCompleted: number | null;
  treatmentDuration: "12-weeks" | "24-weeks-extended" | "";
  /** starter: starter pack; continuation: up to 56 x 1mg tablets (4-week supply). */
  supplyType: "starter" | "continuation" | "";
  quantity: number;
}

export interface SmokingCounselling {
  neuropsychiatricWarning: boolean;
  drivingWarning: boolean;
  alcoholWarning: boolean;
  nauseaManagement: boolean;
  vividDreams: boolean;
  completeCourseAdvice: boolean;
  behaviouralSupport: boolean;
  quitDatePlanning: boolean;
  returnIfWorsening: boolean;
  carbonMonoxideMonitoring: boolean;
  // PGD v003 follow-up advice row
  physicalSymptomsWarning: boolean;
  slipUpAdvice: boolean;
  followUpSchedule: boolean;
  pregnancyAdvice: boolean;
  doNotStopSuddenly: boolean;
}

export interface SmokingToolFormData {
  // Step 0: Patient Details
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number | null;
  gender: string;
  contactNumber: string;
  email: string;

  // Step 1: Consent & ID
  consentToTreatment: boolean;
  consentToRecord: boolean;
  identityVerified: boolean;

  // Step 2: Smoking Assessment
  assessment: SmokingAssessment;

  // Step 3: Medical History
  medicalHistory: SmokingMedicalHistory;

  // Step 4: Current Medications
  medications: SmokingMedications;

  // Step 5: Contraindications Review
  contradicationsReviewed: boolean;
  pharmacistApproves: boolean;

  // Step 6: Dose Titration Plan
  dosePlan: SmokingDosePlan;

  // Step 7: Counselling
  counselling: SmokingCounselling;

  // Step 8: Summary
  pharmacistName: string;
  pharmacistGMCNumber: string;
  consultationDate: string;
  pharmacyName: string;
  pharmacyAddressLine1: string;
  pharmacyAddressLine2: string;
  pharmacyPostcode: string;
}

export const STEP_LABELS: string[] = [
  "Patient Details",
  "Consent",
  "Assessment",
  "Medical History",
  "Medications",
  "Contraindications",
  "Dose Plan",
  "Counselling",
  "Summary",
];

export const DEFAULT_FORM_DATA: SmokingToolFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  age: null,
  gender: "",
  contactNumber: "",
  email: "",

  consentToTreatment: false,
  consentToRecord: false,
  identityVerified: false,

  assessment: {
    cigarettesPerDay: null,
    yearsSmoked: null,
    previousQuitAttempts: null,
    previousQuitMethods: "",
    previousVarenicline: false,
    previousVareniclineOutcome: "",
    nrtCurrentlyUsing: false,
    nrtDetails: "",
    motivationLevel: "",
    quitDate: "",
    readyToQuit: false,
    timeToFirstCigarette: "",
    difficultToRefrain: false,
    whichCigaretteMostHateToGiveUp: "",
    howManyPerDay: "",
    smokeMoreInMorning: false,
    smokeWhenIll: false,
    fagerstromScore: 0,
  },

  medicalHistory: {
    psychiatricHistory: false,
    psychiatricDetails: "",
    seizureHistory: false,
    hypersensitivityVarenicline: false,
    renalImpairment: "",
    hepaticImpairment: "",
    pregnant: false,
    breastfeeding: false,
    cardiovascularDisease: false,
    eatingDisorder: false,
    currentDepression: false,
    suicidalIdeation: false,
  },

  medications: {
    currentMedications: "",
    allergies: "",
    takesWarfarin: false,
    takesInsulin: false,
    takesClopidogrel: false,
    takesTheophylline: false,
    takesAntipsychotics: false,
    takesAntidepressants: false,
  },

  contradicationsReviewed: false,
  pharmacistApproves: false,

  dosePlan: {
    startDate: "",
    quitDate: "",
    phase: "",
    currentDose: "",
    weeksCompleted: null,
    treatmentDuration: "",
    supplyType: "",
    quantity: 0,
  },

  counselling: {
    neuropsychiatricWarning: false,
    drivingWarning: false,
    alcoholWarning: false,
    nauseaManagement: false,
    vividDreams: false,
    completeCourseAdvice: false,
    behaviouralSupport: false,
    quitDatePlanning: false,
    returnIfWorsening: false,
    carbonMonoxideMonitoring: false,
    physicalSymptomsWarning: false,
    slipUpAdvice: false,
    followUpSchedule: false,
    pregnancyAdvice: false,
    doNotStopSuddenly: false,
  },

  pharmacistName: "",
  pharmacistGMCNumber: "",
  consultationDate: "",
  pharmacyName: "",
  pharmacyAddressLine1: "",
  pharmacyAddressLine2: "",
  pharmacyPostcode: "",
};
