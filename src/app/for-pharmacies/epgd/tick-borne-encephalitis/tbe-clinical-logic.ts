import type { ClinicalAlert } from '../shared/types';
import type {
  TBEPatientDetails,
  TBEMedicalHistory,
} from './tbe-types';

// ⚠️ DRAFT clinical logic — must be verified/signed off by the named clinician.
// Reference: TicoVac / TicoVac Junior SmPC, Green Book chapter 31 (TBE).

export function getTBEClinicalAlerts(
  patient: TBEPatientDetails,
  medicalHistory: TBEMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisPreviousDose) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_PREVIOUS_DOSE',
      message: 'Anaphylaxis to a previous dose of TBE vaccine',
      detail: 'Absolute contraindication. Do not supply. Refer to GP.',
    });
  }

  if (medicalHistory.hypersensitivityEggOrComponent) {
    alerts.push({
      severity: 'stop',
      code: 'HYPERSENSITIVITY_EGG_COMPONENT',
      message: 'Severe hypersensitivity to egg, or to any vaccine component',
      detail: 'TicoVac is produced on chick embryo cells. Severe egg allergy is a contraindication — refer to GP.',
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

  // Age gate — TicoVac Junior licensed from 1 year; not licensed under 1.
  if (patient.age !== null && patient.age < 1) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_LICENSED_AGE',
      message: 'Under the licensed age for TBE vaccine',
      detail: 'TicoVac Junior is licensed from 1 year of age. Do not supply below 1 year.',
    });
  }

  // Timing — first two doses give short-term protection; ideally start ≥1 month
  // before travel so dose 2 can be given before departure.
  if (!patient.departureDate) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_DATE_MISSING',
      message: 'Departure date not confirmed',
      detail: 'Two doses are needed for reliable short-term protection. Confirm timing so the course can be started early enough.',
    });
  } else {
    const departure = new Date(patient.departureDate);
    const today = new Date();
    const daysUntilTravel = Math.floor((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTravel >= 0 && daysUntilTravel < 14) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 2 weeks until departure',
        detail: `Only ${daysUntilTravel} day(s) until travel. An accelerated schedule (dose 2 at day 14) may be considered — discuss protection/timing with the patient.`,
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

  // Booster interval — first booster 3 years after the 3rd dose, then every 5
  // years (every 3 years if aged 60+). Verify against current SmPC.
  if (patient.previousTBEDose && patient.previousDoseDate) {
    const previousDose = new Date(patient.previousDoseDate);
    const today = new Date();
    const yearsElapsed = (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsElapsed >= 3) {
      alerts.push({
        severity: 'caution',
        code: 'BOOSTER_DUE',
        message: '3 or more years since last TBE dose',
        detail: 'A booster is likely due (first booster 3 years after the primary course; then every 5 years, or every 3 years if aged 60+). Verify schedule.',
      });
    }
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder or on anticoagulant therapy',
      detail: 'Give subcutaneously if IM is contraindicated. Apply firm pressure for ≥2 minutes and advise the patient to report excessive bleeding/bruising.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient immunosuppressed',
      detail: 'Vaccine response may be reduced; consider serology/specialist advice. Advise of potentially reduced protection.',
    });
  }

  return alerts;
}

/**
 * Dose recommendation by age (TicoVac). Verify against SmPC before go-live.
 */
export function getTBEDoseRecommendation(patient: TBEPatientDetails): string {
  if (patient.age === null) return 'Age required to determine schedule';
  if (patient.age < 1) return 'Not licensed below 1 year of age';
  const product = patient.age < 16 ? 'TicoVac Junior (0.25 mL)' : 'TicoVac (0.5 mL)';
  return `${product}: 3-dose IM course — dose 2 at 1–3 months after dose 1, dose 3 at 5–12 months after dose 2. Accelerated: dose 2 at day 14. First booster 3 years later.`;
}

export function getAdministrationGuidance(
  vaccineType: string
): { vaccineName: string; route: string; guidance: string } {
  const guidance: Record<string, { vaccineName: string; route: string; guidance: string }> = {
    ticovac: {
      vaccineName: 'TicoVac (adult, 0.5 mL, ≥16 years)',
      route: 'Intramuscular',
      guidance:
        'Shake well. 0.5 mL IM into the deltoid. Record dose number, batch and expiry. Complete the 3-dose course and advise on the booster schedule.',
    },
    'ticovac-junior': {
      vaccineName: 'TicoVac Junior (1–15 years, 0.25 mL)',
      route: 'Intramuscular',
      guidance:
        'Shake well. 0.25 mL IM into the deltoid (or anterolateral thigh in young children). Record dose number, batch and expiry. Complete the 3-dose course.',
    },
  };
  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
