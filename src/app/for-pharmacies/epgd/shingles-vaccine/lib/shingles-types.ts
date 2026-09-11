import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// Aligned to the Shingrix PGD version 007, issued 11 September 2026.

/**
 * Green Book chapter 28a, Box 1: definition of severe immunosuppression for
 * the Shingrix programme. Arm 2 of the PGD (aged 18 to 49) requires one of
 * these categories; "not-severe" and "anticipating" are referrals.
 */
export const SEVERE_IMMUNOSUPPRESSION_OPTIONS: { value: string; label: string }[] = [
  { value: "leukaemia-lymphoma", label: "Acute or chronic leukaemia, or clinically aggressive lymphoma (including Hodgkin's lymphoma), less than 12 months since achieving cure" },
  { value: "lymphoproliferative", label: "Chronic lymphoproliferative disorder or haematological malignancy under follow-up (indolent lymphoma, chronic lymphoid leukaemia, myeloma, Waldenstrom's macroglobulinaemia, other plasma cell dyscrasia)" },
  { value: "hiv-cd4-under-200", label: "HIV/AIDS with a current CD4 count below 200 cells per microlitre" },
  { value: "cellular-immunodeficiency", label: "Primary or acquired cellular or combined immune deficiency (lymphocytes below 1,000 per microlitre, or a functional lymphocyte disorder)" },
  { value: "stem-cell-transplant", label: "Stem cell transplant (allogeneic or autologous) in the previous 24 months, or longer ago with ongoing immunosuppression or graft versus host disease" },
  { value: "chemo-radiotherapy-6m", label: "Immunosuppressive chemotherapy or radiotherapy for any indication, current or in the past 6 months" },
  { value: "solid-organ-transplant-6m", label: "Immunosuppressive therapy for a solid organ transplant, current or in the past 6 months" },
  { value: "targeted-autoimmune-3m", label: "Targeted therapy for autoimmune disease in the past 3 months (JAK inhibitor, biologic immune modulator, TNF inhibitor, IL-6, IL-17, IL-12/23 or IL-23 inhibitor; a B-cell therapy such as rituximab counts for 6 months)" },
  { value: "steroids-immune-mediated", label: "Chronic immune-mediated inflammatory disease treated with prednisolone 20mg or more a day for more than 10 days in the past month, or 10mg or more a day for more than 4 weeks in the past 3 months" },
  { value: "non-biologic-immunomodulator", label: "Non-biological immune-modulating drug above the Box 1 threshold in the past 3 months (methotrexate over 20mg a week, azathioprine over 3mg/kg/day, mercaptopurine over 1.5mg/kg/day, mycophenolate over 1g/day), or a Box 1 combination (prednisolone 7.5mg or more a day with another immunosuppressant other than hydroxychloroquine or sulfasalazine; methotrexate with leflunomide)" },
  { value: "short-course-high-dose-steroid", label: "Short course of prednisolone over 40mg a day for more than a week, for any reason, in the past month" },
  { value: "not-severe", label: "Immunosuppression that does NOT meet Box 1 (for example prednisolone up to 40mg a day for an acute asthma, COPD or COVID-19 episode; replacement, topical or inhaled corticosteroids; primary humoral immunodeficiency without a T-cell defect)" },
  { value: "anticipating", label: "Not yet immunosuppressed: about to start immunosuppressive therapy" },
];

/** Box 1 categories that meet the Arm 2 inclusion. */
export const SEVERE_IMMUNOSUPPRESSION_QUALIFYING = new Set(
  SEVERE_IMMUNOSUPPRESSION_OPTIONS.map((o) => o.value).filter((v) => v !== "not-severe" && v !== "anticipating")
);

export type ShinglesArm = "" | "50-plus" | "18-49-immunosuppressed";

