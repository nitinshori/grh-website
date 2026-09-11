/**
 * Pneumococcal clinical logic.
 *
 * Aligned to the Pneumovax 23 / Prevenar 13 PGD version 006, issued
 * 11 September 2026. The document covers PCV13 (Prevenar 13) and PPV23
 * (Pneumovax 23) only; PCV20 appears only as prior exposure that counts
 * against revaccination. The guidance summary was rewritten against the
 * July 2026 Green Book chapter 25 (Prevenar 20 in the adult and at-risk
 * programmes from early 2026; infant PCV13 at 16 weeks and 1 year; clinical
 * risk groups now include occupational metal fume exposure and people
 * experiencing homelessness) by the signatories' decision 10 of 11 September
 * 2026, with the arms unchanged. Prevenar 20 is not authorised under this
 * PGD: where national guidance indicates PCV20 and it is not held, refer.
 */
import type { ClinicalAlert } from '../shared/types';
import type { PneumococcalPatientDetails } from './pneumococcal-types';

export interface PneumococcalMedicalHistoryInput {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  /** Hypersensitivity to diphtheria toxoid (CRM197 carrier): Prevenar 13 exclusion. */
  diphtheriaToxoidHypersensitivity: boolean;
  severeFebrilleIllness: boolean;
  /** Bleeding disorder: PGD v006 caution for both arms. */
  bleedingDisorder: boolean;
  previousPCV13: boolean;
  previousPCV13Date?: string;
  previousPCV20: boolean;
  previousPCV20Date?: string;
  previousPPV23: boolean;
  previousPPV23Date?: string;
}

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const YEAR_MS = 1000 * 60 * 60 * 24 * 365.25;

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

/** Groups in which the PGD permits 5-yearly PPV23 revaccination (Green Book chapter 25). */
export function revaccinationGroup(patient: PneumococcalPatientDetails): boolean {
  return patient.riskCategory === 'asplenia' || patient.riskCategory === 'ckd';
}

