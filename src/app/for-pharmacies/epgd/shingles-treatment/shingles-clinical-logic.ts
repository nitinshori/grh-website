// Clinical logic and validation for shingles ePGD
// Aligned to the Shingles (Herpes Zoster) Treatment PGD, version 007,
// issued 11 September 2026. Aciclovir, valaciclovir or famciclovir, adults
// 18 and over, immunocompetent or non-severe immunosuppression.
import { ClinicalAlert } from '../shared/types';
import {
  ShinglesSymptoms,
  ShinglesMedicalHistory,
  ShinglesMedicineSelection,
  ShinglesCounselling,
  RashDermatome,
  Medicine,
} from './shingles-types';

/**
 * Pain score bands on the 0 to 10 scale the PGD requires (decision 19,
 * 11 Sep 2026): 4 or more is moderate or severe pain (72 hour criterion);
 * 7 or more is severe pain (7 day criterion).
 */
export const MODERATE_PAIN_THRESHOLD = 4;
export const SEVERE_PAIN_THRESHOLD = 7;
/** The PGD defines elderly as 65 years and over (decision 19, 11 Sep 2026). */
export const ELDERLY_AGE = 65;

/**
 * Hours since rash onset.
 *
 * With an approximate onset time the interval is measured exactly. Without
 * one it is counted in whole calendar days (onset date to today, local time)
 * times 24, so that "within 72 hours" means onset today or up to three days
 * ago and "within 7 days" means up to seven days ago. It used to parse the
 * date as UTC midnight and measure to the current instant, which pushed an
 * evening onset three days ago outside the 72 hour window (adversarial
 * review, 11 Sep 2026).
 */
