// ─── Altitude Sickness ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export interface ASPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
  femaleConfirmed: boolean;
}

// ─── Travel Assessment ───

export type ASPurpose = 'prevention' | 'treatment' | '';

export interface ASTravelAssessment {
  destinationCountry: string;
  destinationAltitude: number | null; // metres; PGD v003 inclusion: above 2,500 metres
  currentAltitude: number | null; // current altitude they're at (base)
  departureDate: string; // YYYY-MM-DD
  /** PGD v003 inclusion: requesting preventative treatment or symptomatic treatment for AMS. */
  purpose: ASPurpose;
  ascentRate: string; // 'slow' (gradual), 'moderate', 'rapid'
  acclimatisationPlan: boolean;
  acclimatisationDays: number | null; // days at intermediate altitude
  previousAltitudeExperience: boolean;
  previousAltitudeSickness: boolean;
  previousSicknessDetails: string;
}

// ─── Medical History (Altitude Sickness specific) ───

export interface ASMedicalHistory {
  sulfonamideAllergy: boolean; // hypersensitivity to acetazolamide or sulfonamides: exclusion
  severeHepaticImpairment: boolean; // severe hepatic impairment or hepatic cirrhosis: exclusion
  severeRenalImpairment: boolean; // exclusion
  mildRenalImpairment: boolean; // PGD v003 caution
  adrenalInsufficiency: boolean; // contraindication
  hypokalaemia: boolean; // contraindication
  hyponatraemia: boolean; // contraindication
  metabolicAcidosisOrElectrolyteImbalance: boolean; // hyperchloraemic acidosis or history of electrolyte imbalance: exclusion
  pulmonaryOedemaAfterAcetazolamide: boolean; // previous non-cardiogenic pulmonary oedema after acetazolamide: exclusion
  renalStoneHistory: boolean; // caution: increase fluid intake
  pulmonaryOedema: boolean;
  cerebralOedema: boolean;
  highAltitudeArrhythmia: boolean;
  pregnantOrBreastfeeding: boolean;
}

// ─── Current Medications ───

export interface ASMedications {
  takesThiazideDiuretics: boolean; // potassium-depleting diuretic (thiazide or loop): exclusion, refer
  takesLithium: boolean; // exclusion, refer
  takesPhenytoin: boolean; // exclusion, refer
  takesHighDoseAspirin: boolean; // exclusion, refer
  takesACEInhibitors: boolean;
  takesTopiramate: boolean; // may interact
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Selection ───

export interface ASMedicineSelection {
  selectedMedicine: 'acetazolamide' | '';
  dose: string; // prevention 125 mg (half a 250 mg tablet) BD; treatment 250 mg BD up to 3 days
  startTiming: string;
  continuationTiming: string;
  /** PGD v003: 6 treatment tablets may be supplied in addition to the prevention course where descent is difficult. */
  includeTreatmentCourse: boolean;
  /** PGD v003: quantity supplied in tablets. Max 14 prevention, 6 treatment, 20 total. */
  quantityTablets: number | null;
  /** PGD v003 records: name and brand of medication. */
  brand: string;
  /** PGD v003: patient told that use for AMS is off-label, recorded. */
  offLabelExplained: boolean;
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface ASCounselling {
  paraesthesiaExplained: boolean; // tingling is common and harmless
  avoidAlcoholAdvice: boolean;
  hydrateWellAdvice: boolean;
  ascentAdvice: boolean;
  amsSymptomAdvice: boolean; // Acute mountain sickness symptoms
  haceSymptomAdvice: boolean; // High altitude cerebral edema
  hapeSymptomAdvice: boolean; // High altitude pulmonary edema
  descentAdvice: boolean; // descent immediately if severe
  medicineCardProvided: boolean;
}

// ─── Full Consultation Summary ───

export interface ASConsultationSummary extends BaseSummary {
  // Additional AS-specific fields if needed
}

// ─── Full Consultation State ───

export interface ASConsultationState {
  currentStep: number;
  patient: ASPatientDetails;
  consent: BaseConsent;
  travelAssessment: ASTravelAssessment;
  medicalHistory: ASMedicalHistory;
  medications: ASMedications;
  medicineSelection: ASMedicineSelection;
  counselling: ASCounselling;
  summary: ASConsultationSummary;
  // Computed
  alerts: any[];
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type ASAction =
  | { type: 'UPDATE_PATIENT'; field: keyof ASPatientDetails; value: ASPatientDetails[keyof ASPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof ASTravelAssessment; value: ASTravelAssessment[keyof ASTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof ASMedicalHistory; value: ASMedicalHistory[keyof ASMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof ASMedications; value: ASMedications[keyof ASMedications] }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof ASMedicineSelection; value: ASMedicineSelection[keyof ASMedicineSelection] }
  | { type: 'UPDATE_COUNSELLING'; field: keyof ASCounselling; value: boolean }
  | { type: 'UPDATE_SUMMARY'; field: keyof ASConsultationSummary; value: string }
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

export function createInitialASState(): ASConsultationState {
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
      destinationAltitude: null,
      currentAltitude: null,
      departureDate: '',
      purpose: '',
      ascentRate: '',
      acclimatisationPlan: false,
      acclimatisationDays: null,
      previousAltitudeExperience: false,
      previousAltitudeSickness: false,
      previousSicknessDetails: '',
    },
    medicalHistory: {
      sulfonamideAllergy: false,
      severeHepaticImpairment: false,
      severeRenalImpairment: false,
      mildRenalImpairment: false,
      adrenalInsufficiency: false,
      hypokalaemia: false,
      hyponatraemia: false,
      metabolicAcidosisOrElectrolyteImbalance: false,
      pulmonaryOedemaAfterAcetazolamide: false,
      renalStoneHistory: false,
      pulmonaryOedema: false,
      cerebralOedema: false,
      highAltitudeArrhythmia: false,
      pregnantOrBreastfeeding: false,
    },
    medications: {
      takesThiazideDiuretics: false,
      takesLithium: false,
      takesPhenytoin: false,
      takesHighDoseAspirin: false,
      takesACEInhibitors: false,
      takesTopiramate: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    medicineSelection: {
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationTiming: '',
      includeTreatmentCourse: false,
      quantityTablets: null,
      brand: '',
      offLabelExplained: false,
      reason: '',
    },
    counselling: {
      paraesthesiaExplained: false,
      avoidAlcoholAdvice: false,
      hydrateWellAdvice: false,
      ascentAdvice: false,
      amsSymptomAdvice: false,
      haceSymptomAdvice: false,
      hapeSymptomAdvice: false,
      descentAdvice: false,
      medicineCardProvided: false,
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
