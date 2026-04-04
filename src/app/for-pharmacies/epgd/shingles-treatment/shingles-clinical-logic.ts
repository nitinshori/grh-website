// Clinical logic and validation for shingles ePGD
import { ClinicalAlert, AlertSeverity } from '../shared/types';
import {
  ShinglesSymptoms,
  ShinglesMedicalHistory,
  ShinglesMedicineSelection,
  RashDermatome,
} from './shingles-types';

/**
 * Calculate hours since rash onset from ISO date string
 */
export function calculateHoursSinceOnset(rashOnsetDate: string): number | null {
  if (!rashOnsetDate) return null;
  const onset = new Date(rashOnsetDate);
  const now = new Date();
  const hours = (now.getTime() - onset.getTime()) / (1000 * 60 * 60);
  return hours > 0 ? Math.round(hours) : null;
}

/**
 * Check if rash is within treatment window (72 hours)
 */
export function isWithinTreatmentWindow(hoursSinceOnset: number | null): boolean {
  if (hoursSinceOnset === null) return false;
  return hoursSinceOnset <= 72;
}

/**
 * Check if dermatome is ophthalmic (V1 - trigeminal V1)
 */
export function isOphthalmicShingles(dermatome: RashDermatome): boolean {
  return dermatome === 'trigeminal-V1';
}

/**
 * Check for Hutchinson's sign risk (V1 dermatome involvement)
 */
export function hasHutchinsonSignRisk(dermatome: RashDermatome): boolean {
  return dermatome === 'trigeminal-V1';
}

/**
 * Check for Ramsay Hunt syndrome risk (ear involvement, V3/cervical area)
 */
export function hasRamsayHuntRisk(dermatome: RashDermatome): boolean {
  return dermatome === 'cervical' || dermatome === 'trigeminal-V3';
}

/**
 * Check for urinary retention risk (sacral involvement)
 */
export function hasUrinaryRetentionRisk(dermatome: RashDermatome): boolean {
  return dermatome === 'sacral';
}

/**
 * Generate clinical alerts based on patient data
 */
