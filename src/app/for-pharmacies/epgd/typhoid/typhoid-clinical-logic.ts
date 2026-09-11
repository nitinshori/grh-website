import type { ClinicalAlert } from '../shared/types';
import type {
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';

/** Typhoid (Vi Polysaccharide Vaccine) PGD v005, issued 11 September 2026. */
export const TYPHOID_PGD_VERSION = 'Typhoid (Vi Polysaccharide Vaccine) PGD v005, issued 11 September 2026';

export interface TyphoidMedicalHistory {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
  feverAfterTravel: boolean;
  pregnantOrBreastfeeding: boolean;
  pregnancyDecision: string;
  bleedingDisorder: boolean;
  immunosuppressed: boolean;
}

/** Parse a yyyy-mm-dd string as local midnight (never UTC). */
export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** yyyy-mm-dd from local date parts (toISOString shifts a day between
 *  midnight and 01:00 BST). */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Calendar days from today to the departure date, local midnight to local
 *  midnight, so a departure exactly 14 days away is 14, not 13. */
export function daysUntilDeparture(departureDate: string): number | null {
  const departure = parseLocalDate(departureDate);
  if (!departure) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** True when the expiry date (yyyy-mm-dd) is before today. */
export function isExpired(expiryDate: string): boolean {
  const d = daysUntilDeparture(expiryDate);
  return d !== null && d < 0;
}

/** The document's exception to the 3 year exclusion is for a previous dose
 *  that is "due for renewal". A dose is treated as due for renewal only in
 *  the last 6 months of its 3 year validity; earlier than that the exclusion
 *  stands and the route is exclusion and referral. */
export const RENEWAL_WINDOW_YEARS = 2.5;

export function yearsSincePreviousDose(previousDoseDate?: string): number | null {
  if (!previousDoseDate) return null;
  const previousDose = new Date(previousDoseDate);
  if (Number.isNaN(previousDose.getTime())) return null;
  const today = new Date();
  return (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/** Booster every 3 years: the date the next booster is due, ISO yyyy-mm-dd. */
export function nextBoosterDueDate(from: Date = new Date()): string {
  const d = new Date(from.getFullYear() + 3, from.getMonth(), from.getDate());
  return formatLocalDate(d);
}

export function getTyphoidClinicalAlerts(
  patient: TyphoidPatientDetails,
  medicalHistory: TyphoidMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (patient.age !== null && patient.age < 2) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_2',
      message: 'Under 2 years of age',
      detail:
        'Excluded. The Vi polysaccharide vaccine produces a poor response below 2 years. Refer to a travel clinic or the GP.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Confirmed anaphylaxis to a previous dose of typhoid vaccine',
      detail:
        'Excluded. Refer, do not vaccinate.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Confirmed anaphylaxis to any component of the product held',
      detail:
        'Excluded. Refer, do not vaccinate.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Acute severe febrile illness',
      detail:
        'Postpone until recovered. A minor illness without fever is not a reason to defer. Advise the patient to return when well.',
    });
  }

  if (medicalHistory.feverAfterTravel) {
    alerts.push({
      severity: 'stop',
      code: 'FEVER_AFTER_TRAVEL',
      message: 'Fever following recent travel to a typhoid risk area',
      detail:
        'Typhoid is a notifiable illness and a febrile returning traveller needs urgent same-day assessment, not vaccination. Refer and say plainly that typhoid must be excluded.',
    });
  }

  const days = daysUntilDeparture(patient.departureDate);
  if (days === null) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_DATE_MISSING',
      message: 'Departure date not confirmed',
      detail:
        'The vaccine should be given at least 2 weeks before departure so that protection can develop. Confirm timing.',
    });
  } else {
    if (days < 14 && days >= 0) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 2 weeks until departure',
        detail: `Only ${days} days until travel. Vaccination may still be given, but the traveller must be told that protection may be incomplete, and that must be recorded. Reinforce food and water precautions.`,
      });
    }

    if (days < 0) {
      alerts.push({
        severity: 'caution',
        code: 'TRAVEL_DATE_PASSED',
        message: 'Departure date has already passed',
        detail: 'Confirm travel dates. Vaccination may still be appropriate if travel has not yet commenced.',
      });
    }
  }

  if (patient.previousTyphoidDose) {
    const yearsElapsed = yearsSincePreviousDose(patient.previousDoseDate);
    if (yearsElapsed === null) {
      alerts.push({
        severity: 'caution',
        code: 'PREVIOUS_DOSE_DATE_UNKNOWN',
        message: 'Previous typhoid dose date not recorded',
        detail:
          'Record the date of the previous dose where known. A dose of typhoid Vi vaccine within the last 3 years excludes unless the traveller is returning to a risk area and the previous dose is due for renewal.',
      });
    } else if (yearsElapsed >= 3) {
      alerts.push({
        severity: 'caution',
        code: 'REVACCINATION_DUE',
        message: '3 years or more since the previous typhoid dose',
        detail:
          'A booster dose every 3 years for those with continued or repeated exposure. A booster is due; record the date the next booster is due.',
      });
    } else if (yearsElapsed < RENEWAL_WINDOW_YEARS) {
      // Not due for renewal: the document's exception cannot apply.
      alerts.push({
        severity: 'stop',
        code: 'RECENT_DOSE',
        message: 'Typhoid Vi vaccine given within the last 3 years and not yet due for renewal',
        detail:
          `Excluded. The previous dose was ${yearsElapsed.toFixed(1)} years ago; protection should still be in place and additional doses do not boost levels further. The document's exception applies only where the previous dose is due for renewal (within 6 months of its 3 year renewal date). Record the advice given and the decision, and refer.`,
      });
    } else if (patient.previousDoseRenewalReason.trim()) {
      alerts.push({
        severity: 'caution',
        code: 'RECENT_DOSE_RENEWAL',
        message: 'Previous dose within 6 months of its 3 year renewal date: document exception applied',
        detail:
          `Recorded reason: ${patient.previousDoseRenewalReason.trim()}. Returning to a risk area and the previous dose is due for renewal.`,
      });
    } else {
      alerts.push({
        severity: 'stop',
        code: 'RECENT_DOSE',
        message: 'Typhoid Vi vaccine given within the last 3 years',
        detail:
          'Excluded, unless the traveller is returning to a risk area and the previous dose is due for renewal (it is within 6 months of its renewal date: record the reason). Otherwise record the advice given and refer.',
      });
    }
  }

  if (medicalHistory.pregnantOrBreastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_BREASTFEEDING',
      message: 'Pregnancy or breastfeeding',
      detail:
        'This is an inactivated polysaccharide vaccine and may be given where the risk of typhoid is significant and travel is unavoidable. Discuss and record the decision.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder or anticoagulation',
      detail:
        'Use a fine needle (23 gauge or finer) and apply firm pressure without rubbing for at least 2 minutes. Advise the patient to report excessive bleeding or haematoma.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Immunosuppression',
      detail:
        'The vaccine may be given but the response may be reduced. Advise that protection may be lower and that food and water hygiene matters more, not less.',
    });
  }

  return alerts;
}

