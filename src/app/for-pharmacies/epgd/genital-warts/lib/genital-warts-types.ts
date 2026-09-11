import type {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from "../../shared/types";

/**
 * Genital warts ePGD: state shape.
 *
 * Aligned to the signed PGD version 005, issued 11 September 2026 (valid
 * to 31 July 2027), which is actually two PGDs in one
 * document: podophyllotoxin 0.5% solution / 0.15% cream, and imiquimod 5%
 * cream. They share most exclusions but differ on treatment area limits,
 * dosing, quantity and cautions, so the agent is chosen in the tool and the
 * clinical logic branches on it.
 *
 * One correction to note against the earlier scaffold, which conflated
 * "anal warts" into a single flag. The PGD includes external perianal warts
 * and excludes internal ones (urethral, vaginal, cervical, rectal). Those
 * are modelled separately below, because treating a perianal wart is in
 * scope and treating a rectal one is not.
 */

export type WartAgent = "" | "podophyllotoxin" | "imiquimod";

export interface GenitalWartsAssessment {
  /** Visible external genital warts confirmed on examination. */
  externalWartsConfirmed: boolean;
  /** External perianal warts. In scope under this PGD. */
  perianalExternalWarts: boolean;
  /**
   * Urethral, vaginal, cervical or rectal warts. Hard exclusion under both
   * agents: these need specialist assessment, not a patient-applied topical.
   */
  internalWarts: boolean;
  /** Keratinised lesions. Points towards imiquimod over podophyllotoxin. */
  keratinised: boolean;
  wartCount: number | null;
  /** Treatment area in cm2. Podophyllotoxin is capped at 4 cm2 (SmPC limit for unsupervised use). */
  treatmentAreaCm2: number | null;
  /** Inclusion: able to identify warts and apply treatment to warts only (not healthy skin). */
  ableToSelfApply: boolean;
  /** Atypical appearance, bleeding or ulceration. Refer to exclude SCC. */
  suspiciousLesion: boolean;
  openWoundsPresent: boolean;
  immunosuppressed: boolean;
  /** "", "not-pregnant", "confirmed", "possible" */
  pregnancyStatus: string;
  breastfeeding: boolean;
  /** Hypersensitivity to podophyllotoxin or its excipients: a stop when podophyllotoxin is selected. */
  hypersensitivityPodophyllotoxin: boolean;
  /** Hypersensitivity to imiquimod or its excipients: a stop when imiquimod is selected. */
  hypersensitivityImiquimod: boolean;
  /** Imiquimod caution: risk of phimosis. */
  uncircumcisedMale: boolean;
  /** Imiquimod caution: may exacerbate. */
  autoimmuneCondition: boolean;
  /** Women: cervical screening up to date, per the NICE CKS summary. */
  cervicalScreeningUpToDate: boolean;
  sexualHistoryTaken: boolean;
  stiScreeningOffered: boolean;
}

export type PriorReviewOutcome = "" | "persisting" | "cleared";

export interface GenitalWartsTreatment {
  agent: WartAgent;
  /** Podophyllotoxin only: "solution" (Warticon 3 mL or Condyline 3.5 mL) or "cream" (Warticon 5 g). */
  podophyllotoxinForm: string;
  /** Record: name and brand of medication. */
  brand: string;
  /**
   * Which supply this is in the current course. Podophyllotoxin: one pack
   * per course (the pack covers the licensed 4 weekly cycles); a second pack
   * only at the review after 2 cycles where warts persist, so a maximum of
   * 2 packs. Imiquimod: 12 sachets per dispensing (4 weeks), maximum 4
   * dispensings (16 weeks).
   */
  supplyNumber: number | null;
  /**
   * Outcome of the PGD's mid-course review (podophyllotoxin after 2 cycles,
   * imiquimod at 8 weeks). Required before the second podophyllotoxin pack
   * and before the third imiquimod dispensing; "cleared" means no further
   * supply.
   */
  priorReviewOutcome: PriorReviewOutcome;
  /** Derived from the agent and form: the document's fixed pack per supply. */
  quantitySupplied: string;
  batchNumber: string;
  expiryDate: string;
  reviewDate: string;
}

export interface GenitalWartsCounselling {
  applicationTechniqueExplained: boolean;
  barrierProtectionExplained: boolean;
  localReactionsDiscussed: boolean;
  avoidSexualContactWhileApplied: boolean;
  condomsCounselled: boolean;
  partnerNotificationDiscussed: boolean;
  completeCourseAdvised: boolean;
  hpvVaccinationDiscussed: boolean;
  handWashingAdvised: boolean;
  yellowCardExplained: boolean;
  pilSupplied: boolean;
  /** Podophyllotoxin only: teratogenic, contraception required. */
  contraceptionCounselled: boolean;
  /** Podophyllotoxin solution only: flammable. */
  flammabilityWarningGiven: boolean;
  /** Imiquimod only: weakens condoms and diaphragms; wash off before sex. */
  condomWeakeningExplained: boolean;
  /** Seek advice if warts worsen, spread or do not improve; report severe local reaction, bleeding, infection, systemic symptoms. */
  safetyNettingGiven: boolean;
  /** Attend follow-up; regular sexual health screening; pregnant women to inform their healthcare provider. */
  followUpAndScreeningAdvised: boolean;
}

export interface GenitalWartsSummary extends BaseSummary {
  /** Records requirement: advice given if excluded or declining treatment, and the decision reached. */
  referralAdvice: string;
  /** Records requirement: details of any adverse drug reactions and actions taken. */
  adverseDrugReactions: string;
}

export interface GenitalWartsConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GenitalWartsAssessment;
  treatment: GenitalWartsTreatment;
  counselling: GenitalWartsCounselling;
  summary: GenitalWartsSummary;
}

