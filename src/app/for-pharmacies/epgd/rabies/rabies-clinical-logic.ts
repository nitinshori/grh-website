import { ClinicalAlert } from '../shared/types';
import {
  RabiesScreening,
  RabiesContraindications,
} from './rabies-types';

export function evaluateRabiesContraindications(
  screening: RabiesScreening,
  patientAge: number
): { contraindications: RabiesContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: RabiesContraindications = {
    anaphylaxisHistory: false,
    severeEggAllergy: false,
    acuteFebrileIllness: false,
    ageAppropriate: true, // No specific age restriction for rabies vaccine
  };

  // Hard stop: Anaphylaxis to previous dose
  if (screening.eggAllergy && screening.eggAllergySeverity === 'severe') {
    contraindications.severeEggAllergy = true;
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_EGG_ALLERGY_RABIES',
      message: 'Severe egg allergy',
      detail:
        'Some rabies vaccines (Rabipur) contain gelatin. Patient with severe egg allergy may require specialist formulation or referral to allergy/immunology specialist.',
    });
  }

  // Hard stop: Acute febrile illness
  if (screening.temperature !== null && screening.temperature >= 38.5) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS_RABIES',
      message: 'Acute febrile illness',
      detail: `Patient temperature is ${screening.temperature}°C. Defer vaccination unless exposure to rabies has occurred (in which case, vaccine is given regardless).`,
    });
  }

  // Caution: Mild egg allergy
  if (screening.eggAllergy && screening.eggAllergySeverity === 'mild') {
    alerts.push({
      severity: 'caution',
      code: 'MILD_EGG_ALLERGY_RABIES',
      message: 'Mild egg allergy noted',
      detail:
        'Patient has mild egg allergy. Can proceed with rabies vaccine. Extend observation period to 30 minutes.',
    });
  }

  // Red flag: Pregnancy
  if (screening.pregnant) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREGNANCY_RABIES',
      message: 'Patient is pregnant',
      detail:
        'Rabies vaccination in pregnancy is not recommended unless there is exposure risk. Consult GP or specialist for risk-benefit assessment.',
    });
  }

  // Red flag: Immunosuppression
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOSUPPRESSED_RABIES',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. Vaccine response may be reduced. Consult GP for serological testing post-vaccination to confirm antibody response.`,
    });
  }

  // Caution: Limited access to PEP
  if (!screening.accessToPEP) {
    alerts.push({
      severity: 'caution',
      code: 'LIMITED_PEP_ACCESS',
      message: 'Limited access to post-exposure prophylaxis',
      detail:
        'Patient reports limited access to PEP at destination. Pre-exposure vaccination is strongly recommended. Ensure patient knows to seek medical attention immediately after any bite/scratch.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: RabiesContraindications
): boolean {
  return (
    contraindications.severeEggAllergy ||
    contraindications.acuteFebrileIllness
  );
}

export function getObservationPeriodRecommendation(
  screening: RabiesScreening
): '15-min' | '30-min' {
  // Extend observation if egg allergy or immunosuppressed
  if (
    (screening.eggAllergy && screening.eggAllergySeverity === 'mild') ||
    screening.immunosuppressed
  ) {
    return '30-min';
  }
  return '15-min';
}

export function calculateNextDueDates(
  currentDate: string,
  schedule: 'standard' | 'accelerated'
): string {
  const current = new Date(currentDate);
  if (schedule === 'standard') {
    // Day 0, Day 7, Day 21-28
    const day7 = new Date(current);
    day7.setDate(day7.getDate() + 7);
    const day21 = new Date(current);
    day21.setDate(day21.getDate() + 21);
    return `Day 7: ${day7.toLocaleDateString()}, Day 21-28: ${day21.toLocaleDateString()}`;
  } else {
    // Day 0, Day 3, Day 7, Booster at 1 year
    const day3 = new Date(current);
    day3.setDate(day3.getDate() + 3);
    const day7 = new Date(current);
    day7.setDate(day7.getDate() + 7);
    const booster = new Date(current);
    booster.setFullYear(booster.getFullYear() + 1);
    return `Day 3: ${day3.toLocaleDateString()}, Day 7: ${day7.toLocaleDateString()}, Booster (1yr): ${booster.toLocaleDateString()}`;
  }
}
