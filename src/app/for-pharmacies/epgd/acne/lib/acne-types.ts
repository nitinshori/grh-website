import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface AcnePatientDetails extends BasePatientDetails {}

export interface AcneConsent extends BaseConsent {
  femaleConfirmed: boolean;
}

export interface AcneAssessment {
  severity: "mild" | "moderate" | "severe" | "";
  comedones: boolean;
  inflammatoryPapules: boolean;
  pustules: boolean;
  nodalCystic: boolean;
  affectedArea: string;
}

export interface AcneMedicalHistory {
  previousTreatments: string;
  allergies: string;
  sensitiveToRetinoids: boolean;
  /** History of antibiotic-associated colitis (Duac exclusion). */
  antibioticAssociatedColitis: boolean;
  /** History of gastrointestinal disease (Duac caution). */
  gastrointestinalDisease: boolean;
  /** Atopic patient (Duac caution). */
  atopic: boolean;
  /** Severe scarring, persistent pigmentary change, or persistent psychological
   *  distress / mental health disorder attributable to acne (consider dermatology referral). */
  scarringOrDistress: boolean;
}

export interface AcneContraindications {
  pregnant: boolean;
  /** Planning pregnancy (adapalene / benzoyl peroxide exclusion). */
  planningPregnancy: boolean;
  breastfeeding: boolean;
  ageUnder12: boolean;
  /** Known hypersensitivity to benzoyl peroxide (excludes both arms). */
  hypersensitivityBenzoylPeroxide: boolean;
  /** Known hypersensitivity to clindamycin or lincomycin (Duac exclusion). */
  hypersensitivityClindamycinLincomycin: boolean;
  /** Known hypersensitivity to adapalene or any excipient (Epiduo exclusion). */
  hypersensitivityAdapalene: boolean;
  /** Broken skin at the application site (excludes both arms). */
  brokenSkinAtSite: boolean;
  /** Inflamed skin at the application site (Duac exclusion). */
  inflamedSkinAtSite: boolean;
  /** Eczema or sunburned skin at the application site (Epiduo exclusion). */
  eczemaOrSunburnAtSite: boolean;
}

/** Medicine values: "duac-3" (clindamycin 10mg/g + benzoyl peroxide 30mg/g),
 *  "duac-5" (clindamycin 10mg/g + benzoyl peroxide 50mg/g),
 *  "epiduo-0.1" (adapalene 0.1% / benzoyl peroxide 2.5%),
 *  "epiduo-0.3" (adapalene 0.3% / benzoyl peroxide 2.5%). */
export interface AcneMedicineSelection {
  medicineChoice: string;
  /** Duac 10mg/g + 50mg/g only: the clinical reason for choosing the higher strength. */
  strengthRationale: string;
  /** Repeat course (maximum 12 weeks continuous use; review required for repeat courses). */
  repeatCourse: boolean;
  repeatCourseReviewed: boolean;
}

export interface AcneCounselling {
  improvementTimeline: boolean;
  photosensitivity: boolean;
  washingAdvice: boolean;
  productAdvice: boolean;
  courseCompletion: boolean;
  /** Thin layer once daily in the evening to clean, dry skin; wash hands after; avoid eyes, mouth, mucous membranes, broken skin. */
  applicationAdvice: boolean;
  /** Irritation, dryness, peeling especially at the start; reduce frequency or interrupt; discontinue if severe. */
  irritationAdvice: boolean;
  /** Seek advice if severe skin reaction, or no improvement after the product's review interval. */
  followUpAdvice: boolean;
  /** Picking or scratching lesions increases the risk of scarring. */
  scarringAdvice: boolean;
  /** Duac: refrigerate before dispensing; once dispensed store below 25 C and use within 2 months. */
  storageAdvice: boolean;
  /** Epiduo: bleaching of hair and coloured fabrics; irritant cosmetics additive. */
  bleachingAdvice: boolean;
  pilSupplied: boolean;
}

export interface AcneConsultationSummary extends BaseSummary {
  severity: string;
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface AcneConsultationState {
  patient: AcnePatientDetails;
  consent: AcneConsent;
  assessment: AcneAssessment;
  medicalHistory: AcneMedicalHistory;
  contraindications: AcneContraindications;
  medicineSelection: AcneMedicineSelection;
  counselling: AcneCounselling;
  summary: AcneConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type AcneAction =
  | { type: "UPDATE_PATIENT"; field: keyof AcnePatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof AcneConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AcneAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AcneMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof AcneContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof AcneMedicineSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AcneCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof AcneConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Acne Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): AcneConsultationState {
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
      femaleConfirmed: false,
    },
    assessment: {
      severity: "",
      comedones: false,
      inflammatoryPapules: false,
      pustules: false,
      nodalCystic: false,
      affectedArea: "",
    },
    medicalHistory: {
      previousTreatments: "",
      allergies: "",
      sensitiveToRetinoids: false,
      antibioticAssociatedColitis: false,
      gastrointestinalDisease: false,
      atopic: false,
      scarringOrDistress: false,
    },
    contraindications: {
      pregnant: false,
      planningPregnancy: false,
      breastfeeding: false,
      ageUnder12: false,
      hypersensitivityBenzoylPeroxide: false,
      hypersensitivityClindamycinLincomycin: false,
      hypersensitivityAdapalene: false,
      brokenSkinAtSite: false,
      inflamedSkinAtSite: false,
      eczemaOrSunburnAtSite: false,
    },
    medicineSelection: {
      medicineChoice: "",
      strengthRationale: "",
      repeatCourse: false,
      repeatCourseReviewed: false,
    },
    counselling: {
      improvementTimeline: false,
      photosensitivity: false,
      washingAdvice: false,
      productAdvice: false,
      courseCompletion: false,
      applicationAdvice: false,
      irritationAdvice: false,
      followUpAdvice: false,
      scarringAdvice: false,
      storageAdvice: false,
      bleachingAdvice: false,
      pilSupplied: false,
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
