// Aligned to the Qdenga (TAK-003) Dengue PGD, version 006, issued 11 September 2026.
import { ClinicalAlert } from '../shared/types';
import {
  DengueScreening,
  DengueContraindications,
} from './dengue-types';

export const DENGUE_PGD_VERSION = 'Qdenga (TAK-003) Dengue PGD v006, issued 11 September 2026';

/** Temperature at or above which the tool treats the patient as having an acute fever (exclusion). */
export const FEVER_THRESHOLD_C = 38.0;

/** Minimum interval between dose 1 and dose 2: 3 calendar months. */
export const DOSE_INTERVAL_MONTHS = 3;

export function evaluateDengueContraindications(
  screening: DengueScreening,
  patientAge: number
): { contraindications: DengueContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: DengueContraindications = {
    severeAllergy: false,
    immunosuppressed: false,
    pregnancy: false,
    breastfeeding: false,
    acuteFebrileIllness: false,
    liveVaccineInterval: false,
    gbsHistory: false,
    ageAppropriate: patientAge >= 18,
  };

  // Hard stop: age under 18 (PGD v006 exclusion)
  if (patientAge < 18) {
    alerts.push({
      severity: 'stop',
      code: 'AGE_UNDER_18_DENGUE',
      message: 'Age under 18 years',
      detail: 'This PGD covers adults aged 18 years and over only.',
    });
  }

  // Hard stop: hypersensitivity to any component of the vaccine
  if (screening.vaccineComponentAllergy) {
    contraindications.severeAllergy = true;
    alerts.push({
      severity: 'stop',
      code: 'VACCINE_ALLERGY_DENGUE',
      message: 'Known hypersensitivity to a component of the vaccine',
      detail: 'Known hypersensitivity to any component of Qdenga is an exclusion. Do not vaccinate; refer to the GP.',
    });
  }

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
    contraindications.breastfeeding = true;
    alerts.push({
      severity: 'stop',
      code: 'BREASTFEEDING_DENGUE',
      message: 'Breastfeeding is a contraindication',
      detail:
        'Live attenuated dengue vaccine should not be given to breastfeeding women. Defer vaccination until after breastfeeding ends.',
    });
  }

  // Hard stop: acute fever. The document says "acute fever" without a
  // figure; the tool applies the Green Book's usual 38.0 C. The old 38.5
  // threshold, combined with an integer-only input, let 38.7 pass as 38.
  if (screening.temperature !== null && screening.temperature >= FEVER_THRESHOLD_C) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS_DENGUE',
      message: 'Acute febrile illness',
      detail: `Patient temperature is ${screening.temperature} C. Acute fever is an exclusion: defer vaccination until the patient has recovered.`,
    });
  }

  // Hard stop: significant intercurrent illness
  if (screening.currentIllness) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'INTERCURRENT_ILLNESS_DENGUE',
      message: 'Acute fever or significant intercurrent illness',
      detail: `Reported: ${screening.illnessDetails || 'not described'}. Acute fever or significant intercurrent illness is an exclusion. Defer vaccination until recovered.`,
    });
  }

  // Hard stop: immune deficiency of any cause (PGD v006: no immunocompromised group is vaccinated under this PGD)
  if (screening.immunosuppressed) {
    contraindications.immunosuppressed = true;
    alerts.push({
      severity: 'stop',
      code: 'IMMUNOSUPPRESSED_DENGUE',
      message: 'Immune deficiency of any cause: exclusion',
      detail: `Reason: ${screening.immunosuppressedDetails || 'not described'}. Qdenga is a live vaccine and any congenital or acquired immune deficiency excludes, including immunosuppressive therapy such as chemotherapy, systemic corticosteroids at 20 mg/day prednisolone (or 2 mg/kg/day) or more for 2 weeks or longer within the previous 4 weeks, active malignancy, symptomatic HIV, or asymptomatic HIV with impaired immune function. Do not vaccinate; refer to the GP.`,
    });
  }

  // Hard stop: another live vaccine within 4 weeks before or after
  if (screening.liveVaccineWithin4Weeks) {
    contraindications.liveVaccineInterval = true;
    alerts.push({
      severity: 'stop',
      code: 'LIVE_VACCINE_INTERVAL_DENGUE',
      message: 'Another live vaccine within 4 weeks',
      detail: 'Planned administration of another live vaccine within 4 weeks before or after Qdenga is an exclusion. Give live vaccines on the same day or separate them by at least 4 weeks.',
    });
  }

  // Hard stop: Guillain-Barre syndrome after prior dengue vaccination
  if (screening.gbsAfterDengueVaccine) {
    contraindications.gbsHistory = true;
    alerts.push({
      severity: 'stop',
      code: 'GBS_DENGUE',
      message: 'History of Guillain-Barre syndrome following prior dengue vaccination',
      detail: 'This is an exclusion under the PGD. Do not vaccinate; refer to the GP.',
    });
  }

  // Caution: anticoagulant therapy
  if (screening.anticoagulantTherapy) {
    alerts.push({
      severity: 'caution',
      code: 'ANTICOAGULANT_DENGUE',
      message: 'Anticoagulant therapy: assess bleeding risk',
      detail: 'Use with caution in patients on anticoagulant therapy. Assess bleeding risk before the subcutaneous injection and apply firm pressure afterwards.',
    });
  }

  // Red flag: Previous dengue infection
  if (screening.previousDengueInfection) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREVIOUS_DENGUE_INFECTION',
      message: 'Previous dengue infection noted',
      detail: `Previous infection: ${screening.dengueInfectionDetails}. The PGD says consider serological testing in those with previous dengue infection. Consult the GP for guidance.`,
    });
  }

  // Caution: timing before travel
  if (screening.endemicArea) {
    alerts.push({
      severity: 'caution',
      code: 'ENDEMIC_AREA_TRAVEL',
      message: 'Timing before travel',
      detail:
        'Two doses of Qdenga are given 3 months apart. The first dose should be administered at least 3 months prior to travel when possible.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: DengueContraindications
): boolean {
  return (
    !contraindications.ageAppropriate ||
    contraindications.severeAllergy ||
    contraindications.pregnancy ||
    contraindications.breastfeeding ||
    contraindications.acuteFebrileIllness ||
    contraindications.immunosuppressed ||
    contraindications.liveVaccineInterval ||
    contraindications.gbsHistory
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

/** Add calendar months, clamping the day so 30 November + 3 months is 28 February, not 1 or 2 March. */
export function addMonthsClamped(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateNextDoseDate(currentDate: string): string {
  const current = new Date(currentDate);
  if (isNaN(current.getTime())) return '';
  return toIsoDate(addMonthsClamped(current, DOSE_INTERVAL_MONTHS));
}

/** Today as YYYY-MM-DD in local time. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/**
 * Is the second dose due yet? True when firstDoseDate + 3 calendar months is
 * on or before today. Null when the date is missing or unreadable.
 */
export function secondDoseIntervalMet(firstDoseDate: string): boolean | null {
  if (!firstDoseDate) return null;
  const first = new Date(firstDoseDate);
  if (isNaN(first.getTime())) return null;
  first.setHours(0, 0, 0, 0);
  const due = addMonthsClamped(first, DOSE_INTERVAL_MONTHS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() <= today.getTime();
}
