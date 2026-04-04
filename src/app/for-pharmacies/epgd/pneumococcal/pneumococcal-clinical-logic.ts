import type { ClinicalAlert } from '../shared/types';
import type {
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from './pneumococcal-types';

export function getPneumococcalClinicalAlerts(
  patient: PneumococcalPatientDetails,
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    previousPCV13: boolean;
    previousPCV13Date?: string;
    previousPPV23: boolean;
    previousPPV23Date?: string;
  }
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Anaphylaxis to previous pneumococcal vaccine',
      detail: 'Absolute contraindication. Patient must be referred to GP. Do not supply.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Anaphylaxis to vaccine component',
      detail:
        'Absolute contraindication. Known allergy to polysorbate 80 or other component. Refer to GP.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Severe acute febrile illness',
      detail: 'Absolute contraindication. Defer vaccination until recovery. Advise patient to return when well.',
    });
  }

  if (!patient.riskCategory) {
    alerts.push({
      severity: 'caution',
      code: 'NO_RISK_CATEGORY',
      message: 'No clear at-risk category identified',
      detail:
        'Pneumococcal vaccination is for specific at-risk groups. Confirm clinical indication before proceeding.',
    });
  }

  // Check vaccine schedule appropriateness
  if (medicalHistory.previousPCV13 && medicalHistory.previousPCV13Date) {
    const previousDate = new Date(medicalHistory.previousPCV13Date);
    const today = new Date();
    const weeksElapsed =
      (today.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24 * 7);

    if (weeksElapsed < 8) {
      alerts.push({
        severity: 'caution',
        code: 'PCV13_TOO_SOON',
        message: 'PCV13 dose too recent',
        detail: `Only ${Math.floor(weeksElapsed)} weeks since previous PCV13. Should wait ≥8 weeks before PPV23.`,
      });
    }
  }

  if (medicalHistory.previousPPV23 && medicalHistory.previousPPV23Date) {
    const previousDate = new Date(medicalHistory.previousPPV23Date);
    const today = new Date();
    const yearsElapsed =
      (today.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // Booster only for asplenia/splenic dysfunction
    if (
      patient.riskCategory === 'asplenia' &&
      yearsElapsed < 5
    ) {
      alerts.push({
        severity: 'caution',
        code: 'PPV23_BOOSTER_SOON',
        message: 'PPV23 booster not yet due',
        detail: `${Math.floor(yearsElapsed)} years since previous PPV23. For asplenia/splenic dysfunction, booster due every 5 years.`,
      });
    }

    if (
      patient.riskCategory !== 'asplenia' &&
      yearsElapsed < 1
    ) {
      alerts.push({
        severity: 'caution',
        code: 'PPV23_TOO_SOON',
        message: 'PPV23 given less than 1 year ago',
        detail: 'Only revaccinate if clinically indicated. Discuss with patient and GP.',
      });
    }
  }

  return alerts;
}

export function getPneumococcalDoseSchedule(
  patient: PneumococcalPatientDetails,
  previousVaccineHistory: {
    previousPCV13: boolean;
    previousPPV23: boolean;
  }
): {
  recommendedVaccine: string;
  doseSequence: string;
  guidance: string;
} {
  const { riskCategory } = patient;
  const { previousPCV13, previousPPV23 } = previousVaccineHistory;

  // High-risk group (asplenia, splenic dysfunction)
  if (riskCategory === 'asplenia') {
    if (!previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'First dose (of 2-dose series)',
        guidance:
          'Administer PCV13 first. PPV23 must be given ≥8 weeks later. Booster PPV23 every 5 years after initial series.',
      };
    }
    if (previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Second dose (≥8 weeks after PCV13)',
        guidance:
          'Administer PPV23 ≥8 weeks after PCV13 dose. Then revaccinate with PPV23 every 5 years.',
      };
    }
    if (previousPCV13 && previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Booster dose',
        guidance:
          'If ≥5 years since last PPV23, administer booster PPV23 for asplenia/splenic dysfunction.',
      };
    }
  }

  // Chronic disease (respiratory, cardiac, renal, liver, diabetes)
  if (riskCategory === 'chronic-disease') {
    if (!previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'First dose',
        guidance:
          'For high-risk chronic disease: PCV13 first, then PPV23 ≥8 weeks later provides broader protection.',
      };
    }
    if (previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Second dose (≥8 weeks after PCV13)',
        guidance: 'Administer PPV23 ≥8 weeks after PCV13 for optimal protection.',
      };
    }
    if (!previousPCV13 && previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'Additional dose',
        guidance:
          'Can give PCV13 even after PPV23 if not previously given. May improve protection against additional serotypes.',
      };
    }
  }

  // Immunosuppressed
  if (riskCategory === 'immunosuppressed') {
    if (!previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'First dose',
        guidance:
          'For immunosuppression: PCV13 should be given first. PPV23 ≥8 weeks later. Note: vaccine response may be reduced.',
      };
    }
    if (previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Second dose (≥8 weeks after PCV13)',
        guidance:
          'Administer PPV23 ≥8 weeks after PCV13. Monitor for adequacy of response given immunosuppression.',
      };
    }
  }

  // Cochlear implants or CSF leak
  if (riskCategory === 'cochlear' || riskCategory === 'csf-leak') {
    if (!previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Prevenar 13 (PCV13)',
        doseSequence: 'First dose',
        guidance:
          'For cochlear implant or CSF leak: PCV13 is primary vaccine. PPV23 can follow ≥8 weeks later for additional protection.',
      };
    }
    if (previousPCV13 && !previousPPV23) {
      return {
        recommendedVaccine: 'Pneumovax 23 (PPV23)',
        doseSequence: 'Second dose (≥8 weeks after PCV13)',
        guidance: 'Administer PPV23 ≥8 weeks after PCV13.',
      };
    }
  }

  return {
    recommendedVaccine: 'PPV23 (Pneumovax 23)',
    doseSequence: 'Single or additional dose',
    guidance:
      'Assess clinical indication. For at-risk patients without prior pneumococcal vaccination, consider PCV13 first if age-appropriate.',
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
    'chronic-disease': 'Chronic Disease (Heart, Lung, Kidney, Liver, Diabetes)',
    immunosuppressed: 'Immunosuppressed (HIGH PRIORITY)',
    cochlear: 'Cochlear Implant',
    'csf-leak': 'Cerebrospinal Fluid Leak',
  };

  return {
    level: categoryLabels[riskCategory] || 'At-risk group',
    priority: isHighPriority ? 'high' : 'standard',
  };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
