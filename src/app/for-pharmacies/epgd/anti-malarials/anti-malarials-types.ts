// ─── Anti-malarials ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export interface AMPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
  femaleConfirmed: boolean;
}

// ─── Travel Assessment ───

export interface AMTravelAssessment {
  destinationCountry: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  tripDuration: number | null; // calculated days
  /** PGD v008: destination risk assessment from current NaTHNaC / TravelHealthPro guidance is an inclusion criterion. */
  riskAssessmentCompleted: boolean;
  /** PGD v008 records: the source consulted for the destination recommendation. */
  riskAssessmentSource: string;
  /** PGD v008: body weight in kg. Weight, not age, determines dose and product strength. */
  weightKg: number | null;
  /** PGD v008 inclusion: able and willing to complete the whole course including the post-travel tail. */
  willingToCompleteCourse: boolean;
  previousMalariaProphylaxis: boolean;
  previousProphylaxisType: string; // if yes: which medicine?
  currentlyPregnant: boolean;
  planningPregnancy: boolean;
  breastfeeding: boolean;
}

// ─── Medical History (Anti-malarials specific) ───

export interface AMMedicalHistory {
  /** PGD v008: any febrile illness now, or presenting for treatment of suspected/confirmed malaria. Exclusion, refer same day. */
  currentFeverOrSuspectedMalaria: boolean;
  /** PGD v008: fever within the last 12 months after travel to a malarious area, not investigated with a blood film. Exclusion. */
  uninvestigatedPostTravelFever: boolean;
  severeRenalImpairment: boolean; // known severe renal impairment, kidney disease or dialysis: A/P excluded
  severeHepaticImpairment: boolean; // doxycycline and mefloquine excluded
  epilepsy: boolean; // epilepsy or any seizure disorder: mefloquine excluded
  psychiatricHistory: boolean; // ANY current or previous psychiatric disorder: mefloquine excluded
  sulfonamideAllergy: boolean; // caution re: doxycycline
  penicillinAllergy: boolean;
  atovaquoneProguanilAllergy: boolean; // A/P excluded
  tetracyclineAllergy: boolean; // doxycycline excluded
  mefloquineQuinineAllergy: boolean; // mefloquine, quinine or quinidine: mefloquine excluded
  blackwaterFever: boolean; // mefloquine excluded
  lupusMyastheniaPorphyria: boolean; // SLE, myasthenia gravis or porphyria: doxycycline excluded
  pilotOrDiver: boolean; // occupation needing fine coordination: mefloquine excluded
  photosensitivity: boolean; // caution for Doxy
  g6pdDeficiency: boolean; // caution/alert
  arrhythmia: boolean; // cardiac conduction disorder or family history: mefloquine excluded
  qTprolongation: boolean; // QT prolongation, family history, or QT-prolonging medicines: mefloquine excluded
}

// ─── Current Medications ───