export function generateClinicalAlerts(
  symptoms: ShinglesSymptoms,
  medicalHistory: ShinglesMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // HARD STOPS (CRITICAL)

  // Ophthalmic shingles
  if (isOphthalmicShingles(symptoms.dermatome)) {
    alerts.push({
      code: 'ophthalmic-shingles',
      message: 'URGENT: Ophthalmic shingles (V1 dermatome) requires urgent ophthalmology referral.',
      detail: 'Pharmacy cannot manage ophthalmic shingles - refer to GP immediately for urgent ophthalmology assessment.',
      severity: 'stop',
    });
  }

  // Immunosuppressed patients
  if (
    medicalHistory.immunosuppressed ||
    medicalHistory.hivPositive ||
    medicalHistory.cancerActive ||
    medicalHistory.organTransplant
  ) {
    alerts.push({
      code: 'immunosuppressed',
      message: 'Patient is immunosuppressed.',
      detail: 'This requires specialist management - refer to GP or appropriate specialist.',
      severity: 'stop',
    });
  }

  // Pregnant patients
  if (medicalHistory.pregnant) {
    alerts.push({
      code: 'pregnant',
      message: 'Patient is pregnant.',
      detail: 'Antiviral therapy requires specialist advice - refer to GP or obstetrics.',
      severity: 'stop',
    });
  }

  // Severe hepatic impairment
  if (medicalHistory.hepaticImpairment === 'severe') {
    alerts.push({
      code: 'severe-hepatic',
      message: 'Severe hepatic impairment.',
      detail: 'Antivirals are contraindicated. Refer to GP.',
      severity: 'stop',
    });
  }

  // Outside treatment window AND already crusting (antivirals unlikely to help)
  if (
    symptoms.hoursSinceOnset !== null &&
    symptoms.hoursSinceOnset > 72 &&
    symptoms.rashStage === 'crusting'
  ) {
    alerts.push({
      code: 'outside-window-crusting',
      message: `Rash is ${symptoms.hoursSinceOnset} hours since onset and crusting.`,
      detail: 'Antivirals are unlikely to be effective. Refer to GP for pain management advice.',
      severity: 'stop',
    });
  }

  // RED FLAGS (HIGH)

  // Hutchinson's sign risk
  if (hasHutchinsonSignRisk(symptoms.dermatome)) {
    alerts.push({
      code: 'hutchinson-sign-risk',
      message: 'V1 involvement carries risk of eye complications (Hutchinson\'s sign).',
      detail: 'Ensure patient understands need for immediate eye care if eye symptoms develop.',
      severity: 'red-flag',
    });
  }

  // Ramsay Hunt syndrome risk
  if (hasRamsayHuntRisk(symptoms.dermatome)) {
    alerts.push({
      code: 'ramsay-hunt-risk',
      message: 'V3/cervical dermatome involvement carries risk of Ramsay Hunt syndrome.',
      detail: 'Monitor for facial weakness, ear pain, or hearing loss.',
      severity: 'red-flag',
    });
  }

  // Urinary retention risk
  if (hasUrinaryRetentionRisk(symptoms.dermatome)) {
    alerts.push({
      code: 'urinary-retention-risk',
      message: 'Sacral dermatome involvement carries risk of urinary retention.',
      detail: 'Counsel patient to seek medical attention if unable to void.',
      severity: 'red-flag',
    });
  }

  // Severe pain
  if (symptoms.painLevel !== null && symptoms.painLevel >= 8) {
    alerts.push({
      code: 'severe-pain',
      message: 'Severe pain (8+/10).',
      detail: 'Consider specialist pain management and higher-dose analgesia. Patient may need GP review for additional support.',
      severity: 'red-flag',
    });
  }

  // CAUTIONS (AMBER)

  // Outside treatment window (48-72 hours)
  if (symptoms.hoursSinceOnset !== null && symptoms.hoursSinceOnset > 48 && symptoms.hoursSinceOnset <= 72) {
    alerts.push({
      code: 'approaching-treatment-window',
      message: `Rash is ${symptoms.hoursSinceOnset} hours since onset.`,
      detail: 'Approaching edge of treatment window - antivirals may be less effective.',
      severity: 'caution',
    });
  }

  // Moderate renal impairment
  if (medicalHistory.renalImpairment === 'moderate') {
    alerts.push({
      code: 'moderate-renal',
      message: 'Moderate renal impairment detected.',
      detail: 'Dose adjustment required: valaciclovir 1g BD or aciclovir 800mg TDS.',
      severity: 'caution',
    });
  }

  // Severe renal impairment
  if (medicalHistory.renalImpairment === 'severe') {
    alerts.push({
      code: 'severe-renal',
      message: 'Severe renal impairment detected.',
      detail: 'Significant dose adjustment required: valaciclovir 500mg TDS or aciclovir 800mg BD. Consider GP referral.',
      severity: 'caution',
    });
  }

  // Mild-moderate hepatic impairment
  if (medicalHistory.hepaticImpairment === 'mild-moderate') {
    alerts.push({
      code: 'hepatic-impairment',
      message: 'Mild-moderate hepatic impairment noted.',
      detail: 'Monitor for side effects. Patient should avoid alcohol.',
      severity: 'caution',
    });
  }

  // Breastfeeding
  if (medicalHistory.breastfeeding) {
    alerts.push({
      code: 'breastfeeding',
      message: 'Patient is breastfeeding.',
      detail: 'Aciclovir is preferred (small amounts in breast milk); valaciclovir less preferred. Counsel on monitoring infant.',
      severity: 'caution',
    });
  }

  // Elderly (>70 years)
  if (symptoms.painLevel !== null && symptoms.painLevel >= 7) {
    alerts.push({
      code: 'elderly-phn-risk',
      message: 'Significant pain in patient.',
      detail: 'Postherpetic neuralgia (PHN) risk is high. Optimal antiviral timing is critical.',
      severity: 'caution',
    });
  }

  return alerts;
}

/**
 * Get recommended dose based on medicine and renal status
 */
