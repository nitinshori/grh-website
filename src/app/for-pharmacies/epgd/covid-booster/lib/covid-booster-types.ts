import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface CovidBoosterAssessment {
  /** PGD v008 covers 12 years and over, not 18 and over. */
  ageConfirmed: boolean;
  /**
   * Explicit answer to "Has the patient received a COVID-19 vaccine before?".
   * previousCovidVaccine is derived from it. As an unticked box, "no previous
   * vaccine" was the default, so the primary-course stop fired the moment
   * "Immunosuppressed" was ticked, before the question had been answered
   * (stop audit, 11 Sep 2026).
   */
  previousCovidVaccineAnswer: "" | "yes" | "no";
  previousCovidVaccine: boolean;
  /** Date of the previous COVID-19 vaccine dose, where known (PGD v008 records row). */
  previousDoseDate: string;
  /** Date not known: the individual states the last dose was more than 3 months ago. Printed on the record. */
  previousDoseDateUnknown: boolean;
  timelinessEligible: boolean;
  /** Under 3 months since the last dose but a shorter interval is specifically advised in national guidance for this individual. */
  shorterIntervalNationalGuidance: boolean;
  /** PGD v008 inclusion: NHS entitlement. */
  nhsStatus: '' | 'not-eligible' | 'eligible-prefers-private';
  /** Resident in a care home for older adults (NHS-eligible cohort). */
  careHomeResident: boolean;
  /**
   * Exclusions asked as explicit yes/no answers. They used to be booleans
   * defaulting to false, rendered as pre-ticked "NOT documented" boxes, so
   * the step could be passed without reading it (adversarial review, 11 Sep 2026).
   */
  anaphylaxisToPreviousDose: "" | "yes" | "no";
  anaphylaxisToPEG: "" | "yes" | "no";
  anaphylaxisToPolysorbate: "" | "yes" | "no";
  severeFebrilIllness: "" | "yes" | "no";
  /** Exclusion: confirmed current COVID-19 infection, defer until recovered. */
  currentCovidInfection: boolean;
  onAnticoagulants: boolean;
  /** Bleeding disorder (exclusion unless IM injection assessed as safe by a clinician familiar with the bleeding risk). */
  bleedingDisorder: boolean;
  /**
   * Explicit answer to "Has intramuscular injection been assessed as safe by a
   * clinician familiar with the bleeding risk?". bleedingDisorderAssessedSafe
   * is derived from it. The stop fires only on "no"; blank is a validation
   * message (stop audit, 11 Sep 2026).
   */
  bleedingDisorderAssessedAnswer: "" | "yes" | "no";
  bleedingDisorderAssessedSafe: boolean;
  myocarditisHistory: boolean;
  /** Caution: pregnancy, confirm vaccine and indication against national guidance. */
  pregnant: boolean;
  /** Caution: history of capillary leak syndrome (Spikevax). */
  capillaryLeakHistory: boolean;
  /**
   * Needed for two separate rules in PGD v008: a primary course in someone
   * unvaccinated AND immunosuppressed is excluded, and Comirnaty XFG must be
   * given in preference to LP.8.1 for anyone immunosuppressed or aged 75+.
   */
  immunosuppressed: boolean;
}

/**
 * The product actually given. v003 of this tool recorded none of this: no
 * product, no batch number, no expiry, no site. A recall could not have been
 * actioned from these records, and nothing distinguished Comirnaty XFG from
 * Comirnaty LP.8.1, which is the whole point of the v004 to v008 changeover.
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
  /** Other vaccine given at the same visit and its site (PGD v008: record the site of each). */
  coAdministeredVaccine: string;
  /** Observed for 15 minutes after vaccination (required by the PGD where there is a history of allergy or previous vaccine reaction). */
  observedFifteenMinutes: boolean;
  /** Records row: details of any adverse reaction and the action taken. */
  adverseReaction: string;
  adverseReactionAction: string;
  yellowCardSubmitted: boolean;
  /** PGD v008 consent block, under 16 only. */
  consentBasis: '' | 'parental' | 'gillick';
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
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
  /** PGD v008 counselling: report any suspected side effect via the Yellow Card scheme. */
  explainedYellowCard: boolean;
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
  | { type: "UPDATE_ASSESSMENT"; field: keyof CovidBoosterAssessment; value: boolean | string }
  | { type: "UPDATE_COUNSELLING"; field: keyof CovidBoosterCounselling; value: boolean }
  | { type: "UPDATE_SUPPLY"; field: keyof CovidBoosterSupply; value: string | boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// Consent is taken before the vaccine is drawn up: the PGD lists valid
// informed consent as an inclusion criterion (adversarial review, 11 Sep 2026).
export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Vaccine Eligibility",
  "Allergy & Red Flags",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
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
      previousCovidVaccineAnswer: "",
      previousCovidVaccine: false,
      previousDoseDate: "",
      previousDoseDateUnknown: false,
      timelinessEligible: false,
      shorterIntervalNationalGuidance: false,
      nhsStatus: "",
      careHomeResident: false,
      anaphylaxisToPreviousDose: "",
      anaphylaxisToPEG: "",
      anaphylaxisToPolysorbate: "",
      severeFebrilIllness: "",
      currentCovidInfection: false,
      onAnticoagulants: false,
      bleedingDisorder: false,
      bleedingDisorderAssessedAnswer: "",
      bleedingDisorderAssessedSafe: false,
      myocarditisHistory: false,
      pregnant: false,
      capillaryLeakHistory: false,
      immunosuppressed: false,
    },
    supply: {
      vaccineProduct: "",
      batchNumber: "",
      expiryDate: "",
      administrationSite: "",
      administrationTime: "",
      lp81FormulationExplained: false,
      coAdministeredVaccine: "",
      observedFifteenMinutes: false,
      adverseReaction: "",
      adverseReactionAction: "",
      yellowCardSubmitted: false,
      consentBasis: "",
      parentName: "",
      parentRelationship: "",
      gillickBasis: "",
    },
    counselling: {
      explainedBoosterRationale: false,
      discussedCommonReactions: false,
      explainedObservationPeriod: false,
      discussedSeriousReactions: false,
      providedWrittenInfo: false,
      explainedYellowCard: false,
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
