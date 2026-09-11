import type { ClinicalAlert } from '../shared/types';
import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYMedicalHistory,
} from './meningitis-acwy-travel-types';

/** PGD strapline shown wherever the tool cites its authority. */
export const MENACWY_PGD_VERSION = 'Meningococcal ACWY (Travel and Hajj/Umrah) PGD v007, issued 11 September 2026';

/** Whole months between the date of birth and today. Null when missing or invalid. */
export function calculateAgeInMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months--;
  return months;
}

/** Whole days between the date of birth and today. Null when missing or invalid. */
export function calculateAgeInDays(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

/** Whole calendar days from today to an ISO date (negative when past). Null when blank or invalid. */
export function daysFromToday(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}

/** Whole days since a previous dose. Null when blank or invalid. */
export function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = daysFromToday(iso);
  return d === null ? null : -d;
}

/** Whole months between the date of birth and another ISO date. Null when either is missing or invalid. */
export function ageInMonthsAt(dob: string, iso: string | undefined): number | null {
  if (!dob || !iso) return null;
  const birth = new Date(dob);
  const at = new Date(iso);
  if (isNaN(birth.getTime()) || isNaN(at.getTime())) return null;
  let months = (at.getFullYear() - birth.getFullYear()) * 12 + (at.getMonth() - birth.getMonth());
  if (at.getDate() < birth.getDate()) months--;
  return months;
}

/** True where the travel is to Saudi Arabia, the only destination for which the PGD authorises a repeat dose. */
export function isSaudiTravel(patient: MeningitisACWYPatientDetails): boolean {
  return patient.travelReason === 'hajj-umrah' || /saudi/i.test(patient.travelDestination);
}

/**
 * An infant who had a Nimenrix dose before 12 months of age and is now 12 to
 * 23 months is completing the licensed course (booster at 12 months of age,
 * at least 2 months after the primary dose), not repeating one. The 5 year
 * repeat rule does not apply.
 */
export function isInfantBoosterCandidate(patient: MeningitisACWYPatientDetails): boolean {
  const ageMonths = calculateAgeInMonths(patient.dateOfBirth);
  const ageAtPrevious = ageInMonthsAt(patient.dateOfBirth, patient.previousDoseDate);
  return (
    patient.previousMenACWYDose &&
    ageMonths !== null &&
    ageMonths >= 12 &&
    ageMonths < 24 &&
    ageAtPrevious !== null &&
    ageAtPrevious < 12
  );
}

