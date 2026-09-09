import type { ClinicalAlert } from '../shared/types';
import type {
  CholeraPatientDetails,
  CholeraMedicalHistory,
} from './cholera-types';

// ⚠️ DRAFT clinical logic — must be verified/signed off by the named clinician.
// Reference: Dukoral SmPC, Vaxchora SmPC, Green Book chapter 14 (Cholera).

export function getCholeraClinicalAlerts(
  patient: CholeraPatientDetails,
  medicalHistory: CholeraMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisPreviousDose) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_PREVIOUS_DOSE',
      message: 'Anaphylaxis to a previous dose of oral cholera vaccine',
      detail: 'Absolute contraindication. Do not supply. Refer to GP.',
    });
  }

  if (medicalHistory.hypersensitivityComponent) {
    alerts.push({
      severity: 'stop',
      code: 'HYPERSENSITIVITY_COMPONENT',
      message: 'Known hypersensitivity to formaldehyde or any vaccine excipient',
      detail: 'Absolute contraindication for Dukoral. Do not supply. Refer to GP.',
    });
  }

  if (medicalHistory.acuteGastroIllness) {
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_GI_ILLNESS',
      message: 'Acute gastrointestinal illness (vomiting / diarrhoea)',
      detail: 'Defer vaccination until the patient has recovered — oral vaccine absorption may be impaired.',
    });
  }

  if (medicalHistory.acuteFebrileIllness) {
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS',
      message: 'Acute febrile illness',
      detail: 'Defer vaccination until recovery. Advise the patient to return when well.',
    });
  }

  // Age gate — Dukoral licensed from 2 years; not licensed under 2.
  if (patient.age !== null && patient.age < 2) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_LICENSED_AGE',
      message: 'Under the licensed age for oral cholera vaccine',
      detail: 'Dukoral / Vaxchora are not licensed below 2 years of age. Do not supply.',
    });
  }

  // Timing — the primary course must be completed at least ~1 week before travel.
  if (!patient.departureDate) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_DATE_MISSING',
      message: 'Departure date not confirmed',
      detail: 'The primary course should be completed at least 1 week before travel. Confirm timing.',
    });
  } else {
    const departure = new Date(patient.departureDate);
    const today = new Date();
    const daysUntilTravel = Math.floor((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTravel >= 0 && daysUntilTravel < 7) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 1 week until departure',
        detail: `Only ${daysUntilTravel} day(s) until travel. The course may not be complete or protective in time — discuss risk/benefit with the patient.`,
      });
    }
    if (daysUntilTravel < 0) {
      alerts.push({
        severity: 'caution',
        code: 'TRAVEL_DATE_PASSED',
        message: 'Departure date has already passed',
        detail: 'Confirm travel dates. Vaccination may still be appropriate if travel has not yet commenced.',
      });
    }
  }

  // Booster interval — for Dukoral, if >2 years since the last dose the primary
  // course should generally be restarted (verify against current SmPC).
  if (patient.previousCholeraDose && patient.previousDoseDate) {
    const previousDose = new Date(patient.previousDoseDate);
    const today = new Date();
    const yearsElapsed = (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsElapsed >= 2) {
      alerts.push({
        severity: 'caution',
        code: 'PRIMARY_COURSE_RESTART',
        message: 'More than 2 years since last cholera dose',
        detail: 'For adults, a single booster is effective within 2 years; beyond that the primary course should be restarted. Verify schedule.',
      });
    }
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient immunosuppressed',
      detail: 'Vaccine response may be reduced. Advise the patient of potentially reduced protection.',
    });
  }

  return alerts;
}

/**
 * Dose recommendation by age (Dukoral). Verify against SmPC before go-live.
 */
export function getCholeraDoseRecommendation(patient: CholeraPatientDetails): string {
  if (patient.age === null) return 'Age required to determine schedule';
  if (patient.age < 2) return 'Not licensed below 2 years of age';
  if (patient.age < 6) {
    return 'Dukoral: 3 oral doses, each 1–6 weeks apart. Complete ≥1 week before travel.';
  }
  return 'Dukoral: 2 oral doses, 1–6 weeks apart. Complete ≥1 week before travel. (Vaxchora: single oral dose from age 2.)';
}

export function getAdministrationGuidance(
  vaccineType: string
): { vaccineName: string; route: string; guidance: string } {
  const guidance: Record<string, { vaccineName: string; route: string; guidance: string }> = {
    dukoral: {
      vaccineName: 'Dukoral (oral inactivated)',
      route: 'Oral',
      guidance:
        'Dissolve the effervescent bicarbonate granules in ~150 mL cool water, then add the vaccine and drink within 2 hours. No food or drink for 1 hour before and after. Record dose number, batch and expiry.',
    },
    vaxchora: {
      vaccineName: 'Vaxchora (oral, live attenuated)',
      route: 'Oral',
      guidance:
        'Single oral dose reconstituted per SmPC. Avoid food and drink for 60 minutes before and after. Not to be given with systemic antibiotics or within the stated interval. Record batch and expiry.',
    },
  };
  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
