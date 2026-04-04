import { ImpetigoLesionAssessment, ImpetigoMedicalHistory, ImpetigoTreatmentSelection } from './impetigo-types';
import { ClinicalAlert, AlertSeverity } from '../shared/types';

export interface ReferralResult {
  shouldRefer: boolean;
  reason: string;
}

export interface TreatmentRecommendation {
  treatment: string;
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  rationale: string;
}

export interface ClinicalAssessment {
  referrals: ReferralResult[];
  alerts: ClinicalAlert[];
  treatmentRecommendation: TreatmentRecommendation | null;
  cautions: string[];
}

/**
 * Calculate age from date of birth
 */
export function calculateAgeFromDOB(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Determine if patient meets exclusion criteria
 */
export function evaluateReferralCriteria(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory
): ReferralResult[] {
  const referrals: ReferralResult[] = [];

  // Age <1
  if (age < 1) {
    referrals.push({
      shouldRefer: true,
      reason: 'Patient age <1 year. Refer to GP for assessment and treatment.',
    });
  }

  // Bullous impetigo
  if (lesionAssessment.lesionType === 'bullous') {
    referrals.push({
      shouldRefer: true,
      reason: 'Bullous impetigo identified. Requires systemic treatment from GP.',
    });
  }

  // Lesions near/around eyes
  if (lesionAssessment.nearEyes) {
    referrals.push({
      shouldRefer: true,
      reason: 'Lesions near or around eyes. Risk to ocular structures. Refer to GP.',
    });
  }

  // Immunosuppressed
  if (medicalHistory.immunosuppressed) {
    referrals.push({
      shouldRefer: true,
      reason: 'Immunosuppressed patients. Refer to GP for specialist management.',
    });
  }

  // MRSA suspected
  if (medicalHistory.mrsaSuspected) {
    referrals.push({
      shouldRefer: true,
      reason: 'MRSA suspected. Refer to GP for confirmed diagnosis and appropriate treatment.',
    });
  }

  // Widespread AND bullous
  if (lesionAssessment.extent === 'widespread' && lesionAssessment.lesionType === 'bullous') {
    referrals.push({
      shouldRefer: true,
      reason: 'Widespread bullous impetigo. Requires urgent GP referral for systemic treatment.',
    });
  }

  return referrals;
}

/**
 * Determine treatment recommendations based on assessment
 */
export function determineTreatmentRecommendation(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory
): TreatmentRecommendation | null {
  const extent = lesionAssessment.extent;
  const lesionType = lesionAssessment.lesionType;

  // Localised non-bullous
  if (extent === 'localised' && lesionType === 'non-bullous') {
    return {
      treatment: 'Fusidic Acid 2% Cream',
      dose: 'Apply a small amount',
      frequency: 'Three times daily (TDS)',
      duration: '5 days',
      quantity: 1,
      rationale:
        'Localised non-bullous impetigo is effectively treated with topical fusidic acid. If resistance concern exists, consider hydrogen peroxide 1% cream.',
    };
  }

  // Widespread non-bullous (non-penicillin allergic)
  if (extent === 'widespread' && lesionType === 'non-bullous' && !medicalHistory.penicillinAllergy) {
    const isChild = age >= 1 && age < 18;
    return {
      treatment: 'Flucloxacillin Capsules',
      dose: isChild ? '250 mg' : '500 mg',
      frequency: 'Four times daily (QDS)',
      duration: '7 days',
      quantity: isChild ? 28 : 28,
      rationale: `Widespread non-bullous impetigo requires oral antibiotics. Flucloxacillin dosing: ${isChild ? '250mg QDS (children 5-17 years)' : '500mg QDS (adults)'}. Patient should complete full course.`,
    };
  }

  // Widespread non-bullous (penicillin allergic)
  if (extent === 'widespread' && lesionType === 'non-bullous' && medicalHistory.penicillinAllergy) {
    const isChild = age >= 1 && age < 18;
    return {
      treatment: 'Clarithromycin Tablets',
      dose: isChild ? '7.5 mg/kg' : '250 mg',
      frequency: 'Twice daily (BD)',
      duration: '7 days',
      quantity: isChild ? 14 : 14,
      rationale: `Penicillin allergy confirmed. Clarithromycin is appropriate alternative. Dosing: ${isChild ? '7.5mg/kg BD (children)' : '250mg BD (adults)'}. Patient should complete full course.`,
    };
  }

  return null;
}

/**
 * Generate clinical alerts based on assessment
 */
export function generateClinicalAlerts(
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory,
  age: number
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Red flag: Rapid spreading
  if (lesionAssessment.spreading) {
    alerts.push({
      severity: 'caution',
      code: 'RAPID_SPREAD',
      message: 'Lesions spreading rapidly',
      detail: 'Monitor closely and advise patient to return if worsening. Consider oral antibiotics if topical not controlling spread.',
    });
  }

  // Red flag: Near eyes
  if (lesionAssessment.nearEyes) {
    alerts.push({
      severity: 'stop',
      code: 'OCULAR_RISK',
      message: 'Lesions near eyes',
      detail: 'Infection risk to ocular structures. Refer to GP for assessment.',
    });
  }

  // Caution: Eczema
  if (medicalHistory.eczema) {
    alerts.push({
      severity: 'caution',
      code: 'ECZEMA_PRESENT',
      message: 'Patient has eczema',
      detail: 'Impetigo commonly complicates eczema. Treat both conditions and consider adjunctive emollient therapy.',
    });
  }

  // Caution: Recurrent impetigo
  if (medicalHistory.recurrentImpetigo) {
    alerts.push({
      severity: 'caution',
      code: 'RECURRENT_IMPETIGO',
      message: 'Recurrent impetigo history',
      detail: 'Consider MRSA screening and nasal decolonisation. Discuss risk factors for recurrence.',
    });
  }

  // Caution: Recent antibiotic use
  if (medicalHistory.recentAntibioticUse && medicalHistory.recentAntibioticDetails) {
    alerts.push({
      severity: 'caution',
      code: 'RECENT_ANTIBIOTICS',
      message: `Recent antibiotic use (${medicalHistory.recentAntibioticDetails})`,
      detail: 'Consider resistance risk. Ensure appropriate antibiotic selection based on recent exposure.',
    });
  }

  // Caution: Diabetes
  if (medicalHistory.diabetes) {
    alerts.push({
      severity: 'caution',
      code: 'DIABETES_PRESENT',
      message: 'Patient has diabetes',
      detail: 'Healing may be slower. Monitor treatment response closely and consider earlier review.',
    });
  }

  // Immunosuppression
  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient is immunosuppressed',
      detail: 'Refer to GP for specialist management. Not suitable for self-care treatment in pharmacy.',
    });
  }

  // MRSA suspected
  if (medicalHistory.mrsaSuspected) {
    alerts.push({
      severity: 'red-flag',
      code: 'MRSA_SUSPECTED',
      message: 'MRSA suspected',
      detail: 'Requires GP confirmation and specialist treatment. Not suitable for independent pharmacy treatment.',
    });
  }

  // Bullous impetigo
  if (lesionAssessment.lesionType === 'bullous') {
    alerts.push({
      severity: 'red-flag',
      code: 'BULLOUS_IMPETIGO',
      message: 'Bullous impetigo identified',
      detail: 'Requires systemic treatment. Refer to GP for specialist management.',
    });
  }

  return alerts;
}

