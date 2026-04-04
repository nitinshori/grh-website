import { ClinicalAlert } from '../shared/types';
import {
  DengueScreening,
  DengueContraindications,
} from './dengue-types';

export function evaluateDengueContraindications(
  screening: DengueScreening,
  patientAge: number
): { contraindications: DengueContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: DengueContraindications = {
    severeAllergy: false,
    immunosuppressed: false,
    pregnancy: false,
    acuteFebrileIllness: false,
    ageAppropriate: patientAge >= 4,
  };

  // Hard stop: Pregnancy
  if (screening.pregnant) {
    contraindications.pregnancy = true;
    alerts.push({
      severity: 'stop',
      code: 'PREGNANCY_DENGUE',
      message: 'Pregnancy is a contraindication',
      detail:
        'Qdenga is a live attenuated vaccine and is contraindicated in pregnancy. Defer vaccination until after pregnancy. Counsel on contraception.',
    });
  }

  // Hard stop: Breastfeeding
  if (screening.breastfeeding) {
    alerts.push({
      severity: 'stop',
      code: 'BREASTFEEDING_DENGUE',
      message: 'Breastfeeding is a contraindication',
      detail:
        'Live attenuated dengue vaccine should not be given to breastfeeding women. Defer vaccination until after breastfeeding ends.',
    });
  }

  // Hard stop: Severe acute febrile illness
  if (screening.temperature !== null && screening.temperature >= 38.5) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS_DENGUE',
      message: 'Acute febrile illness',
      detail: `Patient temperature is ${screening.temperature}°C. Defer vaccination until patient has recovered from acute illness.`,
    });
  }

  // Caution: Immunosuppression with moderate CD4 count
  if (screening.immunosuppressed) {
    contraindications.immunosuppressed = true;
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED_DENGUE',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. Live vaccine may have reduced efficacy or increased risk of adverse events. Consider referral to specialist or GP for risk-benefit assessment. If CD4 <200 (HIV), do not vaccinate.`,
    });
  }

  // Red flag: Previous dengue infection
  if (screening.previousDengueInfection) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREVIOUS_DENGUE_INFECTION',
      message: 'Previous dengue infection noted',
      detail: `Previous infection: ${screening.dengueInfectionDetails}. Serological testing may be recommended prior to vaccination to confirm immunity. Consult GP for guidance.`,
    });
  }

  // Caution: Travel to endemic area
  if (screening.endemicArea) {
    alerts.push({
      severity: 'caution',
      code: 'ENDEMIC_AREA_TRAVEL',
      message: 'Travel to dengue endemic area',
      detail:
        'Patient is travelling to dengue endemic region. Ensure adequate interval before departure for vaccine efficacy. First dose should be given ideally 10-30 days before travel.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: DengueContraindications
): boolean {
  return (
    contraindications.pregnancy ||
    contraindications.acuteFebrileIllness
  );
}

export function getObservationPeriodRecommendation(
  screening: DengueScreening
): '15-min' | '30-min' {
  // Extend observation if immunosuppressed or significant medical history
  if (screening.immunosuppressed) {
    return '30-min';
  }
  return '15-min';
}

export function calculateNextDoseDate(currentDate: string): string {
  const current = new Date(currentDate);
  current.setMonth(current.getMonth() + 3);
  return current.toISOString().split('T')[0];
}