/** The document's fixed quantity per supply for the chosen agent and form. */
export function fixedQuantity(agent: WartAgent, podophyllotoxinForm: string): string {
  if (agent === "imiquimod") return "12 sachets (4 weeks at 3 times a week)";
  if (agent === "podophyllotoxin") {
    if (podophyllotoxinForm === "solution") return "1 bottle of 0.5% solution (Warticon 3 mL or Condyline 3.5 mL): one pack per course";
    if (podophyllotoxinForm === "cream") return "1 x 5 g tube of 0.15% cream (Warticon): one pack per course";
    return "";
  }
  return "";
}

/** Maximum supplies in a course: podophyllotoxin 2 packs (the second only at the review after 2 cycles); imiquimod 4 dispensings (16 weeks). */
export const MAX_SUPPLIES: Record<Exclude<WartAgent, "">, number> = {
  podophyllotoxin: 2,
  imiquimod: 4,
};

/** The supply number from which the PGD's mid-course review outcome must be recorded first: podophyllotoxin pack 2 (review after 2 cycles); imiquimod dispensing 3 (8-week review). */
export const REVIEW_BEFORE_SUPPLY: Record<Exclude<WartAgent, "">, number> = {
  podophyllotoxin: 2,
  imiquimod: 3,
};

/** Days from supply to the PGD review point: podophyllotoxin after 2 cycles (14 days); imiquimod at 8 weeks (56 days). */
export const REVIEW_INTERVAL_DAYS: Record<Exclude<WartAgent, "">, number> = {
  podophyllotoxin: 14,
  imiquimod: 56,
};

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Wart Assessment",
  "Eligibility (Exclusions/Cautions)",
  "Treatment Choice & Plan",
  "Counselling",
  "Pharmacist Summary",
  "Consultation Complete",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export const PGD_VERSION_LINE =
  "Genital Warts PGD (podophyllotoxin and imiquimod), version 005, issued 11 September 2026";

export function createInitialConsultationState(): GenitalWartsConsultationState {
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
      externalWartsConfirmed: false,
      perianalExternalWarts: false,
      internalWarts: false,
      keratinised: false,
      wartCount: null,
      treatmentAreaCm2: null,
      ableToSelfApply: false,
      suspiciousLesion: false,
      openWoundsPresent: false,
      immunosuppressed: false,
      pregnancyStatus: "",
      breastfeeding: false,
      hypersensitivityPodophyllotoxin: false,
      hypersensitivityImiquimod: false,
      uncircumcisedMale: false,
      autoimmuneCondition: false,
      cervicalScreeningUpToDate: false,
      sexualHistoryTaken: false,
      stiScreeningOffered: false,
    },
    treatment: {
      agent: "",
      podophyllotoxinForm: "",
      brand: "",
      supplyNumber: null,
      priorReviewOutcome: "",
      quantitySupplied: "",
      batchNumber: "",
      expiryDate: "",
      reviewDate: "",
    },
    counselling: {
      applicationTechniqueExplained: false,
      barrierProtectionExplained: false,
      localReactionsDiscussed: false,
      avoidSexualContactWhileApplied: false,
      condomsCounselled: false,
      partnerNotificationDiscussed: false,
      completeCourseAdvised: false,
      hpvVaccinationDiscussed: false,
      handWashingAdvised: false,
      yellowCardExplained: false,
      pilSupplied: false,
      contraceptionCounselled: false,
      flammabilityWarningGiven: false,
      condomWeakeningExplained: false,
      safetyNettingGiven: false,
      followUpAndScreeningAdvised: false,
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
      referralAdvice: "",
      adverseDrugReactions: "",
    },
  };
}
