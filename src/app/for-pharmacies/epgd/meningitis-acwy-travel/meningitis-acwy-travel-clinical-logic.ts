import type { ClinicalAlert } from '../shared/types';
import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
} from './meningitis-acwy-travel-types';

export function getMeningitisACWYClinicalAlerts(
  patient: MeningitisACWYPatientDetails,
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
      message: 'Anaphylaxis to previous MenACWY dose',
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
        'MenACWY must be given at least 10 days before travel to high-risk areas and within 3 years for Saudi entry. Confirm timing.',
    });
  } else {
    const departure = new Date(patient.departureDate);
    const today = new Date();
    const daysUntilTravel = Math.floor((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTravel < 10 && daysUntilTravel >= 0) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 10 days until departure',
        detail: `Only ${daysUntilTravel} days until travel. MenACWY should ideally be given ≥10 days before departure. Discuss risk/benefit with patient.`,
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

  if (patient.previousMenACWYDose && patient.previousDoseDate) {
    const previousDose = new Date(patient.previousDoseDate);
    const today = new Date();
    const yearsElapsed = (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsElapsed >= 5) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_DUE',
        message: '5 years or more since previous MenACWY dose',
        detail:
          'For Saudi entry and Hajj/Umrah, revaccination is required if >3 years have elapsed. Consider booster for continued protection.',
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

export function getMeningitisACWYDoseRecommendation(
  patient: MeningitisACWYPatientDetails
): string {
  if (patient.age === null) return 'Age required to determine dose';

  if (patient.age < 0.5) {
    return 'Nimenrix: Not approved below 6 weeks';
  }

  if (patient.age < 2) {
    return 'Nimenrix: 0.5 mL IM single dose (conjugate vaccine approved from 6 weeks)';
  }

  return 'Either vaccine: 0.5 mL IM single dose (Nimenrix or Menveo approved from 2 years and above)';
}

export function determineTravelRiskCategory(
  travelReason: string
): { category: string; highRisk: boolean } {
  const hajiRiskReasons = ['hajj-umrah'];
  const beltRiskReasons = ['meningitis-belt'];
  const universityReasons = ['university'];

  if (hajiRiskReasons.includes(travelReason)) {
    return { category: 'Hajj/Umrah Pilgrim (MANDATORY)', highRisk: true };
  }
  if (beltRiskReasons.includes(travelReason)) {
    return { category: 'Sub-Saharan Meningitis Belt', highRisk: true };
  }
  if (universityReasons.includes(travelReason)) {
    return { category: 'University Attendee', highRisk: false };
  }
  return { category: 'Other Travel', highRisk: false };
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
    nimenrix: {
      vaccineName: 'Nimenrix (GSK)',
      route: 'Intramuscular',
      site: 'Deltoid muscle (preferred), anterolateral thigh (infants)',
      guidance:
        'Single 0.5 mL dose. Reconstitute with provided diluent. Use within 1 hour. Mark batch, expiry, site on patient record.',
    },
    menveo: {
      vaccineName: 'Menveo (Sanofi)',
      route: 'Intramuscular',
      site: 'Deltoid muscle (adults/older children), anterolateral thigh (young children)',
      guidance:
        'Single 0.5 mL dose. Do not mix with other vaccines in same syringe. Use within 1 hour of reconstitution. Record all administration details.',
    },
  };

  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', site: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
