/**
 * Pneumococcal clinical logic.
 *
 * Aligned to the Pneumovax 23 / Prevenar 20 PGD version 008, issued
 * 24 September 2026. The document has two arms. Prevenar 20 (PCV20) is given
 * in preference where it is held: a single lifetime dose. Pneumovax 23 (PPV23)
 * is given where Prevenar 20 is not held, where the subcutaneous route is
 * needed, or for the later 5-yearly revaccination cycles of asplenia, splenic
 * dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5,
 * dialysis or kidney transplant) once Prevenar 20 has been given once.
 *
 * Revaccination rule (both arms): an individual in one of those three groups
 * who is due a 5-yearly revaccination (at least 5 years since the last PPV23
 * or PCV20) and has never had Prevenar 20 receives Prevenar 20 as that dose;
 * later cycles are Pneumovax 23. A repeat Prevenar 20 is never given.
 *
 * Vaxneuvance (PCV15) or Capvaxive (PCV21) given at 2 years or older excludes
 * both products whatever the interval and is treated as a completed course.
 * Infant doses under 2 years (Prevenar 13 or Prevenar 20) do not exclude beyond
 * the 8-week conjugate interval, except that a child who had Prevenar 20 on the
 * under-2 risk group schedule is referred to the GP to complete Green Book
 * Table 3. Any conjugate vaccine within the last 8 weeks excludes both products.
 * Severe immunocompromise (multi-dose sequence) and current or recent
 * chemotherapy or radiotherapy are referrals in both arms.
 */
import type { ClinicalAlert } from '../shared/types';
import type { PneumococcalPatientDetails } from './pneumococcal-types';

export interface PneumococcalMedicalHistoryInput {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  /** Hypersensitivity to diphtheria toxoid (CRM197 carrier): Prevenar 20 exclusion. */
  diphtheriaToxoidHypersensitivity: boolean;
  severeFebrilleIllness: boolean;
  /** Bleeding disorder: PGD v008 caution for both arms; Prevenar 20 is IM only. */
  bleedingDisorder: boolean;
  /**
   * Severe immunocompromise as defined in Green Book chapter 25: bone marrow
   * transplant, acute or chronic leukaemia, multiple myeloma, or a genetic
   * immune disorder such as IRAK-4 or NEMO deficiency. Exclusion in both arms.
   */
  severeImmunocompromise: boolean;
  /**
   * Currently receiving chemotherapy or radiotherapy, or within 3 months of
   * completing it (6 months after chemotherapy for leukaemia). Not given under
   * either arm; the treating team decides the timing. Where treatment is
   * planned and has not started, give at least 2 weeks before it does.
   */
  currentOrRecentChemoRadiotherapy: boolean;
  /** Pregnancy: a caution, not an exclusion, in both arms. */
  pregnant: boolean;
  /** Prevenar 13 at any age: history only, counts for the 8-week conjugate interval. */
  previousPCV13: boolean;
  previousPCV13Date?: string;
  /** Prevenar 20 given at 2 years of age or older: single lifetime dose, never repeated. */
  previousPCV20: boolean;
  previousPCV20Date?: string;
  previousPPV23: boolean;
  previousPPV23Date?: string;
  /**
   * Vaxneuvance (PCV15) or Capvaxive (PCV21) given at 2 years of age or older:
   * excludes both products whatever the interval (a completed course; the
   * 5-yearly rule does not apply to it) and counts as a conjugate vaccine for
   * the 8-week interval.
   */
  previousOtherPCV?: boolean;
  previousOtherPCVDate?: string;
  /**
   * Prevenar 20 given under 2 years of age on the risk-group schedule: refer to
   * the GP to complete Green Book Table 3 (PGD v008 Prevenar 20 exclusions).
   */
  pcv20Under2RiskSchedule?: boolean;
  /**
   * The only product this patient can have under the PGD is not held today
   * (for example Pneumovax 23 for a later revaccination cycle, or where
   * Prevenar 20 is excluded). A stop so the visit is saved as not supplied.
   */
  requiredProductNotHeld?: boolean;
  /** The patient declined vaccination after the discussion. A stop so the decision is recorded. */
  patientDeclined?: boolean;
}

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const YEAR_MS = 1000 * 60 * 60 * 24 * 365.25;