/**
 * Most recent PPV23 or PCV20 dose in years, or null when neither was given.
 * Both count against PPV23 revaccination under PGD v006.
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
        'Both arms of this PGD cover individuals aged 2 years and over. Infant primary immunisation is not given under this PGD. Refer to the GP.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Severe allergic reaction to a previous pneumococcal vaccine',
      detail: 'Excluded under the PGD. Refer to the GP. Do not supply.',
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
        'Prevenar 13 is contraindicated and cannot be selected. Pneumovax 23 may still be given where indicated.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Acute illness with fever',
      detail: 'Postpone vaccination until recovered. Advise the patient to return when well.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder',
      detail:
        'Use with caution. Use a fine needle, apply firm pressure to the site for at least 2 minutes, and advise the patient about the risk of haematoma.',
    });
  }

  // A blank eligibility group is "not yet answered", not a clinical alert:
  // the Patient Details validation names the control (stop audit, 11 Sep 2026).

  // Conjugate vaccine interval: PPV23 at least 8 weeks after PCV13 (PGD v006 dose row)
  const weeksSincePCV13 = medicalHistory.previousPCV13 ? weeksSince(medicalHistory.previousPCV13Date) : null;
  if (weeksSincePCV13 !== null && weeksSincePCV13 < 8) {
    alerts.push({
      severity: 'caution',
      code: 'PCV13_TOO_SOON',
      message: 'Conjugate vaccine given less than 8 weeks ago',
      detail: `Only ${Math.floor(weeksSincePCV13)} weeks since the previous PCV13. Pneumovax 23 must be given at least 8 weeks after the conjugate vaccine; it cannot be selected yet.`,
    });
  }

  if (medicalHistory.previousPCV13 || medicalHistory.previousPCV20) {
    alerts.push({
      severity: 'caution',
      code: 'CONJUGATE_ALREADY_GIVEN',
      message: 'Pneumococcal conjugate vaccine previously received',
      detail:
        'Prevenar 13 under this PGD is for individuals aged 2 years and over who have not previously received a pneumococcal conjugate vaccine; it cannot be selected.',
    });
  }

  // PPV23 revaccination rule (PGD v006 Pneumovax 23 exclusion)
  const lastPolyYears = yearsSinceLastPolysaccharideOrPCV20(medicalHistory);
  if (medicalHistory.previousPPV23 || medicalHistory.previousPCV20) {
    if (!revaccinationGroup(patient)) {
      alerts.push({
        severity: 'caution',
        code: 'PPV23_NO_REVACCINATION',
        message: 'PPV23 or PCV20 previously received: revaccination not recommended',
        detail:
          'Revaccination with Pneumovax 23 is only for asplenia, splenic dysfunction or chronic kidney disease once 5 years have elapsed. Pneumovax 23 cannot be selected for this patient.',
      });
    } else if (lastPolyYears !== null && lastPolyYears < 5) {
      alerts.push({
        severity: 'caution',
        code: 'PPV23_BOOSTER_SOON',
        message: 'PPV23 revaccination not yet due',
        detail: `${Math.floor(lastPolyYears)} years since the last PPV23 or PCV20. For asplenia, splenic dysfunction or chronic kidney disease revaccination is every 5 years and never within 3 years; Pneumovax 23 cannot be selected yet.`,
      });
    }
  }

  // No product can be given today. Each product-specific rule above is a
  // caution ("cannot be selected"), so a patient who is blocked from both
  // Prevenar 13 (previous conjugate vaccine) and Pneumovax 23 (previous
  // PPV23 or PCV20 outside the revaccination groups, or not yet 5 years, or
  // less than 8 weeks after the conjugate vaccine) reached the administration
  // step with nothing selectable, no stop and no way to save the referral.
  // Anyone who has had Prevenar 20 under the NHS adult programme is in this
  // position (walkthrough review, 11 Sep 2026).
  {
    const pcv13Possible =
      !medicalHistory.diphtheriaToxoidHypersensitivity &&
      !medicalHistory.previousPCV13 &&
      !medicalHistory.previousPCV20;
    let ppv23Possible = true;
    let ppv23Reason = '';
    if (weeksSincePCV13 !== null && weeksSincePCV13 < 8) {
      ppv23Possible = false;
      ppv23Reason = `Pneumovax 23 is not due until 8 weeks after the conjugate vaccine (${Math.floor(weeksSincePCV13)} weeks so far)`;
    }
    if (medicalHistory.previousPPV23 || medicalHistory.previousPCV20) {
      if (!revaccinationGroup(patient)) {
        ppv23Possible = false;
        ppv23Reason = 'PPV23 or PCV20 has already been given and revaccination is only for asplenia, splenic dysfunction or chronic kidney disease';
      } else if (lastPolyYears !== null && lastPolyYears < 5) {
        ppv23Possible = false;
        ppv23Reason = `PPV23 or PCV20 was given ${Math.floor(lastPolyYears)} years ago and revaccination is not due until 5 years have elapsed`;
      }
    }
    if (!pcv13Possible && !ppv23Possible) {
      alerts.push({
        severity: 'stop',
        code: 'NO_PRODUCT_AVAILABLE',
        message: 'No pneumococcal vaccine can be given under this PGD today',
        detail:
          `Prevenar 13 cannot be given (${medicalHistory.diphtheriaToxoidHypersensitivity ? 'hypersensitivity to diphtheria toxoid' : 'a pneumococcal conjugate vaccine has already been received'}) and ${ppv23Reason}. Explain this to the patient, advise when a further dose may be due if at all, and refer to the GP if there is doubt about the records.`,
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
  }
): {
  recommendedVaccine: string;
  doseSequence: string;
  guidance: string;
} {
  const { riskCategory } = patient;
  const previousConjugate = previousVaccineHistory.previousPCV13 || Boolean(previousVaccineHistory.previousPCV20);
  const previousPPV23 = previousVaccineHistory.previousPPV23 || Boolean(previousVaccineHistory.previousPCV20);

  // Asplenia, splenic dysfunction, severe immunosuppression: PCV followed by PPV23 after at least 8 weeks
  if (riskCategory === 'asplenia' || riskCategory === 'immunosuppressed') {
    const specialist = riskCategory === 'immunosuppressed' ? ' Severely immunocompromised patients require specialist input.' : '';
    if (!previousConjugate && !previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'First dose (conjugate vaccine)',
        guidance:
          'Single 0.5 mL dose of Prevenar 13 intramuscularly. Pneumovax 23 to follow at least 8 weeks later.' +
          (riskCategory === 'asplenia' ? ' Thereafter PPV23 revaccination every 5 years.' : '') +
          specialist,
      };
    }
    if (previousConjugate && !previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Second dose (at least 8 weeks after the conjugate vaccine)',
        guidance:
          'Single 0.5 mL dose of Pneumovax 23, intramuscular or subcutaneous, at least 8 weeks after the conjugate vaccine.' +
          (riskCategory === 'asplenia' ? ' Thereafter revaccinate every 5 years.' : '') +
          specialist,
      };
    }
    if (previousPPV23) {
      return {
        recommendedVaccine: riskCategory === 'asplenia' ? 'Pneumovax 23 (PPV23)' : 'No further dose under this PGD',
        doseSequence: riskCategory === 'asplenia' ? '5-yearly revaccination' : 'Course complete',
        guidance:
          riskCategory === 'asplenia'
            ? 'Revaccinate with Pneumovax 23 only once 5 years have elapsed since the last PPV23 or PCV20 (never within 3 years).'
            : 'Revaccination is not recommended for this group under the PGD. Refer to the GP or specialist if further doses are being considered.',
      };
    }
  }

  // Chronic kidney disease: PPV23 with 5-yearly revaccination
  if (riskCategory === 'ckd') {
    if (!previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Single dose',
        guidance:
          'Single 0.5 mL dose of Pneumovax 23, intramuscular or subcutaneous. Revaccinate every 5 years for chronic kidney disease. Where a conjugate vaccine has been given, allow at least 8 weeks.',
      };
    }
    return {
      recommendedVaccine: 'Pneumovax 23 (PPV23)',
      doseSequence: '5-yearly revaccination',
      guidance:
        'Revaccinate with Pneumovax 23 only once 5 years have elapsed since the last PPV23 or PCV20 (never within 3 years).',
    };
  }

  // Other at-risk groups and adults aged 65 and over: single PPV23, no revaccination
  if (previousPPV23) {
    return {
      recommendedVaccine: 'No further dose under this PGD',
      doseSequence: 'Course complete',
      guidance:
        'PPV23 or PCV20 has already been given. Revaccination is not recommended for any group other than asplenia, splenic dysfunction or chronic kidney disease.',
    };
  }
  return {
    recommendedVaccine: 'Pneumovax 23 (PPV23)',
    doseSequence: 'Single dose (one lifetime dose in most cases)',
    guidance:
      riskCategory === 'age-65-plus'
        ? 'Single 0.5 mL dose of Pneumovax 23, intramuscular or subcutaneous. One-off dose for adults aged 65 and over.'
        : 'Single 0.5 mL dose of Pneumovax 23, intramuscular or subcutaneous. A conjugate vaccine may also be indicated under national guidance if never received; where both are given, PPV23 follows the conjugate vaccine by at least 8 weeks.',
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
    ckd: 'Chronic Kidney Disease',
    'chronic-disease': 'Chronic Disease (Respiratory, Heart, Liver, Neurological, Diabetes)',
    immunosuppressed: 'Immunosuppressed (HIGH PRIORITY)',
    cochlear: 'Cochlear Implant',
    'csf-leak': 'Cerebrospinal Fluid Leak',
    'age-65-plus': 'Adult aged 65 years and over',
    'other-national-guidance': 'Other group eligible under national guidance',
  };

  return {
    level: categoryLabels[riskCategory] || 'At-risk group',
    priority: isHighPriority ? 'high' : 'standard',
  };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
