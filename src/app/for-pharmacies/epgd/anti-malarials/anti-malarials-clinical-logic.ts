// ─── Anti-malarials Clinical Logic ───
//
// Aligned to the Malaria Chemoprophylaxis PGD, version 010, issued
// 11 September 2026. Three arms: atovaquone/proguanil, doxycycline,
// mefloquine. Arm-level exclusions remove that arm from the medicine
// selector; a hard stop is raised when the whole PGD excludes the
// patient or when no arm remains.

import type { ClinicalAlert } from '../shared/types';
import type {
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMPatientDetails,
  AMMedicineChoice,
} from './anti-malarials-types';

export const AM_PGD_VERSION = 'Malaria Chemoprophylaxis PGD v010, issued 11 September 2026';

// ─── Calculate trip duration ───
//
// Days in the malarious area are counted INCLUSIVELY: the day of arrival and
// the day of departure both count, because a tablet is due on each of them.
// Arrive on the 1st and leave on the 15th is 15 days, not 14. The old
// return-minus-departure count left every course one tablet short
// (adversarial review, 11 Sep 2026).

export function calculateTripDuration(
  departureDate: string,
  returnDate: string
): number | null {
  if (!departureDate || !returnDate) return null;

  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);

  if (isNaN(departure.getTime()) || isNaN(returnD.getTime())) return null;
  departure.setHours(0, 0, 0, 0);
  returnD.setHours(0, 0, 0, 0);
  if (returnD < departure) return null;

  const diffMs = returnD.getTime() - departure.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays + 1;
}

// ─── Days from today until departure (mefloquine needs 2 to 3 weeks) ───