/** The three groups the PGD revaccinates every 5 years, as it defines them. */
export const REVACCINATION_GROUPS_TEXT =
  'asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant)';

export function weeksSince(date?: string): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / WEEK_MS;
}

export function yearsSince(date?: string): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / YEAR_MS;
}

/** Groups in which the PGD permits 5-yearly revaccination (Green Book chapter 25). */
export function revaccinationGroup(patient: PneumococcalPatientDetails): boolean {
  return patient.riskCategory === 'asplenia' || patient.riskCategory === 'ckd';
}

/**
 * Weeks since the most recent pneumococcal conjugate vaccine (Prevenar 13,
 * Prevenar 20, Vaxneuvance or Capvaxive), or null when none was given or no
 * date is known. Both arms of PGD v008 require at least 8 weeks after any
 * conjugate vaccine.
 */
export function weeksSinceLastConjugate(
  history: Pick<
    PneumococcalMedicalHistoryInput,
    | 'previousPCV13'
    | 'previousPCV13Date'
    | 'previousPCV20'
    | 'previousPCV20Date'
    | 'previousOtherPCV'
    | 'previousOtherPCVDate'
  >
): number | null {
  const values: number[] = [];
  if (history.previousPCV13) {
    const w = weeksSince(history.previousPCV13Date);
    if (w !== null) values.push(w);
  }
  if (history.previousPCV20) {
    const w = weeksSince(history.previousPCV20Date);
    if (w !== null) values.push(w);
  }
  if (history.previousOtherPCV) {
    const w = weeksSince(history.previousOtherPCVDate);
    if (w !== null) values.push(w);
  }
  if (!values.length) return null;
  return Math.min(...values);
}

/**
 * Most recent PPV23 or PCV20 dose in years, or null when neither was given.
 * The 5-yearly revaccination is counted from whichever was last (PGD v008).
 */
export function yearsSinceLastPolysaccharideOrPCV20(
  history: Pick<PneumococcalMedicalHistoryInput, 'previousPPV23' | 'previousPPV23Date' | 'previousPCV20' | 'previousPCV20Date'>
): number | null {
  const values: number[] = [];
  if (history.previousPPV23) {
    const y = yearsSince(history.previousPPV23Date);
    if (y !== null) values.push(y);
  }
  if (history.previousPCV20) {
    const y = yearsSince(history.previousPCV20Date);
    if (y !== null) values.push(y);
  }
  if (!values.length) return null;
  return Math.min(...values);
}

/**
 * Product availability under PGD v008 for the patient and history given.
 * Shared by the alerts, the administration validation and the dose schedule
 * so that the three cannot disagree. Common exclusions (anaphylaxis, fever,
 * severe immunocompromise, chemotherapy, infant Prevenar 20 on the risk
 * schedule) are stops in their own right and are not repeated here.
 */
