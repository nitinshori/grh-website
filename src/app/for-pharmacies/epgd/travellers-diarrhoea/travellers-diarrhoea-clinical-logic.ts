// ─── Travellers' Diarrhoea Clinical Logic ───
// Aligned to the Azithromycin for Traveller's Diarrhoea PGD, version 003,
// issued 11 September 2026. The PGD supplies azithromycin only.

import type { ClinicalAlert } from '../shared/types';
import type {
  TDTravelAssessment,
  TDMedicalHistory,
  TDMedications,
} from './travellers-diarrhoea-types';

export const TD_PGD_VERSION = "Azithromycin for Traveller's Diarrhoea PGD v003, issued 11 September 2026";

// ─── Generate clinical alerts ───

export function generateTDAlerts(
  medical: TDMedicalHistory,
  medications: TDMedications,
  travel: TDTravelAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── Hard stops: always refer ───

  if (medical.bloodInStool) {
    alerts.push({
      severity: 'stop',
      code: 'BLOOD_IN_STOOL',
      message: 'Bloody diarrhoea: exclusion, refer for medical assessment',
      detail:
        'Bloody diarrhoea is an exclusion under this PGD. It may indicate invasive infection. Refer to a doctor.',
    });
  }

  if (medical.feverAbove38_5C) {
    alerts.push({
      severity: 'stop',
      code: 'HIGH_FEVER',
      message: 'High fever: exclusion, refer for medical assessment',
      detail:
        'High fever is an exclusion under this PGD and suggests systemic infection. Refer to a doctor. Do not supply standby antibiotics.',
    });
  }

  if (medical.systemicallyUnwell) {
    alerts.push({
      severity: 'stop',
      code: 'SYSTEMIC_ILLNESS',
      message: 'Signs of systemic illness: exclusion, refer',
      detail:
        'Signs of systemic illness are an exclusion under this PGD. Refer for medical assessment.',
    });
  }

  if (medical.symptomsOver72Hours) {
    alerts.push({
      severity: 'stop',
      code: 'SYMPTOMS_OVER_72_HOURS',
      message: 'Symptoms lasting more than 72 hours without improvement: exclusion, refer',
      detail:
        'Symptoms lasting more than 72 hours without improvement are an exclusion under this PGD. Refer to a doctor for investigation.',
    });
  }

  // ─── Pregnancy cautions ───

  if (medical.currentlyPregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_TRAVELLERS_DIARRHOEA',
      message: 'Patient is pregnant',
      detail:
        'Azithromycin should be used with caution in pregnancy. Loperamide can be used. Discuss risks/benefits.',
    });
  }

  if (medical.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING_TRAVELLERS_DIARRHOEA',
      message: 'Patient is breastfeeding',
      detail:
        'Azithromycin passes into breast milk in small amounts; the BNF regards it as suitable for use in breastfeeding. Discuss with the patient and record the decision.',
    });
  }

  // ─── Liver/kidney disease ───

  if (medical.severeHepaticImpairment || medical.liverDisease) {
    alerts.push({
      severity: 'stop',
      code: 'LIVER_DISEASE_DIARRHOEA',
      message: 'Severe liver disease or significant hepatic dysfunction: exclusion',
      detail:
        'Severe liver disease or significant hepatic dysfunction is an exclusion under this PGD. Azithromycin cannot be supplied; refer to the GP.',
    });
  }

  if (medical.severeRenalImpairment) {
    alerts.push({
      severity: 'caution',
      code: 'RENAL_DISEASE_DIARRHOEA',
      message: 'Severe renal impairment: caution',
      detail:
        'Azithromycin needs no dose adjustment in renal impairment (eGFR below 10 is a caution in the SmPC). Confirm the impairment is not part of a wider illness that would exclude, and record it.',
    });
  }

  // ─── IBD caution ───

  if (medical.crohnsDisease || medical.ulcerativeColitis || medical.ibd) {
    alerts.push({
      severity: 'red-flag',
      code: 'IBD_DIARRHOEA',
      message: 'Inflammatory bowel disease: caution with loperamide',
      detail:
        'Loperamide may worsen IBD symptoms and increase toxic megacolon risk. Consider azithromycin alone.',
    });
  }

  // ─── Immunocompromised ───

  if (medical.immunocompromised) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOCOMPROMISED',
      message: 'Immunocompromised patient',
      detail:
        'Travellers\' diarrhoea may be more severe in immunocompromised patients. Specialist advice recommended.',
    });
  }

  // ─── Macrolide allergy ───

  if (medical.macrolideAllergy) {
    alerts.push({
      severity: 'stop',
      code: 'MACROLIDE_ALLERGY',
      message: 'Azithromycin is contraindicated',
      detail:
        'Patient has macrolide allergy. Azithromycin is a macrolide and contraindicated. Loperamide only for mild cases.',
    });
  }

  // ─── Drug interactions ───

  if (medications.takesQTprolongingDrugs) {
    alerts.push({
      severity: 'stop',
      code: 'QT_INTERACTION',
      message: 'Concomitant QT-prolonging medicine: exclusion',
      detail:
        'Concomitant medications known to prolong the QT interval are an exclusion under this PGD. Azithromycin cannot be supplied; refer to the GP.',
    });
  }

  if (medications.takesDigoxin) {
    alerts.push({
      severity: 'caution',
      code: 'DIGOXIN_INTERACTION',
      message: 'Azithromycin may increase digoxin levels',
      detail:
        'Azithromycin can increase digoxin absorption. Monitor digoxin levels.',
    });
  }

  if (medications.takesMethadone) {
    alerts.push({
      severity: 'caution',
      code: 'METHADONE_INTERACTION',
      message: 'Azithromycin may interact with methadone',
      detail:
        'Azithromycin may increase methadone levels. Monitor for overdose signs.',
    });
  }

  if (medications.takesWarfarin) {
    alerts.push({
      severity: 'caution',
      code: 'WARFARIN_INTERACTION',
      message: 'Azithromycin may increase warfarin effect',
      detail:
        'Azithromycin may potentiate warfarin. Monitor INR closely.',
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

// ─── Medicine recommendation ───

export interface TravellersDiarrhoeaRecommendation {
  approach: string;
  treatment: string;
  reason: string;
}

/** The document's dose text for a chosen course length. */
export function azithromycinDoseText(days: 1 | 2 | 3): string {
  return `500 mg (one tablet) once daily for ${days} day${days > 1 ? 's' : ''}, with food`;
}

export function recommendApproach(
  medical: TDMedicalHistory,
  medications: TDMedications
): TravellersDiarrhoeaRecommendation | null {
  // Check if any hard stops exist (PGD v003 exclusion criteria)
  if (
    medical.bloodInStool ||
    medical.feverAbove38_5C ||
    medical.systemicallyUnwell ||
    medical.symptomsOver72Hours ||
    medical.macrolideAllergy ||
    medical.severeHepaticImpairment ||
    medical.liverDisease ||
    medications.takesQTprolongingDrugs
  ) {
    return null; // Cannot supply standby
  }

  // If no contraindications
  return {
    approach: 'Standby azithromycin supply (self-start for moderate to severe symptoms)',
    treatment:
      'Azithromycin 500 mg once daily for 1 to 3 days depending on clinical severity, taken with food. Supply one to three 500 mg tablets; maximum course 3 days. Oral rehydration is the first priority. Loperamide is not supplied under this PGD (OTC: 4 mg initially then 2 mg after each loose stool, max 16 mg/day; not with blood in stool or fever).',
    reason:
      'Standby supply allows the patient to self-treat moderate to severe traveller\'s diarrhoea if it develops during travel, where fluoroquinolone resistance is a concern.',
  };
}
