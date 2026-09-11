import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface AnxietyPropranololPatientDetails extends BasePatientDetails {}

export interface AnxietyPropranololConsent extends BaseConsent {}

export interface AnxietyAssessment {
  anxietyType: string;
  triggerSituation: string;
  physicalSymptoms: string;
  frequencyOfEvents: string;
}

export interface AnxietyMedicalHistory {
  // The six exclusion-grade questions that used to sit here (asthma or
  // COPD, cardiac conduction disorder, bradycardia, heart failure,
  // Prinzmetal's angina, phaeochromocytoma) were never read by the clinical
  // logic: a tick produced no alert and no block, and the same question had
  // to be answered again on the Contraindications step to stop supply
  // (adversarial review, 11 Sep 2026). They are removed; the Contraindications
  // step asks each exclusion once, in the document's words, and enforces it.
  diabetes: boolean;
  /** Current medicines and doses ("none" if nothing). Required: the
   *  interaction exclusions (another beta-blocker, verapamil, diltiazem)
   *  rest on this list, and the document requires it in the record. */
  currentMedications: string;
  raynauds: boolean;
  hepaticImpairment: boolean;
  // PGD v005 cautions (11 September 2026)
  firstDegreeHeartBlock: boolean;
  portalHypertension: boolean;
  mildPeripheralVascularDisease: boolean;
  psoriasis: boolean;
  myastheniaGravis: boolean;
  historyOfAnaphylaxis: boolean;
  mildDepression: boolean;
  renalImpairment: boolean;
}

export interface AnxietyContraindications {
  asthmaWithBronchospasm: boolean;
  heartBlock: boolean;
  severeBradycardia: boolean;
  uncontrolledHeartFailure: boolean;
  prinzmetalsAngina: boolean;
  pheochromocytoma: boolean;
  childUnder12: boolean;
  // Added at PGD v002, 9 September 2026. The document named these as red
  // flags in its guidance and none of them was an exclusion, and the tool
  // did not ask. Propranolol is cardiotoxic in overdose.
  suicidalOrSevereDepression: boolean;
  ptsdPanicOrAgoraphobia: boolean;
  substanceOrAlcoholMisuse: boolean;
  otherBetaBlocker: boolean;
  verapamilOrDiltiazem: boolean;
  // PGD v003/v005 exclusions (SmPC contraindications, pregnancy and
  // breastfeeding) that the tool did not ask.
  cardiogenicShock: boolean;
  hypotension: boolean;
  sickSinusSyndrome: boolean;
  metabolicAcidosis: boolean;
  hypersensitivity: boolean;
  severePeripheralArterialDisease: boolean;
  fastingOrHypoglycaemiaRisk: boolean;
  pregnancyOrPlanning: boolean;
  breastfeeding: boolean;
  /**
   * Measured today. The document excludes on a resting heart rate under
   * 50 bpm and a systolic BP under 90 mmHg; before these were captured the
   * record could not show either was measured before a beta-blocker was
   * supplied (adversarial review, 11 Sep 2026). The stops are derived from
   * the readings as well as from the tick boxes.
   */
  restingHeartRate: number | null;
  systolicBP: number | null;
}

export interface AnxietyMedicineSupply {
  /** Dose advised per administration, in mg: "10", "20", "30" or "40"
   *  (whole 10mg tablets). Required; the record used to print the range. */
  propranololDose: string;
  /**
   * 10mg tablets only, maximum 28 (280mg). PGD v002, 9 September 2026: the
   * 40mg arm is withdrawn and the whole supply taken at once must stay below
   * 320mg, because propranolol is cardiotoxic in overdose.
   */
  quantity: number | null;
  timing: string;
  /**
   * PGD dose row: 10-40mg 30-60 minutes before the anxiety-provoking
   * situation, or 10-40mg two to three times daily for ongoing situational
   * anxiety, maximum 120mg daily.
   */
  regimen: "" | "prn" | "regular";
  /** Regular regimen only: two or three times daily (document wording). */
  timesDaily: "" | "2" | "3";
}

export interface AnxietyCounselling {
  prnUseOnly: boolean;
  physicalSymptoms: boolean;
  noDependence: boolean;
  noSuddenWithdrawal: boolean;
  avoidVerapamil: boolean;
  // PGD follow-up advice row
  reportWheeze: boolean;
  coldExtremities: boolean;
  notACure: boolean;
  avoidAlcohol: boolean;
}

export interface AnxietyConsultationSummary extends BaseSummary {
  medicineRecommended: string;
  counsellingPoints: string[];
}

export interface AnxietyPropranololConsultationState {
  patient: AnxietyPropranololPatientDetails;
  consent: AnxietyPropranololConsent;
  assessment: AnxietyAssessment;
  medicalHistory: AnxietyMedicalHistory;
  contraindications: AnxietyContraindications;
  medicineSupply: AnxietyMedicineSupply;
  counselling: AnxietyCounselling;
  summary: AnxietyConsultationSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type AnxietyPropranololAction =
  | { type: "UPDATE_PATIENT"; field: keyof AnxietyPropranololPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof AnxietyPropranololConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AnxietyAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AnxietyMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof AnxietyContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof AnxietyMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AnxietyCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof AnxietyConsultationSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Anxiety Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): AnxietyPropranololConsultationState {
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
      anxietyType: "",
      triggerSituation: "",
      physicalSymptoms: "",
      frequencyOfEvents: "",
    },
    medicalHistory: {
      diabetes: false,
      currentMedications: "",
      raynauds: false,
      hepaticImpairment: false,
      firstDegreeHeartBlock: false,
      portalHypertension: false,
      mildPeripheralVascularDisease: false,
      psoriasis: false,
      myastheniaGravis: false,
      historyOfAnaphylaxis: false,
      mildDepression: false,
      renalImpairment: false,
    },
    contraindications: {
      asthmaWithBronchospasm: false,
      heartBlock: false,
      severeBradycardia: false,
      uncontrolledHeartFailure: false,
      prinzmetalsAngina: false,
      pheochromocytoma: false,
      childUnder12: false,
      suicidalOrSevereDepression: false,
      ptsdPanicOrAgoraphobia: false,
      substanceOrAlcoholMisuse: false,
      otherBetaBlocker: false,
      verapamilOrDiltiazem: false,
      cardiogenicShock: false,
      hypotension: false,
      sickSinusSyndrome: false,
      metabolicAcidosis: false,
      hypersensitivity: false,
      severePeripheralArterialDisease: false,
      fastingOrHypoglycaemiaRisk: false,
      pregnancyOrPlanning: false,
      breastfeeding: false,
      restingHeartRate: null,
      systolicBP: null,
    },
    medicineSupply: {
      propranololDose: "",
      quantity: null,
      timing: "PRN 30-60 minutes before anxiety-provoking situation",
      regimen: "",
      timesDaily: "",
    },
    counselling: {
      prnUseOnly: false,
      physicalSymptoms: false,
      noDependence: false,
      noSuddenWithdrawal: false,
      avoidVerapamil: false,
      reportWheeze: false,
      coldExtremities: false,
      notACure: false,
      avoidAlcohol: false,
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
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}