export function getPneumococcalProductAvailability(
  patient: PneumococcalPatientDetails,
  history: PneumococcalMedicalHistoryInput
): {
  pcv20Possible: boolean;
  pcv20Reason: string;
  ppv23Possible: boolean;
  ppv23Reason: string;
} {
  const conjugateWeeks = weeksSinceLastConjugate(history);
  const conjugateTooSoon = conjugateWeeks !== null && conjugateWeeks < 8;
  const lastPolyYears = yearsSinceLastPolysaccharideOrPCV20(history);
  const otherPCV = Boolean(history.previousOtherPCV);

  // Prevenar 20: single lifetime dose. Given as the 5-yearly revaccination
  // dose of the three revaccination groups where it has never been given.
  let pcv20Possible = true;
  let pcv20Reason = '';
  if (history.diphtheriaToxoidHypersensitivity) {
    pcv20Possible = false;
    pcv20Reason = 'hypersensitivity to diphtheria toxoid (CRM197 carrier protein)';
  } else if (history.previousPCV20) {
    pcv20Possible = false;
    pcv20Reason = 'Prevenar 20 has already been given and is a single lifetime dose under this PGD';
  } else if (otherPCV) {
    pcv20Possible = false;
    pcv20Reason = 'Vaxneuvance (PCV15) or Capvaxive (PCV21) has already been given at 2 years or older and no further dose is given under this PGD, whatever the interval';
  } else if (history.previousPPV23) {
    if (!revaccinationGroup(patient)) {
      pcv20Possible = false;
      pcv20Reason = `PPV23 has already been given and revaccination is only for ${REVACCINATION_GROUPS_TEXT}`;
    } else if (lastPolyYears !== null && lastPolyYears < 5) {
      pcv20Possible = false;
      pcv20Reason = `PPV23 was given ${Math.floor(lastPolyYears)} years ago and revaccination is not due until 5 years have elapsed`;
    }
  }
  if (pcv20Possible && conjugateTooSoon) {
    pcv20Possible = false;
    pcv20Reason = `a pneumococcal conjugate vaccine was given ${Math.floor(conjugateWeeks)} weeks ago and at least 8 weeks are required`;
  }

  // Pneumovax 23: single dose; 5-yearly repeat for the three revaccination
  // groups only. Where Prevenar 20 has never been given it is the preferred
  // revaccination product, but Pneumovax 23 stays available where it is not held.
  let ppv23Possible = true;
  let ppv23Reason = '';
  if (otherPCV) {
    ppv23Possible = false;
    ppv23Reason = 'Vaxneuvance (PCV15) or Capvaxive (PCV21) has already been given at 2 years or older and no further dose is given under this PGD, whatever the interval';
  } else if (history.previousPPV23 || history.previousPCV20) {
    if (!revaccinationGroup(patient)) {
      ppv23Possible = false;
      ppv23Reason = `PPV23 or PCV20 has already been given and revaccination is only for ${REVACCINATION_GROUPS_TEXT}`;
    } else if (lastPolyYears !== null && lastPolyYears < 5) {
      ppv23Possible = false;
      ppv23Reason = `PPV23 or PCV20 was given ${Math.floor(lastPolyYears)} years ago and revaccination is not due until 5 years have elapsed`;
    }
  }
  if (ppv23Possible && conjugateTooSoon) {
    ppv23Possible = false;
    ppv23Reason = `a pneumococcal conjugate vaccine was given ${Math.floor(conjugateWeeks)} weeks ago and at least 8 weeks are required`;
  }

  return { pcv20Possible, pcv20Reason, ppv23Possible, ppv23Reason };
}

