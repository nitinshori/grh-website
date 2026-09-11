import { ClinicalAlert } from '../shared/types';
import {
  JapaneseEncephalitisScreening,
  JapaneseEncephalitisContraindications,
} from './japanese-encephalitis-types';

/** PGD strapline shown wherever the tool cites its authority. */
export const JE_PGD_VERSION = 'Japanese Encephalitis Vaccine (Ixiaro) PGD v005, issued 11 September 2026';

/** Parse yyyy-mm-dd as local midnight. */
export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Calendar days from today to the date (local midnight to local midnight). */
export function daysUntil(iso: string): number | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  return Math.round((d.getTime() - todayLocal().getTime()) / 86400000);
}

/** Whole months between the date of birth and today. Null when the date is missing or invalid. */
export function calculateAgeInMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months--;
  return months;
}

/** Dose volume per the PGD: 0.25 mL from 2 months to under 3 years, 0.5 mL from 3 years. */
export function getDoseVolume(ageInMonths: number | null): string {
  if (ageInMonths === null) return '';
  return ageInMonths < 36 ? '0.25 mL' : '0.5 mL';
}

/** The day 0 and day 7 rapid course is licensed only for adults aged 18 to 64. */
export function isRapidScheduleOffLabel(ageYears: number | null): boolean {
  if (ageYears === null) return false;
  return ageYears < 18 || ageYears >= 65;
}

