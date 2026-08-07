import type { ClinicalAlert } from '../shared/types';
import type {
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';

export function getTyphoidClinicalAlerts(
  patient: TyphoidPatientDetails,
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    bleedingDisorder: boolean;
    immunosuppressed: boolean;
  }
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Anaphylaxis to previous Typhoid dose',
      detail:
        'Absolute contraindication. Patient must be referred to GP. Do not supply.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Anaphylaxis to vaccine component',
      detail:
        'Absolute contraindication due to allergy to polysorbate 80 or other component. Refer to GP.',
    });
  }

  if (medicalHistory.severeFebrilleIllness && patient.age !== null && patient.age >= 18) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Severe acute febrile illness',
      detail:
        'Absolute contraindication. Defer vaccination until recovery. Advise patient to return when well.',
    });
  }

  if (!patient.departureDate) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_DATE_MISSING',
      message: 'Departure date not confirmed',
      detail:
        'Typhoid must be given at least 10 days before travel to high-risk areas and within 3 years for Saudi entry. Confirm timing.',
    });
  } else {
    const departure = new Date(patient.departureDate);
    const today = new Date();
    const daysUntilTravel = Math.floor((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTravel < 14 && daysUntilTravel >= 0) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 2 weeks until departure',
        detail: `Only ${daysUntilTravel} days until travel. The signed PGD requires vaccination at least 2 weeks before departure for protection to develop. Discuss the risk and benefit with the patient, and reinforce food and water precautions.`,
      });
    }

    if (daysUntilTravel < 0) {
      alerts.push({
        severity: 'caution',
        code: 'TRAVEL_DATE_PASSED',
        message: 'Departure date has already passed',
        detail: 'Confirm travel dates. Vaccination may still be appropriate if travel not yet commenced.',
      });
    }
  }

  if (patient.previousTyphoidDose && patient.previousDoseDate) {
    const previousDose = new Date(patient.previousDoseDate);
    const today = new Date();
    const yearsElapsed = (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsElapsed >= 3) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_DUE',
        message: '3 years or more since previous typhoid dose',
        detail:
          'The signed PGD recommends revaccination every 3 years where exposure continues. A booster dose is due.',
      });
    } else {
      alerts.push({
        severity: 'caution',
        code: 'RECENT_DOSE',
        message: 'Typhoid vaccine given within the last 3 years',
        detail:
          'Protection from the previous dose should still be in place. Revaccination is recommended every 3 years, so a further dose is not usually needed yet.',
      });
    }
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder noted',
      detail:
        'Use subcutaneous injection instead of IM. Maintain pressure at injection site for ≥5 minutes. Advise patient to report excessive bleeding.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient immunosuppressed',
      detail:
        'Vaccine response may be reduced. Consider timing relative to immunosuppressive therapy. Advise patient of potentially reduced protection.',
    });
  }

  return alerts;
}

export function getTyphoidDoseRecommendation(
  patient: TyphoidPatientDetails
): string {
  if (patient.age === null) return 'Age required to determine dose';

  // Per the signed PGD: Typhim Vi, adults 18 years and over.
  if (patient.age < 18) {
    return 'Not eligible under this PGD: adults aged 18 years and over only. Refer for age-appropriate provision.';
  }

  return 'Typhim Vi: 0.5 mL (25 micrograms Vi polysaccharide) by intramuscular injection, single dose. Revaccinate every 3 years if risk continues.';
}

export function determineTravelRiskCategory(
  travelReason: string
): { category: string; highRisk: boolean } {
  // Risk areas per the signed PGD: South Asia, Southeast Asia, Africa and
  // Central/South America. South Asia carries the highest risk.
  if (travelReason === 'south-asia') {
    return { category: 'South Asia (highest risk)', highRisk: true };
  }
  if (travelReason === 'southeast-asia') {
    return { category: 'Southeast Asia', highRisk: true };
  }
  if (travelReason === 'africa') {
    return { category: 'Africa', highRisk: true };
  }
  if (travelReason === 'central-south-america') {
    return { category: 'Central or South America', highRisk: true };
  }
  return { category: 'Other travel', highRisk: false };
}

export function getAdministrationGuidance(
  vaccineType: string
): {
  vaccineName: string;
  route: string;
  site: string;
  guidance: string;
} {
  const guidance: Record<
    string,
    { vaccineName: string; route: string; site: string; guidance: string }
  > = {
    'typhim-vi': {
      vaccineName: 'Typhim Vi (Sanofi)',
      route: 'Intramuscular',
      site: 'Deltoid muscle',
      guidance:
        'Single 0.5 mL dose containing 25 micrograms of Vi polysaccharide. Give at least 2 weeks before departure. Protection is 70 to 80% and does not cover paratyphoid A or B, so food and water precautions remain essential. Revaccinate every 3 years if risk continues. Record batch, expiry and site on the patient record.',
    },
  };

  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', site: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
