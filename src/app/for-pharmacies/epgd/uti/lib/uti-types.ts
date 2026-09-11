import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── UTI-Specific Data Structures ───

export interface UTISymptoms {
  dysuria: boolean;
  /** PGD v007 inclusion: two or more of dysuria, new nocturia, frequency, urgency. */
  nocturia: boolean;
  frequency: boolean;
  urgency: boolean;
  suprapubicPain: boolean;
  haematuria: boolean;
  vaginalDischarge: boolean;
  /** Pelvic pain, intermenstrual or post-coital bleeding, or a new or recent
   *  sexual partner: PGD v007 excludes and refers for STI testing. */
  pelvicPain: boolean;
  abnormalBleeding: boolean;
  stiHistory: boolean;
  duration: string; // "< 3 days" | "3-7 days" | "> 7 days" | "unknown"
  additionalNotes: string;
  // Appendix 1 red flags (PGD v007). Every one is a stop.
  redFlagsAsked: boolean;
  feverRigors: boolean;
  loinFlankPain: boolean;
  nauseaVomiting: boolean;
  confusionDrowsiness: boolean;
  systemicallyUnwell: boolean;
}

export interface UTIMedicalHistory {
  pregnant: boolean;
  pregnancyPossible: boolean;
  breastfeeding: boolean;
  /** Indwelling catheter, or a catheter removed within the last 7 days. */
  catheterised: boolean;
  previousUTIWithin4Weeks: boolean;
  /** PGD v007: an antibiotic already taken for this same episode, from anyone. */
  antibioticThisEpisode: boolean;
  /** PGD v007 records both answers: episodes in the last 6 and last 12 months.
   *  Recurrent UTI (2 or more in 6 months, or 3 or more in 12 months) is derived. */
  utiEpisodesLast6Months: "" | "0" | "1" | "2+";
  utiEpisodesLast12Months: "" | "0" | "1" | "2" | "3+";
  kidneyDisease: boolean;
  /** The document's renal row, answered in its own terms, with no default:
   *  "" is unanswered and blocks Next. "unknown" is a real answer at a
   *  pharmacy counter and the PGD acts on it (exclude). Aged 60 to 64 with a
   *  NO answer, supply proceeds only on a seen eGFR result (Decision 43). */
  renalImpairment: "" | "none" | "moderate" | "severe" | "unknown";
  /** Decision 43 (PGD reissue, September 2026): a woman aged 60 to 64 who
   *  answers NO proceeds only where an eGFR of 45 mL/min or more, dated within
   *  the last 12 months, has been seen by the pharmacist (NHS App, GP summary
   *  or a letter) and the result, its date and where it was seen are recorded. */
  egfrResultSeen: boolean;
  /** The eGFR value seen, in mL/min. */
  egfrValue: number | null;
  /** Date of the eGFR result seen (ISO yyyy-mm-dd). */
  egfrDate: string;
  /** Where the result was seen: NHS App, GP summary, letter, or other. */
  egfrSource: string;
  /** Diabetes, or any condition causing peripheral neuropathy (nitrofurantoin caution). */
  diabetesUncontrolled: boolean;
  immunosuppressed: boolean;
  knownAbnormalUrinaryTract: boolean;
  // Nitrofurantoin arm exclusions (PGD v007)
  nitrofurantoinHypersensitivity: boolean;
  g6pdDeficiency: boolean;
  previousNitrofurantoinReaction: boolean;
  acutePorphyria: boolean;
  // Trimethoprim arm exclusions (PGD v007)
  trimethoprimHypersensitivity: boolean;
  trimethoprimLast3Months: boolean;
  folateDeficiencyOrBloodDyscrasia: boolean;
  takingMethotrexate: boolean;
  takingPotassiumSparingAgent: boolean;
  takingInteractingMedicine: boolean;
  takingWarfarin: boolean;
  anticoagulationServiceConsulted: boolean;
  hepaticImpairment: boolean;
  allergies: string;
  currentMedications: string;
}

export interface UTIObservations {
  temperature: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
}

export interface UTIMedicineSelection {
  medicine: "nitrofurantoin" | "trimethoprim" | "";
  dose: string;
  duration: string;
  quantity: number;
  /** PGD v007 gate on the trimethoprim arm: the reason nitrofurantoin is
   *  unsuitable must be one of these and must be recorded. */
  trimethoprimReason: "" | "contraindicated" | "intolerance" | "unavailable";
}

