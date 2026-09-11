import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
  ClinicalAlert,
  DoseRecommendation,
  initialPatientDetails,
  initialConsent,
  initialSummary,
} from "../../shared/types";

/**
 * Skin Infection ePGD: flucloxacillin first line, clarithromycin if
 * penicillin-allergic, doxycycline (12+) as alternative.
 *
 * This client serves two different signed documents, selected by `variant`:
 *   "skin-infection": Skin and Soft Tissue Infection PGD v006 (11 September
 *     2026). Impetigo, folliculitis, infected eczema and infected wounds from
 *     2 years; cellulitis from 12 years. Age-banded observations (Appendix 1).
 *   "cellulitis": Cellulitis PGD v003 (11 September 2026). Adults 18 and over
 *     only, MILD cellulitis (Eron class I) of a limb or the trunk, with its
 *     own exclusion list and adult sepsis thresholds.
 */

export type SkinInfectionVariant = "skin-infection" | "cellulitis";

export interface SkinInfectionPatientDetails extends BasePatientDetails {}
export interface SkinInfectionConsent extends BaseConsent {
  /** Under 16 only (skin-infection document): who gave consent. */
  consentBasis: "" | "parental-responsibility" | "gillick-competent";
  /** Basis recorded, as the document requires. */
  consentBasisNotes: string;
}

export interface SkinInfectionAssessment {
  infectionType:
    | "impetigo"
    | "folliculitis"
    | "infected-eczema"
    | "infected-wound"
    | "cellulitis"
    | "";
  severity: "mild" | "moderate" | "severe" | "";
  affectedSite: string;
  durationDays: string;
  spreadingRapidly: boolean; // rapidly advancing erythema: a necrotising fasciitis feature
  systemicSymptoms: boolean; // fever, rigors, malaise: systemic illness or sepsis
  abscessSuspected: boolean; // needs drainage / surgical review
  necrotisingFeatures: boolean; // pain out of proportion, crepitus, necrosis, bullae, dusky discolouration
  facialOrExcludedSite: boolean; // facial / periorbital / orbital cellulitis, hand (skin-infection), not limb or trunk (cellulitis)
  biteOrWaterExposure: boolean; // animal or human bite; cellulitis document adds fresh or sea water exposure
  jointOrBoneInvolvement: boolean; // suspected osteomyelitis, septic arthritis, infection over a joint or tendon
  possibleTinea: boolean; // untreated fungal infection or a rash that may be tinea
  possibleViral: boolean; // suspected viral infection including eczema herpeticum
  diabeticFootOrLymphoedema: boolean; // diabetic foot infection; cellulitis document adds lymphoedema / chronic venous ulceration
  suspectedDvtOrBilateral: boolean; // cellulitis document: suspected DVT or redness of both legs
  antibioticAlreadyTaken: boolean; // skin-infection document: an antibiotic already taken for this episode
  antibioticFailureOrRecurrence: boolean; // cellulitis document: not improving after 48 h of an antibiotic, or second episode same site within 3 months
  extensiveInfection: boolean; // Appendix 2: derived from the measured findings below (kept for older saved records)
  erythemaDiameterCm: string; // Appendix 2 finding: largest diameter of erythema in cm (required, skin-infection document)
  bodyRegionCount: string; // Appendix 2 finding: number of body regions involved (required, skin-infection document)
  beyondMildModerateScope: boolean; // Appendix 2: infection is beyond the definition (outside the mild to moderate scope): refer
  weightKg: string; // required under 12 (clarithromycin weight bands; 12 kg floor)
  // Observations, recorded against the age band (skin-infection Appendix 1)
  // or the adult sepsis thresholds (cellulitis document).
  respiratoryRate: string;
  pulse: string;
  temperature: string;
  systolicBP: string;
  oxygenSaturation: string;
  capillaryRefillOver2s: boolean; // under 12 only
  alteredConsciousness: boolean; // new confusion, drowsiness, floppiness, not responding normally
  rigors: boolean; // cellulitis document
  // Cellulitis: marking and review
  marginsMarked: boolean;
  marginMarkedTime: string; // cellulitis document: time recorded
  reviewDateTime: string; // skin-infection document: date and time of the booked in-person 48-hour review
}

