// ─── Travellers' Diarrhoea Clinical Logic ───

import type { ClinicalAlert } from '../shared/types';
import type {
  TDTravelAssessment,
  TDMedicalHistory,
  TDMedications,
} from './travellers-diarrhoea-types';

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
      message: 'Blood in stool — refer for medical assessment',
      detail:
        'Blood in stool may indicate invasive infection or inflammatory bowel disease. Refer to doctor immediately.',
    });
  }

  if (medical.feverAbove38_5C) {
    alerts.push({
      severity: 'stop',
      code: 'HIGH_FEVER',
      message: 'Fever >38.5°C — refer for medical assessment',
      detail:
        'High fever suggests systemic infection. Refer to doctor. Do not supply standby antibiotics.',
    });
  }

  if (medical.diarrhoea12plusDays) {
    alerts.push({
      severity: 'stop',
      code: 'CHRONIC_DIARRHOEA',
      message: 'Diarrhoea >12 days — refer for investigation',
      detail:
        'Chronic diarrhoea requires investigation. Refer to doctor.',
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
        'Both loperamide and azithromycin enter breast milk in small amounts. Discuss with patient.',
    });
  }

  // ─── Liver/kidney disease ───

  if (medical.severeHepaticImpairment || medical.liverDisease) {
    alerts.push({
      severity: 'caution',
      code: 'LIVER_DISEASE_DIARRHOEA',
      message: 'Severe liver disease — caution with azithromycin',
      detail:
        'Azithromycin is hepatically metabolized. Use with caution if liver disease present.',
    });
  }

  if (medical.severeRenalImpairment) {
    alerts.push({
      severity: 'caution',
      code: 'RENAL_DISEASE_DIARRHOEA',
      message: 'Severe renal impairment — caution',
      detail:
        'Both agents need careful dosing in renal impairment. Specialist advice may be needed.',
    });
  }

  // ─── IBD caution ───

  if (medical.crohnsDisease || medical.ulcerativeColitis || medical.ibd) {
    alerts.push({
      severity: 'red-flag',
      code: 'IBD_DIARRHOEA',
      message: 'Inflammatory bowel disease — caution with loperamide',
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
      severity: 'caution',
      code: 'QT_INTERACTION',
      message: 'QT-prolonging drug interaction with azithromycin',
      detail:
        'Both azithromycin and some QT-prolonging drugs increase QT interval risk. Monitor and consider alternative.',
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

  // ─── Age warning ───

  alerts.push({
    severity: 'red-flag',
    code: 'AGE_LIMIT_WARNING',
    message: 'Note: Not suitable for children <12 without medical advice',
    detail:
      'This PGD applies to adults and children 12+ years. Children <12 require specialist medical assessment.',
  });

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

export function recommendApproach(
  medical: TDMedicalHistory,
  medications: TDMedications
): TravellersDiarrhoeaRecommendation | null {
  // Check if any hard stops exist
  if (
    medical.bloodInStool ||
    medical.feverAbove38_5C ||
    medical.diarrhoea12plusDays ||
    medical.macrolideAllergy
  ) {
    return null; // Cannot supply standby
  }

  // If no contraindications
  return {
    approach: 'Standby treatment supply',
    treatment:
      'Loperamide 2mg initial dose, then 2mg after each loose stool (max 16mg/day) + Azithromycin 500mg OD for 3 days if moderate-severe',
    reason:
      'Standby supply allows patient to treat diarrhoea if it develops during travel. Oral rehydration is first-line; antidiarrhoeal and antibiotic added only if needed.',
  };
}