export function getPneumococcalClinicalAlerts(
  patient: PneumococcalPatientDetails,
  medicalHistory: PneumococcalMedicalHistoryInput
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (patient.age !== null && patient.age < 2) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_2',
      message: 'Patient is under 2 years of age',
      detail:
        'Both arms of this PGD cover individuals aged 2 years and over. The infant and toddler schedules are not given under this PGD. Refer to the GP.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Severe allergic reaction to a previous pneumococcal vaccine',
      detail: 'Excluded under both arms of the PGD. Refer to the GP. Do not supply.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Known hypersensitivity to the vaccine or any of its components',
      detail: 'Excluded under the PGD. Refer to the GP.',
    });
  }

  if (medicalHistory.diphtheriaToxoidHypersensitivity) {
    alerts.push({
      severity: 'caution',
      code: 'DIPHTHERIA_TOXOID',
      message: 'Hypersensitivity to diphtheria toxoid (CRM197 carrier protein)',
      detail:
        'Prevenar 20 is contraindicated and cannot be selected. Pneumovax 23 may still be given where indicated.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Acute illness with fever',
      detail:
        'Postpone vaccination until recovered. A minor illness without fever or systemic upset is not a reason to postpone. Advise the patient to return when well.',
    });
  }

  if (medicalHistory.severeImmunocompromise) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_IMMUNOCOMPROMISE',
      message: 'Severe immunocompromise: multi-dose sequence needs specialist input',
      detail:
        'Bone marrow transplant, acute or chronic leukaemia, multiple myeloma, or a genetic immune disorder such as IRAK-4 or NEMO deficiency: the Green Book multi-dose sequence for this group needs specialist input and is not given under either arm of this PGD. Refer.',
    });
  }

  if (medicalHistory.currentOrRecentChemoRadiotherapy) {
    alerts.push({
      severity: 'stop',
      code: 'CHEMO_RADIOTHERAPY',
      message: 'Current or recent chemotherapy or radiotherapy: not given under this PGD',
      detail:
        'Currently receiving chemotherapy or radiotherapy, or within 3 months of completing it (6 months after chemotherapy for leukaemia): not given under either arm of this PGD. Refer to the treating team, which decides the timing; long-term maintenance treatment is not an indefinite deferral, and vaccination is not delayed where that would mean it never happens. Where treatment is planned and has not started, untick this box and give the vaccine at least 2 weeks before it does.',
    });
  }

  if (medicalHistory.pregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY',
      message: 'Pregnancy: not an exclusion',
      detail:
        'A caution in both arms of this PGD. Prevenar 20 and Pneumovax 23 are inactivated vaccines and the Green Book finds no evidence of risk from inactivated vaccines in pregnancy. The SmPC has no data in pregnancy and advises use where the potential benefit outweighs any risk. Tell her that, record it, and give the vaccine. Breastfeeding is not a reason to withhold.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder, thrombocytopenia or anticoagulation',
      detail:
        'Give intramuscularly with a 23 gauge or finer needle and firm pressure without rubbing for at least 2 minutes; on warfarin, confirm the latest INR is up to date and below the top of the target range. Where the haematology team has advised against intramuscular injection, give Pneumovax 23 subcutaneously under its arm of this PGD where held and indicated, or refer. Prevenar 20 is intramuscular only.',
    });
  }

  if (patient.riskCategory === 'cochlear') {
    alerts.push({
      severity: 'caution',
      code: 'COCHLEAR_IMPLANT_PLANNED',
      message: 'Cochlear implant: vaccinate before implantation',
      detail:
        'A caution in both arms of this PGD, whichever product is given. Where the implant is planned, vaccinate before implantation without delaying the operation. Immunisation must not delay the implantation.',
    });
  }

  // A blank eligibility group is "not yet answered", not a clinical alert:
  // the Patient Details validation names the control (stop audit, 11 Sep 2026).
  // "Not in an eligible group" is an answer, and a stop, so that the advice
  // given can be saved as a not-supplied record (walkthrough review, PGD v008).
  if (patient.riskCategory === 'not-eligible') {
    alerts.push({
      severity: 'stop',
      code: 'NOT_ELIGIBLE',
      message: 'Not in an eligible group under this PGD',
      detail:
        'Not authorised under this PGD, whatever the product licence says. Explain, record the advice given, and refer to the GP if there is a clinical question.',
    });
  }

  // Administration-side stops: the visit ends without a supply and the PGD
  // requires the advice and the decision to be recorded.
  if (medicalHistory.requiredProductNotHeld) {
    alerts.push({
      severity: 'stop',
      code: 'PRODUCT_NOT_HELD',
      message: 'The only product this patient can have under the PGD is not held today',
      detail:
        'Advise how the vaccine can be accessed through the GP, or book the patient to return when stock is held; record the advice.',
    });
  }

  if (medicalHistory.patientDeclined) {
    alerts.push({
      severity: 'stop',
      code: 'PATIENT_DECLINED',
      message: 'Patient declined vaccination',
      detail: 'Record the advice given and the decision reached; inform the GP as appropriate.',
    });
  }

  // Prevenar 20 on the under-2 risk group schedule (PGD v008 Prevenar 20 exclusions)
  if (medicalHistory.pcv20Under2RiskSchedule) {
    alerts.push({
      severity: 'stop',
      code: 'PCV20_UNDER_2_RISK_SCHEDULE',
      message: 'Prevenar 20 given under 2 years on the risk-group schedule',
      detail:
        'Refer to the GP to complete Green Book Table 3. The remaining doses of the risk-group schedule are not given under this PGD.',
    });
  }

  // Conjugate vaccine interval: both arms require at least 8 weeks after any
  // pneumococcal conjugate vaccine (PGD v008 inclusion and exclusion rows).
  const conjugateWeeks = weeksSinceLastConjugate(medicalHistory);
  if (conjugateWeeks !== null && conjugateWeeks < 8) {
    alerts.push({
      severity: 'caution',
      code: 'CONJUGATE_TOO_SOON',
      message: 'Pneumococcal conjugate vaccine given less than 8 weeks ago',
      detail: `Only ${Math.floor(conjugateWeeks)} weeks since the previous conjugate vaccine. Both Prevenar 20 and Pneumovax 23 must be given at least 8 weeks after any pneumococcal conjugate vaccine; neither can be selected yet.`,
    });
  }

  // Vaxneuvance or Capvaxive at 2 years or older (PGD v008 both arms)
  if (medicalHistory.previousOtherPCV) {
    alerts.push({
      severity: 'caution',
      code: 'OTHER_PCV_GIVEN',
      message: 'Vaxneuvance (PCV15) or Capvaxive (PCV21) previously received at 2 years or older',
      detail:
        'Any previous dose of Vaxneuvance or Capvaxive given at 2 years of age or older excludes both Prevenar 20 and Pneumovax 23, whatever the interval. It is treated as a completed course: the 5-yearly revaccination rule does not apply to it and no further dose is given under this PGD. Neither product can be selected.',
    });
  }

  // Prevenar 20 single lifetime dose (PGD v008 Prevenar 20 exclusion)
  if (medicalHistory.previousPCV20) {
    alerts.push({
      severity: 'caution',
      code: 'PCV20_ALREADY_GIVEN',
      message: 'Prevenar 20 previously received: not repeated under this PGD',
      detail:
        `Prevenar 20 is a single lifetime dose under this PGD; a repeat dose is not established in the SmPC and is not authorised. It cannot be selected. Later 5-yearly revaccination cycles of ${REVACCINATION_GROUPS_TEXT} are given with Pneumovax 23.`,
    });
  }

  // Revaccination rule (PGD v008 both arms)
  const lastPolyYears = yearsSinceLastPolysaccharideOrPCV20(medicalHistory);
  if ((medicalHistory.previousPPV23 || medicalHistory.previousPCV20) && !medicalHistory.previousOtherPCV) {
    if (!revaccinationGroup(patient)) {
      alerts.push({
        severity: 'caution',
        code: 'NO_REVACCINATION',
        message: 'PPV23 or PCV20 previously received: revaccination not recommended',
        detail:
          `Any previous dose of PPV23 or PCV20 given at 2 years of age or older excludes, whatever the interval, except for ${REVACCINATION_GROUPS_TEXT} once 5 years have elapsed. An individual vaccinated for a risk group does not need another dose at 65. Neither product can be selected for this patient.`,
      });
    } else if (lastPolyYears !== null && lastPolyYears < 5) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_NOT_DUE',
        message: '5-yearly revaccination not yet due',
        detail: `${Math.floor(lastPolyYears)} years since the last PPV23 or PCV20. For ${REVACCINATION_GROUPS_TEXT} revaccination is every 5 years, counted from the last PPV23 or PCV20 dose; nothing can be selected yet.`,
      });
    } else if (medicalHistory.previousPCV20) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_PPV23_ONLY',
        message: '5-yearly revaccination is given with Pneumovax 23',
        detail:
          'This patient has had Prevenar 20 and is in a group revaccinated every 5 years. A repeat Prevenar 20 is never given under this PGD: give Pneumovax 23 under its arm where held, or refer to the GP.',
      });
    } else if (!medicalHistory.diphtheriaToxoidHypersensitivity) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_PCV20_DUE',
        message: '5-yearly revaccination due: give Prevenar 20 as this dose',
        detail:
          'This patient is in a group revaccinated every 5 years, at least 5 years have passed since the last PPV23, and Prevenar 20 has never been given. Under both arms of this PGD Prevenar 20 is given as this revaccination dose where it is held; give Pneumovax 23 where Prevenar 20 is not held or the subcutaneous route is needed. Later cycles are Pneumovax 23; Prevenar 20 is given once only.',
      });
    }
  }

  // The co-administration caution (PGD v008 cautions row, both arms) is
  // shown as information on the administration step, not as an alert: it
  // applies to every patient and would otherwise hide the "no alerts" state.

  // No product can be given today. Each product-specific rule above is a
  // caution ("cannot be selected"), so a patient blocked from both products
  // would otherwise reach the administration step with nothing selectable,
  // no stop and no way to save the referral (walkthrough review, 11 Sep 2026).
  {
    const { pcv20Possible, pcv20Reason, ppv23Possible, ppv23Reason } =
      getPneumococcalProductAvailability(patient, medicalHistory);
    if (!pcv20Possible && !ppv23Possible) {
      alerts.push({
        severity: 'stop',
        code: 'NO_PRODUCT_AVAILABLE',
        message: 'No pneumococcal vaccine can be given under this PGD today',
        detail:
          `Prevenar 20 cannot be given (${pcv20Reason}) and Pneumovax 23 cannot be given (${ppv23Reason}). Explain this to the patient, advise when a further dose may be due if at all, and refer to the GP if there is doubt about the records.`,
      });
    }
  }

  return alerts;
}

