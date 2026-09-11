// Shingles-specific types for PGD consultation
// Aligned to the Shingles (Herpes Zoster) Treatment PGD, version 005,
// issued 11 September 2026 (aciclovir, valaciclovir or famciclovir).
import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

export type RashStage = 'prodromal' | 'vesicular' | 'pustular' | 'crusting' | '';
export type RashDermatome =
  | 'thoracic'
  | 'cervical'
  | 'trigeminal-V1'
  | 'trigeminal-V2'
  | 'trigeminal-V3'
  | 'lumbar'
  | 'sacral'
  | 'upper-limb'
  | 'lower-limb'
  | 'perineum';
export type PainType = 'burning' | 'stabbing' | 'aching' | 'itching' | '';
export type RashSeverity = 'mild' | 'moderate' | 'severe' | '';
/** eGFR band. The PGD does not operate a renal dosing ladder: below the threshold for the agent, refer. */
export type RenalStatus = 'none' | 'moderate' | 'severe' | 'unknown';
export type HepaticStatus = 'none' | 'mild-moderate' | 'severe';
/** Green Book chapter 28a: severe immunosuppression is excluded; non-severe changes the agent. */
export type ImmunosuppressionSeverity = 'non-severe' | 'severe' | '';
export type Medicine = 'valaciclovir' | 'aciclovir' | 'famciclovir' | '';

export interface ShinglesSymptoms {
  rashOnsetDate: string; // ISO date string
  hoursSinceOnset: number | null; // calculated automatically
  rashStage: RashStage;
  dermatome: RashDermatome;
  painLevel: number | null; // 1-10 scale
  painType: PainType;
  /** Inclusion: unilateral, dermatomal rash that does not cross the midline. Must be confirmed. */
  unilateral: boolean;
  rashDescription: string;
  /** Moderate or severe rash with confluent lesions is a 72-hour window criterion. */
  rashSeverity: RashSeverity;
  /** Continued formation of new vesicles: a 7-day window criterion. */
  newVesiclesForming: boolean;
  /** High risk of severe shingles, for example severe atopic eczema: a 7-day window criterion. */
  highRiskSevereShingles: boolean;
  // Red flags requiring urgent referral rather than supply (PGD v005)
  /** Any visual symptom, unexplained red eye, eye pain or Hutchinson's sign. */
  eyeSymptoms: boolean;
  /** Rash in or around the ear, hearing loss, vertigo, altered taste or facial weakness (Ramsay Hunt). */
  earOrFacialSymptoms: boolean;
  /** Neck stiffness, photophobia, mottled skin. */
  meningitisSigns: boolean;
  /** Disorientation, confusion, change in behaviour. */
  encephalitisSigns: boolean;
  /** Muscle weakness, loss of bladder or bowel control. */
  myelitisSigns: boolean;
  /** Any sign of sepsis or serious systemic infection. */
  sepsisSigns: boolean;
  /** Systemic illness not meeting the threshold for sepsis. */
  systemicallyUnwell: boolean;
  /** Pain not controlled by over-the-counter analgesia. */
  painUncontrolledByOtc: boolean;
  /** Record: ophthalmic involvement was specifically excluded. */
  ophthalmicExcluded: boolean;
}

export interface ShinglesMedicalHistory {
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  /** Required where immunosuppressed or HIV positive. Severe (Green Book 28a) is an exclusion. */
  immunosuppressionSeverity: ImmunosuppressionSeverity;
  /** Known or suspected. */
  pregnant: boolean;
  breastfeeding: boolean;
  /** Breastfeeding with sores on the breast is an exclusion; sores elsewhere are a caution. */
  breastLesions: boolean;
  renalImpairment: RenalStatus;
  /** Record: how renal function was established (result, date, source). */
  renalFunctionSource: string;
  hepaticImpairment: HepaticStatus;
  hivPositive: boolean;
  previousShingles: boolean;
  cancerActive: boolean;
  organTransplant: boolean;
  currentMedications: string;
  allergies: string;
  // Exclusions (PGD v005)
  allergyAciclovirValaciclovir: boolean;
  allergyFamciclovirPenciclovir: boolean;
  previousDress: boolean;
  /** Concurrent ciclosporin, tacrolimus, mycophenolate, aminophylline or theophylline. */
  excludedInteractingMedicines: boolean;
  unableToSwallowOrAbsorb: boolean;
  onAntiviralProphylaxis: boolean;
  neurologicalCondition: boolean;
  dehydrationRisk: boolean;
  failedAntiviralThisEpisode: boolean;
  // Cautions (PGD v005)
  nephrotoxicMedicines: boolean;
  tenofovir: boolean;
  probenecidOrCimetidine: boolean;
  raloxifene: boolean;
}

