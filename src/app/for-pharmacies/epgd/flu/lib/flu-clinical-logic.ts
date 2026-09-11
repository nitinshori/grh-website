// Aligned to the seasonal influenza vaccines PGD (IIVc, aIIV, IIVr, IIVe), 2026/27 season,
// version 005, issued 11 September 2026.
import { ClinicalAlert } from '../../shared/types';
import {
  FluScreening,
  FluContraindications,
  FluConsultationState,
  FluVaccineType,
  FLU_VACCINES,
} from './flu-types';

/**
 * Is a child under 9 on the two-dose first course (two doses at least 4 weeks
 * apart)? True for a child who has never had influenza vaccine (dose 1) and
 * for a child whose only previous dose was dose 1 of this season's course
 * (dose 2). A null or unknown age fails every age gate.
 */
export function needsTwoDoses(screening: FluScreening, patientAge: number): boolean {
  if (!Number.isFinite(patientAge) || patientAge < 0) return false;
  return patientAge < 9 && (!screening.previousFluVaccine || screening.firstDoseThisSeason);
}

/** Dose number in the two-dose course, derived from the screening answers rather than chosen freely. */
export function twoDoseCourseDoseNumber(screening: FluScreening, patientAge: number): '' | '1' | '2' {
  if (!needsTwoDoses(screening, patientAge)) return '';
  return screening.firstDoseThisSeason ? '2' : '1';
}

/** Vaccine types permitted for this patient under PGD v005 (age range and egg allergy). */
export function permittedVaccineTypes(
  patientAge: number,
  eggAllergy: boolean
): Exclude<FluVaccineType, ''>[] {
  // An unknown age (blank or unparseable date of birth) permits nothing.
  if (!Number.isFinite(patientAge) || patientAge < 0) return [];
  return (Object.keys(FLU_VACCINES) as Exclude<FluVaccineType, ''>[]).filter((t) => {
    const v = FLU_VACCINES[t];
    if (patientAge < v.minAge) return false;
    if (v.maxAge !== null && patientAge > v.maxAge) return false;
    if (patientAge < 18 && t !== 'iivc') return false;
    if (eggAllergy && !v.eggFree) return false;
    return true;
  });
}

/** Why a given vaccine type cannot be used for this patient, or null if it can. */
export function vaccineTypeRefusal(
  type: FluVaccineType,
  patientAge: number,
  eggAllergy: boolean
): string | null {
  if (!type) return null;
  const v = FLU_VACCINES[type];
  if (!Number.isFinite(patientAge) || patientAge < 0) {
    return 'The patient\'s age could not be calculated from the date of birth; no vaccine can be selected';
  }
  if (patientAge < 18 && type !== 'iivc') {
    return 'No vaccine other than IIVc (cell-based) may be given under this PGD to anyone under 18 years';
  }
  if (patientAge < v.minAge || (v.maxAge !== null && patientAge > v.maxAge)) {
    return `${v.label} is for ${v.minAge}${v.maxAge !== null ? ` to ${v.maxAge}` : ' years and over'} under this PGD; patient is ${patientAge}`;
  }
  if (eggAllergy && !v.eggFree) {
    return 'Egg allergy: use IIVc or IIVr, which are egg-free, or refer. Do not administer an egg-cultured vaccine';
  }
  return null;
}