export function getAdministrationGuidance(
  vaccineType: string
): {
  vaccineName: string;
  route: string;
  site: string;
  guidance: string;
} {
  const shared =
    'Single 0.5 mL dose containing 25 micrograms of Vi polysaccharide, solution for injection in a pre-filled syringe. Intramuscular injection into the deltoid (adults and children aged 2 and over); do not give intravascularly. Give at least 2 weeks before departure. Efficacy is roughly 70 to 80% and the vaccine does not protect against paratyphoid A or B, so food and water hygiene advice must be given and recorded in every case. Booster every 3 years for continued or repeated exposure; record the date the next booster is due. One dose per patient per attendance; no supply for administration elsewhere. May be given at the same time as other travel vaccines in a separate limb where possible, or at least 2.5 cm apart; record the site of each. Vaccinate seated and observe for 15 minutes.';
  const guidance: Record<
    string,
    { vaccineName: string; route: string; site: string; guidance: string }
  > = {
    'typhim-vi': {
      vaccineName: 'Typhim Vi (Sanofi), typhoid Vi polysaccharide vaccine 25 micrograms in 0.5 mL',
      route: 'Intramuscular',
      site: 'Deltoid muscle',
      guidance: shared,
    },
    'other-vi': {
      vaccineName: 'Equivalent Vi polysaccharide typhoid vaccine, 25 micrograms in 0.5 mL (record the brand)',
      route: 'Intramuscular',
      site: 'Deltoid muscle',
      guidance: shared,
    },
  };

  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', site: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