export interface ShinglesAssessment {
  /** Within the licensed indication and one of the two PGD arms: aged 50 or older (Arm 1), or aged 18 to 49 and severely immunosuppressed (Arm 2). */
  ageEligible: boolean;
  immunosuppressed: boolean;
  /**
   * Under 50 only: the explicit answer to "Is the patient severely
   * immunosuppressed (Green Book chapter 28a, Box 1)?". The Arm 2 stop used to
   * fire from the Patient Details step onward for every 18 to 49 year old,
   * before the question had been asked, so Arm 2 patients could never reach
   * the eligibility step (walkthrough review, 11 Sep 2026).
   */
  under50ImmunosuppressionAnswer: "" | "yes" | "no";
  /** Green Book chapter 28a Box 1 category. Required under 50 (Arm 2); optional information at 50 and over. */
  severeImmunosuppressionCategory: string;
  /** Arm 2: the condition or therapy relied on and its dates, as documented in the record. */
  immunosuppressionDetail: string;
  /** Arm 2: where there was any doubt whether Box 1 is met, the treating specialist or GP confirmed it. */
  immunosuppressionDoubt: "" | "no-doubt" | "confirmed" | "unresolved";
  /** Inclusion: an NHS-eligible patient (65 to 79, or severely immunosuppressed and 18 or over) was told Shingrix is free on the NHS before a private supply. */
  nhsEntitlementExplained: boolean;
  /** Exclusion. Tri-state so the step cannot be passed without an explicit answer: "" (unanswered), "yes", "no". */
  anaphylaxisToComponent: "" | "yes" | "no";
  /** Defer in acute illness with fever. Tri-state, as above. */
  severeAcuteIllness: "" | "yes" | "no";
  /** "not-pregnant" | "unknown" | "confirmed" | "breastfeeding". Pregnancy or breastfeeding is an exclusion; unknown is a stop until established. */
  pregnancyStatus: string;
  /** Dose 1 of Shingrix already given (here or elsewhere). */
  previousShingrix: boolean;
  /** Date of dose 1, required when dose 2 is being given (PGD v007 inclusion: record the date of dose 1). */
  previousShingrixDate: string;
  /** Exclusion: has already completed the two-dose course. */
  completedCourse: boolean;
  /** Previous Zostavax is not an exclusion (PGD v007); recorded for the vaccine history. */
  previousZostavax: boolean;
  /** Inclusion: no history of shingles in the past 12 months. Ticked means shingles within 12 months. */
  previousShinglesHistory: boolean;
  /** Caution: allow appropriate spacing from other vaccines (COVID-19, influenza) based on clinical judgement. */
  recentOtherVaccine: boolean;
}

export interface ShinglesSupply {
  doseNumber: "" | "1" | "2";
  vaccinationDate: string;
  batchNumber: string;
  expiryDate: string;
  site: "" | "left-deltoid" | "right-deltoid";
  /** Date the second dose is due (2 to 6 months after dose 1 in Arm 1; 8 weeks to 6 months in Arm 2). */
  nextDoseDue: string;
  /** Dose 2 more than 6 months after dose 1: given as soon as possible, course not restarted (Green Book); the practitioner confirms the interval was recorded. */
  lateDoseAcknowledged: boolean;
  /** Safety block: record that the 15 minute observation period was completed. */
  observedFifteenMinutes: boolean;
  /** Records row: details of any adverse drug reactions and actions taken. */
  adverseReaction: string;
  adverseReactionAction: string;
  yellowCardSubmitted: boolean;
}

export interface ShinglesCounselling {
  explainedDoseSchedule: boolean;
  explainedLocalReactions: boolean;
  /** PGD v007 caution: systemic side effects are common and generally self-limiting. */
  explainedSystemicReactions: boolean;
  explainedEffectiveness: boolean;
  explainedNotLiveVaccine: boolean;
  offeredWrittenInfo: boolean;
  /** PGD v007 follow-up advice given. */
  followUpAdviceGiven: boolean;
}

export interface ShinglesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ShinglesAssessment;
  supply: ShinglesSupply;
  counselling: ShinglesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type ShinglesAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean | undefined }
  | { type: "UPDATE_ASSESSMENT"; field: keyof ShinglesAssessment; value: string | boolean }
  | { type: "UPDATE_SUPPLY"; field: keyof ShinglesSupply; value: string | boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof ShinglesCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// Consent is taken before the vaccine is drawn up: the PGD lists informed
// consent as an inclusion criterion (adversarial review, 11 Sep 2026).
export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Eligibility Assessment",
  "Contraindications",
  "Counselling",
  "Vaccine Supply",
  "Summary & Declaration",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): ShinglesConsultationState {
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
      ageEligible: false,
      immunosuppressed: false,
      under50ImmunosuppressionAnswer: "",
      severeImmunosuppressionCategory: "",
      immunosuppressionDetail: "",
      immunosuppressionDoubt: "",
      nhsEntitlementExplained: false,
      anaphylaxisToComponent: "",
      severeAcuteIllness: "",
      pregnancyStatus: "",
      previousShingrix: false,
      previousShingrixDate: "",
      completedCourse: false,
      previousZostavax: false,
      previousShinglesHistory: false,
      recentOtherVaccine: false,
    },
    supply: {
      doseNumber: "",
      vaccinationDate: new Date().toISOString().split("T")[0],
      batchNumber: "",
      expiryDate: "",
      site: "",
      nextDoseDue: "",
      lateDoseAcknowledged: false,
      observedFifteenMinutes: false,
      adverseReaction: "",
      adverseReactionAction: "",
      yellowCardSubmitted: false,
    },
    counselling: {
      explainedDoseSchedule: false,
      explainedLocalReactions: false,
      explainedSystemicReactions: false,
      explainedEffectiveness: false,
      explainedNotLiveVaccine: false,
      offeredWrittenInfo: false,
      followUpAdviceGiven: false,
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