export function evaluateFluContraindications(
  screening: FluScreening,
  patientAge: number
): { contraindications: FluContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  // A blank or unparseable date of birth is "not yet answered": the Patient
  // Details validation asks for it. Only an entered date of birth that gives an
  // age under 2 raises the stop (stop audit, 11 Sep 2026).
  const ageKnown = Number.isFinite(patientAge) && patientAge >= 0;
  const contraindications: FluContraindications = {
    anaphylaxisToPreviousDose: false,
    severeEggAllergy: false,
    acuteFebrileIllness: false,
    ageAppropriate: !(ageKnown && patientAge < 2),
    hypersensitivityToComponent: false,
    alreadyVaccinatedThisSeason: false,
    bleedingDisorderUnassessed: false,
  };

  if (ageKnown && patientAge < 2) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_2',
      message: 'Patient is under 2 years',
      detail:
        'Excluded. Refer to the NHS childhood programme, the GP or a service commissioned to vaccinate this age group.',
    });
  }

  // Hard stop: confirmed anaphylaxis to a previous dose of any influenza vaccine
  if (screening.previousReaction && screening.previousFluVaccine && screening.previousReactionType === 'anaphylaxis') {
    contraindications.anaphylaxisToPreviousDose = true;
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_PREVIOUS_DOSE',
      message: 'Confirmed anaphylactic reaction to a previous dose of any influenza vaccine',
      detail: 'Excluded under the PGD. Do not vaccinate. Refer to the GP or an allergy specialist.',
    });
  }

  // Hard stop: hypersensitivity to active substances, excipients or residues
  if (screening.hypersensitivityToComponent) {
    contraindications.hypersensitivityToComponent = true;
    alerts.push({
      severity: 'stop',
      code: 'HYPERSENSITIVITY_COMPONENT',
      message: 'Known hypersensitivity to the active substances or to an excipient or residue in the SPC',
      detail: 'Excluded under the PGD. Refer.',
    });
  }

  // Hard stop: already vaccinated this season, unless a child under 9 attending for dose 2
  // of this season's first course (recorded as firstDoseThisSeason).
  const attendingForDose2 = patientAge < 9 && screening.firstDoseThisSeason;
  if (screening.receivedThisSeason && !attendingForDose2) {
    contraindications.alreadyVaccinatedThisSeason = true;
    alerts.push({
      severity: 'stop',
      code: 'ALREADY_VACCINATED_THIS_SEASON',
      message: 'Already received an influenza vaccine for the 2026/27 season',
      detail:
        'Excluded: one dose per individual per season, other than a child under 9 years attending for the second of two doses.',
    });
  }

  // Egg allergy: egg-free vaccine required (IIVc or IIVr); not a barrier to vaccination
  if (screening.eggAllergy) {
    contraindications.severeEggAllergy = screening.eggAllergySeverity === 'severe';
    alerts.push({
      severity: 'caution',
      code: screening.eggAllergySeverity === 'severe' ? 'SEVERE_EGG_ALLERGY' : 'MILD_EGG_ALLERGY',
      message: `Egg allergy (${screening.eggAllergySeverity || 'severity not recorded'})`,
      detail:
        'Egg allergy is not a barrier to vaccination provided an egg-free vaccine is used. IIVc and IIVr contain no ovalbumin and are the appropriate choices, including for a history of anaphylaxis to egg. aIIV and IIVe are egg-cultured and cannot be selected. Where no egg-free vaccine is in stock, arrange supply or refer. Observe for 15 minutes.',
    });
  }

  // Hard stop: acute febrile illness (tool threshold 38 C)
  if (screening.temperature !== null && screening.temperature >= 38) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS',
      message: 'Acute severe febrile illness',
      detail: `Patient temperature is ${screening.temperature} C. Postpone until recovered. A minor infection without fever is not a contraindication.`,
    });
  }

  // Caution: previous non-anaphylactic reaction
  if (screening.previousReaction && screening.previousFluVaccine && screening.previousReactionType === 'other') {
    alerts.push({
      severity: 'caution',
      code: 'PREVIOUS_MILD_REACTION',
      message: 'Previous reaction to influenza vaccine (not anaphylaxis)',
      detail: `Previous reaction: ${screening.reactionDetails}. Observe for 15 minutes after vaccination where there is a history of allergy or previous vaccine reaction.`,
    });
  }

  // Caution: previous GBS (tool's own note; the PGD is silent)
  if (screening.previousGBS) {
    alerts.push({
      severity: 'caution',
      code: 'PREVIOUS_GBS',
      message: 'Previous Guillain-Barre syndrome',
      detail:
        'Patient has a history of GBS. Weigh risks and benefits; consider referral to the GP or specialist for shared decision-making.',
    });
  }

  // Immunosuppressed: response may be reduced, still recommended
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. The immune response may be reduced. Vaccination is still recommended; advise that protection may be limited.`,
    });
  }

  // Pregnancy and breastfeeding: recommended; NHS eligible, must be told
  if (screening.pregnant || screening.breastfeeding) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREGNANT',
      message: screening.pregnant ? 'Patient is pregnant' : 'Patient is breastfeeding',
      detail:
        'Inactivated influenza vaccine is recommended at any stage of pregnancy and is safe while breastfeeding. Pregnant women are eligible under the NHS programme and must be told they can have the vaccine free of charge before proceeding with a private supply.',
    });
  }

  // Bleeding disorder: exclusion unless IM assessed as safe. The stop fires on
  // an answered "No" only; an unanswered assessment is a validation message.
  if (screening.bleedingDisorder && screening.bleedingDisorderAssessedSafe === false) {
    contraindications.bleedingDisorderUnassessed = true;
    alerts.push({
      severity: 'stop',
      code: 'BLEEDING_DISORDER_UNASSESSED',
      message: 'Bleeding disorder without a clinical assessment that intramuscular injection is safe',
      detail:
        'Excluded until intramuscular injection has been assessed as safe by a clinician familiar with the individual\'s bleeding risk. Where the intramuscular route is not suitable, refer rather than administering by an alternative route.',
    });
  }

  if ((screening.bleedingDisorder && screening.bleedingDisorderAssessedSafe === true) || screening.anticoagulated) {
    alerts.push({
      severity: 'red-flag',
      code: 'BLEEDING_DISORDER',
      message: 'Anticoagulation or bleeding disorder',
      detail:
        'Vaccinate intramuscularly with a 23 gauge or finer needle, apply firm pressure without rubbing for at least 2 minutes, and advise on the risk of haematoma. Do not use an alternative route under this PGD.',
    });
  }

  // Caution: currently unwell without fever
  if (screening.currentIllness && !contraindications.acuteFebrileIllness) {
    alerts.push({
      severity: 'caution',
      code: 'CURRENT_ILLNESS',
      message: 'Patient currently unwell',
      detail: `Illness: ${screening.illnessDetails}. A minor infection without fever is not a contraindication; postpone only for acute severe febrile illness.`,
    });
  }

  // Two-dose schedule for a child under 9 having influenza vaccine for the first time
  if (needsTwoDoses(screening, patientAge)) {
    alerts.push({
      severity: 'caution',
      code: 'TWO_DOSE_CHILD',
      message: screening.firstDoseThisSeason
        ? 'Child under 9 attending for dose 2 of 2 of this season\'s first course'
        : 'Child under 9 receiving influenza vaccine for the first time: 2 doses required',
      detail: screening.firstDoseThisSeason
        ? `Dose 1 given ${screening.firstDoseThisSeasonDate || '(date not recorded)'}. Dose 2 must be at least 4 weeks after dose 1. This is recorded as dose 2 of 2.`
        : 'Give 2 doses at least 4 weeks apart. Book the second dose at the first appointment and record that this is dose 1 of 2. Give written confirmation of the date the second dose is due.',
    });
  }

  // Children: IIVc only, NHS childhood programme
  if (patientAge >= 2 && patientAge < 18) {
    alerts.push({
      severity: 'caution',
      code: 'CHILD_IIVC_ONLY',
      message: 'Patient is under 18: IIVc only',
      detail:
        'Cell-based vaccine (IIVc) is the only vaccine that may be given to anyone under 18 under this PGD. Children eligible under the NHS childhood programme must be told they can be vaccinated free of charge, usually with the nasal spray vaccine.',
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: FluContraindications
): boolean {
  return (
    contraindications.anaphylaxisToPreviousDose ||
    contraindications.acuteFebrileIllness ||
    contraindications.hypersensitivityToComponent ||
    contraindications.alreadyVaccinatedThisSeason ||
    contraindications.bleedingDisorderUnassessed ||
    !contraindications.ageAppropriate
  );
}

export function getAlertsByStep(
  state: FluConsultationState
): Map<number, ClinicalAlert[]> {
  const alertsByStep = new Map<number, ClinicalAlert[]>();

  state.alerts.forEach((alert: ClinicalAlert) => {
    let step: number | null = null;

    if (alert.code === 'ACUTE_FEBRILE_ILLNESS' || alert.code === 'CURRENT_ILLNESS') {
      step = 2;
    } else if (alert.code === 'BLEEDING_DISORDER') {
      step = 4;
    } else {
      step = 3;
    }

    if (step !== null) {
      if (!alertsByStep.has(step)) {
        alertsByStep.set(step, []);
      }
      alertsByStep.get(step)!.push(alert);
    }
  });

  return alertsByStep;
}

export function getObservationPeriodRecommendation(
  screening: FluScreening
): '15-min' | '30-min' {
  // The PGD requires 15 minutes where there is a history of allergy or previous vaccine reaction.
  // The tool keeps its longer 30 minute option for those patients (stricter).
  if (
    (screening.previousReaction && screening.previousFluVaccine) ||
    screening.eggAllergy
  ) {
    return '30-min';
  }
  return '15-min';
}
