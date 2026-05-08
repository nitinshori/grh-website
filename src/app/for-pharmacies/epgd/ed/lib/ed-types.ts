// ─── ED ePGD TypeScript Interfaces ───

export interface PatientDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number | null;
  genderConfirmed: boolean; // must confirm male
  gpName: string;
  gpPractice: string;
  gpAddress: string;
  gpPhone: string;
  gpOdsCode: string;
  nhsNumber: string;
  address: string;
  phone: string;
  email: string;
}

export interface ConsentDetails {
  informedConsentGiven: boolean;
  idVerified: boolean;
  idType: string; // e.g. "Driving licence", "Passport", "None required"
  patientAwarePrivateService: boolean;
}

export interface PresentingComplaint {
  description: string;
  onsetType: "gradual" | "sudden" | "";
  duration: string; // e.g. "< 3 months", "3-6 months", "6-12 months", "> 12 months"
  severity: "mild" | "moderate" | "severe" | "";
  previousTreatment: boolean;
  previousTreatmentDetails: string;
  psychosexualFactors: boolean;
  psychosexualDetails: string;
}

export interface MedicalHistory {
  cardiovascularDisease: boolean;
  cardiovascularDetails: string;
  diabetes: boolean;
  diabetesType: string;
  neurologicalConditions: boolean;
  neurologicalDetails: string;
  hepaticImpairment: "none" | "mild-moderate" | "severe";
  renalImpairment: "none" | "moderate" | "severe"; // moderate = eGFR 30-50, severe = <30
  retinalDisorders: boolean; // hereditary degenerative
  sickleCell: boolean;
  bleedingDisorders: boolean;
  penileDeformity: boolean; // Peyronie's, angulation, fibrosis
  penileDeformityDetails: string;
  priapismHistory: boolean;
  unstableAngina: boolean;
  severeHeartFailure: boolean; // NYHA class IV
  uncontrolledArrhythmias: boolean;
  recentMIOrStroke: boolean; // within 6 months
  naionHistory: boolean; // non-arteritic anterior ischaemic optic neuropathy
  hypogonadism: boolean;
  psychiatricIssues: boolean;
  psychiatricDetails: string;
}

export interface CurrentMedications {
  takesNitrates: boolean; // HARD STOP - absolute contraindication
  nitrateDetails: string;
  takesRiociguat: boolean; // HARD STOP
  takesAlphaBlockers: boolean; // caution - start 25mg
  alphaBlockerStable: boolean; // must be stable on alpha-blocker
  alphaBlockerDetails: string;
  takesCYP3A4Inhibitors: boolean; // caution - dose adjustment
  cyp3a4Details: string; // e.g. erythromycin, ketoconazole, itraconazole, ritonavir
  otherMedications: string;
  allergies: string;
}

export interface Observations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  bpTakenToday: boolean;
}

export interface RedFlagsChecklist {
  pelvicPerinealTrauma: boolean;
  penileAnatomicalAbnormality: boolean;
  previousPDE5Failure: boolean; // failed 2 different PDE5 inhibitors at max dose
  previousPDE5Details: string;
}

export type MedicineChoice = "sildenafil" | "tadalafil" | "";
export type DosingRegimen = "on-demand" | "daily" | "";

export interface MedicineSelection {
  medicine: MedicineChoice;
  dosingRegimen: DosingRegimen; // tadalafil only: on-demand vs daily
  dose: string; // e.g. "25mg", "50mg", "100mg" for sildenafil; "2.5mg", "5mg", "10mg", "20mg" for tadalafil
  quantity: number; // tablets supplied
  pharmacistOverride: boolean; // pharmacist overrode auto-recommendation
  overrideReason: string;
}

export interface CounsellingChecklist {
  sexualStimulationRequired: boolean;
  timingAdvice: boolean; // when to take relative to activity
  foodInteractions: boolean; // sildenafil: high-fat meal reduces efficacy
  priapismWarning: boolean; // seek help if erection >4hrs
  visionHearingWarning: boolean; // sudden loss → urgent attention
  noSTIProtection: boolean;
  grapefruitAvoidance: boolean;
  alcoholModeration: boolean;
  sideEffectsExplained: boolean;
  reviewAdvice: boolean; // trial 6-8 occasions before concluding failure
  gpReviewRecommended: boolean; // if not under regular CV review
}

export interface ConsultationSummary {
  pharmacistName: string;
  pharmacistGPhC: string;
  pharmacyName: string;
  pharmacyAddress: string;
  consultationDate: string;
  consultationTime: string;
  clinicalNotes: string;
}

// ─── Alert Types ───

export type AlertSeverity = "stop" | "caution" | "red-flag";

export interface ClinicalAlert {
  severity: AlertSeverity;
  code: string;
  message: string;
  detail: string;
}

// ─── Dose Recommendation ───

export interface DoseRecommendation {
  medicine: MedicineChoice;
  dosingRegimen: DosingRegimen;
  dose: string;
  reason: string;
}

// ─── Full Consultation State ───

export interface EDConsultationState {
  currentStep: number;
  patient: PatientDetails;
  consent: ConsentDetails;
  complaint: PresentingComplaint;
  medicalHistory: MedicalHistory;
  medications: CurrentMedications;
  observations: Observations;
  redFlags: RedFlagsChecklist;
  medicineSelection: MedicineSelection;
  counselling: CounsellingChecklist;
  summary: ConsultationSummary;
  // Computed
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type EDAction =
  | { type: "UPDATE_PATIENT"; field: keyof PatientDetails; value: PatientDetails[keyof PatientDetails] }
  | { type: "UPDATE_CONSENT"; field: keyof ConsentDetails; value: ConsentDetails[keyof ConsentDetails] }
  | { type: "UPDATE_COMPLAINT"; field: keyof PresentingComplaint; value: PresentingComplaint[keyof PresentingComplaint] }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof MedicalHistory; value: MedicalHistory[keyof MedicalHistory] }
  | { type: "UPDATE_MEDICATIONS"; field: keyof CurrentMedications; value: CurrentMedications[keyof CurrentMedications] }
  | { type: "UPDATE_OBSERVATIONS"; field: keyof Observations; value: Observations[keyof Observations] }
  | { type: "UPDATE_RED_FLAGS"; field: keyof RedFlagsChecklist; value: RedFlagsChecklist[keyof RedFlagsChecklist] }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof MedicineSelection; value: MedicineSelection[keyof MedicineSelection] }
  | { type: "UPDATE_COUNSELLING"; field: keyof CounsellingChecklist; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof ConsultationSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Step Labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Presenting Complaint",
  "Medical History",
  "Current Medications",
  "Observations",
  "Red Flags & Exclusions",
  "Medicine Selection",
  "Counselling",
  "Summary & Print",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;