export interface UTICounselling {
  completeCourse: boolean;
  hydrationAdvice: boolean;
  /** 48 hour safety netting given in the PGD's terms, and recorded. */
  symptomsToReturn: boolean;
  /** Immediate-action list (Appendix 1 symptoms) given. */
  immediateActionAdvice: boolean;
  /** Nitrofurantoin: take with food or milk. Trimethoprim: doses about 12 hours apart. */
  howToTake: boolean;
  /** Nitrofurantoin only: urine may go dark yellow or brown. */
  darkUrine: boolean;
  /** Nitrofurantoin: numbness, tingling or breathlessness. Trimethoprim: sore
   *  throat, fever, mouth ulcers, bruising or bleeding. */
  stopAndSeekAdvice: boolean;
  avoidCranberry: boolean;
  painRelief: boolean;
  sexualActivityAdvice: boolean;
  /** Written information row: PIL supplied with the product. */
  pilSupplied: boolean;
  /** Disposal row: return any unused medicine to a pharmacy. */
  disposalAdvice: boolean;
}

// ─── UTI Consultation State ───

export interface UTIPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface UTIConsultationState {
  patient: UTIPatientDetails;
  consent: BaseConsent;
  symptoms: UTISymptoms;
  medicalHistory: UTIMedicalHistory;
  observations: UTIObservations;
  medicineSelection: UTIMedicineSelection;
  counselling: UTICounselling;
  summary: BaseSummary;
}

// ─── Initial Values ───

export const initialUTISymptoms: UTISymptoms = {
  dysuria: false,
  frequency: false,
  urgency: false,
  nocturia: false,
  suprapubicPain: false,
  haematuria: false,
  vaginalDischarge: false,
  pelvicPain: false,
  abnormalBleeding: false,
  stiHistory: false,
  duration: "",
  additionalNotes: "",
  redFlagsAsked: false,
  feverRigors: false,
  loinFlankPain: false,
  nauseaVomiting: false,
  confusionDrowsiness: false,
  systemicallyUnwell: false,
};

export const initialUTIMedicalHistory: UTIMedicalHistory = {
  pregnant: false,
  pregnancyPossible: false,
  breastfeeding: false,
  catheterised: false,
  previousUTIWithin4Weeks: false,
  antibioticThisEpisode: false,
  utiEpisodesLast6Months: "",
  utiEpisodesLast12Months: "",
  kidneyDisease: false,
  renalImpairment: "",
  egfrResultSeen: false,
  egfrValue: null,
  egfrDate: "",
  egfrSource: "",
  diabetesUncontrolled: false,
  immunosuppressed: false,
  knownAbnormalUrinaryTract: false,
  nitrofurantoinHypersensitivity: false,
  g6pdDeficiency: false,
  previousNitrofurantoinReaction: false,
  acutePorphyria: false,
  trimethoprimHypersensitivity: false,
  trimethoprimLast3Months: false,
  folateDeficiencyOrBloodDyscrasia: false,
  takingMethotrexate: false,
  takingPotassiumSparingAgent: false,
  takingInteractingMedicine: false,
  takingWarfarin: false,
  anticoagulationServiceConsulted: false,
  hepaticImpairment: false,
  allergies: "",
  currentMedications: "",
};

export const initialUTIObservations: UTIObservations = {
  temperature: null,
  systolicBP: null,
  diastolicBP: null,
};

export const initialUTIMedicineSelection: UTIMedicineSelection = {
  medicine: "",
  dose: "",
  duration: "",
  quantity: 0,
  trimethoprimReason: "",
};

export const initialUTICounselling: UTICounselling = {
  completeCourse: false,
  hydrationAdvice: false,
  symptomsToReturn: false,
  immediateActionAdvice: false,
  howToTake: false,
  darkUrine: false,
  stopAndSeekAdvice: false,
  avoidCranberry: false,
  painRelief: false,
  sexualActivityAdvice: false,
  pilSupplied: false,
  disposalAdvice: false,
};

export const initialUTIPatientDetails = (basePatient?: Partial<BasePatientDetails>): UTIPatientDetails => ({
  firstName: basePatient?.firstName || "",
  lastName: basePatient?.lastName || "",
  dateOfBirth: basePatient?.dateOfBirth || "",
  age: basePatient?.age ?? null,
  gpName: basePatient?.gpName || "",
  gpPractice: basePatient?.gpPractice || "",
  gpAddress: basePatient?.gpAddress || "",
  gpPhone: basePatient?.gpPhone || "",
  gpEmail: basePatient?.gpEmail || "",
  gpOdsCode: basePatient?.gpOdsCode || "",
  nhsNumber: basePatient?.nhsNumber || "",
  address: basePatient?.address || "",
  phone: basePatient?.phone || "",
  email: basePatient?.email || "",
  femaleConfirmed: false,
});
