import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface ThrushAssessment {
  vulvalItching: boolean;
  vulvalSoreness: boolean;
  thickWhiteDischarge: boolean;
  dysuria: boolean; // any pain passing urine
  dysuriaType: "" | "external" | "internal"; // external: stinging as urine passes over the sore vulva (a thrush symptom); internal: pain inside the urethra or bladder (exclusion)
  urinaryFrequencyOrUrgency: boolean; // dysuria with frequency, urgency or fever is an exclusion (possible UTI)
  dyspareunia: boolean;
  bloodStainedDischarge: boolean;
  offensiveSmell: boolean;
  fever: boolean;
  pelvicPain: boolean; // lower abdominal pain
  vulvalUlcers: boolean; // vulval ulcers, sores or blisters
  systemicUpset: boolean;
  recurrentEpisodes: number | null;
  exclusionsAsked: boolean; // pharmacist attests every symptom exclusion above was asked
}

export interface ThrushMedicalHistory {
  femaleConfirmed: boolean; // PGD: women aged 16 to 60
  diabetes: boolean;
  diabetesPoorlyControlled: boolean; // exclusion, both arms
  pregnancy: boolean; // fluconazole exclusion; pessary caution (insert with fingers, no applicator)
  breastfeeding: boolean; // fluconazole exclusion
  immunocompromised: boolean; // exclusion, both arms
  ageUnder16: boolean;
  ageOver60: boolean;
  firstEpisode: boolean; // exclusion, both arms
  recurrentThrush: boolean; // 4 or more in 12 months, or 2 in the last 6 months: exclusion, both arms
  stiExposure: boolean; // possible STI exposure or partner with an STI: exclusion, both arms
  azoleHypersensitivity: boolean; // fluconazole or azoles
  imidazoleHypersensitivity: boolean; // clotrimazole or imidazoles
  severeHepatic: boolean; // Child-Pugh over 9: fluconazole exclusion
  severeRenal: boolean; // eGFR under 20: fluconazole exclusion
  mildModerateHepatic: boolean; // fluconazole caution
  mildModerateRenal: boolean; // fluconazole caution
  qtHistory: boolean; // QT prolongation or cardiac arrhythmias: fluconazole exclusion
  cannotRetainPessary: boolean; // abnormal anatomy, severe prolapse: pessary caution
  exclusionsAsked: boolean; // pharmacist attests every exclusion and caution above was asked and recorded
}

export interface ThrushMedications {
  warfarin: boolean;
  qtDrugs: boolean; // terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin: fluconazole exclusion
  statins: boolean;
  phenytoin: boolean;
  rifampicin: boolean;
  otherMedications: string;
  allergies: string;
}

export type ThrushMedicineChoice = "" | "fluconazole-oral" | "clotrimazole-pessary";

export interface ThrushMedicineSelection {
  medicineChoice: ThrushMedicineChoice;
  dose: string;
  frequency: string;
  brand: string; // records row: name and brand of medication
  abilityConfirmed: boolean; // pessary arm inclusion: able to insert pessary intravaginally
}

export interface ThrushCounselling {
  typicalSymptoms: boolean;
  avoidPerfumedProducts: boolean;
  cottonUnderwear: boolean;
  completesTreatment: boolean;
  timelineToRelief: boolean;
  recurrenceAdvice: boolean;
  avoidIntercourse: boolean; // at least 5 days after treatment; pessary may damage condoms and diaphragms
  insertWithFingers: boolean; // pessary: fingers rather than applicator
  yellowCardAdvice: boolean;
  pilSupplied: boolean; // written information row: PIL supplied with the medication
}

export const PGD_VERSION_LABEL =
  "Vaginal Thrush PGD (fluconazole 150 mg capsule / clotrimazole 500 mg pessary), version 005, issued 11 September 2026";

export interface ThrushConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ThrushAssessment;
  medicalHistory: ThrushMedicalHistory;
  medications: ThrushMedications;
  medicineSelection: ThrushMedicineSelection;
  counselling: ThrushCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type ThrushAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = ["Patient Details", "Consent", "Symptom Assessment", "Medical History", "Contraindications", "Medicine Selection", "Counselling", "Summary"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): ThrushConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { vulvalItching: false, vulvalSoreness: false, thickWhiteDischarge: false, dysuria: false, dysuriaType: "", urinaryFrequencyOrUrgency: false, dyspareunia: false, bloodStainedDischarge: false, offensiveSmell: false, fever: false, pelvicPain: false, vulvalUlcers: false, systemicUpset: false, recurrentEpisodes: null, exclusionsAsked: false },
    medicalHistory: { femaleConfirmed: false, diabetes: false, diabetesPoorlyControlled: false, pregnancy: false, breastfeeding: false, immunocompromised: false, ageUnder16: false, ageOver60: false, firstEpisode: false, recurrentThrush: false, stiExposure: false, azoleHypersensitivity: false, imidazoleHypersensitivity: false, severeHepatic: false, severeRenal: false, mildModerateHepatic: false, mildModerateRenal: false, qtHistory: false, cannotRetainPessary: false, exclusionsAsked: false },
    medications: { warfarin: false, qtDrugs: false, statins: false, phenytoin: false, rifampicin: false, otherMedications: "", allergies: "" },
    medicineSelection: { medicineChoice: "", dose: "", frequency: "", brand: "", abilityConfirmed: false },
    counselling: { typicalSymptoms: false, avoidPerfumedProducts: false, cottonUnderwear: false, completesTreatment: false, timelineToRelief: false, recurrenceAdvice: false, avoidIntercourse: false, insertWithFingers: false, yellowCardAdvice: false, pilSupplied: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}
