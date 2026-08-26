import type {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from "../../shared/types";

/**
 * Genital warts ePGD — state shape.
 *
 * Built against the signed PGD (genital-warts.pdf, v001, valid from
 * 1 Nov 2025, expiry 31 Jul 2027), which is actually two PGDs in one
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
  /** Treatment area in cm². Podophyllotoxin is capped at 10 cm². */
  treatmentAreaCm2: number | null;
  /** Atypical appearance, bleeding or ulceration. Refer to exclude SCC. */
  suspiciousLesion: boolean;
  openWoundsPresent: boolean;
  immunosuppressed: boolean;
  /** "", "not-pregnant", "confirmed", "possible" */
  pregnancyStatus: string;
  breastfeeding: boolean;
  hypersensitivityToAgent: boolean;
  /** Imiquimod caution: risk of phimosis. */
  uncircumcisedMale: boolean;
  /** Imiquimod caution: may exacerbate. */
  autoimmuneCondition: boolean;
  /** Women: cervical screening up to date, per the NICE CKS summary. */
  cervicalScreeningUpToDate: boolean;
  sexualHistoryTaken: boolean;
  stiScreeningOffered: boolean;
}

export interface GenitalWartsTreatment {
  agent: WartAgent;
  /** Podophyllotoxin only: "solution" (15 mL) or "cream" (5 g). */
  podophyllotoxinForm: string;
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
}

export interface GenitalWartsConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GenitalWartsAssessment;
  treatment: GenitalWartsTreatment;
  counselling: GenitalWartsCounselling;
  summary: BaseSummary;
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
      suspiciousLesion: false,
      openWoundsPresent: false,
      immunosuppressed: false,
      pregnancyStatus: "",
      breastfeeding: false,
      hypersensitivityToAgent: false,
      uncircumcisedMale: false,
      autoimmuneCondition: false,
      cervicalScreeningUpToDate: false,
      sexualHistoryTaken: false,
      stiScreeningOffered: false,
    },
    treatment: {
      agent: "",
      podophyllotoxinForm: "",
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
  };
}
