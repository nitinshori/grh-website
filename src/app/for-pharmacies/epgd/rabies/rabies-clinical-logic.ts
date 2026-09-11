import { ClinicalAlert } from '../shared/types';
import {
  RabiesScreening,
  RabiesContraindications,
  RabiesVaccineAdministration,
} from './rabies-types';

/** PGD strapline shown wherever the tool cites its authority. */
export const RABIES_PGD_VERSION = 'Rabies Vaccine (Rabipur or Verorab) Pre-exposure Prophylaxis PGD v005, issued 11 September 2026';

/** The dose volumes differ: 1.0 mL for Rabipur, 0.5 mL for Verorab. */
export function getDoseVolume(product: RabiesVaccineAdministration['product']): string {
  if (product === 'rabipur') return '1.0 mL';
  if (product === 'verorab') return '0.5 mL';
  return '';
}

export function getProductLabel(product: RabiesVaccineAdministration['product']): string {
  if (product === 'rabipur') return 'Rabipur (Bavarian Nordic), purified chick embryo cell vaccine, 1.0 mL';
  if (product === 'verorab') return 'Verorab (Sanofi), purified Vero cell rabies vaccine, 0.5 mL';
  return '';
}

export function evaluateRabiesContraindications(
  screening: RabiesScreening,
  patientAge: number | null
): { contraindications: RabiesContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: RabiesContraindications = {
    priorExposure: false,
    anaphylaxisHistory: false,
    severeEggAllergy: false,
    antibioticHypersensitivity: false,
    neomycinHypersensitivity: false,
    acuteFebrileIllness: false,
    // Cover of the PGD: from age 2 years onwards; children under 2 are not covered.
    ageAppropriate: patientAge !== null && patientAge >= 2,
  };

  if (!contraindications.ageAppropriate) {
    alerts.push({
      severity: 'stop',
      code: 'AGE_UNDER_2_RABIES',
      message: 'Under 2 years of age',
      detail: 'This PGD covers patients from age 2 years onwards. Children under 2 are not covered; refer to a travel clinic or the GP.',
    });
  }

  // Exclusion: any actual or possible exposure that has already occurred (post-exposure)
  if (screening.priorExposure) {
    contraindications.priorExposure = true;
    alerts.push({
      severity: 'stop',
      code: 'PRIOR_EXPOSURE_RABIES',
      message: 'Possible exposure has already occurred: this is post-exposure',
      detail:
        'Any bite, scratch or lick on broken skin from a mammal in a rabies risk area, however trivial and however long ago, is a post-exposure situation and a same-day medical emergency. Refer for urgent medical assessment today. Do not manage it here.',
    });
  }

  // Exclusion: confirmed anaphylactic reaction to a previous dose or any component
  if (screening.anaphylaxisToVaccineOrComponent) {
    contraindications.anaphylaxisHistory = true;
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_RABIES',
      message: 'Confirmed anaphylactic reaction to a previous dose of rabies vaccine or to a component',
      detail: 'Do not vaccinate under this PGD. Refer.',
    });
  }

  // Exclusion (Rabipur only): severe egg allergy
  if (screening.eggAllergy && screening.eggAllergySeverity === 'severe') {
    contraindications.severeEggAllergy = true;
    alerts.push({
      severity: screening.antibioticHypersensitivity ? 'stop' : 'caution',
      code: 'SEVERE_EGG_ALLERGY_RABIES',
      message: 'Severe egg allergy: Rabipur excluded',
      detail:
        'Rabipur contains chick embryo cell residues including ovalbumin and must not be used. Verorab may be a suitable alternative; select Verorab on the administration step.',
    });
  }

  // Exclusion (Verorab only): hypersensitivity to polymyxin B, streptomycin or neomycin.
  // Rabipur contains traces of neomycin, so where the hypersensitivity extends to
  // neomycin it is a component of the product to be used and Rabipur is excluded too.
  if (screening.antibioticHypersensitivity) {
    contraindications.antibioticHypersensitivity = true;
    contraindications.neomycinHypersensitivity = screening.hypersensitivityIncludesNeomycin !== 'no';
    if (contraindications.neomycinHypersensitivity) {
      alerts.push({
        severity: 'stop',
        code: 'NEOMYCIN_HYPERSENSITIVITY_RABIES',
        message: 'Neomycin hypersensitivity: neither product can be given',
        detail:
          'Verorab may contain traces of polymyxin B, streptomycin and neomycin, and Rabipur contains traces of neomycin, chlortetracycline and amphotericin B. Hypersensitivity to a component of the product to be used is an exclusion for both. Refer to a travel clinic or specialist service.',
      });
    } else {
      alerts.push({
        severity: contraindications.severeEggAllergy ? 'stop' : 'caution',
        code: 'ANTIBIOTIC_HYPERSENSITIVITY_RABIES',
        message: 'Hypersensitivity to polymyxin B or streptomycin: Verorab excluded',
        detail:
          'Verorab may contain traces of polymyxin B, streptomycin and neomycin and must not be used. The hypersensitivity has been recorded as not extending to neomycin, so Rabipur (traces of neomycin, chlortetracycline and amphotericin B) may be used.',
      });
    }
  }

  if (contraindications.severeEggAllergy && contraindications.antibioticHypersensitivity && !contraindications.neomycinHypersensitivity) {
    alerts.push({
      severity: 'stop',
      code: 'NO_SUITABLE_PRODUCT_RABIES',
      message: 'Neither product can be given',
      detail: 'Rabipur is excluded by severe egg allergy and Verorab by antibiotic hypersensitivity. Refer to a travel clinic or specialist service.',
    });
  }

  // Exclusion: acute severe febrile illness (postpone until recovered)
  if (screening.acuteFebrileIllness || (screening.temperature !== null && screening.temperature >= 38.5)) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS_RABIES',
      message: 'Acute severe febrile illness',
      detail: `Temperature recorded ${screening.temperature ?? 'not recorded'} C. Postpone until recovered, so that signs or symptoms of the illness are not wrongly attributed to the vaccine. A minor illness without fever is not a reason to defer.`,
    });
  }

  // Caution: mild egg allergy (no exclusion in the PGD)
  if (screening.eggAllergy && screening.eggAllergySeverity === 'mild') {
    alerts.push({
      severity: 'caution',
      code: 'MILD_EGG_ALLERGY_RABIES',
      message: 'Mild egg allergy noted',
      detail:
        'Only severe egg allergy excludes Rabipur. Can proceed. Observe for 15 minutes after vaccination as for every patient.',
    });
  }

  // Caution: pregnancy
  if (screening.pregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_RABIES',
      message: 'Patient is pregnant',
      detail:
        'Give pre-exposure vaccine where the risk of exposure is high and rapid access to post-exposure treatment would be limited, and record the risk assessment. There is no identified harm signal but human data are limited.',
    });
  }

  // Caution: breastfeeding
  if (screening.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING_RABIES',
      message: 'Patient is breastfeeding',
      detail:
        'The same principle as pregnancy applies: give where the risk of exposure is high and rapid access to post-exposure treatment would be limited, and record the risk assessment. No risk to the infant has been identified.',
    });
  }

  // Caution: immunosuppression (conventional course only; post-course serology)
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED_RABIES',
      message: 'Immunosuppression, including HIV',
      detail: `Reason: ${screening.immunosuppressedDetails}. A full response may not be mounted. Use the conventional three dose schedule rather than the accelerated one (the accelerated course is excluded), and refer for post-course serology to confirm a protective titre, taken as 0.5 IU/mL or above.`,
    });
  }

  // Caution: bleeding disorders, thrombocytopenia or anticoagulation
  if (screening.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER_RABIES',
      message: 'Bleeding disorder, thrombocytopenia or anticoagulation',
      detail: 'Give by deep subcutaneous injection rather than intramuscularly. Select the deep subcutaneous route on the administration step.',
    });
  }

  // Caution: limited access to post-exposure treatment (inclusion emphasis)
  if (!screening.accessToPEP) {
    alerts.push({
      severity: 'caution',
      code: 'LIMITED_PEP_ACCESS',
      message: 'Post-exposure treatment and rabies biologics lacking or in short supply at destination',
      detail:
        'Pre-exposure vaccination is particularly indicated. Ensure the patient knows to wash any wound and seek medical help the same day after any bite, scratch or lick on broken skin.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: RabiesContraindications
): boolean {
  return (
    contraindications.priorExposure ||
    contraindications.anaphylaxisHistory ||
    contraindications.acuteFebrileIllness ||
    contraindications.neomycinHypersensitivity ||
    (contraindications.severeEggAllergy && contraindications.antibioticHypersensitivity) ||
    !contraindications.ageAppropriate
  );
}

export function getObservationPeriodRecommendation(
  _screening: RabiesScreening
): '15-min' {
  // PGD: observe every patient for 15 minutes after vaccination. Nothing in
  // the signed document extends this, so the tool no longer invents a 30
  // minute period for egg allergy or immunosuppression.
  return '15-min';
}

/** Whole calendar days from today to an ISO date (negative when in the past). null when blank or invalid. */
export function daysFromToday(isoDate: string): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}

/** Minimum days between the previous dose and this one, per schedule and dose number. */
export function minimumIntervalDays(
  schedule: 'standard' | 'accelerated' | '',
  doseNumber: RabiesVaccineAdministration['doseNumber']
): number | null {
  if (doseNumber === '2nd') return schedule === 'accelerated' ? 3 : 7;
  if (doseNumber === '3rd') return schedule === 'accelerated' ? 4 : 14;
  // Accelerated course: further dose at one year. Taken as not before 300
  // days so that a traveller leaving shortly before the anniversary can be
  // given it.
  if (doseNumber === 'one-year-dose') return 300;
  // Booster: considered if travelling again more than a year after the course.
  if (doseNumber === 'booster') return 365;
  return null;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString();
}

/**
 * Next due dates for the dose just given, per the PGD schedules.
 * Conventional: day 0, day 7 and day 28 (third dose may be brought forward to day 21).
 * Accelerated: day 0, day 3 and day 7, with a further dose at one year if travel to high risk areas continues.
 *
 * `currentDate` is the date of the dose being given now; `previousDoseDate`
 * is the date of the previous dose in the course, so that a late second dose
 * still yields the course's own day 21 and day 28 rather than today plus 21.
 */
export function calculateNextDueDates(
  currentDate: string,
  schedule: 'standard' | 'accelerated',
  doseNumber: RabiesVaccineAdministration['doseNumber'],
  previousDoseDate?: string
): string {
  const current = new Date(currentDate);
  const prev = previousDoseDate ? new Date(previousDoseDate) : null;
  const day0 = prev && !isNaN(prev.getTime()) ? prev : current;
  const oneYear = new Date(current);
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  if (schedule === 'standard') {
    if (doseNumber === '1st') {
      return `Day 7: ${addDays(current, 7)}; Day 28: ${addDays(current, 28)} (may be brought forward to day 21: ${addDays(current, 21)})`;
    }
    if (doseNumber === '2nd') {
      // Previous dose was day 0 of the course.
      return `Day 28: ${addDays(day0, 28)} (may be brought forward to day 21: ${addDays(day0, 21)}); if that date has passed, give the third dose as soon as possible`;
    }
    if (doseNumber === '3rd') {
      return 'Primary course complete. Boosters are not routinely recommended for most travellers; a single booster may be considered after risk assessment if travelling again to an enzootic area more than a year after the course.';
    }
    return 'Booster given. Further boosters per risk assessment or serology.';
  }

  if (doseNumber === '1st') {
    return `Day 3: ${addDays(current, 3)}; Day 7: ${addDays(current, 7)}; further dose at one year if travel to high risk areas continues: ${addDays(current, 365)}`;
  }
  if (doseNumber === '2nd') {
    // Previous dose was day 0 of the course.
    return `Day 7: ${addDays(day0, 7)}; further dose at one year if travel to high risk areas continues: ${addDays(day0, 365)}`;
  }
  if (doseNumber === '3rd') {
    return `Accelerated primary course complete. Further dose at one year if travel to high risk areas continues: ${oneYear.toLocaleDateString()}`;
  }
  return 'One year dose given. Further boosters per risk assessment or serology.';
}
