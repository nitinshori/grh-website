// ─── Sore Throat Test & Treat ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Symptoms ───

export interface SoreThroatSymptoms {
  duration: "<3 days" | "3-7 days" | ">7 days" | "";
  soreThroatSeverity: "mild" | "moderate" | "severe" | "";
  dysphagia: boolean; // difficulty swallowing
  drooling: boolean;
  trismus: boolean; // difficulty opening mouth
  muffledVoice: boolean; // hot potato voice
  unilateralSwelling: boolean;
  additionalNotes: string;
}

// ─── FeverPAIN Score ───

export interface FeverPAINScore {
  fever: boolean; // temp >38 in last 24hrs
  purulence: boolean; // tonsillar exudate
  attendRapidly: boolean; // symptoms <3 days
  inflamedTonsils: boolean; // severely inflamed
  noCoughCoryza: boolean; // absence of cough/runny nose
  totalScore: number; // 0-5, auto-calculated
}

// ─── Examination & Test Results ───

export interface SoreThroatExamination {
  rapidStrepAResult: "positive" | "negative" | "not-performed" | "";
  tonsillarAppearance: "normal" | "erythematous" | "exudate" | "abscess" | "";
  cervicalLymphadenopathy: boolean;
  temperature: number | null;
}

// ─── Medical History & Contraindications ───

export interface SoreThroatHistory {
  penicillinAllergy: boolean;
  immunosuppressed: boolean;
  recurrentTonsillitis: boolean; // 7+ episodes/year
  previousQuinsy: boolean;
  rheumaticFeverHistory: boolean;
  currentMedications: string;
  allergies: string;
}

// ─── Medicine Selection ───

export interface SoreThroatMedicine {
  medicine: "phenoxymethylpenicillin" | "clarithromycin" | "none" | "";
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  backupPrescription: boolean; // delayed/back-up strategy
}

// ─── Counselling ───

export interface SoreThroatCounselling {
  completeCourse: boolean;
  painRelief: boolean; // paracetamol/ibuprofen
  fluidIntake: boolean;
  softFoods: boolean;
  returnIfWorsening: boolean; // worsen or no improvement in 3-5 days
  redFlagSymptoms: boolean; // difficulty breathing, unable to swallow
  avoidAntibioticSharing: boolean;
  schoolWorkAdvice: boolean;
}

// ─── Complete State ───

export interface SoreThroatState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  symptoms: SoreThroatSymptoms;
  feverPainScore: FeverPAINScore;
  examination: SoreThroatExamination;
  history: SoreThroatHistory;
  medicine: SoreThroatMedicine;
  counselling: SoreThroatCounselling;
  summary: BaseSummary;
}

// ─── Initial Values ───

export const initialSoreThroatSymptoms: SoreThroatSymptoms = {
  duration: "",
  soreThroatSeverity: "",
  dysphagia: false,
  drooling: false,
  trismus: false,
  muffledVoice: false,
  unilateralSwelling: false,
  additionalNotes: "",
};

export const initialFeverPAINScore: FeverPAINScore = {
  fever: false,
  purulence: false,
  attendRapidly: false,
  inflamedTonsils: false,
  noCoughCoryza: false,
  totalScore: 0,
};

export const initialSoreThroatExamination: SoreThroatExamination = {
  rapidStrepAResult: "",
  tonsillarAppearance: "",
  cervicalLymphadenopathy: false,
  temperature: null,
};

export const initialSoreThroatHistory: SoreThroatHistory = {
  penicillinAllergy: false,
  immunosuppressed: false,
  recurrentTonsillitis: false,
  previousQuinsy: false,
  rheumaticFeverHistory: false,
  currentMedications: "",
  allergies: "",
};

export const initialSoreThroatMedicine: SoreThroatMedicine = {
  medicine: "",
  dose: "",
  frequency: "",
  duration: "",
  quantity: 0,
  backupPrescription: false,
};

export const initialSoreThroatCounselling: SoreThroatCounselling = {
  completeCourse: false,
  painRelief: false,
  fluidIntake: false,
  softFoods: false,
  returnIfWorsening: false,
  redFlagSymptoms: false,
  avoidAntibioticSharing: false,
  schoolWorkAdvice: false,
};
