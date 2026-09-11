// ─── Sore Throat Test & Treat ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Symptoms ───

export interface SoreThroatSymptoms {
  /** Document exclusion: symptoms for more than 2 weeks. */
  duration: "<3 days" | "3-7 days" | "8-14 days" | ">14 days" | "";
  soreThroatSeverity: "mild" | "moderate" | "severe" | "";
  dysphagia: boolean; // difficulty swallowing
  drooling: boolean;
  trismus: boolean; // difficulty opening mouth
  muffledVoice: boolean; // hot potato voice
  unilateralSwelling: boolean;
  // PGD v005 red flags (airway compromise, quinsy or epiglottitis): any one excludes
  stridor: boolean;
  difficultyBreathing: boolean;
  unableToSwallowSaliva: boolean;
  uvulaDeviation: boolean;
  // PGD v005: possible malignancy pathway, refer to GP
  persistentNeckLumpOrHoarseness: boolean;
  additionalNotes: string;
}

// ─── FeverPAIN Score ───

export interface FeverPAINScore {
  fever: boolean; // temp >38 in last 24hrs
  purulence: boolean; // tonsillar exudate
  attendRapidly: boolean; // symptoms <3 days: DERIVED from symptoms.duration, never ticked by hand
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
  // PGD v005 sepsis screen: temperature 38 or above together with any of these
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicBP: number | null;
  newConfusion: boolean;
  looksUnwell: boolean;
}

// ─── Medical History & Contraindications ───

export interface SoreThroatHistory {
  /** Penicillin or beta-lactam allergy: Yes/No with no default. It chooses the arm, so it is answered, never assumed from an unticked box. */
  penicillinAllergy: "" | "yes" | "no";
  immunosuppressed: boolean;
  neutropeniaRiskMedicine: boolean; // chemotherapy, carbimazole, clozapine, methotrexate or other DMARDs
  recentAntibioticForThisIllness: boolean; // inclusion: no recent antibiotic use for this illness
  ableToTakeOralMedication: boolean; // inclusion
  severeHepaticOrRenalDysfunction: boolean; // exclusion, both arms
  pregnantOrBreastfeeding: boolean; // caution, both arms
  suspectedMononucleosis: boolean; // caution, phenoxymethylpenicillin
  oralContraceptive: boolean; // caution: additional contraception for 7 days
  // Clarithromycin arm exclusions (apply when penicillin allergic)
  macrolideAllergy: boolean;
  ergotamineUse: boolean;
  simvastatinLovastatinUse: boolean;
  qtProlongationRisk: boolean;
  /** Clarithromycin caution: "QT interval risk: assess baseline risk". Recorded, not assumed. */
  qtBaselineRiskAssessed: boolean;
  clarithromycinInteractingMedicine: boolean; // SmPC 4.3 list
  severeHepaticImpairment: boolean;
  myastheniaGravis: boolean;
  // Clarithromycin arm cautions
  renalImpairmentEgfrUnder30: boolean;
  warfarin: boolean;
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
  brand: string; // records: name and brand of medication
}

// ─── Counselling ───

export interface SoreThroatCounselling {
  completeCourse: boolean;
  howToTake: boolean; // Pen V on an empty stomach; clarithromycin with or without food
  contraceptionAdvice: boolean; // additional contraception during course and for 7 days after
  painRelief: boolean; // paracetamol/ibuprofen
  fluidIntake: boolean;
  lozengesGargles: boolean;
  softFoods: boolean;
  returnIfWorsening: boolean; // worsen or no improvement in 3-5 days
  redFlagSymptoms: boolean; // difficulty breathing, unable to swallow
  allergicReactionAdvice: boolean; // report rash, facial swelling, breathing difficulty immediately
  clarithromycinAdvice: boolean; // persistent diarrhoea (C. difficile), metallic taste
  avoidAntibioticSharing: boolean;
  schoolWorkAdvice: boolean;
  pilSupplied: boolean; // the patient information leaflet provided with the medication
  /** Advice given where the patient is excluded or declines (document record item). */
  exclusionAdvice: string;
  /** Details of any adverse drug reactions and the actions taken (Yellow Card). */
  adverseReactions: string;
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
  stridor: false,
  difficultyBreathing: false,
  unableToSwallowSaliva: false,
  uvulaDeviation: false,
  persistentNeckLumpOrHoarseness: false,
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
  heartRate: null,
  respiratoryRate: null,
  systolicBP: null,
  newConfusion: false,
  looksUnwell: false,
};

export const initialSoreThroatHistory: SoreThroatHistory = {
  penicillinAllergy: "",
  immunosuppressed: false,
  neutropeniaRiskMedicine: false,
  recentAntibioticForThisIllness: false,
  ableToTakeOralMedication: false,
  severeHepaticOrRenalDysfunction: false,
  pregnantOrBreastfeeding: false,
  suspectedMononucleosis: false,
  oralContraceptive: false,
  macrolideAllergy: false,
  ergotamineUse: false,
  simvastatinLovastatinUse: false,
  qtProlongationRisk: false,
  qtBaselineRiskAssessed: false,
  clarithromycinInteractingMedicine: false,
  severeHepaticImpairment: false,
  myastheniaGravis: false,
  renalImpairmentEgfrUnder30: false,
  warfarin: false,
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
  brand: "",
};

export const initialSoreThroatCounselling: SoreThroatCounselling = {
  completeCourse: false,
  howToTake: false,
  contraceptionAdvice: false,
  painRelief: false,
  fluidIntake: false,
  lozengesGargles: false,
  softFoods: false,
  returnIfWorsening: false,
  redFlagSymptoms: false,
  allergicReactionAdvice: false,
  clarithromycinAdvice: false,
  avoidAntibioticSharing: false,
  schoolWorkAdvice: false,
  pilSupplied: false,
  exclusionAdvice: "",
  adverseReactions: "",
};
