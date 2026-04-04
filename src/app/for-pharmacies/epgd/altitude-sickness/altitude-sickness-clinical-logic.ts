// ─── Altitude Sickness Clinical Logic ───

import type { ClinicalAlert } from '../shared/types';
import type {
  ASTravelAssessment,
  ASMedicalHistory,
  ASMedications,
} from './altitude-sickness-types';

// ─── Generate clinical alerts ───

export function generateASAlerts(
  medical: ASMedicalHistory,
  medications: ASMedications,
  travel: ASTravelAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── Acetazolamide contraindications ───

  if (medical.sulfonamideAllergy) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_ALLERGY_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has sulfonamide allergy. Acetazolamide is a sulfonamide derivative. Do not use.',
    });
  }

  if (medical.severeHepaticImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_LIVER_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has severe hepatic impairment. Acetazolamide is contraindicated.',
    });
  }

  if (medical.severeRenalImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_RENAL_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has severe renal impairment (eGFR <30). Acetazolamide is contraindicated.',
    });
  }

  if (medical.adrenalInsufficiency) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_ADRENAL_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has adrenocortical insufficiency. Acetazolamide is contraindicated.',
    });
  }

  if (medical.hypokalaemia) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_HYPOKALAEMIA_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has hypokalaemia. Acetazolamide causes urinary potassium loss, worsening hypokalaemia.',
    });
  }

  if (medical.hyponatraemia) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_HYPONATRAEMIA_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Patient has hyponatraemia. Acetazolamide causes urinary sodium loss, worsening hyponatraemia.',
    });
  }

  // ─── Cautions ───

  if (medical.renalStoneHistory) {
    alerts.push({
      severity: 'caution',
      code: 'ACETAZOLAMIDE_STONES_CAUTION',
      message: 'Caution: Renal stone history',
      detail:
        'Acetazolamide increases uric acid excretion. Patient should increase fluid intake significantly (aim 2.5–3L/day).',
    });
  }

  if (medical.pulmonaryOedema) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREVIOUS_PULMONARY_EDEMA',
      message: 'Previous high altitude pulmonary edema',
      detail:
        'Consider specialist advice. HAPE prevention may require nifedipine or other agents in addition to acetazolamide.',
    });
  }

  if (medical.cerebralOedema) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREVIOUS_CEREBRAL_EDEMA',
      message: 'Previous high altitude cerebral edema',
      detail:
        'High-risk patient. Specialist guidance recommended. Dexamethasone may be required.',
    });
  }

  if (medical.highAltitudeArrhythmia) {
    alerts.push({
      severity: 'caution',
      code: 'HIGH_ALTITUDE_ARRHYTHMIA',
      message: 'History of high-altitude arrhythmia',
      detail:
        'Monitor for cardiac symptoms. Slow ascent recommended. Consider specialist advice.',
    });
  }

  if (medical.pregnantOrBreastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_ALTITUDE',
      message: 'Patient is pregnant or breastfeeding',
      detail:
        'Acetazolamide is relatively safe in pregnancy but specialist advice recommended. Consider non-pharmacological prevention (slow ascent).',
    });
  }

  // ─── Drug interactions ───

  if (medications.takesThiazideDiuretics) {
    alerts.push({
      severity: 'caution',
      code: 'THIAZIDE_INTERACTION',
      message: 'Thiazide interaction with acetazolamide',
      detail:
        'Both cause potassium loss. Monitor K+ levels. May need supplementation.',
    });
  }

  if (medications.takesACEInhibitors) {
    alerts.push({
      severity: 'caution',
      code: 'ACE_INHIBITOR_INTERACTION',
      message: 'ACE inhibitor interaction with acetazolamide',
      detail:
        'Both affect electrolytes. Monitor K+ and renal function. Risk of hyperkalemia.',
    });
  }

  if (medications.takesTopiramate) {
    alerts.push({
      severity: 'caution',
      code: 'TOPIRAMATE_INTERACTION',
      message: 'Topiramate interaction with acetazolamide',
      detail:
        'Both are carbonic anhydrase inhibitors. Combined use increases risk of metabolic acidosis and renal stones.',
    });
  }

  // ─── Rapid ascent warnings ───

  if (travel.ascentRate === 'rapid' && !medical.adrenalInsufficiency) {
    alerts.push({
      severity: 'red-flag',
      code: 'RAPID_ASCENT',
      message: 'Rapid ascent planned',
      detail:
        'Rapid ascent significantly increases AMS risk. Strongly advise slow, gradual ascent (allow acclimatisation). Acetazolamide helps but does not replace gradual ascent.',
    });
  }

  return alerts;
}

// ─── Check if consultation can proceed ───

export function canProceedWithConsultation(alerts: ClinicalAlert[]): boolean {
  return !alerts.some((a) => a.severity === 'stop');
}

// ─── Check if hard stops exist ───

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

// ─── Acetazolamide recommendation ───

export interface AltitudeSicknessRecommendation {
  medicine: string;
  dose: string;
  startTiming: string;
  continuationTiming: string;
  reason: string;
}

export function recommendMedicine(
  medical: ASMedicalHistory,
  medications: ASMedications,
  travel: ASTravelAssessment
): AltitudeSicknessRecommendation | null {
  // Check contraindications
  if (
    medical.sulfonamideAllergy ||
    medical.severeHepaticImpairment ||
    medical.severeRenalImpairment ||
    medical.adrenalInsufficiency ||
    medical.hypokalaemia ||
    medical.hyponatraemia
  ) {
    return null; // Do not recommend if contraindicated
  }

  return {
    medicine: 'Acetazolamide 250mg',
    dose: '250mg twice daily (morning and evening)',
    startTiming: '1–2 days before ascent',
    continuationTiming: '2 days after reaching highest altitude',
    reason:
      'Acetazolamide helps prevent acute mountain sickness by enhancing respiratory acclimatisation and promoting diuresis. Start early to assess tolerance.',
  };
}
