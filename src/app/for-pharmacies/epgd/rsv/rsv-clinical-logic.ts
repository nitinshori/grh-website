// Aligned to the Abrysvo / Arexvy RSV PGD version 005, issued 11 September 2026.
import type { ClinicalAlert } from '../shared/types';
import type { RSVPatientDetails, RSVMedicalHistory } from './rsv-types';

export function getRSVClinicalAlerts(
  patient: RSVPatientDetails,
  medicalHistory: RSVMedicalHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (medicalHistory.anaphylaxisToVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_VACCINE',
      message: 'Severe allergic reaction to a previous RSV vaccine',
      detail: 'Excluded under the PGD. Refer to the GP. Do not supply.',
    });
  }

  if (medicalHistory.anaphylaxisToVaccineComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_COMPONENT',
      message: 'Previous severe allergic reaction to any component of the RSV vaccine',
      detail: 'Excluded under the PGD. Refer to the GP.',
    });
  }

  if (medicalHistory.severeFebrilleIllness) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_FEBRILE_ILLNESS',
      message: 'Acute febrile illness',
      detail: 'Postpone vaccination until recovered. Advise the patient to return when well. Minor illness without fever is not a reason to delay.',
    });
  }

  if (medicalHistory.previousRSVVaccine) {
    alerts.push({
      severity: 'stop',
      code: 'PREVIOUS_RSV_VACCINE',
      message: 'Already received a complete dose of an RSV vaccine',
      detail: 'Excluded under the PGD: one-time vaccination per current guidance. No further dose.',
    });
  }

  // Pregnant women: PGD inclusion is 28 to 36 weeks; Abrysvo should not be used under 28 weeks; after 36 weeks refer to the maternity service
  if (patient.patientCategory === 'pregnant-woman') {
    if (patient.pregnancyWeeks === undefined || patient.pregnancyWeeks === null) {
      alerts.push({
        severity: 'caution',
        code: 'PREGNANCY_WEEKS_MISSING',
        message: 'Gestation not specified',
        detail: 'Abrysvo under this PGD is for pregnant women between 28 and 36 weeks of gestation. Confirm gestational age.',
      });
    } else if (patient.pregnancyWeeks < 28) {
      alerts.push({
        severity: 'stop',
        code: 'UNDER_28_WEEKS',
        message: `Pregnancy at ${patient.pregnancyWeeks} weeks: below the 28 week inclusion`,
        detail: 'Abrysvo should not be used in pregnant individuals less than 28 weeks of gestation. Advise to return from 28 weeks.',
      });
    } else if (patient.pregnancyWeeks > 36) {
      alerts.push({
        severity: 'stop',
        code: 'OVER_36_WEEKS',
        message: `Pregnancy at ${patient.pregnancyWeeks} weeks: beyond the 36 week inclusion`,
        detail: 'This PGD covers 28 to 36 weeks. After 36 weeks refer to the maternity service, where vaccination up to delivery is still recommended.',
      });
    }
  }

  // Adult 60+ eligibility
  if (patient.patientCategory === 'adult-60-plus') {
    if (patient.age !== null && patient.age < 60) {
      alerts.push({
        severity: 'stop',
        code: 'BELOW_AGE_60',
        message: 'Patient is under 60 years',
        detail: 'Both vaccines under this PGD are for adults aged 60 years and over (or, for Abrysvo, pregnant women 28 to 36 weeks). Not eligible.',
      });
    }

    // Tool's own timing note (the document is silent on season for adults); caution only
    if (!patient.atIncreasedrisk && !isCurrentRSVSeason()) {
      alerts.push({
        severity: 'caution',
        code: 'OUTSIDE_SEASON_STANDARD_RISK',
        message: 'Outside RSV season for standard-risk 60+ adults',
        detail:
          'For adults 60+ without increased risk, RSV circulates mainly September to January. Timing note only; the PGD permits vaccination all year.',
      });
    }

    if (medicalHistory.pregnantOrBreastfeeding) {
      alerts.push({
        severity: 'caution',
        code: 'PREGNANT_OR_BREASTFEEDING',
        message: 'Pregnant or breastfeeding',
        detail: 'Arexvy should not be administered to those who are pregnant or breastfeeding; it cannot be selected. Abrysvo may be given where otherwise indicated.',
      });
    }

    if (medicalHistory.fluVaccineSameDay) {
      alerts.push({
        severity: 'caution',
        code: 'FLU_SAME_DAY',
        message: 'Influenza vaccine at the same appointment or on the same day',
        detail:
          'Abrysvo is not routinely scheduled for an older adult on the same day as an influenza vaccine (possible reduced response to both). Give Abrysvo at the same time only if the individual is unlikely to return or immediate protection is necessary. Arexvy may be given concomitantly with inactivated seasonal influenza vaccine at a different injection site.',
      });
    }
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient is immunocompromised',
      detail: 'Advise that they may have a reduced response to the vaccine. The vaccine can still be given.',
    });
  }

  if (medicalHistory.bleedingDisorder) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: 'Coagulation disorder',
      detail:
        'Administer with caution: increased risk of bleeding after intramuscular injection. Use a fine needle (23 or 25 gauge), apply firm pressure without rubbing for at least 2 minutes, and inform the individual about the risk of haematoma. Do NOT give the vaccine subcutaneously.',
    });
  }

  if (!patient.patientCategory) {
    alerts.push({
      severity: 'caution',
      code: 'NO_CATEGORY',
      message: 'Patient category not specified',
      detail: 'Confirm the patient is an adult aged 60 years or over, or a pregnant woman at 28 to 36 weeks of gestation.',
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
        vaccineName: 'Abrysvo powder and solvent for solution for injection',
        indication: 'Maternal RSV vaccination at 28 to 36 weeks of gestation',
        route: 'Intramuscular, preferably in the deltoid muscle',
        guidance:
          'Single 0.5 mL intramuscular dose, preferably in the deltoid. Reconstitute per the SmPC; administer immediately after reconstitution or within 4 hours if stored between 15 and 30 degrees C. Protects the infant via placental antibody transfer. Can be co-administered with influenza and COVID-19 vaccines; if a pertussis-containing vaccine has not yet been given, both can and should be given at the same appointment. Babies born to women who have had Abrysvo can be safely breastfed. Record batch, expiry, site and time.',
      };
    }
    return {
      vaccineName: 'Abrysvo powder and solvent for solution for injection',
      indication: 'RSV vaccination for adults aged 60 years and over',
      route: 'Intramuscular, preferably in the deltoid muscle',
      guidance:
        'Single 0.5 mL intramuscular dose, preferably in the deltoid. Reconstitute per the SmPC; administer immediately after reconstitution or within 4 hours if stored between 15 and 30 degrees C. One-time vaccination per current guidance. Not routinely given on the same day as influenza vaccine in older adults. Be attentive to signs of Guillain-Barre syndrome, reported rarely after Abrysvo in those 60 and over. Record batch, expiry, site and time.',
    };
  }

  if (vaccineType === 'arexvy') {
    return {
      vaccineName: 'Arexvy powder and suspension for suspension for injection',
      indication: 'RSV vaccination for adults aged 60 years and over',
      route: 'Intramuscular, preferably in the deltoid muscle',
      guidance:
        'Single 0.5 mL intramuscular dose, preferably in the deltoid. Do NOT administer intravascularly or intradermally; no data on subcutaneous use. After reconstitution use within 4 hours at 2 to 8 degrees C or at room temperature up to 25 degrees C. Not for those who are pregnant or breastfeeding. May be given concomitantly with COVID-19, pneumococcal conjugate, herpes zoster and inactivated influenza vaccines at different injection sites. Be attentive to signs of Guillain-Barre syndrome, reported rarely after Arexvy. Record batch, expiry, site and time.',
    };
  }

  return {
    vaccineName: 'Unknown',
    indication: '',
    route: '',
    guidance: '',
  };
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