export type RenalFunctionAnswer =
  | ""
  | "not-known-no-concern"
  | "known-crcl-30-or-above"
  | "crcl-below-30-or-suspected"
  | "crcl-below-10";

export interface SkinInfectionMedicalHistory {
  allergies: string; // free-text allergy record (required)
  penicillinAllergy: boolean;
  macrolideAllergy: boolean;
  tetracyclineAllergy: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  immunosuppressed: boolean;
  flucloxHepaticHistory: boolean; // previous flucloxacillin jaundice / hepatic dysfunction
  severeRenalImpairment: boolean; // CrCl < 10 ml/min
  renalFunction: RenalFunctionAnswer; // asked and recorded (clarithromycin arm)
  interactingMedicines: boolean; // clinically significant interaction on checking
  recentAntibioticsOrHospital: boolean; // C. difficile risk
  regularParacetamol: boolean; // HAGMA risk with flucloxacillin
  takesStatin: boolean; // statin other than simvastatin / lovastatin (caution with clarithromycin)
  takesWarfarin: boolean;
  takesDoac: boolean;
  qtProlongation: boolean; // known QT prolongation or concurrent QT-prolonging medicines
  clariContraindicatedMedicines: boolean; // ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin, lovastatin
  takesColchicine: boolean;
  severeHepaticImpairment: boolean;
  electrolyteDisturbance: boolean;
  myastheniaSleOrPorphyria: boolean; // doxycycline exclusion
  takesIsotretinoin: boolean; // doxycycline exclusion
  currentMedicines: string;
}

export type FlucloxUnsuitableReason =
  | ""
  | "penicillin-allergy"
  | "hepatic-history"
  | "cannot-manage-empty-stomach"
  | "intolerance";

export interface SkinInfectionAntibioticSelection {
  choice: "flucloxacillin" | "clarithromycin" | "doxycycline" | "";
  /** Selected from the document's formulations for the arm, age band and weight band (see getFormulationOptions). */
  formulation: string;
  /** Records requirement (both documents): name and brand of medication. */
  brand: string;
  courseDays: "5" | "7" | "";
  /** Derived from the formulation and course length: the document's fixed quantity. Not free text. */
  quantitySupplied: string;
  batchNumber: string;
  expiryDate: string;
  /** Second and third line arms: the structured reason flucloxacillin was unsuitable (inclusion for those arms). */
  flucloxUnsuitableReason: FlucloxUnsuitableReason;
  rationale: string;
}

export interface SkinInfectionCounselling {
  completeCourse: boolean;
  administrationAdvice: boolean; // drug-specific: empty stomach / upright with water / with or after food
  sideEffects: boolean;
  worseningAdvice: boolean; // same-day help for warning signs; come back if no better in 2 to 3 days
  sunProtection: boolean; // doxycycline only
  seriousReactionAdvice: boolean; // stop and seek urgent help for rash, wheeze, lip or tongue swelling; 999 for breathing difficulty
  hepaticAdvice: boolean; // flucloxacillin: report jaundice or dark urine even weeks after finishing
  childSyringeAdvice: boolean; // flucloxacillin suspension, ages 2 to 9
  cellulitisReviewAdvice: boolean; // edge marked, 48-hour appointment booked, same-day help if redness passes the mark
  interactionAdvice: boolean; // clarithromycin: tell us before any new medicine; dizziness and taste disturbance
  antacidAdvice: boolean; // doxycycline: separate from antacids, iron and dairy by 2 hours
  selfCareAdvice: boolean; // cellulitis document: analgesia, fluids, elevation, no compression, comorbidities, prevention
}

export interface SkinInfectionSummary extends BaseSummary {
  /** Populated at save time from antibioticSelection. */
  antibioticSupplied: string;
  /** Populated at save time from antibioticSelection. */
  courseLength: string;
  /** Records requirement: advice given if excluded or declining treatment, and the referral arranged. */
  referralAdvice: string;
  /** Records requirement: details of any adverse drug reactions and the actions taken. */
  adverseDrugReactions: string;
}

