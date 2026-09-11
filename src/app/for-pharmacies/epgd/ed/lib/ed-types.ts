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
  gpEmail: string; gpOdsCode: string;
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
  /** Structured record of any previous PDE5 inhibitor. Only a previous
   *  supply of the SAME medicine, at a stated dose, that was tolerated lifts
   *  the document's starting-dose rule (adversarial review, 11 Sep 2026). */
  previousPDE5Inhibitor: "" | "none" | "sildenafil" | "tadalafil-on-demand" | "tadalafil-daily";
  previousPDE5Dose: string;
  previousPDE5Tolerated: boolean;
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
  /** "" until the question has been asked: the record must not state "none"
   *  by default (walkthrough review, 11 Sep 2026). */
  hepaticImpairment: "" | "none" | "mild-moderate" | "severe";
  renalImpairment: "" | "none" | "moderate" | "severe"; // moderate = eGFR 30-50, severe = <30
  retinalDisorders: boolean; // hereditary degenerative
  sickleCell: boolean;
  bleedingDisorders: boolean;
  penileDeformity: boolean; // Peyronie's, angulation, fibrosis
  penileDeformityDetails: string;
  /** PGD v008: previous priapism, or an erection over 4 hours on any PDE5 inhibitor, excludes. */
  priapismHistory: boolean;
  unstableAngina: boolean;
  /** PGD v008: heart failure of NYHA class 2 or greater in the last 6 months. */
  severeHeartFailure: boolean;
  uncontrolledArrhythmias: boolean;
  /** PGD v008: hypertrophic cardiomyopathy, significant aortic stenosis or other
   *  moderate to severe valve disease, or a murmur of unknown cause. */
  structuralHeartDisease: boolean;
  recentMIOrStroke: boolean; // within 6 months
  /** Date of the last cardiovascular review, where known (recorded at every supply). */
  lastCvReviewDate: string;
  naionHistory: boolean; // non-arteritic anterior ischaemic optic neuropathy
  hypogonadism: boolean;
  psychiatricIssues: boolean;
  psychiatricDetails: string;
}

export interface CurrentMedications {
  takesNitrates: boolean;
  /**
   * PGD v002 splits these out. A single "nitrates" tick relies on the
   * pharmacist classifying the drug. Nicorandil has no "nitrate" in its name
   * and appeared in neither arm of v001. Amyl nitrite is bought, not
   * prescribed, and will never be on a medication list, so it needs its own
   * direct question rather than being buried in a list.
   */
  takesNicorandil: boolean;
  usesPoppers: boolean; // HARD STOP - absolute contraindication
  /** PGD v008: the direct question about poppers must be asked and the answer recorded. */
  poppersQuestionAsked: boolean;
  nitrateDetails: string;
  takesRiociguat: boolean; // HARD STOP
  /** PGD v008: excludes the sildenafil arm (25mg in 48 hours cap cannot be titrated). */
  takesRitonavirOrCobicistat: boolean;
  /** PGD v008: excludes the tadalafil arm (combination not recommended in the SmPC). */
  takesDoxazosin: boolean;
  /** PGD v008: already taking any other PDE5 inhibitor, including one obtained online. */
  takesOtherPDE5Inhibitor: boolean;
  takesAlphaBlockers: boolean; // caution - start 25mg
  alphaBlockerStable: boolean; // must be stable on alpha-blocker
  /** True once the stability question has been answered (Yes or No). The
   *  stop is raised on "No", not on the box being untouched. */
  alphaBlockerStabilityAnswered: boolean;
  alphaBlockerDetails: string;
  takesCYP3A4Inhibitors: boolean; // caution - dose adjustment
  cyp3a4Details: string; // e.g. erythromycin, ketoconazole, itraconazole, ritonavir
  otherMedications: string;
  allergies: string;
  /** First exclusion in both arms: known hypersensitivity to sildenafil,
   *  tadalafil or any excipient. A stop, not a free-text note. */
  hypersensitivityPDE5: boolean;
}

export interface Observations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  bpTakenToday: boolean;
  /** PGD v002 Appendix 1 functional test. */
  exerciseTolerance: '' | 'yes' | 'no' | 'unknown';
  /** The cardiovascular fitness answer, in the patient's terms (recorded). */
  exerciseToleranceNotes: string;
  symptomsOnExertionOrSex: boolean;
  /** True once the symptoms question has been answered (Yes or No), so the
   *  record can distinguish "No" from "not asked". */
  symptomsQuestionAsked: boolean;
}

export interface RedFlagsChecklist {
  /** PGD v008 exclusion: ED of sudden onset following trauma, surgery or a new
   *  medicine, or accompanied by penile pain or deformity. Refer for a diagnosis. */
  suddenOnsetSecondaryCause: boolean;
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
  /** Brand supplied (PGD v008 records: name, brand, form, strength). */
  brand: string;
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
  /** One dose in 24 hours. No more. */
  maxOneDoseIn24Hours: boolean;
  /** NEVER with poppers or any nitrate medicine (tadalafil: for two days after a dose). */
  nitrateWarningGiven: boolean;
  /** Chest pain during or after sex: no GTN spray; tell the paramedics what was taken. */
  chestPainAdvice: boolean;
  grapefruitAvoidance: boolean;
  alcoholModeration: boolean;
  sideEffectsExplained: boolean;
  reviewAdvice: boolean; // trial 6-8 occasions before concluding failure
  /** Written information row: the product PIL was supplied. */
  pilSupplied: boolean;
  /** Disposal row: return unused tablets to a pharmacy. */
  disposalAdvice: boolean;
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
