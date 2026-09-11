// ─── Altitude Sickness Clinical Logic ───
// Aligned to the Acetazolamide for Altitude Sickness PGD, version 004,
// issued 11 September 2026.

import type { ClinicalAlert } from '../shared/types';
import type {
  ASTravelAssessment,
  ASMedicalHistory,
  ASMedications,
} from './altitude-sickness-types';

export const AS_PGD_VERSION = 'Acetazolamide for Altitude Sickness PGD v004, issued 11 September 2026';

// PGD v004 quantity limits (tablets per supply)
export const AS_MAX_PREVENTION_TABLETS = 14;
export const AS_TREATMENT_TABLETS = 6;
export const AS_MAX_TOTAL_TABLETS = 20;

// ─── Generate clinical alerts ───

export function generateASAlerts(
  medical: ASMedicalHistory,
  medications: ASMedications,
  travel: ASTravelAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── Inclusion: altitude above 2,500 metres ───

  if (travel.destinationAltitude !== null && travel.destinationAltitude <= 2500) {
    alerts.push({
      severity: 'stop',
      code: 'ALTITUDE_BELOW_2500',
      message: 'Destination altitude is not above 2,500 metres',
      detail:
        'This PGD covers adults travelling to, or currently at, altitudes above 2,500 metres. Acetazolamide cannot be supplied under it for this itinerary.',
    });
  }

  // ─── Acetazolamide contraindications ───

  if (medical.sulfonamideAllergy) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_ALLERGY_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Known hypersensitivity to acetazolamide or sulfonamides. Do not use.',
    });
  }

  if (medical.severeHepaticImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_LIVER_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Severe hepatic impairment or hepatic cirrhosis. Acetazolamide is contraindicated.',
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

  if (medical.metabolicAcidosisOrElectrolyteImbalance) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_ACIDOSIS_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Hyperchloraemic (metabolic) acidosis, or a history of electrolyte imbalance. Acetazolamide is contraindicated.',
    });
  }

  if (medical.pulmonaryOedemaAfterAcetazolamide) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_PULMONARY_OEDEMA_CI',
      message: 'Acetazolamide is contraindicated',
      detail:
        'Previous non-cardiogenic pulmonary oedema after acetazolamide. Do not use.',
    });
  }

  if (medical.pregnantOrBreastfeeding) {
    alerts.push({
      severity: 'stop',
      code: 'PREGNANCY_ALTITUDE',
      message: 'Patient is pregnant or breastfeeding',
      detail:
        'Pregnancy or breastfeeding is an exclusion under this PGD. Advise on alternative options (gradual ascent) and refer to the GP as appropriate.',
    });
  }

  if (medications.takesLithium || medications.takesPhenytoin || medications.takesHighDoseAspirin || medications.takesThiazideDiuretics) {
    alerts.push({
      severity: 'stop',
      code: 'ACETAZOLAMIDE_INTERACTING_MEDICINE',
      message: 'Taking lithium, phenytoin, high-dose aspirin or a potassium-depleting diuretic',
      detail:
        'These medicines are an exclusion under this PGD. Refer to the GP.',
    });
  }

  // ─── Cautions ───

  if (medical.mildRenalImpairment) {
    alerts.push({
      severity: 'caution',
      code: 'ACETAZOLAMIDE_MILD_RENAL_CAUTION',
      message: 'Caution: mild renal impairment',
      detail:
        'Use with caution in mild renal impairment. Monitor for symptoms of electrolyte imbalance and dehydration; advise adequate hydration.',
    });
  }

  if (medical.renalStoneHistory) {
    alerts.push({
      severity: 'caution',
      code: 'ACETAZOLAMIDE_STONES_CAUTION',
      message: 'Caution: Renal stone history',
      detail:
        'Acetazolamide increases uric acid excretion. Patient should increase fluid intake significantly (aim 2.5 to 3 litres a day).',
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

  // ─── Drug interactions ───

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

  if (travel.ascentRate === 'rapid') {
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
  // Check contraindications (PGD v004 exclusion criteria)
  if (
    medical.sulfonamideAllergy ||
    medical.severeHepaticImpairment ||
    medical.severeRenalImpairment ||
    medical.adrenalInsufficiency ||
    medical.hypokalaemia ||
    medical.hyponatraemia ||
    medical.metabolicAcidosisOrElectrolyteImbalance ||
    medical.pulmonaryOedemaAfterAcetazolamide ||
    medical.pregnantOrBreastfeeding ||
    medications.takesLithium ||
    medications.takesPhenytoin ||
    medications.takesHighDoseAspirin ||
    medications.takesThiazideDiuretics ||
    (travel.destinationAltitude !== null && travel.destinationAltitude <= 2500)
  ) {
    return null; // Do not recommend if contraindicated
  }

  if (travel.purpose === 'treatment') {
    return {
      medicine: 'Acetazolamide 250 mg tablets (scored)',
      dose: '250 mg (one tablet) twice daily for up to 3 days',
      startTiming: 'At symptom onset',
      continuationTiming: 'Maximum 3 days; 6 tablets. Acetazolamide is not a substitute for descent.',
      reason:
        'Symptomatic treatment of AMS under the PGD, as an adjunct to rest or descent. Descent is the definitive treatment. Off-label use: tell the patient and record it.',
    };
  }

  return {
    medicine: 'Acetazolamide 250 mg tablets (scored)',
    dose: '125 mg (half a 250 mg tablet) twice daily',
    startTiming: '1 to 2 days before ascent',
    continuationTiming: 'Continue for 2 days after reaching the highest altitude, or until descent begins. Maximum 14 tablets (28 doses, 14 days) per supply without review. Treatment course of 6 tablets (250 mg twice daily for 3 days) may be added where the itinerary makes descent difficult; maximum total 20 tablets.',
    reason:
      'Prevention of AMS under the PGD. Quantity: half a tablet twice daily for (1 to 2 lead-in days + days ascending + 2 days), rounded up to whole tablets. Off-label use: tell the patient and record it.',
  };
}

// ─── Calculated quantity for the chosen regimen (PGD v004) ───
//
// Prevention: half a tablet twice daily for (1 to 2 lead-in days + days
// ascending + 2 days), rounded up to whole tablets, maximum 14. Treatment: 6
// tablets. Prevention plus treatment: maximum 20. Before this the tool only
// capped the quantity and never asked for the itinerary that determines it
// (adversarial review, 11 Sep 2026).

export interface ASQuantityCalculation {
  /** Days of prevention dosing: lead-in + days ascending + 2. */
  preventionDays: number | null;
  /** Prevention tablets: ceil(preventionDays / 2). */
  preventionTablets: number | null;
  treatmentTablets: number;
  total: number | null;
  /** Readable calculation for the screen and the record. */
  text: string;
  /** True when the prevention course would exceed 14 days per supply. */
  exceedsMaximumPeriod: boolean;
}

export function calculateASQuantity(
  travel: ASTravelAssessment,
  includeTreatmentCourse: boolean
): ASQuantityCalculation {
  if (travel.purpose === 'treatment') {
    return {
      preventionDays: null,
      preventionTablets: null,
      treatmentTablets: AS_TREATMENT_TABLETS,
      total: AS_TREATMENT_TABLETS,
      text: `Treatment: 250 mg twice daily for up to 3 days = ${AS_TREATMENT_TABLETS} tablets`,
      exceedsMaximumPeriod: false,
    };
  }
  const leadIn = travel.leadInDays;
  const days = travel.daysAscending;
  if (travel.purpose !== 'prevention' || leadIn === null || days === null || days <= 0) {
    return {
      preventionDays: null,
      preventionTablets: null,
      treatmentTablets: includeTreatmentCourse ? AS_TREATMENT_TABLETS : 0,
      total: null,
      text: 'Enter the lead-in days and the days ascending to calculate the prevention course',
      exceedsMaximumPeriod: false,
    };
  }
  const preventionDays = leadIn + days + 2;
  const preventionTablets = Math.ceil(preventionDays / 2);
  const treatmentTablets = includeTreatmentCourse ? AS_TREATMENT_TABLETS : 0;
  const exceeds = preventionDays > 14;
  return {
    preventionDays,
    preventionTablets,
    treatmentTablets,
    total: preventionTablets + treatmentTablets,
    text:
      `Prevention: (${leadIn} lead-in + ${days} ascending + 2) = ${preventionDays} days, half a tablet twice daily = ${preventionTablets} tablets` +
      (treatmentTablets ? ` + treatment course ${treatmentTablets} = ${preventionTablets + treatmentTablets} tablets` : ''),
    exceedsMaximumPeriod: exceeds,
  };
}

// ─── Maximum quantity for the chosen regimen (PGD v004) ───

export function maxQuantityTablets(
  purpose: ASTravelAssessment['purpose'],
  includeTreatmentCourse: boolean
): number {
  if (purpose === 'treatment') return AS_TREATMENT_TABLETS;
  return includeTreatmentCourse ? AS_MAX_TOTAL_TABLETS : AS_MAX_PREVENTION_TABLETS;
}