export function evaluateJapaneseEncephalitisContraindications(
  screening: JapaneseEncephalitisScreening,
  ageInMonths: number | null,
  ageYears: number | null
): { contraindications: JapaneseEncephalitisContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: JapaneseEncephalitisContraindications = {
    severeFebrileIllness: false,
    severeAllergy: false,
    hypersensitivityAfterFirstDose: false,
    pregnancy: false,
    lowRiskItinerary: false,
    ageAppropriate: ageInMonths !== null && ageInMonths >= 2,
  };

  // Exclusion: under 2 months of age
  if (!contraindications.ageAppropriate) {
    alerts.push({
      severity: 'stop',
      code: 'AGE_UNDER_2_MONTHS_JE',
      message: 'Under 2 months of age',
      detail: 'Ixiaro is licensed from 2 months of age. Do not vaccinate under this PGD.',
    });
  }

  // Exclusion: acute severe febrile illness (postpone until recovered). The
  // document sets no temperature threshold and does not require one to be
  // measured; the pharmacist's assessment is the gate.
  if (screening.severeFebrileIllness) {
    contraindications.severeFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS_JE',
      message: 'Acute severe febrile illness',
      detail: `${screening.temperature !== null ? `Temperature recorded ${screening.temperature} C. ` : ''}Postpone vaccination until recovered.`,
    });
  }

  // Exclusion: confirmed anaphylactic or serious systemic reaction to a previous dose or any component
  if (screening.anaphylaxisToVaccineOrComponent) {
    contraindications.severeAllergy = true;
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_JE',
      message: 'Confirmed anaphylactic or serious systemic reaction to Ixiaro or a component',
      detail:
        'Components include the residues protamine sulphate, formaldehyde, bovine serum albumin, host cell DNA and protein, and sodium metabisulphite. Do not vaccinate; refer.',
    });
  }

  // Exclusion: hypersensitivity reaction following the first dose
  if (screening.hypersensitivityAfterFirstDose) {
    contraindications.hypersensitivityAfterFirstDose = true;
    alerts.push({
      severity: 'stop',
      code: 'HYPERSENSITIVITY_FIRST_DOSE_JE',
      message: 'Hypersensitivity reaction following the first dose',
      detail: 'Do not give the second dose. Refer.',
    });
  }

  // Exclusion: pregnancy (refer for individual assessment rather than vaccinating under this PGD)
  if (screening.pregnant) {
    contraindications.pregnancy = true;
    alerts.push({
      severity: 'stop',
      code: 'PREGNANCY_JE',
      message: 'Patient is pregnant',
      detail:
        'Pregnancy is an exclusion unless the risk of Japanese encephalitis is high and cannot be avoided. Refer for individual assessment rather than vaccinating under this PGD.',
    });
  }

  // Exclusion: short stay of less than one month confined to urban areas with a low risk itinerary
  if (screening.riskCategory === 'not-recommended-urban-short-stay') {
    contraindications.lowRiskItinerary = true;
    alerts.push({
      severity: 'stop',
      code: 'LOW_RISK_ITINERARY_JE',
      message: 'Vaccination not recommended for this itinerary',
      detail:
        'A short stay of less than one month confined to urban areas with a low risk itinerary. Explain the reasoning and give bite avoidance advice rather than vaccinating.',
    });
  }

  // Caution: breastfeeding
  if (screening.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING_JE',
      message: 'Patient is breastfeeding',
      detail:
        'Limited data. Avoid as a precaution unless the risk of exposure is significant, and record the risk assessment.',
    });
  }

  // Caution: immunosuppression
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED_JE',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. An adequate immune response may not be achieved. Counsel accordingly and consider referral for serology where the risk is high.`,
    });
  }

  // Caution: bleeding disorders, thrombocytopenia or anticoagulation
  if (screening.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER_JE',
      message: 'Bleeding disorder, thrombocytopenia or anticoagulation',
      detail: 'Give by deep subcutaneous injection rather than intramuscularly. Select the deep subcutaneous route on the administration step.',
    });
  }

  // Caution: aged 65 and over (the Green Book text the document summarises
  // says "65 years and older", and the rapid-schedule licence stops at 64).
  if (ageYears !== null && ageYears >= 65) {
    alerts.push({
      severity: 'caution',
      code: 'AGE_OVER_65_JE',
      message: 'Aged 65 or over',
      detail:
        'Seroconversion is lower, around 65% compared with over 96% in adults under 50, and titres are lower. Counsel that protection may be less reliable and consider the booster at 12 months.',
    });
  }

  // Caution: time before travel (calendar days, so exactly 14 or 35 days away
  // does not fire a day early)
  if (screening.departureDate) {
    const daysToDeparture = daysUntil(screening.departureDate);
    if (daysToDeparture !== null) {
      if (daysToDeparture < 0) {
        alerts.push({
          severity: 'caution',
          code: 'DEPARTURE_PAST_JE',
          message: 'The departure date is in the past',
          detail: 'Check the travel dates. If the traveller has already departed, record why vaccination is being given now (for example completing a course).',
        });
      } else if (daysToDeparture < 14) {
        alerts.push({
          severity: 'caution',
          code: 'INSUFFICIENT_TIME_JE',
          message: 'Insufficient time to complete the primary course before travel',
          detail:
            'Even the rapid course (day 0 and day 7) cannot be completed at least one week before departure. Risk assess; the second dose may still be given before exposure and the course should be completed rather than abandoned.',
        });
      } else if (daysToDeparture < 35) {
        alerts.push({
          severity: 'caution',
          code: 'RAPID_SCHEDULE_NEEDED_JE',
          message: 'Conventional course cannot be completed one week before travel',
          detail:
            'Consider the rapid course (day 0 and day 7). It is licensed only for adults aged 18 to 64; in children and in adults aged 65 and over it is off-label and requires explicit documented consent.',
        });
      }
    }
  }

  // Caution: wet or monsoon season travel
  if (screening.seasonOfTravel.toLowerCase().includes('monsoon') || screening.seasonOfTravel.toLowerCase().includes('wet')) {
    alerts.push({
      severity: 'caution',
      code: 'MONSOON_SEASON_JE',
      message: 'Travel during monsoon/wet season',
      detail:
        'The highest transmission rates occur during and just after wet seasons when mosquitoes are most active. Outdoor activities in rice paddies particularly increase transmission risk.',
    });
  }

  // Caution: outdoor or field activities
  if (screening.outdoorActivities) {
    alerts.push({
      severity: 'caution',
      code: 'OUTDOOR_ACTIVITIES_JE',
      message: 'Planned outdoor activities',
      detail: `Activities: ${screening.activitiesDetails}. Ensure strict mosquito bite prevention measures, especially between dusk and dawn.`,
    });
  }

  // Continued risk: booster timing
  if (screening.continuedRisk) {
    alerts.push({
      severity: 'red-flag',
      code: 'CONTINUED_RISK_JE',
      message: 'Continued risk: booster needed',
      detail:
        'First booster 12 to 24 months after the primary course and before re-exposure. Those at continuous risk, such as long-term residents and laboratory staff, should have it at 12 months.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: JapaneseEncephalitisContraindications
): boolean {
  return (
    contraindications.severeFebrileIllness ||
    contraindications.severeAllergy ||
    contraindications.hypersensitivityAfterFirstDose ||
    contraindications.pregnancy ||
    contraindications.lowRiskItinerary ||
    !contraindications.ageAppropriate
  );
}

export type JeSchedule = 'standard' | 'accelerated' | '';
export type JeDoseNumber = '1st' | '2nd' | 'booster' | 'second-booster' | '';

/**
 * Next dose from the schedule AND the dose number (the document's schedule
 * table): after the 1st dose, day 28 (or day 7 on the rapid course); after
 * the 2nd, the first booster at 12 months (12 to 24 months, 12 at continuous
 * risk); after the first booster, the second booster at 10 years for adults
 * aged 18 to 64 only; after the second booster, nothing. Returns "" where no
 * further dose is scheduled, with a note for the record.
 */
export function calculateNextDose(
  schedule: JeSchedule,
  doseNumber: JeDoseNumber,
  ageYears: number | null
): { date: string; note: string } {
  const t = todayLocal();
  const plusDays = (n: number) => formatLocalDate(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n));
  const plusMonths = (n: number) => formatLocalDate(new Date(t.getFullYear(), t.getMonth() + n, t.getDate()));
  const plusYears = (n: number) => formatLocalDate(new Date(t.getFullYear() + n, t.getMonth(), t.getDate()));
  if (!doseNumber) return { date: '', note: '' };
  if (doseNumber === '1st') {
    if (!schedule) return { date: '', note: 'Select the schedule' };
    return schedule === 'accelerated'
      ? { date: plusDays(7), note: 'Second dose on day 7 (rapid course); complete at least one week before exposure' }
      : { date: plusDays(28), note: 'Second dose on day 28; complete at least one week before exposure' };
  }
  if (doseNumber === '2nd') {
    return { date: plusMonths(12), note: 'First booster 12 to 24 months after the primary course and before re-exposure; at 12 months for those at continuous risk or aged 65 and over' };
  }
  if (doseNumber === 'booster') {
    if (ageYears !== null && ageYears >= 18 && ageYears <= 64) {
      return { date: plusYears(10), note: 'Second booster at 10 years for adults aged 18 to 64 at continued risk' };
    }
    return { date: '', note: 'No further booster scheduled under this PGD (second booster is for adults aged 18 to 64; long-term data are lacking in children and from 65)' };
  }
  return { date: '', note: 'No further dose scheduled' };
}

/** Second booster is authorised for adults aged 18 to 64 only. */
export function secondBoosterAllowed(ageYears: number | null): boolean {
  return ageYears !== null && ageYears >= 18 && ageYears <= 64;
}
