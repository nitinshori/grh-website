import { ClinicalAlert } from '../shared/types';
import {
  JapaneseEncephalitisScreening,
  JapaneseEncephalitisContraindications,
} from './japanese-encephalitis-types';

export function evaluateJapaneseEncephalitisContraindications(
  screening: JapaneseEncephalitisScreening,
  patientAge: number
): { contraindications: JapaneseEncephalitisContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: JapaneseEncephalitisContraindications = {
    severeFebrileIllness: false,
    severeAllergy: false,
    ageAppropriate: patientAge >= 2 / 12, // 2 months
  };

  // Hard stop: Severe febrile illness
  if (screening.severeFebrileIllness || (screening.temperature !== null && screening.temperature >= 39)) {
    contraindications.severeFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS_JE',
      message: 'Severe febrile illness',
      detail: `Patient temperature is ${screening.temperature}°C or has severe febrile illness. Defer vaccination until acute illness resolves.`,
    });
  }

  // Red flag: Pregnancy
  if (screening.pregnant) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREGNANCY_JE',
      message: 'Patient is pregnant',
      detail:
        'Japanese encephalitis vaccination in pregnancy is not recommended unless significant risk. Consult GP for risk-benefit assessment.',
    });
  }

  // Red flag: Immunosuppression
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOSUPPRESSED_JE',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. Vaccine response may be reduced. Consult GP for guidance and consider serological testing post-vaccination.`,
    });
  }

  // Caution: Rural/high-risk areas during monsoon
  if (screening.seasonOfTravel.toLowerCase().includes('monsoon') || screening.seasonOfTravel.toLowerCase().includes('wet')) {
    alerts.push({
      severity: 'caution',
      code: 'MONSOON_SEASON_JE',
      message: 'Travel during monsoon/wet season',
      detail:
        'Monsoon and wet season have increased mosquito populations. Outdoor activities in rice paddies particularly increase transmission risk.',
    });
  }

  // Caution: Outdoor/field activities
  if (screening.outdoorActivities) {
    alerts.push({
      severity: 'caution',
      code: 'OUTDOOR_ACTIVITIES_JE',
      message: 'Planned outdoor activities',
      detail: `Activities: ${screening.activitiesDetails}. Ensure strict mosquito bite prevention measures, especially at dusk and dawn.`,
    });
  }

  // Red flag: Continued risk - booster needed
  if (screening.continuedRisk) {
    alerts.push({
      severity: 'red-flag',
      code: 'CONTINUED_RISK_JE',
      message: 'Continued risk - booster needed',
      detail:
        'Patient will have ongoing exposure risk. Booster at 12-24 months is recommended to maintain immunity.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: JapaneseEncephalitisContraindications
): boolean {
  return contraindications.severeFebrileIllness;
}

export function getObservationPeriodRecommendation(
  screening: JapaneseEncephalitisScreening
): '15-min' | '30-min' {
  // Extend observation for first dose in adults (30 minutes)
  if (screening.immunosuppressed) {
    return '30-min';
  }
  return '30-min'; // Standard for first dose is 30 minutes
}

export function calculateNextDoseDate(currentDate: string, schedule: 'standard' | 'accelerated'): string {
  const current = new Date(currentDate);
  if (schedule === 'standard') {
    // Day 28
    const day28 = new Date(current);
    day28.setDate(day28.getDate() + 28);
    return day28.toISOString().split('T')[0];
  } else {
    // Day 7
    const day7 = new Date(current);
    day7.setDate(day7.getDate() + 7);
    return day7.toISOString().split('T')[0];
  }
}