export function getPneumococcalDoseSchedule(
  patient: PneumococcalPatientDetails,
  previousVaccineHistory: {
    previousPCV13: boolean;
    previousPCV20?: boolean;
    previousPPV23: boolean;
    previousOtherPCV?: boolean;
    pcv20Under2RiskSchedule?: boolean;
  }
): {
  recommendedVaccine: string;
  doseSequence: string;
  guidance: string;
} {
  const { riskCategory } = patient;
  const previousPCV20 = Boolean(previousVaccineHistory.previousPCV20);
  const previousPPV23 = previousVaccineHistory.previousPPV23;
  const previousOtherPCV = Boolean(previousVaccineHistory.previousOtherPCV);
  const conjugateNote = previousVaccineHistory.previousPCV13
    ? ' A previous course of Prevenar 13 does not exclude, provided at least 8 weeks have elapsed.'
    : '';
  const preferredProduct =
    'Prevenar 20 (PCV20); Pneumovax 23 (PPV23) where Prevenar 20 is not held or the subcutaneous route is needed';

  if (riskCategory === 'not-eligible') {
    return {
      recommendedVaccine: 'No dose under this PGD',
      doseSequence: 'Not eligible',
      guidance:
        'The patient is not in a group eligible under Green Book chapter 25. Not authorised under this PGD, whatever the product licence says. Record the advice given and refer to the GP if there is a clinical question.',
    };
  }

  if (previousVaccineHistory.pcv20Under2RiskSchedule) {
    return {
      recommendedVaccine: 'No dose under this PGD',
      doseSequence: 'Refer to the GP',
      guidance:
        'Prevenar 20 was given under 2 years of age on the risk-group schedule. Refer to the GP to complete Green Book Table 3; the remaining doses of that schedule are not given under this PGD.',
    };
  }

  if (previousOtherPCV) {
    return {
      recommendedVaccine: 'No further dose under this PGD',
      doseSequence: 'Course complete',
      guidance:
        'Vaxneuvance (PCV15) or Capvaxive (PCV21) has been given at 2 years of age or older. Under both arms of this PGD this excludes whatever the interval and is treated as a completed course; the 5-yearly revaccination rule does not apply to it. Refer to the GP if there is doubt about the record.',
    };
  }

  // Asplenia, splenic dysfunction or CKD (nephrotic syndrome, stage 4 or 5,
  // dialysis or transplant): single dose, then 5-yearly revaccination.
  // Prevenar 20 once, whenever it is first given; every other cycle Pneumovax 23.
  if (riskCategory === 'asplenia' || riskCategory === 'ckd') {
    if (!previousPPV23 && !previousPCV20) {
      return {
        recommendedVaccine: preferredProduct,
        doseSequence: 'Single dose, then 5-yearly revaccination',
        guidance:
          'Single 0.5 mL dose of Prevenar 20 intramuscularly (deltoid), given in preference where it is held. Pneumovax 23, intramuscular or subcutaneous, where Prevenar 20 is not held or the subcutaneous route is needed. Thereafter revaccinate every 5 years: Prevenar 20 as the revaccination dose if it has never been given, otherwise Pneumovax 23. A repeat Prevenar 20 is never given.' +
          conjugateNote,
      };
    }
    if (previousPCV20) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23) only',
        doseSequence: '5-yearly revaccination',
        guidance:
          'Prevenar 20 has already been given once. Revaccinate with Pneumovax 23 once 5 years have elapsed since the last PPV23 or PCV20 dose, and every 5 years thereafter. A repeat Prevenar 20 is never given under this PGD. Where Pneumovax 23 is not held, refer to the GP.',
      };
    }
    return {
      recommendedVaccine: preferredProduct,
      doseSequence: '5-yearly revaccination',
      guidance:
        'Previous PPV23 only: Prevenar 20 has never been given. Once 5 years have elapsed since the last PPV23, give Prevenar 20 as this 5-yearly revaccination dose where it is held (Pneumovax 23 where it is not held or the subcutaneous route is needed). Later cycles are Pneumovax 23; Prevenar 20 is given once only.' +
        conjugateNote,
    };
  }

  // All other eligible groups (including adults aged 65 and over): one dose, no revaccination
  if (previousPPV23 || previousPCV20) {
    return {
      recommendedVaccine: 'No further dose under this PGD',
      doseSequence: 'Course complete',
      guidance:
        `PPV23 or PCV20 has already been given at 2 years of age or older. Revaccination is not recommended for any group other than ${REVACCINATION_GROUPS_TEXT}, and an individual vaccinated for a risk group does not need another dose at 65.`,
    };
  }
  return {
    recommendedVaccine: preferredProduct,
    doseSequence: 'Single dose (one lifetime dose)',
    guidance:
      'Single 0.5 mL dose of Prevenar 20 intramuscularly (deltoid), given in preference where it is held. Pneumovax 23, intramuscular or subcutaneous, where Prevenar 20 is not held or the subcutaneous route is needed. No further pneumococcal vaccine is needed for this group.' +
      (riskCategory === 'immunosuppressed'
        ? ' Severe immunocompromise (bone marrow transplant, leukaemia, myeloma, genetic immune disorder) needs the multi-dose sequence with specialist input and is referred, not given under this PGD.'
        : '') +
      conjugateNote,
  };
}

export function determinePneumococcalRiskLevel(
  riskCategory: string
): {
  level: string;
  priority: 'high' | 'standard';
} {
  const highPriority = ['asplenia', 'immunosuppressed'];
  const isHighPriority = highPriority.includes(riskCategory);

  const categoryLabels: Record<string, string> = {
    asplenia: 'Asplenia / Splenic Dysfunction (HIGH PRIORITY)',
    ckd: 'Chronic Kidney Disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant)',
    'chronic-disease': 'Chronic Disease (Respiratory, Heart, Liver, Neurological, Diabetes)',
    immunosuppressed: 'Immunosuppressed (HIGH PRIORITY)',
    cochlear: 'Cochlear Implant',
    'csf-leak': 'Cerebrospinal Fluid Leak',
    'age-65-plus': 'Adult aged 65 years and over',
    'other-national-guidance': 'Other group eligible under national guidance',
    'not-eligible': 'Not in an eligible group (not authorised under this PGD)',
  };

  return {
    level: categoryLabels[riskCategory] || 'At-risk group',
    priority: isHighPriority ? 'high' : 'standard',
  };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