export function calculateDaysUntilDeparture(departureDate: string): number | null {
  if (!departureDate) return null;
  const departure = new Date(departureDate);
  if (isNaN(departure.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  departure.setHours(0, 0, 0, 0);
  return Math.round((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Atovaquone/proguanil weight band (PGD Appendix 1, UKMEAG Table 5) ───
//
// Decision 1 (11 September 2026): the bands are the UKMEAG bands with
// decimal boundaries (x to y.9 kg) and the adult tablet from 40 kg. Every
// weight therefore has exactly one band: 19.9 kg is one paediatric tablet,
// 20.0 kg is two; 39.9 kg is three paediatric tablets, 40.0 kg is the adult
// tablet. The PGD's lower limit for this arm stays at 11 kg (the licensed
// minimum for the paediatric tablet).

export const WEIGHT_BAND_CONVENTION =
  'Weights are read against the UKMEAG bands in the PGD, which run to x.9 kg: 19.9 kg is dosed as 11 to 19.9 kg and ' +
  '20.0 kg as 20 to 29.9 kg; the adult tablet is used from 40 kg, and one mefloquine tablet from 45 kg.';

export interface APWeightBand {
  label: string;
  product: 'malarone' | 'malarone-paediatric';
  productName: string;
  tabletsPerDay: number;
}

export function getAtovaquoneProguanilBand(weightKg: number | null): APWeightBand | null {
  if (weightKg === null || weightKg < 11) return null;
  if (weightKg < 20) {
    return {
      label: '11 to 19.9 kg',
      product: 'malarone-paediatric',
      productName: 'Malarone Paediatric (atovaquone 62.5mg / proguanil 25mg) tablets',
      tabletsPerDay: 1,
    };
  }
  if (weightKg < 30) {
    return {
      label: '20 to 29.9 kg',
      product: 'malarone-paediatric',
      productName: 'Malarone Paediatric (atovaquone 62.5mg / proguanil 25mg) tablets',
      tabletsPerDay: 2,
    };
  }
  if (weightKg < 40) {
    return {
      label: '30 to 39.9 kg',
      product: 'malarone-paediatric',
      productName: 'Malarone Paediatric (atovaquone 62.5mg / proguanil 25mg) tablets',
      tabletsPerDay: 3,
    };
  }
  return {
    label: '40 kg and over',
    product: 'malarone',
    productName: 'Malarone (atovaquone 250mg / proguanil 100mg) tablets, adult strength',
    tabletsPerDay: 1,
  };
}

// ─── Mefloquine weight band (PGD Arm 3 dose table, UKMEAG Table 3) ───
//
// Decision 1: UKMEAG bands with decimal boundaries. 5 to 15.9 kg a quarter
// tablet, 16 to 24.9 kg half, 25 to 44.9 kg three quarters, 45 kg and over
// one tablet.

export interface MefloquineWeightBand {
  label: string;
  tabletFraction: number; // tablets per weekly dose
  doseText: string;
}

export function getMefloquineBand(weightKg: number | null): MefloquineWeightBand | null {
  if (weightKg === null || weightKg < 5) return null;
  if (weightKg < 16) return { label: '5 to 15.9 kg', tabletFraction: 0.25, doseText: 'ONE QUARTER of a 250mg tablet once weekly' };
  if (weightKg < 25) return { label: '16 to 24.9 kg', tabletFraction: 0.5, doseText: 'HALF a 250mg tablet once weekly' };
  if (weightKg < 45) return { label: '25 to 44.9 kg', tabletFraction: 0.75, doseText: 'THREE QUARTERS of a 250mg tablet once weekly' };
  return { label: '45 kg and over', tabletFraction: 1, doseText: 'ONE 250mg tablet once weekly' };
}

// ─── Generate clinical alerts ───

export function generateAMAlerts(
  patient: AMPatientDetails,
  travel: AMTravelAssessment,
  medical: AMMedicalHistory,
  medications: AMMedications
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── Paediatric hard stop (tool is stricter than the PGD) ─────────
  //
  // The PGD (v010) covers children by weight band. This tool is kept
  // adult-only: anyone under 18 is referred rather than dosed here.
  // Remove this stop only when parental consent capture and the
  // under-12 doxycycline exclusion are built into the tool.
  if (patient.age !== null && patient.age < 18) {
    alerts.push({
      severity: 'stop',
      code: 'PAEDIATRIC_NOT_SUPPORTED_BY_TOOL',
      message: 'This tool does not supply to anyone under 18',
      detail:
        'Malaria chemoprophylaxis in children is dosed by body weight. Work from Appendix 1 of the Malaria ' +
        'Chemoprophylaxis PGD (v010, 11 September 2026): one Malarone Paediatric 62.5mg/25mg tablet daily for 11 to 19.9kg, ' +
        'two for 20 to 29.9kg, three for 30 to 39.9kg, and one adult 250mg/100mg tablet from 40kg. Doxycycline is not ' +
        'for under 12s. Weigh the child; do not estimate from age.',
    });
  }

  // ─── Fever and suspected malaria (all arms: exclusion, refer same day) ───

  if (medical.currentFeverOrSuspectedMalaria) {
    alerts.push({
      severity: 'stop',
      code: 'FEVER_OR_SUSPECTED_MALARIA',
      message: 'Febrile illness now, or suspected or confirmed malaria',
      detail:
        'This PGD covers PROPHYLAXIS ONLY. Malaria is a medical emergency: refer the same day for urgent assessment ' +
        'and a malaria blood film, and say plainly that malaria must be excluded. Do not supply a prophylactic dose.',
    });
  }

  if (medical.uninvestigatedPostTravelFever) {
    alerts.push({
      severity: 'stop',
      code: 'UNINVESTIGATED_POST_TRAVEL_FEVER',
      message: 'Fever within 12 months of travel to a malarious area, not investigated with a blood film',
      detail:
        'Any fever in the last 12 months following travel to a malarious area that has not been investigated with a ' +
        'malaria blood film excludes. Refer the same day for urgent assessment.',
    });
  }

  // ─── Pregnancy and breastfeeding (all arms: exclusion) ───

  if (travel.currentlyPregnant) {
    alerts.push({
      severity: 'stop',
      code: 'PREGNANT_CONTRAINDICATED',
      message: 'Patient is currently pregnant',
      detail:
        'Pregnancy is an exclusion for every arm of this PGD. Chemoprophylaxis in pregnancy needs individual ' +
        'specialist assessment and is outside this PGD. Refer, and give bite avoidance advice regardless.',
    });
  }

  if (travel.breastfeeding) {
    alerts.push({
      severity: 'stop',
      code: 'BREASTFEEDING',
      message: 'Patient is currently breastfeeding',
      detail:
        'Breastfeeding is an exclusion for every arm of this PGD. Refer for individual specialist assessment, and ' +
        'give bite avoidance advice regardless.',
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

  // ─── Weight (all arms: below minimum or not obtainable is an exclusion) ───

  if (travel.weightKg !== null && travel.weightKg < 5) {
    alerts.push({
      severity: 'stop',
      code: 'WEIGHT_BELOW_MINIMUM',
      message: 'Weight below the minimum for every available agent',
      detail: 'Weight below 5kg is outside every arm of this PGD. Refer.',
    });
  }

  // ─── Arm 1: atovaquone/proguanil exclusions ───

  if (travel.weightKg !== null && travel.weightKg >= 5 && travel.weightKg < 11) {
    alerts.push({
      severity: 'red-flag',
      code: 'AP_WEIGHT_CI',
      message: 'Atovaquone/proguanil arm excluded: weight below 11kg',
      detail: 'Atovaquone/proguanil is outside this PGD below 11kg (Appendix 1). Refer for this agent.',
    });
  }

  if (medical.atovaquoneProguanilAllergy) {
    alerts.push({
      severity: 'red-flag',
      code: 'AP_ALLERGY_CI',
      message: 'Atovaquone/proguanil arm excluded: known hypersensitivity',
      detail: 'Known hypersensitivity to atovaquone or proguanil excludes this arm.',
    });
  }

  if (medical.severeRenalImpairment) {
    alerts.push({
      severity: 'red-flag',
      code: 'MALARONE_RENAL_CI',
      message: 'Atovaquone/proguanil arm excluded: renal impairment, kidney disease or dialysis',
      detail:
        'Known severe renal impairment (eGFR below 30), or the patient reports kidney disease or dialysis, excludes ' +
        'atovaquone/proguanil. Refer for this agent; another arm may be suitable.',
    });
  }

  if (medications.takesRifampicinOrRifabutin || medications.takesMetoclopramideOrTetracycline) {
    alerts.push({
      severity: 'red-flag',
      code: 'AP_INTERACTION_CI',
      message: 'Atovaquone/proguanil arm excluded: interacting medicine',
      detail:
        'Rifampicin, rifabutin, metoclopramide and tetracycline reduce atovaquone concentrations. Refer for this agent.',
    });
  }

  if (medications.takesAntiretroviralsOrPyrimethamine) {
    alerts.push({
      severity: 'red-flag',
      code: 'AP_ARV_CI',
      message: 'Atovaquone/proguanil arm excluded: antiretroviral therapy or pyrimethamine',
      detail:
        'Antiretroviral therapy (efavirenz, other NNRTIs or boosted protease inhibitors) and pyrimethamine exclude ' +
        'atovaquone/proguanil. Refer for this agent.',
    });
  }

  // ─── Arm 2: doxycycline exclusions ───

  if (medical.tetracyclineAllergy) {
    alerts.push({
      severity: 'red-flag',
      code: 'DOXY_ALLERGY_CI',
      message: 'Doxycycline arm excluded: known hypersensitivity',
      detail: 'Known hypersensitivity to doxycycline or other tetracyclines excludes this arm.',
    });
  }

  if (medical.severeHepaticImpairment) {
    alerts.push({
      severity: 'red-flag',
      code: 'HEPATIC_CI',
      message: 'Doxycycline and mefloquine arms excluded: severe hepatic impairment',
      detail:
        'Known severe hepatic impairment excludes doxycycline and mefloquine. Atovaquone/proguanil is not excluded ' +
        'on this ground.',
    });
  }

  if (medications.takesCarbamazepinePhenytoinPhenobarbital || medications.takesRifampicinOrRifabutin) {
    alerts.push({
      severity: 'red-flag',
      code: 'DOXY_INDUCER_CI',
      message: 'Doxycycline arm excluded: carbamazepine, phenytoin, phenobarbital or rifampicin',
      detail: 'These medicines reduce doxycycline concentrations. Refer for this agent.',
    });
  }

  if (medications.takesIsotretinoin) {
    alerts.push({
      severity: 'red-flag',
      code: 'DOXY_ISOTRETINOIN_CI',
      message: 'Doxycycline arm excluded: taking isotretinoin',
      detail: 'Taking isotretinoin excludes doxycycline. Refer for this agent.',
    });
  }

  if (medical.lupusMyastheniaPorphyria) {
    alerts.push({
      severity: 'red-flag',
      code: 'DOXY_SLE_MG_CI',
      message: 'Doxycycline arm excluded: systemic lupus erythematosus, myasthenia gravis or porphyria',
      detail: 'These conditions exclude doxycycline under this PGD.',
    });
  }

  if (medical.photosensitivity) {
    alerts.push({
      severity: 'caution',
      code: 'DOXY_PHOTOSENSITIVITY',
      message: 'Doxycycline may cause photosensitivity',
      detail:
        'Patient reports photosensitivity history. Photosensitivity is common with doxycycline and matters in a sunny ' +
        'destination: advise high-factor sunscreen, covering up and avoiding midday sun.',
    });
  }

  // ─── Warfarin: A/P and doxycycline arms excluded (refer for INR monitoring) ───

  if (medications.takesWarfarin) {
    alerts.push({
      severity: 'red-flag',
      code: 'WARFARIN_INTERACTION',
      message: 'Atovaquone/proguanil and doxycycline arms excluded: taking warfarin',
      detail:
        'Proguanil and doxycycline potentiate warfarin. The PGD says refer for INR monitoring rather than supplying ' +
        'these agents. Advise the patient to inform their anticoagulant clinic.',
    });
  }

  // ─── Arm 3: mefloquine exclusions ───

  if (medical.epilepsy) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_EPILEPSY_CI',
      message: 'Mefloquine arm excluded: epilepsy or seizure disorder',
      detail:
        'Epilepsy or any seizure disorder is an absolute exclusion for mefloquine. Offer an alternative arm rather ' +
        'than seeking a second opinion.',
    });
  }

  if (medications.takesCarbamazepinePhenytoinPhenobarbital || medications.takesOtherAnticonvulsant) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_ANTICONVULSANT_CI',
      message: 'Mefloquine arm excluded: taking an anticonvulsant',
      detail: 'Taking an anticonvulsant excludes mefloquine under this PGD.',
    });
  }

  if (medical.psychiatricHistory) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_PSYCH_CI',
      message: 'Mefloquine arm excluded: current or previous psychiatric disorder',
      detail:
        'ANY current or previous psychiatric disorder, including depression, anxiety, psychosis or a suicide attempt ' +
        'at any time, is an absolute exclusion for mefloquine. Offer an alternative arm rather than seeking a second opinion.',
    });
  }

  if (medications.takesBupropionOrSeizureLowering) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_BUPROPION_CI',
      message: 'Mefloquine arm excluded: bupropion or a seizure-threshold-lowering medicine',
      detail: 'Taking bupropion, or any other medicine that lowers the seizure threshold, excludes mefloquine. Refer for this agent.',
    });
  }

  if (medications.takesHalofantrineOrKetoconazole) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_HALOFANTRINE_CI',
      message: 'Mefloquine arm excluded: halofantrine or ketoconazole',
      detail: 'Taking, or planning to take, halofantrine or ketoconazole excludes mefloquine.',
    });
  }

  if (medical.blackwaterFever) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_BLACKWATER_CI',
      message: 'Mefloquine arm excluded: history of Blackwater fever',
      detail: 'A history of Blackwater fever excludes mefloquine.',
    });
  }

  if (medical.mefloquineQuinineAllergy) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_ALLERGY_CI',
      message: 'Mefloquine arm excluded: hypersensitivity to mefloquine, quinine or quinidine',
      detail: 'Known hypersensitivity to mefloquine, quinine or quinidine excludes this arm.',
    });
  }

  if (medical.qTprolongation) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_QT_CI',
      message: 'Mefloquine arm excluded: QT prolongation, family history, or QT-prolonging medicines',
      detail:
        'Known QT prolongation, a family history of it, or concurrent QT-prolonging medicines exclude mefloquine. ' +
        'Mefloquine carries QT prolongation and arrhythmia in its SPC as rare but serious. Refer for this agent.',
    });
  }

  if (medical.arrhythmia) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_ARRHYTHMIA',
      message: 'Mefloquine arm excluded: cardiac conduction disorder or family history',
      detail:
        'A known cardiac conduction disorder, or a family history of one, excludes mefloquine. Refer for this agent.',
    });
  }

  if (medical.pilotOrDiver) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_OCCUPATION_CI',
      message: 'Mefloquine arm excluded: occupation requiring fine coordination or spatial discrimination',
      detail: 'Pilots, divers and similar occupations are excluded from mefloquine. Refer for this agent.',
    });
  }

  const daysUntilDeparture = calculateDaysUntilDeparture(travel.departureDate);
  if (daysUntilDeparture !== null && daysUntilDeparture < 14) {
    alerts.push({
      severity: 'red-flag',
      code: 'MEFLOQUINE_LATE_DEPARTURE',
      message: 'Mefloquine arm excluded: departing within 2 weeks',
      detail:
        'Mefloquine is started 2 to 3 weeks before travel so that tolerability can be assessed before departure. ' +
        'Do not supply it to a traveller leaving within 2 weeks. Atovaquone/proguanil or doxycycline can be started ' +
        '1 to 2 days before travel.',
    });
  }

  if (daysUntilDeparture !== null && daysUntilDeparture >= 0 && daysUntilDeparture < 2) {
    alerts.push({
      severity: 'caution',
      code: 'DEPARTURE_IMMINENT',
      message: daysUntilDeparture === 0 ? 'Departing today' : 'Departing tomorrow',
      detail:
        'Atovaquone/proguanil and doxycycline are started 1 to 2 days before entering the malarious area. The full ' +
        'lead-in cannot be met: tell the patient to take the first dose today and record this. Bite avoidance advice ' +
        'matters more than usual for the first days of the trip.',
    });
  }

  // ─── Maximum treatment periods ───

  if (travel.tripDuration !== null && travel.tripDuration > 365) {
    alerts.push({
      severity: 'red-flag',
      code: 'MAX_PERIOD_AP_MEFLOQUINE',
      message: 'Atovaquone/proguanil and mefloquine arms excluded: trip longer than 12 months',
      detail:
        'Continuous use of atovaquone/proguanil is supported for up to 12 months and mefloquine for up to 1 year. ' +
        'Beyond that, refer for specialist advice.',
    });
  }
  if (travel.tripDuration !== null && travel.tripDuration > 730) {
    alerts.push({
      severity: 'red-flag',
      code: 'MAX_PERIOD_DOXY',
      message: 'Doxycycline arm excluded: trip longer than 2 years',
      detail: 'Continuous use of doxycycline is supported for up to 2 years. Beyond that, refer.',
    });
  }

  // ─── Other interactions and cautions ───

  if (medications.takesOralContraception) {
    alerts.push({
      severity: 'caution',
      code: 'DOXY_OCP_INTERACTION',
      message: 'Oral contraception: no extra precautions needed with doxycycline unless vomiting or diarrhoea',
      detail:
        'Doxycycline is a non-enzyme-inducing antibiotic, so additional contraceptive precautions are not required ' +
        'with combined or progestogen-only oral contraceptives unless vomiting or diarrhoea occur.',
    });
  }

  if (medications.takesAntacids) {
    alerts.push({
      severity: 'caution',
      code: 'ANTACID_INTERACTION',
      message: 'Antacids, iron and dairy: separate from doxycycline by at least 2 hours',
      detail:
        'If doxycycline is chosen, advise the patient to avoid indigestion remedies, iron tablets and milk within ' +
        '2 hours of a dose.',
    });
  }

  if (medical.g6pdDeficiency) {
    alerts.push({
      severity: 'caution',
      code: 'G6PD_DEFICIENCY',
      message: 'Patient has G6PD deficiency',
      detail:
        'UKMEAG guidance summarised in the PGD states that atovaquone/proguanil, doxycycline and mefloquine can all ' +
        'be used in G6PD deficiency. Record the diagnosis and refer if unsure.',
    });
  }

  // ─── No arm remains ───

  const ci = identifyMedicineContraindications(medical, medications, travel);
  if (ci.malarone && ci.doxycycline && ci.mefloquine) {
    alerts.push({
      severity: 'stop',
      code: 'NO_SUITABLE_ARM',
      message: 'No arm of this PGD is suitable for this patient',
      detail:
        'Every agent is excluded. Refer to a travel clinic or the GP, give bite avoidance advice regardless, and ' +
        'document the advice and the decision.',
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
  const longerThanYear = travel.tripDuration !== null && travel.tripDuration > 365;
  const longerThanTwoYears = travel.tripDuration !== null && travel.tripDuration > 730;
  const daysUntilDeparture = calculateDaysUntilDeparture(travel.departureDate);

  const malaroneCI =
    travel.currentlyPregnant ||
    travel.breastfeeding ||
    (travel.weightKg !== null && travel.weightKg < 11) ||
    medical.atovaquoneProguanilAllergy ||
    medical.severeRenalImpairment ||
    medications.takesRifampicinOrRifabutin ||
    medications.takesMetoclopramideOrTetracycline ||
    medications.takesAntiretroviralsOrPyrimethamine ||
    medications.takesWarfarin ||
    longerThanYear;

  const doxyCI =
    travel.currentlyPregnant ||
    travel.breastfeeding ||
    medical.tetracyclineAllergy ||
    medical.severeHepaticImpairment ||
    medications.takesWarfarin ||
    medications.takesCarbamazepinePhenytoinPhenobarbital ||
    medications.takesRifampicinOrRifabutin ||
    medications.takesIsotretinoin ||
    medical.lupusMyastheniaPorphyria ||
    longerThanTwoYears;

  const mefloquineCI =
    travel.currentlyPregnant ||
    travel.breastfeeding ||
    (travel.weightKg !== null && travel.weightKg < 5) ||
    medical.psychiatricHistory ||
    medical.epilepsy ||
    medications.takesCarbamazepinePhenytoinPhenobarbital ||
    medications.takesOtherAnticonvulsant ||
    medications.takesBupropionOrSeizureLowering ||
    medications.takesHalofantrineOrKetoconazole ||
    medical.blackwaterFever ||
    medical.mefloquineQuinineAllergy ||
    medical.qTprolongation ||
    medical.arrhythmia ||
    medical.severeHepaticImpairment ||
    medical.pilotOrDiver ||
    (daysUntilDeparture !== null && daysUntilDeparture < 14) ||
    longerThanYear;

  return {
    malarone: malaroneCI,
    doxycycline: doxyCI,
    mefloquine: mefloquineCI,
  };
}

// ─── Eligible medicine options for the selector (exclusions enforced) ───

export function getEligibleMedicineOptions(
  medical: AMMedicalHistory,
  medications: AMMedications,
  travel: AMTravelAssessment
): { value: AMMedicineChoice; label: string }[] {
  const ci = identifyMedicineContraindications(medical, medications, travel);
  const options: { value: AMMedicineChoice; label: string }[] = [];
  const apBand = getAtovaquoneProguanilBand(travel.weightKg);

  if (!ci.malarone && apBand) {
    if (apBand.product === 'malarone') {
      options.push({ value: 'malarone', label: 'Atovaquone/Proguanil (Malarone) 250mg/100mg adult tablets, 40kg and over' });
    } else {
      options.push({ value: 'malarone-paediatric', label: 'Atovaquone/Proguanil (Malarone Paediatric) 62.5mg/25mg tablets, 11 to 39.9kg' });
    }
  }
  if (!ci.doxycycline) {
    options.push({ value: 'doxycycline', label: 'Doxycycline 100mg capsules' });
  }
  if (!ci.mefloquine && getMefloquineBand(travel.weightKg)) {
    options.push({ value: 'mefloquine', label: 'Mefloquine 250mg tablets' });
  }
  return options;
}

// ─── Dose and timing recommendations ───

export interface MedicineRecommendation {
  medicine: string;
  dose: string;
  startTiming: string;
  continuationAfterReturn: string;
  /** Human-readable calculation, e.g. "(2 lead-in + 14 + 7 tail) x 1 per day = 23 tablets". */
  quantity: string;
  /** Calculated whole course in tablets or capsules; null until the dates are known. */
  total: number | null;
  /** "tablets" or "capsules". */
  unit: string;
  maxPeriod: string;
  reason: string;
}

/**
 * Mefloquine lead-in in weeks: the document says start 2 to 3 weeks before
 * travel. Three weeks where there is time, two where departure is 14 to 20
 * days away. Under 14 days the arm is excluded (see generateAMAlerts), so
 * a constant 3 week lead-in was supplying a dose the traveller could not
 * take (adversarial review, 11 Sep 2026).
 */
export function getMefloquineLeadInWeeks(departureDate: string): number {
  const days = calculateDaysUntilDeparture(departureDate);
  if (days === null) return 3;
  return days >= 21 ? 3 : 2;
}

/**
 * The document's course for one arm: name, dose, timing and the calculated
 * quantity. This is the ONLY place the quantity is computed; the medicine
 * step pre-fills from it, validation checks against it, and the printed
 * record reads from it.
 */
export function describeArm(
  choice: AMMedicineChoice,
  travel: AMTravelAssessment
): MedicineRecommendation | null {
  const days = travel.tripDuration;
  const daysText = days === null ? 'days in area' : String(days);

  if (choice === 'malarone' || choice === 'malarone-paediatric') {
    const band = getAtovaquoneProguanilBand(travel.weightKg);
    if (!band) return null;
    const perDay = band.tabletsPerDay;
    const total = days === null ? null : (2 + days + 7) * perDay;
    return {
      medicine: band.productName,
      dose: `${perDay} ${band.product === 'malarone' ? 'adult' : 'paediatric'} tablet${perDay > 1 ? 's' : ''} once daily, at the same time each day, with food or a milky drink (weight band ${band.label})`,
      startTiming: '1 to 2 days before entering the malarious area',
      continuationAfterReturn: 'Continue daily throughout and for 7 DAYS after leaving the malarious area',
      quantity:
        `(2 lead-in + ${daysText} + 7 tail) x ${perDay} per day` +
        (total !== null ? ` = ${total} tablets` : ''),
      total,
      unit: 'tablets',
      maxPeriod: 'Continuous use for up to 12 months. Beyond that, refer for specialist advice.',
      reason: 'Supply the whole course. A short supply leaves the traveller unprotected at the end, which is when risk is highest.',
    };
  }

  if (choice === 'doxycycline') {
    const total = days === null ? null : 2 + days + 28;
    return {
      medicine: 'Doxycycline 100mg capsules',
      dose: '100mg (one capsule) once daily, swallowed with plenty of water sitting or standing, well before lying down',
      startTiming: '1 to 2 days before entering the malarious area',
      continuationAfterReturn: 'Continue daily throughout and for 4 WEEKS (28 days) after leaving the malarious area',
      quantity: `2 lead-in + ${daysText} + 28 tail` + (total !== null ? ` = ${total} capsules` : '') + '. A quantity below 30 cannot be correct for any itinerary.',
      total,
      unit: 'capsules',
      maxPeriod: 'Continuous use for up to 2 years. Beyond that, refer.',
      reason: 'Supply the whole course including the 4 week tail.',
    };
  }

  if (choice === 'mefloquine') {
    const band = getMefloquineBand(travel.weightKg);
    if (!band) return null;
    const leadIn = getMefloquineLeadInWeeks(travel.departureDate);
    const weeks = days === null ? null : Math.ceil(days / 7);
    const doses = weeks === null ? null : leadIn + weeks + 4;
    const total = doses === null ? null : Math.ceil(doses * band.tabletFraction);
    return {
      medicine: 'Mefloquine 250mg tablets',
      dose: `${band.doseText}, on the same day each week, with food and plenty of water (weight band ${band.label})`,
      startTiming: `${leadIn} weeks before travel (the PGD says 2 to 3 weeks), so that tolerability can be assessed before departure`,
      continuationAfterReturn: 'Continue weekly throughout and for 4 WEEKS after leaving the malarious area',
      quantity:
        `${leadIn} lead-in + ${weeks === null ? 'weeks in area' : weeks} + 4 tail` +
        (doses !== null ? ` = ${doses} weekly doses` : '') +
        (band.tabletFraction < 1
          ? ` at ${band.tabletFraction} of a tablet each` + (total !== null ? ` = ${total} whole tablets (divided dose: tablet must be scored)` : '')
          : total !== null ? ` = ${total} tablets` : ''),
      total,
      unit: 'tablets',
      maxPeriod: 'Continuous use for up to 1 year. Beyond that, refer.',
      reason: 'Tell the patient to STOP and seek advice at the first neuropsychiatric symptom, including insomnia and abnormal dreams.',
    };
  }

  return null;
}

/**
 * Largest quantity accepted above the calculated course: one extra
 * four-week pack, to allow for pack rounding. Anything more is a supply
 * the document does not describe.
 */
export const QUANTITY_PACK_ALLOWANCE = 28;

export function recommendMedicine(
  medical: AMMedicalHistory,
  medications: AMMedications,
  travel: AMTravelAssessment,
  selected: AMMedicineChoice = ''
): MedicineRecommendation | null {
  const options = getEligibleMedicineOptions(medical, medications, travel);
  if (options.length === 0) return null;

  const choice: AMMedicineChoice =
    selected && options.some((o) => o.value === selected) ? selected : options[0].value;

  return describeArm(choice, travel);
}

// ─── Check if consultation can proceed ───

export function canProceedWithConsultation(alerts: ClinicalAlert[]): boolean {
  return !alerts.some((a) => a.severity === 'stop');
}

// ─── Check if hard stops exist ───

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}