export function calculateHoursSinceOnset(rashOnsetDate: string, rashOnsetTime: string = ''): number | null {
  if (!rashOnsetDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rashOnsetDate);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const now = new Date();
  const t = /^(\d{2}):(\d{2})$/.exec(rashOnsetTime || '');
  if (t) {
    const onset = new Date(y, mo, d, parseInt(t[1], 10), parseInt(t[2], 10));
    if (isNaN(onset.getTime())) return null;
    const hours = (now.getTime() - onset.getTime()) / (1000 * 60 * 60);
    return hours >= 0 ? Math.round(hours) : null;
  }
  const onsetDay = new Date(y, mo, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (isNaN(onsetDay.getTime())) return null;
  const days = Math.round((today.getTime() - onsetDay.getTime()) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days * 24 : null;
}

/**
 * Check if rash is within the 72 hour treatment window
 */
export function isWithinTreatmentWindow(hoursSinceOnset: number | null): boolean {
  if (hoursSinceOnset === null) return false;
  return hoursSinceOnset <= 72;
}

/** Rash onset within 7 days (the extended window in the PGD). */
export function isWithinSevenDays(hoursSinceOnset: number | null): boolean {
  if (hoursSinceOnset === null) return false;
  return hoursSinceOnset <= 24 * 7;
}

/**
 * Check if dermatome is ophthalmic (V1 - trigeminal V1)
 */
export function isOphthalmicShingles(dermatome: RashDermatome): boolean {
  return dermatome === 'trigeminal-V1';
}

/**
 * Check for Hutchinson's sign risk (V1 dermatome involvement)
 */
export function hasHutchinsonSignRisk(dermatome: RashDermatome): boolean {
  return dermatome === 'trigeminal-V1';
}

/**
 * Head or neck involvement, including the face, scalp, ear or eye: refer (PGD v007 red flag).
 */
export function isHeadOrNeck(dermatome: RashDermatome): boolean {
  return (
    dermatome === 'cervical' ||
    dermatome === 'trigeminal-V1' ||
    dermatome === 'trigeminal-V2' ||
    dermatome === 'trigeminal-V3'
  );
}

/**
 * Non-truncal involvement of the limbs or perineum (72 hour window criterion).
 * Sacral dermatomes, including the buttocks, count as truncal (decision 20,
 * 11 Sep 2026), so sacral involvement does not meet this criterion.
 */
export function isNonTruncal(dermatome: RashDermatome): boolean {
  return dermatome === 'upper-limb' || dermatome === 'lower-limb' || dermatome === 'perineum';
}

/**
 * Check for urinary retention risk (sacral involvement)
 */
export function hasUrinaryRetentionRisk(dermatome: RashDermatome): boolean {
  return dermatome === 'sacral' || dermatome === 'perineum';
}

/** Severe immunosuppression as defined in Green Book chapter 28a: excluded. */
export function hasSevereImmunosuppression(medicalHistory: ShinglesMedicalHistory): boolean {
  return (
    medicalHistory.cancerActive ||
    medicalHistory.organTransplant ||
    ((medicalHistory.immunosuppressed || medicalHistory.hivPositive) &&
      medicalHistory.immunosuppressionSeverity === 'severe')
  );
}

/** Non-severe (mild or moderate) immunosuppression: supply valaciclovir or famciclovir, not aciclovir. */
export function hasNonSevereImmunosuppression(medicalHistory: ShinglesMedicalHistory): boolean {
  return (
    !hasSevereImmunosuppression(medicalHistory) &&
    (medicalHistory.immunosuppressed || medicalHistory.hivPositive) &&
    medicalHistory.immunosuppressionSeverity === 'non-severe'
  );
}

/** Which treatment window the presentation meets, for the record. */
export type TreatmentWindow = 'within-72h' | 'within-7-days' | 'outside' | 'not-met' | 'unknown';

export function meets72HourCriteria(symptoms: ShinglesSymptoms, age: number | null): boolean {
  return (
    // PGD inclusion (decision 18, 11 Sep 2026): aged 50 years or over.
    (age !== null && age >= 50) ||
    isNonTruncal(symptoms.dermatome) ||
    (symptoms.painLevel !== null && symptoms.painLevel >= MODERATE_PAIN_THRESHOLD) ||
    symptoms.rashSeverity === 'moderate' ||
    symptoms.rashSeverity === 'severe'
  );
}

export function meetsSevenDayCriteria(symptoms: ShinglesSymptoms, age: number | null): boolean {
  return (
    symptoms.newVesiclesForming === 'yes' ||
    (symptoms.painLevel !== null && symptoms.painLevel >= SEVERE_PAIN_THRESHOLD) ||
    (age !== null && age >= 70) ||
    symptoms.highRiskSevereShingles === 'yes'
  );
}

/**
 * Every input the window criteria read has been answered. Until then the
 * window is "not established", never "not met": a stop may only follow an
 * answer the pharmacist has given (stop audit, 11 Sep 2026).
 */
export function windowCriteriaAnswered(symptoms: ShinglesSymptoms, age: number | null): boolean {
  return (
    age !== null &&
    symptoms.dermatome !== '' &&
    symptoms.painLevel !== null &&
    symptoms.rashSeverity !== '' &&
    symptoms.newVesiclesForming !== '' &&
    symptoms.highRiskSevereShingles !== ''
  );
}

export function getTreatmentWindow(symptoms: ShinglesSymptoms, age: number | null): TreatmentWindow {
  const hours = symptoms.hoursSinceOnset;
  if (hours === null) return 'unknown';
  if (!isWithinSevenDays(hours)) return 'outside';
  if (isWithinTreatmentWindow(hours)) {
    if (meets72HourCriteria(symptoms, age)) return 'within-72h';
    if (meetsSevenDayCriteria(symptoms, age)) return 'within-7-days';
    return windowCriteriaAnswered(symptoms, age) ? 'not-met' : 'unknown';
  }
  if (meetsSevenDayCriteria(symptoms, age)) return 'within-7-days';
  return windowCriteriaAnswered(symptoms, age) ? 'not-met' : 'unknown';
}

export function describeTreatmentWindow(window: TreatmentWindow): string {
  switch (window) {
    case 'within-72h':
      return 'Rash onset within 72 hours with a qualifying criterion (aged 50 or over, non-truncal involvement of the limbs or perineum, pain 4 or more on the 0 to 10 scale, or moderate or severe rash)';
    case 'within-7-days':
      return 'Rash onset within 7 days with a qualifying criterion (new vesicles forming, pain 7 or more on the 0 to 10 scale, age 70 or over, or high risk of severe shingles)';
    case 'outside':
      return 'Rash onset more than 7 days ago: excluded, refer to a prescriber';
    case 'not-met':
      return 'No inclusion criterion for the treatment window met: refer to a prescriber';
    default:
      return 'Not established';
  }
}

/**
 * Generate clinical alerts based on patient data
 */
export function generateClinicalAlerts(
  symptoms: ShinglesSymptoms,
  medicalHistory: ShinglesMedicalHistory,
  age: number | null = null
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // HARD STOPS (CRITICAL)

  if (age !== null && age < 18) {
    alerts.push({
      code: 'under-18',
      message: 'Patient is under 18 years of age.',
      detail: 'This PGD covers adults aged 18 years and over only. Refer.',
      severity: 'stop',
    });
  }

  // Ophthalmic shingles
  if (isOphthalmicShingles(symptoms.dermatome) || symptoms.eyeSymptoms) {
    alerts.push({
      code: 'ophthalmic-shingles',
      message: 'URGENT: Ophthalmic involvement. Refer the same day for ophthalmology assessment.',
      detail:
        'Rash in the ophthalmic division of the trigeminal nerve, any visual symptom, an unexplained red eye, or Hutchinson\'s sign (rash on the tip, side or root of the nose). Do not supply under this PGD.',
      severity: 'stop',
    });
  }

  // Head or neck involvement (face, scalp, ear, eye)
  if (isHeadOrNeck(symptoms.dermatome) && !isOphthalmicShingles(symptoms.dermatome)) {
    alerts.push({
      code: 'head-neck',
      message: 'Head or neck involvement (face, scalp, ear or neck). Refer or seek specialist advice the same day.',
      detail:
        'NICE CKS: head and neck involvement is a trigger for admission or specialist advice, urgently where the eye may be involved. Not for supply under this PGD.',
      severity: 'stop',
    });
  }

  if (symptoms.earOrFacialSymptoms) {
    alerts.push({
      code: 'ramsay-hunt',
      message: 'Ramsay Hunt syndrome or facial nerve involvement. Refer urgently.',
      detail: 'Rash in or around the ear, hearing loss, vertigo, altered taste, or unilateral facial weakness.',
      severity: 'stop',
    });
  }

  if (symptoms.meningitisSigns) {
    alerts.push({
      code: 'meningitis',
      message: 'Signs of meningitis (neck stiffness, photophobia, mottled skin). Refer to A&E.',
      detail: 'Do not supply. Arrange emergency assessment.',
      severity: 'stop',
    });
  }

  if (symptoms.encephalitisSigns) {
    alerts.push({
      code: 'encephalitis',
      message: 'Signs of encephalitis (disorientation, confusion, change in behaviour). Refer to A&E.',
      detail: 'Do not supply. Arrange emergency assessment.',
      severity: 'stop',
    });
  }

  if (symptoms.myelitisSigns) {
    alerts.push({
      code: 'myelitis',
      message: 'Signs of myelitis (muscle weakness, loss of bladder or bowel control). Refer to A&E.',
      detail: 'Do not supply. Arrange emergency assessment.',
      severity: 'stop',
    });
  }

  if (symptoms.sepsisSigns) {
    alerts.push({
      code: 'sepsis',
      message: 'Signs of sepsis or serious systemic infection. Call 999.',
      detail: 'Do not supply. Emergency.',
      severity: 'stop',
    });
  }

  if (symptoms.systemicallyUnwell) {
    alerts.push({
      code: 'systemic-illness',
      message: 'Systemic illness not meeting the threshold for sepsis. Refer to a prescriber the same day.',
      detail: 'Not for supply under this PGD.',
      severity: 'stop',
    });
  }

  if (symptoms.painUncontrolledByOtc) {
    alerts.push({
      code: 'pain-uncontrolled',
      message: 'Pain not controlled by over-the-counter analgesia. Refer to a prescriber the same day.',
      detail: 'Not for supply under this PGD.',
      severity: 'stop',
    });
  }

  if (symptoms.unilateral === 'no') {
    alerts.push({
      code: 'not-dermatomal',
      message: 'Rash is not a unilateral dermatomal rash, or crosses the midline. Refer.',
      detail:
        'A disseminated or widespread rash, or a rash crossing the midline, suggests dissemination. Inclusion requires a unilateral, dermatomal, painful vesicular rash that does not cross the midline.',
      severity: 'stop',
    });
  }

  // Treatment window
  const window = getTreatmentWindow(symptoms, age);
  if (window === 'outside') {
    alerts.push({
      code: 'outside-7-days',
      message: `Rash onset ${symptoms.hoursSinceOnset} hours ago (more than 7 days). Excluded: refer for a prescriber decision.`,
      detail:
        'A prescriber may still favour treatment where new vesicles are forming or pain is severe, but supply under this PGD is not permitted.',
      severity: 'stop',
    });
  } else if (window === 'not-met') {
    alerts.push({
      code: 'window-criteria-not-met',
      message: 'No treatment window inclusion criterion is met. Refer to a prescriber.',
      detail: isWithinTreatmentWindow(symptoms.hoursSinceOnset)
        ? 'Within 72 hours, supply requires at least one of: aged 50 or over; non-truncal involvement of the limbs or perineum (sacral dermatomes count as truncal); moderate or severe pain (4 or more on the 0 to 10 scale); or moderate or severe rash with confluent lesions.'
        : 'Between 72 hours and 7 days, supply requires at least one of: continued formation of new vesicles; severe pain (7 or more on the 0 to 10 scale); age 70 or over; or a high risk of severe shingles (for example severe atopic eczema).',
      severity: 'stop',
    });
  }

  // Severe immunosuppression (Green Book chapter 28a)
  if (hasSevereImmunosuppression(medicalHistory)) {
    alerts.push({
      code: 'severe-immunosuppression',
      message: 'Severe immunosuppression as defined in Green Book chapter 28a. Excluded.',
      detail:
        'Refer for intravenous aciclovir or specialist advice. Refer to A&E if the rash is widespread or severe, or the patient is systemically unwell.',
      severity: 'stop',
    });
  }

  // Pregnant patients (known or suspected)
  if (medicalHistory.pregnant) {
    alerts.push({
      code: 'pregnant',
      message: 'Pregnancy, known or suspected. Refer to a prescriber.',
      detail: 'NICE CKS: seek specialist advice before antiviral treatment in pregnancy.',
      severity: 'stop',
    });
  }

  if (medicalHistory.breastfeeding) {
    alerts.push({
      code: 'breastfeeding',
      message: 'Breastfeeding. Excluded: refer to a prescriber.',
      detail:
        'NICE CKS advises specialist advice before antiviral treatment in a breastfeeding woman. Not for supply under this PGD.',
      severity: 'stop',
    });
  }

  // Renal impairment below the PGD thresholds: refer, do not operate a dosing ladder
  if (medicalHistory.renalImpairment === 'severe') {
    alerts.push({
      code: 'severe-renal',
      message: 'eGFR below 30 mL/min/1.73m2. Excluded: refer to a prescriber.',
      detail: 'No antiviral may be supplied under this PGD below 30. Do not attempt to operate the renal dosing ladder in the pharmacy.',
      severity: 'stop',
    });
  }

  const renalRiskFactors =
    (age !== null && age >= ELDERLY_AGE) ||
    medicalHistory.nephrotoxicMedicines ||
    medicalHistory.tenofovir ||
    medicalHistory.immunosuppressed ||
    medicalHistory.hivPositive ||
    medicalHistory.dehydrationRisk;
  if (medicalHistory.renalImpairment === 'unknown' && renalRiskFactors) {
    alerts.push({
      code: 'renal-unknown-risk',
      message: 'Renal function unknown in a patient who is elderly (65 or over) or has risk factors for renal impairment. Refer rather than assume.',
      detail: 'The PGD requires renal function to be checked before supply in elderly patients (65 years and over) and where risk factors are present.',
      severity: 'stop',
    });
  }

  // Severe hepatic impairment (tool position, retained)
  if (medicalHistory.hepaticImpairment === 'severe') {
    alerts.push({
      code: 'severe-hepatic',
      message: 'Severe hepatic impairment.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.allergyAciclovirValaciclovir && medicalHistory.allergyFamciclovirPenciclovir) {
    alerts.push({
      code: 'hypersensitivity-all',
      message: 'Hypersensitivity to both antiviral classes. No agent can be supplied.',
      detail: 'Aciclovir and valaciclovir are cross-reactive; famciclovir and penciclovir are cross-reactive. Refer.',
      severity: 'stop',
    });
  }

  if (medicalHistory.previousDress) {
    alerts.push({
      code: 'previous-dress',
      message: 'Previous DRESS reaction to valaciclovir or famciclovir. Excluded: these must never be restarted.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.excludedInteractingMedicines) {
    alerts.push({
      code: 'interacting-medicines',
      message: 'Concurrent ciclosporin, tacrolimus, mycophenolate, aminophylline or theophylline. Excluded: refer to a prescriber.',
      detail: 'Not for supply under this PGD.',
      severity: 'stop',
    });
  }

  if (medicalHistory.unableToSwallowOrAbsorb) {
    alerts.push({
      code: 'oral-route',
      message: 'Unable to swallow or absorb oral medication. Excluded.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.onAntiviralProphylaxis) {
    alerts.push({
      code: 'antiviral-prophylaxis',
      message: 'Current long-term prophylactic treatment with the same class of antiviral. Excluded.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.neurologicalCondition) {
    alerts.push({
      code: 'neurological-condition',
      message: 'Underlying neurological condition. Excluded.',
      detail: 'Antivirals carry a higher risk of neurological adverse effects. Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.dehydrationRisk) {
    alerts.push({
      code: 'dehydration-risk',
      message: 'Unable to maintain adequate fluid intake, or at risk of dehydration. Excluded.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  if (medicalHistory.failedAntiviralThisEpisode) {
    alerts.push({
      code: 'failed-antiviral',
      message: 'Failure to respond to antiviral treatment already given for this episode. Excluded.',
      detail: 'Refer to a prescriber.',
      severity: 'stop',
    });
  }

  // RED FLAGS (HIGH)

  // Urinary retention risk
  if (hasUrinaryRetentionRisk(symptoms.dermatome)) {
    alerts.push({
      code: 'urinary-retention-risk',
      message: 'Sacral or perineal involvement carries a risk of urinary retention.',
      detail: 'Counsel the patient to seek medical attention if unable to pass urine.',
      severity: 'red-flag',
    });
  }

  // Severe pain
  if (symptoms.painLevel !== null && symptoms.painLevel >= SEVERE_PAIN_THRESHOLD) {
    alerts.push({
      code: 'severe-pain',
      message: `Severe pain (${symptoms.painLevel}/10).`,
      detail:
        'Advise paracetamol alone or with codeine, or an NSAID, subject to the usual contraindications. Refer urgently to a prescriber if pain is not controlled by over-the-counter analgesia.',
      severity: 'red-flag',
    });
  }

  // CAUTIONS (AMBER)

  if (window === 'within-7-days' && !isWithinTreatmentWindow(symptoms.hoursSinceOnset)) {
    alerts.push({
      code: 'extended-window',
      message: `Rash onset ${symptoms.hoursSinceOnset} hours ago: outside 72 hours, supplied under the 7 day criteria.`,
      detail: 'Start treatment as soon as possible. The benefit falls away the longer the delay after rash onset.',
      severity: 'caution',
    });
  }

  if (hasNonSevereImmunosuppression(medicalHistory)) {
    alerts.push({
      code: 'non-severe-immunosuppression',
      message: 'Non-severe immunosuppression: use valaciclovir or famciclovir, not aciclovir.',
      detail:
        'Valaciclovir and famciclovir are licensed for herpes zoster in immunocompromised adults; aciclovir is not licensed in the same terms. Famciclovir course is 10 days in this group.',
      severity: 'caution',
    });
  }

  if (
    (medicalHistory.immunosuppressed || medicalHistory.hivPositive) &&
    medicalHistory.immunosuppressionSeverity === ''
  ) {
    alerts.push({
      code: 'immunosuppression-unclassified',
      message: 'Immunosuppression or HIV recorded: classify as severe or non-severe using Green Book chapter 28a before proceeding.',
      detail: 'Severe immunosuppression is excluded. HIV with a CD4 count below 200 is severe.',
      severity: 'caution',
    });
  }

  if (medicalHistory.renalImpairment === 'moderate') {
    alerts.push({
      code: 'moderate-renal',
      message: 'eGFR 30 to 59 mL/min/1.73m2: aciclovir only. Valaciclovir and famciclovir are not to be supplied below eGFR 60.',
      detail:
        'The PGD does not operate the renal dosing ladder. Aciclovir at the standard dose may be supplied at eGFR 30 and above; counsel firmly on fluid intake and neurological side effects.',
      severity: 'caution',
    });
  }

  if (medicalHistory.renalImpairment === 'unknown' && !renalRiskFactors) {
    alerts.push({
      code: 'renal-unknown',
      message: 'Renal function not established.',
      detail: 'Record how renal function was assessed. Where the patient is elderly (65 or over) or has risk factors for renal impairment, refer rather than assume.',
      severity: 'caution',
    });
  }

  if (age !== null && age >= ELDERLY_AGE) {
    alerts.push({
      code: 'elderly',
      message: 'Elderly patient (65 years or over): check renal function before supply.',
      detail:
        'Renal function declines with age, often without a diagnosis of chronic kidney disease, and all three antivirals carry a higher risk of neurological adverse effects (confusion, hallucinations, somnolence) in this group.',
      severity: 'caution',
    });
  }

  if (medicalHistory.nephrotoxicMedicines) {
    alerts.push({
      code: 'nephrotoxic-medicines',
      message: 'Other nephrotoxic medicines (ACE inhibitor, ARB, diuretic, NSAID, metformin, aminoglycoside, methotrexate).',
      detail: 'Supply may still be appropriate but counsel firmly on maintaining fluid intake.',
      severity: 'caution',
    });
  }

  if (medicalHistory.tenofovir) {
    alerts.push({
      code: 'tenofovir',
      message: 'Tenofovir: supply may proceed.',
      detail: 'Advise the patient to contact the prescriber of their tenofovir about additional renal monitoring.',
      severity: 'caution',
    });
  }

  if (medicalHistory.probenecidOrCimetidine) {
    alerts.push({
      code: 'probenecid-cimetidine',
      message: 'Probenecid or cimetidine reduce renal clearance of aciclovir and valaciclovir.',
      detail: 'The therapeutic index is wide so this is usually not significant, but it matters more where renal function is already reduced.',
      severity: 'caution',
    });
  }

  if (medicalHistory.raloxifene) {
    alerts.push({
      code: 'raloxifene',
      message: 'Raloxifene with famciclovir: antiviral effect may be reduced.',
      detail: 'Raloxifene inhibits the enzyme that converts famciclovir to its active form. Monitor the clinical response, or choose another agent.',
      severity: 'caution',
    });
  }

  if (medicalHistory.allergyAciclovirValaciclovir && !medicalHistory.allergyFamciclovirPenciclovir) {
    alerts.push({
      code: 'allergy-aciclovir',
      message: 'Hypersensitivity to aciclovir or valaciclovir: neither may be supplied (cross-reactive). Famciclovir only.',
      detail: 'Known hypersensitivity to the antiviral to be supplied is an exclusion.',
      severity: 'caution',
    });
  }

  if (medicalHistory.allergyFamciclovirPenciclovir && !medicalHistory.allergyAciclovirValaciclovir) {
    alerts.push({
      code: 'allergy-famciclovir',
      message: 'Hypersensitivity to famciclovir or penciclovir: famciclovir may not be supplied (cross-reactive).',
      detail: 'Known hypersensitivity to the antiviral to be supplied is an exclusion.',
      severity: 'caution',
    });
  }

  // Mild-moderate hepatic impairment
  if (medicalHistory.hepaticImpairment === 'mild-moderate') {
    alerts.push({
      code: 'hepatic-impairment',
      message: 'Mild to moderate hepatic impairment noted.',
      detail: 'No dose modification is required in mild or moderate cirrhosis (valaciclovir SmPC). Monitor for side effects.',
      severity: 'caution',
    });
  }

  return alerts;
}

/** Agents that may be supplied to this patient, with the reason for any that may not. */
export function getMedicineAvailability(
  medicalHistory: ShinglesMedicalHistory
): { medicine: Exclude<Medicine, ''>; available: boolean; reason: string }[] {
  const nonSevere = hasNonSevereImmunosuppression(medicalHistory);
  const renalBelow60 =
    medicalHistory.renalImpairment === 'moderate' || medicalHistory.renalImpairment === 'severe';
  const renalBelow30 = medicalHistory.renalImpairment === 'severe';

  return [
    {
      medicine: 'aciclovir',
      available:
        !medicalHistory.allergyAciclovirValaciclovir && !nonSevere && !renalBelow30,
      reason: medicalHistory.allergyAciclovirValaciclovir
        ? 'hypersensitivity to aciclovir or valaciclovir'
        : nonSevere
        ? 'non-severe immunosuppression: use valaciclovir or famciclovir'
        : renalBelow30
        ? 'eGFR below 30'
        : '',
    },
    {
      medicine: 'valaciclovir',
      available:
        !medicalHistory.allergyAciclovirValaciclovir &&
        !medicalHistory.previousDress &&
        !renalBelow60,
      reason: medicalHistory.allergyAciclovirValaciclovir
        ? 'hypersensitivity to aciclovir or valaciclovir'
        : medicalHistory.previousDress
        ? 'previous DRESS reaction'
        : renalBelow60
        ? 'eGFR below 60'
        : '',
    },
    {
      medicine: 'famciclovir',
      available:
        !medicalHistory.allergyFamciclovirPenciclovir &&
        !medicalHistory.previousDress &&
        !renalBelow60,
      reason: medicalHistory.allergyFamciclovirPenciclovir
        ? 'hypersensitivity to famciclovir or penciclovir'
        : medicalHistory.previousDress
        ? 'previous DRESS reaction'
        : renalBelow60
        ? 'eGFR below 60'
        : '',
    },
  ];
}

/**
 * Get the PGD regimen for the chosen agent. The PGD does not operate a renal
 * dosing ladder: below the renal threshold for an agent the patient is
 * referred, so no renal-adjusted doses exist here.
 */
export function getRecommendedDose(
  medicine: string,
  medicalHistory: ShinglesMedicalHistory
): {
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  notes: string;
} {
  if (medicine === 'valaciclovir') {
    return {
      dose: '1000 mg (two 500 mg tablets)',
      frequency: 'three times daily',
      duration: '7 days',
      quantity: 42,
      notes:
        'Valaciclovir 500 mg film-coated tablets: 1000 mg three times daily for 7 days (42 tablets). Preferred where five times daily dosing is impractical or in non-severe immunosuppression. Not below eGFR 60.',
    };
  }
  if (medicine === 'aciclovir') {
    return {
      dose: '800 mg',
      frequency: 'five times daily at approximately four hourly intervals, omitting the night dose',
      duration: '7 days',
      quantity: 35,
      notes:
        'Aciclovir 800 mg tablets or dispersible tablets: 800 mg five times daily for 7 days (35 tablets). Adherence to five doses a day is the practical problem. Not below eGFR 30.',
    };
  }
  if (medicine === 'famciclovir') {
    if (hasNonSevereImmunosuppression(medicalHistory)) {
      return {
        dose: '500 mg',
        frequency: 'three times daily',
        duration: '10 days',
        quantity: 30,
        notes:
          'Famciclovir 500 mg film-coated tablets, non-severe immunosuppression: 500 mg three times daily for 10 days (30 tablets). Not below eGFR 60.',
      };
    }
    return {
      dose: '500 mg',
      frequency: 'three times daily',
      duration: '7 days',
      quantity: 21,
      notes:
        'Famciclovir 500 mg film-coated tablets, immunocompetent: 500 mg three times daily for 7 days (21 tablets). Not part of NHS Pharmacy First. Not below eGFR 60.',
    };
  }

  return {
    dose: '',
    frequency: '',
    duration: '',
    quantity: 0,
    notes: '',
  };
}

/**
 * Validate symptom data
 */
export function validateSymptomStep(symptoms: ShinglesSymptoms): string | null {
  if (!symptoms.rashOnsetDate) {
    return 'Date of rash onset is required';
  }
  if (calculateHoursSinceOnset(symptoms.rashOnsetDate, symptoms.rashOnsetTime) === null) {
    return 'Date of rash onset: the date (and time, if entered) cannot be in the future. Check the date';
  }
  if (!symptoms.rashStage) {
    return 'Rash stage must be selected';
  }
  if (!symptoms.dermatome) {
    return 'Dermatome location is required';
  }
  if (!symptoms.rashSeverity) {
    return 'Rash severity must be recorded';
  }
  if (symptoms.painLevel === null || symptoms.painLevel < 0 || symptoms.painLevel > 10) {
    return 'Pain score must be recorded on the 0 to 10 scale';
  }
  if (!symptoms.painType) {
    return 'Pain type must be selected';
  }
  if (!symptoms.newVesiclesForming) {
    return 'Answer "New vesicles are still forming": Yes or No';
  }
  if (!symptoms.highRiskSevereShingles) {
    return 'Answer "High risk of severe shingles (for example severe atopic eczema)": Yes or No';
  }
  if (!symptoms.rashDescription.trim()) {
    return 'Rash description is required';
  }
  if (!symptoms.unilateral) {
    return 'Answer whether the rash is unilateral, dermatomal and does not cross the midline';
  }
  if (symptoms.unilateral === 'no') {
    return 'The rash is not a unilateral dermatomal rash: refer, not for supply under this PGD';
  }
  if (!symptoms.ophthalmicExcluded) {
    return 'Record that ophthalmic involvement was specifically excluded (PGD records requirement)';
  }
  return null;
}

/**
 * Validate medical history data
 */
export function validateMedicalHistoryStep(medicalHistory: ShinglesMedicalHistory): string | null {
  if (medicalHistory.immunosuppressed && !medicalHistory.immunosuppressedDetails.trim()) {
    return 'Please provide details of immunosuppression';
  }
  if (
    (medicalHistory.immunosuppressed || medicalHistory.hivPositive) &&
    !medicalHistory.immunosuppressionSeverity
  ) {
    return 'Classify the immunosuppression as severe or non-severe (Green Book chapter 28a)';
  }
  if (!medicalHistory.renalImpairment) {
    return 'Renal function (eGFR, mL/min/1.73m2): select a band, or "Not known / not established"';
  }
  if (!medicalHistory.renalFunctionSource.trim()) {
    return 'Record renal function and how it was established (PGD records requirement)';
  }
  if (!medicalHistory.hepaticImpairment) {
    return 'Hepatic impairment: select none, mild to moderate, or severe';
  }
  return null;
}

/**
 * Validate medicine selection
 */
export function validateMedicineSelectionStep(
  selection: ShinglesMedicineSelection,
  medicalHistory?: ShinglesMedicalHistory
): string | null {
  if (!selection.medicine) {
    return 'Medicine must be selected';
  }
  if (medicalHistory) {
    const entry = getMedicineAvailability(medicalHistory).find((m) => m.medicine === selection.medicine);
    if (entry && !entry.available) {
      return `${selection.medicine} may not be supplied to this patient (${entry.reason})`;
    }
  }
  // The regimen is the PGD's, read-only. Anything else is a prescription,
  // not a PGD supply (adversarial review, 11 Sep 2026).
  if (medicalHistory) {
    const pgd = getRecommendedDose(selection.medicine, medicalHistory);
    if (
      selection.dose !== pgd.dose ||
      selection.frequency !== pgd.frequency ||
      selection.duration !== pgd.duration ||
      selection.quantity !== pgd.quantity
    ) {
      return 'The regimen recorded does not match the PGD regimen for this agent. Only the PGD regimen may be supplied; any deviation is a referral to a prescriber';
    }
  }
  if (!selection.dose || !selection.frequency || !selection.duration || selection.quantity <= 0) {
    return 'The PGD regimen could not be determined for the selected agent';
  }
  if (!selection.brand.trim()) {
    return 'Brand / manufacturer supplied must be recorded (PGD records requirement: name and brand of the medicine)';
  }
  if (!selection.batchNumber.trim()) {
    return 'Batch number must be recorded (PGD records requirement)';
  }
  return null;
}

/**
 * Validate counselling
 */
export function validateCounsellingStep(counselling: ShinglesCounselling): string | null {
  // Name the first item still unticked, in the label's own words.
  const requiredItems: [keyof ShinglesCounselling, string][] = [
    ['completeCourse', 'Counselled patient on completing the full course'],
    ['leafletAndDosing', 'Leaflet given, dosing schedule explained, and return of unused medicine advised'],
    ['hydration', 'Counselled on maintaining a good fluid intake throughout the course'],
    ['painManagement', 'Counselled on pain management'],
    ['rashCare', 'Counselled on rash care'],
    ['contagiousPeriod', 'Counselled on the infectious period'],
    ['pregnancyExposure', 'Counselled to avoid pregnant women who have not had chickenpox, babies under one month, and immunosuppressed people'],
    ['PHNRisk', 'Explained post-herpetic neuralgia'],
    ['returnIfWorsening', 'Safety netting advice given'],
    ['vaccinationAdvice', 'Advised to discuss the shingles vaccine with the GP practice once recovered'],
  ];

  for (const [item, label] of requiredItems) {
    if (counselling[item] !== true) {
      return `Tick "${label}" once it has been covered (every counselling item is required)`;
    }
  }
  return null;
}

/**
 * Check if patient can proceed (no blocking alerts)
 */
export function canProceedToMedicineSelection(alerts: ClinicalAlert[]): boolean {
  return !alerts.some((a) => a.severity === 'stop');
}
