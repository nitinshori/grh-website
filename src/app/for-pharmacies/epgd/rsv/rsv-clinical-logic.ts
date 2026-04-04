import type { ClinicalAlert } from '../shared/types';
import type {
  RSVPatientDetails,
  RSVConsent,
  RSVSummary,
} from './rsv-types';

export function getRSVClinicalAlerts(
  patient: RSVPatientDetails,
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    immunosuppressed: boolean;
    bleedingDisorder: boolean;
  }
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Anaphylaxis to previous RSV vaccine',
      detail: 'Absolute contraindication. Patient must be referred to GP. Do not supply.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Anaphylaxis to vaccine component',
      detail:
        'Absolute contraindication. Known allergy (e.g., polysorbate 80 or other component). Refer to GP.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Severe acute febrile illness',
      detail:
        'Absolute contraindication. Defer vaccination until recovery. Advise patient to return when well.',
    });
  }

  // Pregnant women eligibility check
  if (patient.patientCategory === 'pregnant-woman') {
    // Check RSV season (Sep-Jan in UK)
    const today = new Date();
    const month = today.getMonth();
    const isRSVSeason = month >= 8 || month <= 0; // Sep=8, Oct=9, Nov=10, Dec=11, Jan=0

    if (!isRSVSeason) {
      alerts.push({
        severity: 'caution',
        code: 'OUTSIDE_RSV_SEASON',
        message: 'Current RSV season is Sep-Jan',
        detail:
          'Abrysvo for maternal immunisation is recommended during RSV season (September to January). Consider timing.',
      });
    }

    if (patient.pregnancyWeeks === undefined) {
      alerts.push({
        severity: 'caution',
        code: 'PREGNANCY_WEEKS_MISSING',
        message: 'Pregnancy weeks not specified',
        detail:
          'Abrysvo maternal vaccination is approved for 32-36 weeks gestation. Confirm gestational age.',
      });
    } else if (patient.pregnancyWeeks < 32 || patient.pregnancyWeeks > 36) {
      alerts.push({
        severity: 'caution',
        code: 'OUTSIDE_OPTIMAL_GESTATION',
        message: `Pregnancy at ${patient.pregnancyWeeks} weeks`,
        detail:
          'Abrysvo is optimally given at 32-36 weeks gestation to maximise maternal and newborn protection. Currently outside recommended window.',
      });
    }
  }

  // Adult 60+ eligibility
  if (patient.patientCategory === 'adult-60-plus') {
    if (patient.age !== null && patient.age < 60) {
      alerts.push({
        severity: 'caution',
        code: 'BELOW_AGE_60',
        message: 'Patient age less than 60 years',
        detail:
          'RSV vaccination is recommended for adults 60+. Patient may be at increased risk if other factors present, but not routine indication.',
      });
    }

    // Check if RSV season matters
    const today = new Date();
    const month = today.getMonth();
    const isRSVSeason = month >= 8 || month <= 0;

    if (!patient.atIncreasedrisk && isRSVSeason) {
      // Standard recommendation for 60+
    } else if (!patient.atIncreasedrisk && !isRSVSeason) {
      alerts.push({
        severity: 'caution',
        code: 'OUTSIDE_SEASON_STANDARD_RISK',
        message: 'Outside RSV season for standard-risk 60+ adults',
        detail:
          'For adults 60+ without increased risk, vaccination is seasonal (Sep-Jan). Consider waiting for RSV season.',
      });
    }
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient immunosuppressed',
      detail:
        'Vaccine response may be reduced. Discuss optimal timing relative to immunosuppressive therapy. Vaccine can still be given.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder noted',
      detail:
        'Use subcutaneous injection instead of IM. Maintain pressure at injection site for ≥5 minutes.',
    });
  }

  if (!patient.patientCategory) {
    alerts.push({
      severity: 'caution',
      code: 'NO_CATEGORY',
      message: 'Patient category not specified',
      detail:
        'Confirm patient is either 60+ years old or pregnant woman at 32-36 weeks gestation for RSV vaccination eligibility.',
    });
  }

  return alerts;
}

export function getRSVVaccineGuidance(
  vaccineType: string,
  patientCategory: string
): {
  vaccineName: string;
  indication: string;
  route: string;
  guidance: string;
} {
  if (vaccineType === 'abrysvo') {
    if (patientCategory === 'pregnant-woman') {
      return {
        vaccineName: 'Abrysvo (Pfizer)',
        indication: 'Maternal RSV vaccination at 32-36 weeks gestation',
        route: 'Intramuscular',
        guidance:
          'Single 0.5 mL IM dose. Protects newborn for first 6 months of life via maternal antibodies. Administer during RSV season (Sep-Jan). Record batch, expiry, site, administration time.',
      };
    }
    return {
      vaccineName: 'Abrysvo (Pfizer)',
      indication: 'RSV vaccination for adults 60+',
      route: 'Intramuscular',
      guidance:
        'Single 0.5 mL IM dose. Approved for adults 60+ at increased risk. No booster currently recommended. Record batch, expiry, site, administration time.',
    };
  }

  if (vaccineType === 'mresvia') {
    return {
      vaccineName: 'mRESVIA (Moderna)',
      indication: 'RSV vaccination for adults 60+',
      route: 'Intramuscular',
      guidance:
        'Single 0.5 mL IM dose for adults 60+. Not approved for maternal use. No booster currently recommended. Record batch, expiry, site, administration time.',
    };
  }

  return {
    vaccineName: 'Unknown',
    indication: '',
    route: '',
    guidance: '',
  };
}

export function determineMaternalProtectionPeriod(): string {
  return 'Abrysvo maternal vaccination provides passive protection to newborn for approximately 6 months of life through maternal antibodies. Advise patient to ensure infant is monitored for RSV infection.';
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

export function isCurrentRSVSeason(): boolean {
  const today = new Date();
  const month = today.getMonth();
  // RSV season is Sep-Jan (months 8, 9, 10, 11, 0)
  return month >= 8 || month <= 0;
}
