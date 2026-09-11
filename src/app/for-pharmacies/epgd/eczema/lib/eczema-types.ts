import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

/**
 * Eczema and Dermatitis ePGD, aligned to the Eczema and Dermatitis PGD
 * version 005, issued 11 September 2026. Two arms, 12 years and over:
 *   Arm 1, clobetasone butyrate 0.05%: mild disease at any permitted site, and
 *     moderate disease on the face, flexures or genital skin (7 days maximum
 *     at those sites).
 *   Arm 2, betamethasone valerate 0.1%: moderate disease on the trunk and
 *     limbs only.
 * The eyelids are excluded from both arms. Quantity is sized to the treated
 * area in adult palms (15g, 30g, 60g); above ten palms (10% of body surface)
 * refer.
 */
export const ECZEMA_PGD_VERSION = "Eczema and Dermatitis PGD, version 005, issued 11 September 2026";

export interface EczemaPatientDetails extends BasePatientDetails {}

export interface EczemaConsent extends BaseConsent {
  /** Under 16 only: who gave consent, and the basis recorded. */
  consentBasis: "" | "parental-responsibility" | "gillick-competent";
  consentBasisNotes: string;
}

export type TreatedArea = "" | "up-to-2-palms" | "2-to-5-palms" | "5-to-10-palms" | "over-10-palms";

export interface EczemaAssessment {
  severity: "mild" | "moderate" | "severe" | "";
  isDry: boolean;
  isRed: boolean;
  isThickened: boolean;
  isCracked: boolean;
  isOozing: boolean;
  affectedSite: string;
  /** Face, flexures or genital skin involved (thin skin: Arm 1 only, 7 day cap). */
  thinSkinSite: boolean;
  /** Eyelid involvement: excluded from both arms. */
  eyelids: boolean;
  /** Treated area in adult palms (one fingertip unit covers about two palms). */
  treatedArea: TreatedArea;
}

export interface EczemaMedicalHistory {
  previousTreatments: string;
  allergies: string;
  /** Courses of topical corticosteroid supplied in the last 12 months. */
  coursesLast12Months: "" | "0" | "1" | "2" | "3-or-more";
  currentlyUsingTopicalSteroid: boolean;
  productHypersensitivity: boolean;
  pregnantOrBreastfeeding: boolean;
  treatmentToBreastArea: boolean;
}

export interface EczemaContraindications {
  bacterialInfection: boolean; // signs of secondary bacterial infection (weeping, crusting, sudden worsening)
  concurrentAntibioticSupplied: boolean; // mild, localised, treated at this visit under the Skin and Soft Tissue Infection PGD
  viralInfection: boolean; // suspected eczema herpeticum: emergency
  fungalInfection: boolean; // untreated fungal infection or a rash that might be tinea
  ulceratedOrOpenWound: boolean;
  faceOrGroin: boolean; // retained: mirrors assessment.thinSkinSite for older records
  childUnder1: boolean; // retained for older records; the PGD starts at 12
  rosaceaOrAcne: boolean; // rosacea, perioral dermatitis or acne
}

export interface EczemaMedicineSelection {
  emollientFirst: boolean;
  steroidChoice: "" | "clobetasone" | "betamethasone";
  formulation: "" | "cream" | "ointment";
  quantitySupplied: "" | "15g" | "30g" | "60g";
  batchNumber: string;
  expiryDate: string;
}

export interface EczemaCounselling {
  emollientFirst: boolean; // keep using the emollient every day, including after the course
  fingertipUnits: boolean; // fingertip unit shown on the patient's own finger
  applyThinly: boolean; // steroid first, thin layer, affected skin only, wait at least 30 minutes, then emollient
  stepDownApproach: boolean; // Arm 2: step down to a moderate potency rather than stopping abruptly
  avoidTriggers: boolean;
  fireRiskExplained: boolean; // MHRA fire risk from emollients, recorded
  sevenDayCapExplained: boolean; // face, flexures or genital skin: no more than 7 days
  notOnFaceAdvice: boolean; // Arm 2: do not use on the face, eyelids, skin folds or genital skin
  followUpAdvice: boolean; // back if no better after 7 days, spreads, weeps, crusts or becomes painful
  urgentHelpAdvice: boolean; // rapidly painful with clustered blisters or punched-out sores, or unwell
}

export interface EczemaConsultationSummary extends BaseSummary {
  severity: string;
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface EczemaConsultationState {
  patient: EczemaPatientDetails;
  consent: EczemaConsent;
  assessment: EczemaAssessment;
  medicalHistory: EczemaMedicalHistory;
  contraindications: EczemaContraindications;
  medicineSelection: EczemaMedicineSelection;
  counselling: EczemaCounselling;
  summary: EczemaConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type EczemaAction =
  | { type: "UPDATE_PATIENT"; field: keyof EczemaPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof EczemaConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof EczemaAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof EczemaMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof EczemaContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof EczemaMedicineSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof EczemaCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof EczemaConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Eczema Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

/** Quantity by treated area (Appendix 1). */
export const QUANTITY_BY_AREA: Record<Exclude<TreatedArea, "" | "over-10-palms">, "15g" | "30g" | "60g"> = {
  "up-to-2-palms": "15g",
  "2-to-5-palms": "30g",
  "5-to-10-palms": "60g",
};

export const TREATED_AREA_LABEL: Record<Exclude<TreatedArea, "">, string> = {
  "up-to-2-palms": "Up to 2 adult palms (about 2% of body surface): 1 fingertip unit per application. Supply 15g",
  "2-to-5-palms": "2 to 5 adult palms: up to 2.5 fingertip units per application. Supply 30g",
  "5-to-10-palms": "5 to 10 adult palms (up to the 10% maximum): up to 5 fingertip units per application. Supply 60g",
  "over-10-palms": "More than 10 adult palms (over 10% of body surface): refer, do not supply",
};

export function createInitialConsultationState(): EczemaConsultationState {
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
      consentBasis: "",
      consentBasisNotes: "",
    },
    assessment: {
      severity: "",
      isDry: false,
      isRed: false,
      isThickened: false,
      isCracked: false,
      isOozing: false,
      affectedSite: "",
      thinSkinSite: false,
      eyelids: false,
      treatedArea: "",
    },
    medicalHistory: {
      previousTreatments: "",
      allergies: "",
      coursesLast12Months: "",
      currentlyUsingTopicalSteroid: false,
      productHypersensitivity: false,
      pregnantOrBreastfeeding: false,
      treatmentToBreastArea: false,
    },
    contraindications: {
      bacterialInfection: false,
      concurrentAntibioticSupplied: false,
      viralInfection: false,
      fungalInfection: false,
      ulceratedOrOpenWound: false,
      faceOrGroin: false,
      childUnder1: false,
      rosaceaOrAcne: false,
    },
    medicineSelection: {
      emollientFirst: false,
      steroidChoice: "",
      formulation: "",
      quantitySupplied: "",
      batchNumber: "",
      expiryDate: "",
    },
    counselling: {
      emollientFirst: false,
      fingertipUnits: false,
      applyThinly: false,
      stepDownApproach: false,
      avoidTriggers: false,
      fireRiskExplained: false,
      sevenDayCapExplained: false,
      notOnFaceAdvice: false,
      followUpAdvice: false,
      urgentHelpAdvice: false,
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
      severity: "",
      medicineRecommended: "",
      counsellingPoints: [],
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
