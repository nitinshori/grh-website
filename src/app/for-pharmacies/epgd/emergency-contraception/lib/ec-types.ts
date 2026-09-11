// ─── Emergency Contraception ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Patient Details (extends base) ───

export interface ECPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean; // must confirm female
  fraserCompetent?: boolean; // required for ages 13-15
  // PGD v003 (11 September 2026) safeguarding: under 13 supply may still be
  // appropriate but a safeguarding referral is mandatory; 13 to 15 record
  // Fraser competence, coercion, partner age and any safeguarding concern.
  safeguardingReferralMade: boolean;
  coercionAsked: boolean;
  partnerAge: string;
  safeguardingConcern: boolean;
  safeguardingNotes: string;
}

export const PGD_VERSION_LABEL =
  "Emergency Contraception PGD (levonorgestrel 1.5 mg, Levonelle / ulipristal acetate 30 mg, ellaOne), version 003, issued 11 September 2026";

// ─── Clinical Assessment ───

export interface ECClinicalAssessment {
  upsiDate: string; // YYYY-MM-DD: date of unprotected sexual intercourse
  upsiTime: string; // HH:MM: approximate time of UPSI
  hoursSinceUPSI: number | null; // auto-calculated
  additionalUPSIInstances: boolean; // multiple UPSI episodes this cycle
  lastMenstrualPeriod: string; // YYYY-MM-DD
  cycleRegular: boolean; // regular menstrual cycle
  cycleLength: number | null; // days (21-35 normal)
  currentPregnancySymptoms: boolean; // nausea, breast tenderness, etc.
  previousEC: boolean; // used EC already in this cycle
  previousECDetails: string; // what was used previously
  regularContraception: boolean; // uses regular contraception
  contraceptionType: string; // e.g. "combined pill", "POP", "implant", "IUD", "none"
  contraceptionFailureType: string; // e.g. "condom split", "missed pills", "none used"
}

// ─── Medical History (Emergency Contraception specific) ───

export interface ECMedicalHistory {
  severeHepatic: boolean; // contraindication for both medicines
  severeAsthma: boolean; // severe asthma insufficiently controlled by oral glucocorticoids: ulipristal exclusion
  crohnsDisease: boolean; // caution - reduced efficacy
  breastfeeding: boolean; // caution - avoid breastfeeding 8 hours (LNG) or 7 days (UPA)
  previousEctopic: boolean; // history of ectopic pregnancy
  porphyria: boolean; // acute intermittent porphyria: levonorgestrel exclusion
  currentlyPregnant: boolean; // known or suspected pregnancy: HARD STOP
  pregnancyTestResult: "positive" | "negative" | "not-done" | "";
  lngHypersensitivity: boolean; // levonorgestrel or any component: LNG exclusion
  upaHypersensitivity: boolean; // ulipristal acetate or any component: UPA exclusion
  galactoseIntolerance: boolean; // hereditary galactose intolerance: exclusion, both arms
  weightKg: number | null;
  heightCm: number | null;
}

// ─── Current Medications & Interactions ───

export interface ECMedications {
  takesEnzymeInducers: boolean; // enzyme-inducing drugs in the last 4 weeks (anticonvulsants, rifampicin, antiretrovirals, St John's Wort)
  enzymeInducerDetails: string; // which enzyme inducer
  takesUPA: boolean; // already taken ulipristal (ellaOne) this cycle
  currentHormonalContraception: boolean; // combined or POP
  hormonalContraceptionType: string; // pill name/type
  progestogenLast7Days: boolean; // progestogen-containing contraceptive taken in the previous 7 days: ulipristal caution
}

// ─── Medicine Selection ───

export type ECDoubleDoseReason = "" | "enzyme-inducers" | "weight-bmi";

export interface ECMedicineSelection {
  medicine: "levonorgestrel" | "ulipristal" | ""; // selected EC medicine
  dose: string; // "1.5mg" or "3mg" for LNG, "30mg" for UPA
  doubleDosingRequired: boolean; // 3mg LNG
  doubleDoseReason: ECDoubleDoseReason; // PGD: record the reason for a 3 mg dose
  offLabelExplained: boolean; // weight or BMI based 3 mg is off-label per FSRH: explain and record
  copperIudOffered: boolean; // enzyme inducers: offer a copper IUD first; LNG 3 mg if declined
  pharmacistOverride: boolean; // override auto-recommendation
  overrideReason: string;
}

// ─── Counselling & Follow-up ───