export interface SkinInfectionConsultationState {
  variant: SkinInfectionVariant;
  patient: SkinInfectionPatientDetails;
  consent: SkinInfectionConsent;
  assessment: SkinInfectionAssessment;
  medicalHistory: SkinInfectionMedicalHistory;
  antibioticSelection: SkinInfectionAntibioticSelection;
  counselling: SkinInfectionCounselling;
  summary: SkinInfectionSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type SkinInfectionAction =
  | { type: "UPDATE_PATIENT"; field: keyof SkinInfectionPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof SkinInfectionConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SkinInfectionAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof SkinInfectionMedicalHistory; value: any }
  | { type: "UPDATE_ANTIBIOTIC_SELECTION"; field: keyof SkinInfectionAntibioticSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof SkinInfectionCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof SkinInfectionSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Infection Assessment",
  "Medical History",
  "Antibiotic Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

/** Document strapline shown on the record, per variant. */
export const PGD_VERSION_LABEL: Record<SkinInfectionVariant, string> = {
  "skin-infection":
    "Skin and Soft Tissue Infection PGD, version 006, issued 11 September 2026",
  cellulitis: "Cellulitis PGD, version 003, issued 11 September 2026",
};

export function createInitialConsultationState(
  variant: SkinInfectionVariant = "skin-infection",
): SkinInfectionConsultationState {
  return {
    variant,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent, consentBasis: "", consentBasisNotes: "" },
    assessment: {
      infectionType: variant === "cellulitis" ? "cellulitis" : "",
      severity: "",
      affectedSite: "",
      durationDays: "",
      spreadingRapidly: false,
      systemicSymptoms: false,
      abscessSuspected: false,
      necrotisingFeatures: false,
      facialOrExcludedSite: false,
      biteOrWaterExposure: false,
      jointOrBoneInvolvement: false,
      possibleTinea: false,
      possibleViral: false,
      diabeticFootOrLymphoedema: false,
      suspectedDvtOrBilateral: false,
      antibioticAlreadyTaken: false,
      antibioticFailureOrRecurrence: false,
      extensiveInfection: false,
      erythemaDiameterCm: "",
      bodyRegionCount: "",
      beyondMildModerateScope: false,
      weightKg: "",
      respiratoryRate: "",
      pulse: "",
      temperature: "",
      systolicBP: "",
      oxygenSaturation: "",
      capillaryRefillOver2s: false,
      alteredConsciousness: false,
      rigors: false,
      marginsMarked: false,
      marginMarkedTime: "",
      reviewDateTime: "",
    },
    medicalHistory: {
      allergies: "",
      penicillinAllergy: false,
      macrolideAllergy: false,
      tetracyclineAllergy: false,
      pregnant: false,
      breastfeeding: false,
      immunosuppressed: false,
      flucloxHepaticHistory: false,
      severeRenalImpairment: false,
      renalFunction: "",
      interactingMedicines: false,
      recentAntibioticsOrHospital: false,
      regularParacetamol: false,
      takesStatin: false,
      takesWarfarin: false,
      takesDoac: false,
      qtProlongation: false,
      clariContraindicatedMedicines: false,
      takesColchicine: false,
      severeHepaticImpairment: false,
      electrolyteDisturbance: false,
      myastheniaSleOrPorphyria: false,
      takesIsotretinoin: false,
      currentMedicines: "",
    },
    antibioticSelection: {
      choice: "",
      formulation: "",
      brand: "",
      courseDays: "",
      quantitySupplied: "",
      batchNumber: "",
      expiryDate: "",
      flucloxUnsuitableReason: "",
      rationale: "",
    },
    counselling: {
      completeCourse: false,
      administrationAdvice: false,
      sideEffects: false,
      worseningAdvice: false,
      sunProtection: false,
      seriousReactionAdvice: false,
      hepaticAdvice: false,
      childSyringeAdvice: false,
      cellulitisReviewAdvice: false,
      interactionAdvice: false,
      antacidAdvice: false,
      selfCareAdvice: false,
    },
    summary: {
      ...initialSummary(),
      antibioticSupplied: "",
      courseLength: "",
      referralAdvice: "",
      adverseDrugReactions: "",
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