/**
 * Comprehensive clinical assessment
 */
export function assessPatient(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory
): ClinicalAssessment {
  const referrals = evaluateReferralCriteria(age, lesionAssessment, medicalHistory);
  const alerts = generateClinicalAlerts(lesionAssessment, medicalHistory, age);
  const treatmentRecommendation =
    referrals.length === 0 ? determineTreatmentRecommendation(age, lesionAssessment, medicalHistory) : null;

  const cautions: string[] = [];
  if (medicalHistory.eczema) {
    cautions.push('Eczema - impetigo commonly complicates, treat both');
  }
  if (medicalHistory.recurrentImpetigo) {
    cautions.push('Recurrent impetigo - consider MRSA screen and nasal decolonisation');
  }
  if (medicalHistory.recentAntibioticUse) {
    cautions.push('Recent antibiotic use - resistance consideration');
  }
  if (medicalHistory.diabetes) {
    cautions.push('Diabetes - slower healing may occur');
  }

  return {
    referrals,
    alerts,
    treatmentRecommendation,
    cautions,
  };
}

/**
 * Validate that treatment matches clinical recommendations
 */
export function validateTreatmentSelection(
  treatment: ImpetigoTreatmentSelection,
  recommendation: TreatmentRecommendation | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!treatment.treatment) {
    errors.push('Treatment selection required');
  }

  if (!treatment.dose) {
    errors.push('Dose required');
  }

  if (!treatment.frequency) {
    errors.push('Frequency required');
  }

  if (!treatment.duration) {
    errors.push('Duration required');
  }

  if (treatment.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