export function getMeningitisACWYClinicalAlerts(
  patient: MeningitisACWYPatientDetails,
  medicalHistory: MeningitisACWYMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const ageMonths = calculateAgeInMonths(patient.dateOfBirth);

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Confirmed anaphylactic reaction to a previous dose of the same vaccine',
      detail: 'Exclusion. Refer, do not vaccinate.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Confirmed anaphylactic reaction to any excipient or manufacturing residue',
      detail: 'Exclusion. Refer, do not vaccinate.',
    });
  }

  if (medicalHistory.diphtheriaToxoidHypersensitivity) {
    alerts.push({
      severity: 'caution',
      code: 'DIPHTHERIA_TOXOID_HYPERSENSITIVITY',
      message: 'Hypersensitivity to diphtheria toxoid or CRM197: Menveo excluded',
      detail:
        'Menveo is conjugated to CRM197 and must not be used. Nimenrix and MenQuadfi are conjugated to tetanus toxoid instead; the administration step will refuse Menveo.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Acute severe febrile illness',
      detail:
        'Postpone until recovered. A minor illness without fever is not a reason to defer. Arrange to vaccinate after recovery and, if travel is imminent, say plainly that protection may not be achieved in time.',
    });
  }

  if (medicalHistory.outbreakOrContact) {
    alerts.push({
      severity: 'stop',
      code: 'OUTBREAK_OR_CONTACT',
      message: 'Outbreak or contact management',
      detail:
        'Directed by the local UKHSA Health Protection Team and outside a private travel PGD. Refer to the GP or the Health Protection Team.',
    });
  }

  if (!patient.departureDate) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_DATE_MISSING',
      message: 'Departure date not confirmed',
      detail:
        'For Hajj or Umrah the dose must be given at least 10 days before arrival in Saudi Arabia. Confirm timing.',
    });
  } else {
    // Calendar days, so a departure exactly 10 days ahead is 10, not 9.x
    // floored to 9 (which used to alarm the pharmacist a day early).
    const daysUntilTravel = daysFromToday(patient.departureDate) ?? 0;

    if (daysUntilTravel < 10 && daysUntilTravel >= 0) {
      alerts.push({
        severity: 'caution',
        code: 'INSUFFICIENT_TIME_BEFORE_TRAVEL',
        message: 'Less than 10 days until departure',
        detail: `Only ${daysUntilTravel} days until travel. For Hajj or Umrah the dose must be given at least 10 days before arrival in Saudi Arabia; the certificate will not be accepted otherwise. Discuss with the patient.`,
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

  // Repeat doses: routine boosters are not recommended for most travellers. A repeat is
  // authorised only where the previous dose was more than 5 years ago AND a valid
  // certificate is required for travel to Saudi Arabia. An infant under 12 months with
  // a previous dose is completing a course, not repeating one, and so is a 12 to 23
  // month old whose primary dose was given under 12 months (booster at 12 months).
  if (patient.previousMenACWYDose && (ageMonths === null || ageMonths >= 12) && !isInfantBoosterCandidate(patient)) {
    if (!patient.previousDoseDate) {
      alerts.push({
        severity: 'stop',
        code: 'PREVIOUS_DOSE_DATE_MISSING',
        message: 'Previous MenACWY dose: date not recorded',
        detail: 'Record the date of the previous dose. A repeat is authorised only where it was more than 5 years ago and a valid certificate is required for travel to Saudi Arabia.',
      });
    } else {
      const previousDose = new Date(patient.previousDoseDate);
      const today = new Date();
      const yearsElapsed = (today.getTime() - previousDose.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (yearsElapsed < 5) {
        alerts.push({
          severity: 'stop',
          code: 'REPEAT_NOT_AUTHORISED',
          message: 'Previous dose within the last 5 years',
          detail:
            'Routine boosters are not recommended for most travellers, and a repeat is authorised under this PGD only where the previous dose was more than 5 years ago and a valid certificate is required. A conjugate vaccine given within the last 5 years is accepted for Hajj and Umrah. JCVI has not determined boosters for at-risk groups; do not invent an interval, assess individually and refer where there is doubt.',
        });
      } else if (!isSaudiTravel(patient)) {
        alerts.push({
          severity: 'stop',
          code: 'REPEAT_NOT_AUTHORISED_DESTINATION',
          message: 'Previous dose more than 5 years ago, but no Saudi certificate is required',
          detail:
            'A repeat dose is authorised under this PGD only where a valid certificate is required for travel to Saudi Arabia. Routine boosters are not recommended for other travellers, and JCVI has not determined boosters for at-risk groups. Do not vaccinate under this PGD; refer where there is doubt.',
        });
      } else {
        alerts.push({
          severity: 'caution',
          code: 'REPEAT_FOR_CERTIFICATE',
          message: 'Previous dose more than 5 years ago: repeat for Saudi certificate',
          detail:
            'A repeat dose is authorised under this PGD because a valid certificate is required for travel to Saudi Arabia (a conjugate vaccine is accepted within the last 5 years). Select "Repeat for certificate" as the dose number and record the reason for the repeat.',
        });
      }
    }
  }

  if (medicalHistory.pregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY',
      message: 'Patient is pregnant',
      detail:
        'The Green Book position is that meningococcal vaccines may be given in pregnancy when clinically indicated, and there is no evidence of harm from inadvertent vaccination.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Bleeding disorder or anticoagulation',
      detail:
        'Give intramuscularly using a fine needle (23 gauge or finer) and apply firm pressure without rubbing for at least 2 minutes. Do not give subcutaneously.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Immunosuppression, including HIV regardless of CD4 count',
      detail:
        'Vaccinate in accordance with the routine schedule, but the individual may not make a full antibody response. Advise the patient of potentially reduced protection.',
    });
  }

  if (medicalHistory.nhsEligibleRiskGroup) {
    alerts.push({
      severity: 'caution',
      code: 'NHS_FUNDED_RISK_GROUP',
      message: 'Asplenia, complement deficiency or due to start a complement inhibitor',
      detail:
        'May be eligible for NHS-funded vaccination. Check before charging privately. Boosters in these groups have not been determined by JCVI; assess individually and refer where there is doubt.',
    });
  }

  return alerts;
}

/** Product schedule per the PGD, by age. */
export function getMeningitisACWYDoseRecommendation(
  patient: MeningitisACWYPatientDetails
): string {
  const ageDays = calculateAgeInDays(patient.dateOfBirth);
  const ageMonths = calculateAgeInMonths(patient.dateOfBirth);
  if (ageDays === null || ageMonths === null) return 'Age required to determine dose';

  if (ageDays < 42) {
    return 'Below 6 weeks: no MenACWY product is licensed. Do not vaccinate under this PGD.';
  }

  if (ageMonths < 6) {
    return 'Nimenrix only (6 weeks to under 6 months): two 0.5 mL doses at least 2 months apart, with a booster at 12 months of age if the primary course was completed before 12 months.';
  }

  if (ageMonths < 12) {
    return 'Nimenrix only (6 to 11 months): a single 0.5 mL dose, with a booster at 12 months of age at least 2 months after it.';
  }

  if (ageMonths < 24) {
    return 'Nimenrix or MenQuadfi (12 months to under 2 years): a single 0.5 mL dose. Menveo is not licensed below 2 years.';
  }

  return 'Nimenrix, MenQuadfi or Menveo (2 years and over, including adults): a single 0.5 mL dose.';
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
      vaccineName: 'Nimenrix (Pfizer), powder and solvent for solution for injection, licensed from 6 weeks',
      route: 'Intramuscular',
      site: 'Anterolateral thigh in infants under 1 year; deltoid from 1 year of age and in adults',
      guidance:
        '0.5 mL intramuscular. Reconstitute immediately before use and draw up the entire 0.5 mL; in-use stability after reconstitution is 8 hours but delay is not recommended. 6 weeks to under 6 months: two doses at least 2 months apart, booster at 12 months of age if the course was completed before 12 months. 6 to 11 months: a single dose, booster at 12 months of age at least 2 months after it. From 12 months: a single dose. Do not give intravascularly, subcutaneously or intradermally. Record batch, expiry, site, dose number and next due date.',
    },
    menquadfi: {
      vaccineName: 'MenQuadfi (Sanofi), 0.5 mL solution for injection, single-dose vial or syringe, licensed from 12 months',
      route: 'Intramuscular',
      site: 'Deltoid from 1 year of age and in adults',
      guidance:
        '0.5 mL intramuscular, single dose. No reconstitution. Do not give intravascularly, subcutaneously or intradermally. Record batch, expiry and site.',
    },
    menveo: {
      vaccineName: 'Menveo (GSK), powder and solvent for solution for injection, licensed from 2 years',
      route: 'Intramuscular',
      site: 'Deltoid',
      guidance:
        '0.5 mL intramuscular, single dose. Reconstitute immediately before use and draw up the entire 0.5 mL; in-use stability after reconstitution is 8 hours but delay is not recommended. Conjugated to CRM197 (diphtheria toxoid): excluded in hypersensitivity to diphtheria toxoid or CRM197. Do not give intravascularly, subcutaneously or intradermally. Record batch, expiry and site.',
    },
  };

  return guidance[vaccineType] || { vaccineName: 'Unknown', route: '', site: '', guidance: '' };
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
