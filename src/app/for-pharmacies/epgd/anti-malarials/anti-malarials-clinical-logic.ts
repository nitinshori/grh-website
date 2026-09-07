// ─── Anti-malarials Clinical Logic ───

import type { ClinicalAlert, AlertSeverity } from '../shared/types';
import type {
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMPatientDetails,
} from './anti-malarials-types';

// ─── Calculate trip duration ───

export function calculateTripDuration(
  departureDate: string,
  returnDate: string
): number | null {
  if (!departureDate || !returnDate) return null;

  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);

  if (isNaN(departure.getTime()) || isNaN(returnD.getTime())) return null;
  if (returnD <= departure) return null;

  const diffMs = returnD.getTime() - departure.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

// ─── Generate clinical alerts ───

export function generateAMAlerts(
  patient: AMPatientDetails,
  travel: AMTravelAssessment,
  medical: AMMedicalHistory,
  medications: AMMedications
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── Paediatric hard stop ─────────────────────────────────────
  //
  // This tool cannot dose a child. It collects no body weight at any
  // step, and for atovaquone/proguanil weight determines both the dose
  // AND the product strength: 11-20kg is ONE paediatric 62.5/25mg
  // tablet, and the adult 250/100mg tablet is for over 40kg only.
  //
  // Until weight capture and banding are built, anyone under 18 is
  // referred rather than dosed from an adult recommendation. v001 of
  // this tool returned a flat "Atovaquone/Proguanil (Malarone)
  // 250/100mg, 1 tablet daily" for every patient, which in an 11kg
  // child is four times the intended atovaquone dose. That is why the
  // service was withdrawn on 7 Sep 2026.
  //
  // The PGD itself (v002) does cover children, with full weight bands.
  // A pharmacist can therefore still supply for a child by working from
  // the document; what they cannot do is have this tool tell them the
  // dose. Remove this stop only when the tool captures weight and
  // implements Appendix 1 of the PGD.
  if (patient.age !== null && patient.age < 18) {
    alerts.push({
      severity: 'stop',
      code: 'PAEDIATRIC_NOT_SUPPORTED_BY_TOOL',
      message: 'This tool cannot calculate a paediatric dose',
      detail:
        'Malaria chemoprophylaxis in anyone under 18 is dosed by body weight, and this tool does not capture weight. ' +
        'Do not use the recommendation below for a child. Work from the weight bands in Appendix 1 of the Malaria ' +
        'Chemoprophylaxis PGD (v002), which give one paediatric 62.5mg/25mg tablet for 11-20kg, two for 21-30kg, ' +
        'three for 31-40kg, and one adult tablet only above 40kg. Weigh the child; do not estimate from age.',
    })
  }

  // ─── Pregnancy checks ───

  if (travel.currentlyPregnant) {
    alerts.push({
      severity: 'stop',
      code: 'PREGNANT_CONTRAINDICATED',
      message: 'Patient is currently pregnant',
      detail:
        'Antimalarial prophylaxis during pregnancy requires specialist guidance. Refer to GP/midwife.',
    });
  }

  if (travel.planningPregnancy) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_PLANNING',
      message: 'Patient is planning to become pregnant',
      detail:
        'Some antimalarials may need to be avoided or continued after conception. Discuss timing with patient.',
    });
  }

  if (travel.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING',
      message: 'Patient is currently breastfeeding',
      detail:
        'Check compatibility of chosen antimalarial with breastfeeding. Some are contraindicated.',
    });
  }

  // ─── Malarone-specific contraindications ───

  if (medical.severeRenalImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'MALARONE_RENAL_CI',
      message: 'Atovaquone/Proguanil (Malarone) is contraindicated',
      detail:
        'Patient has severe renal impairment (eGFR <30). Malarone is contraindicated. Consider alternative.',
    });
  }

  // ─── Doxycycline-specific contraindications ───

  if (travel.currentlyPregnant && !medical.severeRenalImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'DOXY_PREGNANCY_CI',
      message: 'Doxycycline is contraindicated in pregnancy',
      detail:
        'Doxycycline can affect fetal bone/tooth development. Contraindicated in all trimesters.',
    });
  }

  if (medical.photosensitivity) {
    alerts.push({
      severity: 'caution',
      code: 'DOXY_PHOTOSENSITIVITY',
      message: 'Doxycycline may cause photosensitivity',
      detail:
        'Patient reports photosensitivity history. Advise strict sun protection if using doxycycline.',
    });
  }

  // ─── Mefloquine-specific contraindications ───

  if (medical.epilepsy) {
    alerts.push({
      severity: 'stop',
      code: 'MEFLOQUINE_EPILEPSY_CI',
      message: 'Mefloquine is contraindicated in epilepsy',
      detail:
        'Mefloquine can lower seizure threshold and worsen seizure control. Do not use.',
    });
  }

  if (medical.psychiatricHistory) {
    alerts.push({
      severity: 'stop',
      code: 'MEFLOQUINE_PSYCH_CI',
      message: 'Mefloquine is contraindicated with psychiatric history',
      detail:
        'Mefloquine is associated with neuropsychiatric adverse effects. Contraindicated if previous psychiatric illness.',
    });
  }

  if (medical.qTprolongation) {
    alerts.push({
      severity: 'stop',
      code: 'MEFLOQUINE_QT_CI',
      message: 'Mefloquine is contraindicated with QT prolongation',
      detail:
        'Mefloquine can prolong QT interval. Do not use if patient has history of QT prolongation.',
    });
  }

  if (medical.arrhythmia) {
    alerts.push({
      severity: 'caution',
      code: 'MEFLOQUINE_ARRHYTHMIA',
      message: 'Caution: Mefloquine and cardiac arrhythmia',
      detail:
        'Mefloquine can affect heart rhythm. Use with caution; monitor patient. Consider alternative if possible.',
    });
  }

  // ─── Drug interactions ───

  if (medications.takesWarfarin) {
    alerts.push({
      severity: 'caution',
      code: 'WARFARIN_INTERACTION',
      message: 'Antimalarials may interact with warfarin',
      detail:
        'Some antimalarials can affect warfarin metabolism. Monitor INR closely. Advise patient to inform anticoagulation clinic.',
    });
  }

  if (medications.takesOralContraception) {
    alerts.push({
      severity: 'caution',
      code: 'DOXY_OCP_INTERACTION',
      message: 'Doxycycline may reduce oral contraceptive efficacy',
      detail:
        'If choosing doxycycline, advise patient to use backup contraception (condoms) during and for 7 days after treatment.',
    });
  }

  if (medications.takesAntacids) {
    alerts.push({
      severity: 'caution',
      code: 'ANTACID_INTERACTION',
      message: 'Antacids may reduce antimalarial absorption',
      detail:
        'If patient takes antacids, space them apart from antimalarials. Advise timing to pharmacy.',
    });
  }

  // ─── G6PD deficiency ───

  if (medical.g6pdDeficiency) {
    alerts.push({
      severity: 'red-flag',
      code: 'G6PD_DEFICIENCY',
      message: 'Patient has G6PD deficiency',
      detail:
        'G6PD deficiency may affect choice of antimalarial. Consider testing severity and ethnicity-specific risk. Refer to specialist if unsure.',
    });
  }

  return alerts;
}

