import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface RosaceaAssessment {
  subtype: string;
  severity: string;
  flushing: boolean;
  erythema: boolean;
  papulesPostules: boolean;
  triggersIdentified: string;
}

export interface RosaceaContraindications {
  pregnancy: boolean;
  breastfeeding: boolean;
  underEighteen: boolean;
  /** Broken, irritated or eczematous (facial) skin: exclusion for both arms. */
  brokenOrEczematousSkin: boolean;
  /** Known hypersensitivity to metronidazole or other nitroimidazoles (metronidazole arm). */
  hypersensitivityMetronidazole: boolean;
  /** Known hypersensitivity to azelaic acid or any of the excipients (azelaic acid arm). */
  hypersensitivityAzelaicAcid: boolean;
  /** Asthma: worsening of asthma has been reported with azelaic acid (caution). */
  asthma: boolean;
  /** Derived: any arm-independent exclusion is met. */
  contraindicated: boolean;
}

/** product: "metronidazole" (0.75% gel) or "azelaic-acid" (15% gel). */
export interface RosaceaTreatment {
  product: string;
  strength: string;
  frequency: string;
  duration: string;
  /** Which supply of the course this is ("1", "2", "3"); each supply is one 30 g tube. */
  supplyNumber: string;
  quantity: string;
}

export interface RosaceaCounselling {
  sunProtectionAdvised: boolean;
  triggerAvoidanceAdvised: boolean;
  /** Trigger diary suggested. */
  diaryAdvised: boolean;
  /** Non-oily emollients if dry; yellow- or green-tinted cosmetics to camouflage erythema. */
  skinCareAdvised: boolean;
  /** Thin layer, avoid eyes, mouth, mucous membranes and broken skin; wash hands after. */
  applicationAdvised: boolean;
  /** Review interval and treatment period for the product supplied. */
  reviewAdvised: boolean;
  /** Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or systemically very unwell. */
  followUpAdvised: boolean;
  pilSupplied: boolean;
}

export interface RosaceaConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: RosaceaAssessment;
  contraindications: RosaceaContraindications;
  treatment: RosaceaTreatment;
  counselling: RosaceaCounselling;
  summary: BaseSummary;
  completedSteps: Set<number>;
}

export type RosaceaAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof RosaceaAssessment; value: unknown }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof RosaceaContraindications; value: unknown }
  | { type: "UPDATE_TREATMENT"; field: keyof RosaceaTreatment; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof RosaceaCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = ["Patient Details", "Consent", "Rosacea Assessment", "Contraindications", "Treatment Selection", "Counselling", "Summary & Record", "Consultation Complete"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialRosaceaState(): RosaceaConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { subtype: "", severity: "", flushing: false, erythema: false, papulesPostules: false, triggersIdentified: "" },
    contraindications: { pregnancy: false, breastfeeding: false, underEighteen: false, brokenOrEczematousSkin: false, hypersensitivityMetronidazole: false, hypersensitivityAzelaicAcid: false, asthma: false, contraindicated: false },
    treatment: { product: "", strength: "", frequency: "", duration: "", supplyNumber: "", quantity: "" },
    counselling: { sunProtectionAdvised: false, triggerAvoidanceAdvised: false, diaryAdvised: false, skinCareAdvised: false, applicationAdvised: false, reviewAdvised: false, followUpAdvised: false, pilSupplied: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    completedSteps: new Set(),
  };
}
