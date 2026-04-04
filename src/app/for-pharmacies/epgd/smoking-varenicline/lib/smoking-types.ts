/**
 * Smoking Cessation ePGD - Type Definitions
 * UK Pharmacy PGD Consultation Tool for Varenicline (Champix)
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
  },

  pharmacistName: "",
  pharmacistGMCNumber: "",
  consultationDate: "",
  pharmacyName: "",
  pharmacyAddressLine1: "",
  pharmacyAddressLine2: "",
  pharmacyPostcode: "",
};
