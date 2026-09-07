import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface CovidBoosterAssessment {
  /** PGD v004 covers 12 years and over, not 18 and over. */
  ageConfirmed: boolean;
  previousCovidVaccine: boolean;
  timelinessEligible: boolean;
  anaphylaxisToPreviousDose: boolean;
  anaphylaxisToPEG: boolean;
  anaphylaxisToPolysorbate: boolean;
  severeFebrilIllness: boolean;
  onAnticoagulants: boolean;
  myocarditisHistory: boolean;
  /**
   * Needed for two separate rules in PGD v004: a primary course in someone
   * unvaccinated AND immunosuppressed is excluded, and Comirnaty XFG must be
   * given in preference to LP.8.1 for anyone immunosuppressed or aged 75+.
   */
  immunosuppressed: boolean;
}

/**
 * The product actually given. v003 of this tool recorded none of this: no
 * product, no batch number, no expiry, no site. A recall could not have been
 * actioned from these records, and nothing distinguished Comirnaty XFG from
 * Comirnaty LP.8.1, which is the whole point of the v004 changeover.
 */
export type CovidVaccineProduct =
  | ''
  | 'comirnaty-xfg'
  | 'comirnaty-lp81'
  | 'spikevax-lp81'
  | 'nuvaxovid-jn1';

export interface CovidBoosterSupply {
  vaccineProduct: CovidVaccineProduct;
  batchNumber: string;
  expiryDate: string;
  administrationSite: '' | 'left-deltoid' | 'right-deltoid';
  administrationTime: string;
  /** Required when Comirnaty LP.8.1 is given in place of XFG. */
  lp81FormulationExplained: boolean;
}

/** Dose volume and display name per product, taken from the UK SPCs. */
export const COVID_PRODUCTS: Record<
  Exclude<CovidVaccineProduct, ''>,
  { label: string; volume: string; minAge: number }
> = {
  'comirnaty-xfg': {
    label: 'Comirnaty XFG 30 micrograms/dose, pre-filled syringe (BioNTech/Pfizer)',
    volume: '0.3 mL',
    minAge: 12,
  },
  'comirnaty-lp81': {
    label: 'Comirnaty LP.8.1 30 micrograms/dose, pre-filled syringe (BioNTech/Pfizer)',
    volume: '0.3 mL',
    minAge: 12,
  },
  'spikevax-lp81': {
    label: 'Spikevax LP.8.1 0.1 mg/mL, multidose vial (Moderna)',
    volume: '0.5 mL',
    minAge: 12,
  },
  'nuvaxovid-jn1': {
    label: 'Nuvaxovid JN.1, pre-filled syringe (Sanofi)',
    volume: '0.5 mL',
    minAge: 12,
  },
};

export interface CovidBoosterCounselling {
  explainedBoosterRationale: boolean;
  discussedCommonReactions: boolean;
  explainedObservationPeriod: boolean;
  discussedSeriousReactions: boolean;
  providedWrittenInfo: boolean;
}

export interface CovidBoosterConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: CovidBoosterAssessment;
  counselling: CovidBoosterCounselling;
  supply: CovidBoosterSupply;
  summary: BaseSummary;
  currentStep: number;
}

export type CovidBoosterAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_ASSESSMENT"; field: keyof CovidBoosterAssessment; value: boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof CovidBoosterCounselling; value: boolean }
  | { type: "UPDATE_SUPPLY"; field: keyof CovidBoosterSupply; value: string | boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Vaccine Eligibility",
  "Allergy & Red Flags",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
  "Consultation Complete",
  "Review",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): CovidBoosterConsultationState {
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
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      ageConfirmed: false,
      previousCovidVaccine: false,
      timelinessEligible: false,
      anaphylaxisToPreviousDose: false,
      anaphylaxisToPEG: false,
      anaphylaxisToPolysorbate: false,
      severeFebrilIllness: false,
      onAnticoagulants: false,
      myocarditisHistory: false,
      immunosuppressed: false,
    },
    supply: {
      vaccineProduct: "",
      batchNumber: "",
      expiryDate: "",
      administrationSite: "",
      administrationTime: "",
      lp81FormulationExplained: false,
    },
    counselling: {
      explainedBoosterRationale: false,
      discussedCommonReactions: false,
      explainedObservationPeriod: false,
      discussedSeriousReactions: false,
      providedWrittenInfo: false,
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
    },
    currentStep: 0,
  };
}