// ─── Determine contraindications by medicine ───

export function identifyMedicineContraindications(
  medical: AMMedicalHistory,
  medications: AMMedications,
  travel: AMTravelAssessment
): {
  malarone: boolean;
  doxycycline: boolean;
  mefloquine: boolean;
} {
  const malaroneCI =
    medical.severeRenalImpairment ||
    medical.severeHepaticImpairment ||
    travel.currentlyPregnant;

  const doxyCI = travel.currentlyPregnant || travel.breastfeeding;

  const mefloquineCI =
    medical.epilepsy ||
    medical.psychiatricHistory ||
    medical.qTprolongation;

  return {
    malarone: malaroneCI,
    doxycycline: doxyCI,
    mefloquine: mefloquineCI,
  };
}

// ─── Dose and timing recommendations ───

export interface MedicineRecommendation {
  medicine: string;
  dose: string;
  startTiming: string;
  continuationAfterReturn: string;
  reason: string;
}

export function recommendMedicine(
  medical: AMMedicalHistory,
  medications: AMMedications,
  travel: AMTravelAssessment
): MedicineRecommendation | null {
  const ci = identifyMedicineContraindications(medical, medications, travel);

  // ─── Malarone (atovaquone/proguanil 250/100mg) ───
  if (!ci.malarone) {
    return {
      medicine: 'Atovaquone/Proguanil (Malarone) 250/100mg',
      dose: '1 tablet daily',
      startTiming: '1–2 days before travel',
      continuationAfterReturn: 'Continue for 7 days after leaving malaria area',
      reason:
        'Malarone is well-tolerated, effective, and suitable. Start early, continue post-travel.',
    };
  }

  // ─── Doxycycline (100mg daily) ───
  if (!ci.doxycycline && !medical.photosensitivity) {
    return {
      medicine: 'Doxycycline 100mg',
      dose: '1 tablet daily',
      startTiming: '1–2 days before travel',
      continuationAfterReturn: 'Continue for 4 weeks after leaving malaria area',
      reason:
        'Doxycycline is cost-effective and widely used. Start early, longer post-travel duration.',
    };
  }

  // ─── Mefloquine (250mg weekly) ───
  if (!ci.mefloquine && !medical.arrhythmia) {
    return {
      medicine: 'Mefloquine 250mg',
      dose: '1 tablet weekly',
      startTiming: '2–3 weeks before travel (allows tolerance assessment)',
      continuationAfterReturn: 'Continue for 4 weeks after leaving malaria area',
      reason:
        'Mefloquine is given weekly. Start well in advance to assess tolerance and watch for neuropsychiatric effects.',
    };
  }

  return null;
}

// ─── Check if consultation can proceed ───

export function canProceedWithConsultation(alerts: ClinicalAlert[]): boolean {
  return !alerts.some((a) => a.severity === 'stop');
}

// ─── Check if hard stops exist ───

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
