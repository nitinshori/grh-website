// ─── Premature Ejaculation (Dapoxetine) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary, DoseRecommendation, ClinicalAlert } from "../../shared/types";

// ─── Extended types for PE PGD ───

export interface PEPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

/** Inclusion criterion: "Patient has provided informed WRITTEN consent". The
 *  shared consent step records verbal-or-written as one tick. */
export interface PEConsent extends BaseConsent {
  writtenConsentObtained: boolean;
}

export interface PEClinicalAssessment {
  peType: "lifelong" | "acquired" | ""; // lifelong vs acquired
  ieltMinutes: number | null; // Intravaginal Ejaculation Latency Time
  relationshipDistress: boolean;
  psychologicalDistress: boolean;
}

export interface PEMedicalHistory {
  cardiacDisorder: boolean; // NYHA II-IV heart failure, significant valvular disease
  cardiacDisorderDetail: string;
  /** PGD v005 exclusions: conduction abnormality or QT-prolonging condition; history of IHD. */
  conductionOrQT: boolean;
  ischaemicHeartDisease: boolean;
  /** History of syncope or orthostatic hypotension (exclusion). */
  syncope: boolean;
  /** Moderate or severe hepatic impairment, Child-Pugh B or C (exclusion). */
  severeHepaticImpairment: boolean;
  /** Mild hepatic impairment, Child-Pugh A (caution). */
  mildHepaticImpairment: boolean;
  /** Moderate or severe renal impairment (exclusion). */
  renalImpairment: boolean;
  /** History of bipolar disorder or mania (exclusion). */
  bipolarOrMania: boolean;
  /** Decision 46 exclusions: red flags that need a diagnosis before an SSRI.
   *  Symptoms suggesting prostatitis (perineal, pelvic or genital pain, painful
   *  ejaculation, dysuria or lower urinary tract symptoms). */
  prostatitisSymptoms: boolean;
  /** Symptoms suggesting thyroid dysfunction (weight change, heat or cold
   *  intolerance, palpitations, tremor, marked fatigue). */
  thyroidSymptoms: boolean;
  /** Symptoms suggesting a neurological cause (new numbness, weakness, or
   *  bladder or bowel symptoms). */
  neurologicalSymptoms: boolean;
  /** Premature ejaculation of recent onset together with another new symptom. */
  recentOnsetWithNewSymptom: boolean;
  uncontrolledEpilepsy: boolean;
  // Cautions (PGD v005)
  seizureHistory: boolean;
  bleedingDisorderOrAnticoagulant: boolean;
  orthostaticRiskFactors: boolean;
  cyp2d6PoorMetaboliser: boolean;
  hyponatraemiaRisk: boolean;
  otherConditions: string;
}

export interface PECurrentMedications {
  /** MAOIs, thioridazine, SSRIs, SNRIs, tricyclics, or any other serotonergic
   *  medicine (tramadol, triptans, linezolid, lithium, L-tryptophan, St John's
   *  wort), now or within the last 14 days. Exclusion. */
  maoisOrSsrisOrSnris: boolean;
  thioridazine: boolean;
  /** Potent CYP3A4 inhibitor (ketoconazole, ritonavir, etc.): exclusion. */
  potentCyp3a4Inhibitor: boolean;
  /** Moderate CYP3A4 inhibitor: caution. */
  moderateCyp3a4Inhibitor: boolean;
  /** PDE5 inhibitor (sildenafil, tadalafil): caution, hypotension risk. */
  pde5Inhibitor: boolean;
  otherMedications: string;
}

export interface PEContraindications {
  hadSevereOrSuddenAE: boolean; // Adverse events
  aeDetail: string;
}

export interface PEMedicineSupply {
  dapoxetine30mgSupplied: boolean;
  mayIncreaseTo60mg: boolean;
  /** Strength supplied: 30mg starting dose; 60mg only where 30mg was insufficient and well tolerated. */
  strengthSupplied: "" | "30mg" | "60mg";
  /** Up to 6 tablets per supply (PGD v005). */
  quantity: number | null;
  brand: string;
  understandsUsage: boolean; // 1-3 hours before, max once per 24h, take with water
  understandsOrthostatic: boolean; // Lying/standing BP done
  /** Written information row: the Priligy PIL was supplied. */
  pilSupplied: boolean;
}

export interface PECounselling {
  takeWithWater: boolean;
  maxOnePer24h: boolean;
  avoidAlcohol: boolean;
  standSlowly: boolean;
  hydration: boolean;
  noDrive2hrs: boolean;
  avoidGrapefruit: boolean;
  mayHaveSideEffects: boolean;
  reportChestPainHeadacheFainting: boolean;
  priapismWarning: boolean;
  informGp: boolean;
  notForDaily: boolean;
  review4weeks: boolean;
}

export interface PEConsultationState {
  patient: PEPatientDetails;
  consent: PEConsent;
  clinicalAssessment: PEClinicalAssessment;
  medicalHistory: PEMedicalHistory;
  currentMedications: PECurrentMedications;
  contraindications: PEContraindications;
  medicineSupply: PEMedicineSupply;
  counselling: PECounselling;
  summary: BaseSummary & { lyingBP: string; standingBP: string };
  currentStep: number;
}

export type PEAction =
  | { type: "UPDATE_PATIENT"; field: keyof PEPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof PEConsent; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof PEClinicalAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof PEMedicalHistory; value: any }
  | { type: "UPDATE_CURRENT_MEDICATIONS"; field: keyof PECurrentMedications; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof PEContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof PEMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof PECounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): PEConsultationState {
  return {
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
      maleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
      writtenConsentObtained: false,
    },
    clinicalAssessment: {
      peType: "",
      ieltMinutes: null,
      relationshipDistress: false,
      psychologicalDistress: false,
    },
    medicalHistory: {
      cardiacDisorder: false,
      cardiacDisorderDetail: "",
      conductionOrQT: false,
      ischaemicHeartDisease: false,
      syncope: false,
      severeHepaticImpairment: false,
      mildHepaticImpairment: false,
      renalImpairment: false,
      bipolarOrMania: false,
      prostatitisSymptoms: false,
      thyroidSymptoms: false,
      neurologicalSymptoms: false,
      recentOnsetWithNewSymptom: false,
      uncontrolledEpilepsy: false,
      seizureHistory: false,
      bleedingDisorderOrAnticoagulant: false,
      orthostaticRiskFactors: false,
      cyp2d6PoorMetaboliser: false,
      hyponatraemiaRisk: false,
      otherConditions: "",
    },
    currentMedications: {
      maoisOrSsrisOrSnris: false,
      thioridazine: false,
      potentCyp3a4Inhibitor: false,
      moderateCyp3a4Inhibitor: false,
      pde5Inhibitor: false,
      otherMedications: "",
    },
    contraindications: {
      hadSevereOrSuddenAE: false,
      aeDetail: "",
    },
    medicineSupply: {
      dapoxetine30mgSupplied: false,
      mayIncreaseTo60mg: false,
      strengthSupplied: "",
      quantity: null,
      brand: "",
      understandsUsage: false,
      understandsOrthostatic: false,
      pilSupplied: false,
    },
    counselling: {
      takeWithWater: false,
      maxOnePer24h: false,
      avoidAlcohol: false,
      standSlowly: false,
      hydration: false,
      noDrive2hrs: false,
      avoidGrapefruit: false,
      mayHaveSideEffects: false,
      reportChestPainHeadacheFainting: false,
      priapismWarning: false,
      informGp: false,
      notForDaily: false,
      review4weeks: false,
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
      lyingBP: "",
      standingBP: "",
    },
    currentStep: 0,
  };
}