export interface ShinglesMedicineSelection {
  medicine: Medicine;
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  /** Record: name and brand of medicine, and batch number. */
  brand: string;
  batchNumber: string;
  pharmacistOverride: boolean;
  overrideReason: string;
}

export interface ShinglesCounselling {
  completeCourse: boolean;
  painManagement: boolean;
  rashCare: boolean;
  contagiousPeriod: boolean;
  pregnancyExposure: boolean;
  PHNRisk: boolean;
  returnIfWorsening: boolean;
  vaccinationAdvice: boolean;
  /** PIL given, dosing explained, antivirals reduce but do not cure, return unused medicine. */
  leafletAndDosing: boolean;
  /** Maintain a good fluid intake throughout the course, particularly if elderly. */
  hydration: boolean;
}

export interface ShinglesPatientDetails extends BasePatientDetails {
  // Inherits: dateOfBirth, gender (optional), weight, height, notes
}

export interface ShinglesConsent extends BaseConsent {
  // Inherits: agreedToTreatment, confirmIdentity, confirmedInformation
}

export interface ShinglesSummary extends BaseSummary {
  patientDetails: ShinglesPatientDetails;
  consent: ShinglesConsent;
  symptoms: ShinglesSymptoms;
  medicalHistory: ShinglesMedicalHistory;
  medicineSelection: ShinglesMedicineSelection;
  counselling: ShinglesCounselling;
}

// Initial state factories
export const initialShinglesSymptoms = (): ShinglesSymptoms => ({
  rashOnsetDate: '',
  hoursSinceOnset: null,
  rashStage: '',
  dermatome: 'thoracic',
  painLevel: null,
  painType: '',
  unilateral: false,
  rashDescription: '',
  rashSeverity: '',
  newVesiclesForming: false,
  highRiskSevereShingles: false,
  eyeSymptoms: false,
  earOrFacialSymptoms: false,
  meningitisSigns: false,
  encephalitisSigns: false,
  myelitisSigns: false,
  sepsisSigns: false,
  systemicallyUnwell: false,
  painUncontrolledByOtc: false,
  ophthalmicExcluded: false,
});

export const initialShinglesMedicalHistory = (): ShinglesMedicalHistory => ({
  immunosuppressed: false,
  immunosuppressedDetails: '',
  immunosuppressionSeverity: '',
  pregnant: false,
  breastfeeding: false,
  breastLesions: false,
  renalImpairment: 'unknown',
  renalFunctionSource: '',
  hepaticImpairment: 'none',
  hivPositive: false,
  previousShingles: false,
  cancerActive: false,
  organTransplant: false,
  currentMedications: '',
  allergies: '',
  allergyAciclovirValaciclovir: false,
  allergyFamciclovirPenciclovir: false,
  previousDress: false,
  excludedInteractingMedicines: false,
  unableToSwallowOrAbsorb: false,
  onAntiviralProphylaxis: false,
  neurologicalCondition: false,
  dehydrationRisk: false,
  failedAntiviralThisEpisode: false,
  nephrotoxicMedicines: false,
  tenofovir: false,
  probenecidOrCimetidine: false,
  raloxifene: false,
});

export const initialShinglesMedicineSelection = (): ShinglesMedicineSelection => ({
  medicine: '',
  dose: '',
  frequency: '',
  duration: '',
  quantity: 0,
  brand: '',
  batchNumber: '',
  pharmacistOverride: false,
  overrideReason: '',
});

export const initialShinglesCounselling = (): ShinglesCounselling => ({
  completeCourse: false,
  painManagement: false,
  rashCare: false,
  contagiousPeriod: false,
  pregnancyExposure: false,
  PHNRisk: false,
  returnIfWorsening: false,
  vaccinationAdvice: false,
  leafletAndDosing: false,
  hydration: false,
});