export function getRecommendedDose(
  medicine: string,
  renalStatus: 'none' | 'moderate' | 'severe',
  age?: number
): {
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  notes: string;
} {
  if (medicine === 'valaciclovir') {
    if (renalStatus === 'none') {
      return {
        dose: '1g',
        frequency: 'three times daily',
        duration: '7 days',
        quantity: 21,
        notes: 'Standard dose for normal renal function',
      };
    } else if (renalStatus === 'moderate') {
      return {
        dose: '1g',
        frequency: 'twice daily',
        duration: '7 days',
        quantity: 14,
        notes: 'Moderate renal impairment - reduced frequency',
      };
    } else {
      // severe
      return {
        dose: '500mg',
        frequency: 'three times daily',
        duration: '7 days',
        quantity: 21,
        notes: 'Severe renal impairment - reduced dose',
      };
    }
  } else if (medicine === 'aciclovir') {
    if (renalStatus === 'none') {
      return {
        dose: '800mg',
        frequency: 'five times daily',
        duration: '7 days',
        quantity: 35,
        notes: 'Standard dose for normal renal function',
      };
    } else if (renalStatus === 'moderate') {
      return {
        dose: '800mg',
        frequency: 'three times daily',
        duration: '7 days',
        quantity: 21,
        notes: 'Moderate renal impairment - reduced frequency',
      };
    } else {
      // severe
      return {
        dose: '800mg',
        frequency: 'twice daily',
        duration: '7 days',
        quantity: 14,
        notes: 'Severe renal impairment - reduced frequency',
      };
    }
  }

  return {
    dose: '',
    frequency: '',
    duration: '',
    quantity: 0,
    notes: '',
  };
}

/**
 * Validate symptom data
 */
export function validateSymptomStep(symptoms: ShinglesSymptoms): string | null {
  if (!symptoms.rashOnsetDate) {
    return 'Rash onset date is required';
  }
  if (!symptoms.rashStage) {
    return 'Rash stage must be selected';
  }
  if (!symptoms.dermatome) {
    return 'Dermatome location is required';
  }
  if (symptoms.painLevel === null || symptoms.painLevel < 1 || symptoms.painLevel > 10) {
    return 'Pain level must be between 1 and 10';
  }
  if (!symptoms.painType) {
    return 'Pain type must be selected';
  }
  if (!symptoms.rashDescription.trim()) {
    return 'Rash description is required';
  }
  return null;
}

/**
 * Validate medical history data
 */
export function validateMedicalHistoryStep(medicalHistory: ShinglesMedicalHistory): string | null {
  if (medicalHistory.immunosuppressed && !medicalHistory.immunosuppressedDetails.trim()) {
    return 'Please provide details of immunosuppression';
  }
  return null;
}

/**
 * Validate medicine selection
 */
export function validateMedicineSelectionStep(selection: ShinglesMedicineSelection): string | null {
  if (!selection.medicine) {
    return 'Medicine must be selected';
  }
  if (!selection.dose) {
    return 'Dose is required';
  }
  if (!selection.frequency) {
    return 'Frequency is required';
  }
  if (!selection.duration) {
    return 'Duration is required';
  }
  if (selection.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }
  if (selection.pharmacistOverride && !selection.overrideReason.trim()) {
    return 'Override reason is required';
  }
  return null;
}

/**
 * Validate counselling
 */
export function validateCounsellingStep(counselling: any): string | null {
  const requiredItems = [
    'completeCourse',
    'painManagement',
    'rashCare',
    'contagiousPeriod',
    'pregnancyExposure',
    'PHNRisk',
    'returnIfWorsening',
    'vaccinationAdvice',
  ];

  for (const item of requiredItems) {
    if (counselling[item] !== true) {
      return `All counselling items must be confirmed`;
    }
  }
  return null;
}

/**
 * Check if patient can proceed (no blocking alerts)
 */
export function canProceedToMedicineSelection(alerts: ClinicalAlert[]): boolean {
  return !alerts.some((a) => a.severity === 'stop');
}