export interface ECCounselling {
  timingAdvice: boolean; // when to take the medicine
  vomitingAdvice: boolean; // what to do if vomiting within 2-3hrs
  notGuaranteed: boolean; // advised not 100% effective
  pregnancyTestAdvice: boolean; // test if period >7 days late
  futureContraceptionDiscussed: boolean; // long-term contraception options
  returnToGPAdvice: boolean; // when to contact GP
  stiScreeningAdvice: boolean; // advised to get STI screening
  sideEffectsExplained: boolean; // nausea, headache, irregular bleeding
  hormonalContraceptionRestart: boolean; // how to restart existing HC
}

// ─── Full Consultation Summary ───

export interface ECConsultationSummary extends BaseSummary {
  // Additional EC-specific fields
}

// ─── Alert Types ───

export type AlertSeverity = "stop" | "caution" | "red-flag";

export interface ClinicalAlert {
  severity: AlertSeverity;
  code: string;
  message: string;
  detail: string;
}

// ─── Dose Recommendation ───

export interface DoseRecommendation {
  medicine: "levonorgestrel" | "ulipristal" | "none";
  dose: string;
  reason: string;
}

// ─── Full Consultation State ───

export interface ECConsultationState {
  currentStep: number;
  patient: ECPatientDetails;
  consent: BaseConsent;
  clinicalAssessment: ECClinicalAssessment;
  medicalHistory: ECMedicalHistory;
  medications: ECMedications;
  medicineSelection: ECMedicineSelection;
  counselling: ECCounselling;
  summary: ECConsultationSummary;
  // Computed
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type ECAction =
  | { type: "UPDATE_PATIENT"; field: keyof ECPatientDetails; value: ECPatientDetails[keyof ECPatientDetails] }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof ECClinicalAssessment; value: ECClinicalAssessment[keyof ECClinicalAssessment] }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof ECMedicalHistory; value: ECMedicalHistory[keyof ECMedicalHistory] }
  | { type: "UPDATE_MEDICATIONS"; field: keyof ECMedications; value: ECMedications[keyof ECMedications] }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: keyof ECMedicineSelection; value: ECMedicineSelection[keyof ECMedicineSelection] }
  | { type: "UPDATE_COUNSELLING"; field: keyof ECCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof ECConsultationSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Step Labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Clinical Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications Review",
  "Medicine Selection",
  "Counselling & Follow-up",
  "Summary & Print",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State Factory ───

export function createInitialConsultationState(): ECConsultationState {
  return {
    currentStep: 0,
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      femaleConfirmed: false,
      safeguardingReferralMade: false,
      coercionAsked: false,
      partnerAge: "",
      safeguardingConcern: false,
      safeguardingNotes: "",
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
    clinicalAssessment: {
      upsiDate: "",
      upsiTime: "",
      hoursSinceUPSI: null,
      additionalUPSIInstances: false,
      lastMenstrualPeriod: "",
      cycleRegular: false,
      cycleLength: null,
      currentPregnancySymptoms: false,
      previousEC: false,
      previousECDetails: "",
      regularContraception: false,
      contraceptionType: "",
      contraceptionFailureType: "",
    },
    medicalHistory: {
      severeHepatic: false,
      severeAsthma: false,
      crohnsDisease: false,
      breastfeeding: false,
      previousEctopic: false,
      porphyria: false,
      currentlyPregnant: false,
      pregnancyTestResult: "",
      lngHypersensitivity: false,
      upaHypersensitivity: false,
      galactoseIntolerance: false,
      weightKg: null,
      heightCm: null,
    },
    medications: {
      takesEnzymeInducers: false,
      enzymeInducerDetails: "",
      takesUPA: false,
      currentHormonalContraception: false,
      hormonalContraceptionType: "",
      progestogenLast7Days: false,
    },
    medicineSelection: {
      medicine: "",
      dose: "",
      doubleDosingRequired: false,
      doubleDoseReason: "",
      offLabelExplained: false,
      copperIudOffered: false,
      pharmacistOverride: false,
      overrideReason: "",
    },
    counselling: {
      timingAdvice: false,
      vomitingAdvice: false,
      notGuaranteed: false,
      pregnancyTestAdvice: false,
      futureContraceptionDiscussed: false,
      returnToGPAdvice: false,
      stiScreeningAdvice: false,
      sideEffectsExplained: false,
      hormonalContraceptionRestart: false,
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
    alerts: [],
    doseRecommendation: null,
    canProceed: false,
    isComplete: false,
  };
}
