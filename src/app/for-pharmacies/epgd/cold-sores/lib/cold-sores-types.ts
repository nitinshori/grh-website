import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface ColdSoresPatientDetails extends BasePatientDetails {}

export interface ColdSoresConsent extends BaseConsent {
  /** Under 16 only: who gave consent (the PGD covers patients from 12). */
  consentBasis: "" | "parental-responsibility" | "gillick-competent";
  /** Under 16 only: who consented, and for Gillick competence the assessment made. */
  consentBasisNotes: string;
}

export interface ColdSoresSymptomAssessment {
  isRecurrent: boolean;
  isFirstEpisode: boolean;
  prodromeSigns: boolean;
  hoursFromProdrome: number | null;
  /** How long this episode's lesion has been present. The PGD: consult a doctor if still present after 10 days. */
  daysSinceOnset: number | null;
  currentSymptoms: string;
}

export interface ColdSoresMedicalHistory {
  immunosuppressed: boolean;
  recentlyImmunosuppressed: boolean;
  renalImpairment: boolean;
  renalFunction: string;
}

// Exclusions per the Cold Sores (Herpes Labialis) PGD v003, 11 September 2026.
export interface ColdSoresContraindications {
  /** Exclusion: pregnancy (unless assessed as appropriate by a prescriber, which a PGD supply is not). */
  pregnant: boolean;
  /** Exclusion: breastfeeding (same basis). */
  breastfeeding: boolean;
  /** Exclusion: immunocompromised patients. */
  immunosuppressed: boolean;
  /** Exclusion: severe recurrent episodes. */
  severeRecurrentEpisodes: boolean;
  /** Exclusion: known hypersensitivity to aciclovir, valaciclovir or any excipient. */
  hypersensitivity: boolean;
  /** Exclusion (cream): lesions on mucous membranes (eyes, inside mouth, genitals). */
  mucousMembraneLesions: boolean;
  childUnder12: boolean;
  renalImpairmentSevere: boolean;
}

export type ColdSoresProduct = "cream" | "tablets" | "";
export type ColdSoresTubeSize = "2g" | "5g" | "";

export interface ColdSoresMedicineSupply {
  /** Aciclovir 5% cream (P) or aciclovir 200 mg tablets (POM). */
  product: ColdSoresProduct;
  /** Tablets: the PGD dose is 200 mg only. */
  doseChoice: string;
  /** Cream: up to one 2 g or 5 g tube per episode. */
  tubeSize: ColdSoresTubeSize;
  quantity: number | null;
  frequency: string;
  duration: string;
  /** Record: name and brand of medication. */
  brand: string;
}

export interface ColdSoresCounselling {
  startASAP: boolean;
  completeCourse: boolean;
  contagious: boolean;
  avoidSharing: boolean;
  sunExposure: boolean;
  /** Seek advice if worsening (spreads, new lesions, persistent fever, difficulty taking fluids) or no significant improvement after 5 to 7 days. */
  safetyNetting: boolean;
  /** Paracetamol and/or ibuprofen if no contraindication; adequate fluids; self-limiting, heals without scarring. */
  symptomRelief: boolean;
  /** Avoid touching lesions, dab not rub, wash hands, contact lens care, defer elective dental treatment. */
  hygieneMeasures: boolean;
  /** Patient information leaflet supplied. */
  providedPIL: boolean;
  /** Report suspected adverse effects via Yellow Card and inform the GP as appropriate. */
  yellowCard: boolean;
}

export interface ColdSoresConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
  /** Records requirement: advice given if excluded or declining treatment, and the decision reached. */
  referralAdvice: string;
  /** Records requirement: details of any adverse drug reactions and actions taken. */
  adverseDrugReactions: string;
}

export interface ColdSoresConsultationState {
  patient: ColdSoresPatientDetails;
  consent: ColdSoresConsent;
  symptomAssessment: ColdSoresSymptomAssessment;
  medicalHistory: ColdSoresMedicalHistory;
  contraindications: ColdSoresContraindications;
  medicineSupply: ColdSoresMedicineSupply;
  counselling: ColdSoresCounselling;
  summary: ColdSoresConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type ColdSoresAction =
  | { type: "UPDATE_PATIENT"; field: keyof ColdSoresPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof ColdSoresConsent; value: any }
  | { type: "UPDATE_SYMPTOM_ASSESSMENT"; field: keyof ColdSoresSymptomAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof ColdSoresMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof ColdSoresContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof ColdSoresMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof ColdSoresCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof ColdSoresConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Symptom Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export const PGD_VERSION_LINE =
  "Cold Sores (Herpes Labialis) PGD, aciclovir cream and tablets, version 003, issued 11 September 2026";

export function createInitialConsultationState(): ColdSoresConsultationState {
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
    symptomAssessment: {
      isRecurrent: false,
      isFirstEpisode: false,
      prodromeSigns: false,
      hoursFromProdrome: null,
      daysSinceOnset: null,
      currentSymptoms: "",
    },
    medicalHistory: {
      immunosuppressed: false,
      recentlyImmunosuppressed: false,
      renalImpairment: false,
      renalFunction: "",
    },
    contraindications: {
      pregnant: false,
      breastfeeding: false,
      immunosuppressed: false,
      severeRecurrentEpisodes: false,
      hypersensitivity: false,
      mucousMembraneLesions: false,
      childUnder12: false,
      renalImpairmentSevere: false,
    },
    medicineSupply: {
      product: "",
      doseChoice: "",
      tubeSize: "",
      quantity: null,
      frequency: "5 times daily",
      duration: "5 days",
      brand: "",
    },
    counselling: {
      startASAP: false,
      completeCourse: false,
      contagious: false,
      avoidSharing: false,
      sunExposure: false,
      safetyNetting: false,
      symptomRelief: false,
      hygieneMeasures: false,
      providedPIL: false,
      yellowCard: false,
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
      medicineRecommended: "",
      counsellingPoints: [],
      referralAdvice: "",
      adverseDrugReactions: "",
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