export interface AMMedications {
  takesWarfarin: boolean; // A/P and doxycycline excluded (refer for INR monitoring)
  takesOralContraception: boolean; // doxycycline is non-enzyme-inducing; no extra precautions unless vomiting/diarrhoea
  takesAntacids: boolean; // separate doxycycline from antacids, iron and dairy by 2 hours
  takesRifampicinOrRifabutin: boolean; // A/P excluded; rifampicin also excludes doxycycline
  takesMetoclopramideOrTetracycline: boolean; // A/P excluded
  takesAntiretroviralsOrPyrimethamine: boolean; // A/P excluded
  takesCarbamazepinePhenytoinPhenobarbital: boolean; // doxycycline and mefloquine excluded
  takesOtherAnticonvulsant: boolean; // mefloquine excluded
  takesIsotretinoin: boolean; // doxycycline excluded
  takesBupropionOrSeizureLowering: boolean; // mefloquine excluded
  takesHalofantrineOrKetoconazole: boolean; // mefloquine excluded
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Contraindications Check ───

export interface AMContraindications {
  malaioneContraindicated: boolean;
  doxyContraindicated: boolean;
  mefloquineContraindicated: boolean;
}

// ─── Medicine Selection ───

export type AMMedicineChoice =
  | 'malarone' // atovaquone 250mg / proguanil 100mg adult tablet, over 40kg
  | 'malarone-paediatric' // atovaquone 62.5mg / proguanil 25mg paediatric tablet, 11 to 40kg
  | 'doxycycline'
  | 'mefloquine'
  | '';

export interface AMMedicineSelection {
  selectedMedicine: AMMedicineChoice;
  dose: string;
  startTiming: string;
  continuationAfterReturn: string;
  /** PGD v008 records: quantity supplied and the calculated course length including the tail. */
  quantity: string;
  /** PGD v008 mefloquine arm: a divided dose may only be supplied from a scored tablet. */
  scoredTabletConfirmed: boolean;
  /** PGD v008 records: batch number and expiry date. */
  batchNumber: string;
  expiryDate: string;
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface AMCounselling {
  takeWithFood: boolean;
  sunProtectionAdvice: boolean; // especially for Doxy
  bitePrevention: boolean;
  pregnancyAdvice: boolean;
  diarrhoeaManagement: boolean;
  feverManagement: boolean;
  sideEffectsExplained: boolean;
  whenToSeekHelp: boolean;
  medicineCardProvided: boolean;
  /** PGD v008: keep taking it for the post-travel tail (7 days A/P, 4 weeks doxycycline and mefloquine). */
  completeCourseAdvised: boolean;
  /** PGD v008 mefloquine: STOP and seek advice at the first neuropsychiatric symptom, including insomnia and abnormal dreams. */
  mefloquineStopAdvice: boolean;
}

// ─── Full Consultation Summary ───

export interface AMConsultationSummary extends BaseSummary {
  // Additional AM-specific fields if needed
}

// ─── Full Consultation State ───

export interface AMConsultationState {
  currentStep: number;
  patient: AMPatientDetails;
  consent: BaseConsent;
  travelAssessment: AMTravelAssessment;
  medicalHistory: AMMedicalHistory;
  medications: AMMedications;
  contraindications: AMContraindications;
  medicineSelection: AMMedicineSelection;
  counselling: AMCounselling;
  summary: AMConsultationSummary;
  // Computed
  alerts: any[];
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type AMAction =
  | { type: 'UPDATE_PATIENT'; field: keyof AMPatientDetails; value: AMPatientDetails[keyof AMPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof AMTravelAssessment; value: AMTravelAssessment[keyof AMTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof AMMedicalHistory; value: AMMedicalHistory[keyof AMMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof AMMedications; value: AMMedications[keyof AMMedications] }
  | { type: 'UPDATE_CONTRAINDICATIONS'; field: keyof AMContraindications; value: boolean }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof AMMedicineSelection; value: AMMedicineSelection[keyof AMMedicineSelection] }
  | { type: 'UPDATE_COUNSELLING'; field: keyof AMCounselling; value: boolean }
  | { type: 'UPDATE_SUMMARY'; field: keyof AMConsultationSummary; value: string }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

// ─── Step Labels ───

export const STEP_LABELS = [
  'Patient Details',
  'Consent & ID',
  'Travel Assessment',
  'Medical History',
  'Current Medications',
  'Contraindications Review',
  'Medicine Selection',
  'Counselling & Follow-up',
  'Summary & Print',
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialAMState(): AMConsultationState {
  return {
    currentStep: 0,
    patient: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: null,
      gpName: '',
      gpPractice: '',
gpAddress: '',
gpPhone: '',
gpEmail: '',
gpOdsCode: '',
      nhsNumber: '',
      address: '',
      phone: '',
      email: '',
      maleConfirmed: false,
      femaleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: '',
      patientAwarePrivateService: false,
    },
    travelAssessment: {
      destinationCountry: '',
      departureDate: '',
      returnDate: '',
      tripDuration: null,
      riskAssessmentCompleted: false,
      riskAssessmentSource: '',
      weightKg: null,
      willingToCompleteCourse: false,
      previousMalariaProphylaxis: false,
      previousProphylaxisType: '',
      currentlyPregnant: false,
      planningPregnancy: false,
      breastfeeding: false,
    },
    medicalHistory: {
      currentFeverOrSuspectedMalaria: false,
      uninvestigatedPostTravelFever: false,
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      epilepsy: false,
      psychiatricHistory: false,
      sulfonamideAllergy: false,
      penicillinAllergy: false,
      atovaquoneProguanilAllergy: false,
      tetracyclineAllergy: false,
      mefloquineQuinineAllergy: false,
      blackwaterFever: false,
      lupusMyastheniaPorphyria: false,
      pilotOrDiver: false,
      photosensitivity: false,
      g6pdDeficiency: false,
      arrhythmia: false,
      qTprolongation: false,
    },
    medications: {
      takesWarfarin: false,
      takesOralContraception: false,
      takesAntacids: false,
      takesRifampicinOrRifabutin: false,
      takesMetoclopramideOrTetracycline: false,
      takesAntiretroviralsOrPyrimethamine: false,
      takesCarbamazepinePhenytoinPhenobarbital: false,
      takesOtherAnticonvulsant: false,
      takesIsotretinoin: false,
      takesBupropionOrSeizureLowering: false,
      takesHalofantrineOrKetoconazole: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    contraindications: {
      malaioneContraindicated: false,
      doxyContraindicated: false,
      mefloquineContraindicated: false,
    },
    medicineSelection: {
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationAfterReturn: '',
      quantity: '',
      scoredTabletConfirmed: false,
      batchNumber: '',
      expiryDate: '',
      reason: '',
    },
    counselling: {
      takeWithFood: false,
      sunProtectionAdvice: false,
      bitePrevention: false,
      pregnancyAdvice: false,
      diarrhoeaManagement: false,
      feverManagement: false,
      sideEffectsExplained: false,
      whenToSeekHelp: false,
      medicineCardProvided: false,
      completeCourseAdvised: false,
      mefloquineStopAdvice: false,
    },
    summary: {
      pharmacistName: '',
      pharmacistGPhC: '',
      pharmacyName: '',
      pharmacyAddress: '',
      consultationDate: new Date().toISOString().split('T')[0],
      consultationTime: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      clinicalNotes: '',
    },
    alerts: [],
    canProceed: false,
    isComplete: false,
  };
}
