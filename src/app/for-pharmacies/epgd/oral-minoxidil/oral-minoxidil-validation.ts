import type {
  OMConsent,
  OMCounselling,
  OMDiagnosis,
  OMMeasurements,
  OMMedicalHistory,
  OMMedicines,
  OMPatientDetails,
  OMSummary,
  OMSupply,
  OMSupplyHistory,
  OMWomen,
} from './oral-minoxidil-types';
import type { PrefillableField } from './oral-minoxidil-types';
import { AWAITING_REVIEW_MAX_GAP_DAYS, DOSE_INCREASE_MIN_SUPPLY_NUMBER, FACE_TO_FACE_CV_REVIEW_TYPES, MAX_SUPPLIES, RESTART_GAP_DAYS } from './oral-minoxidil-types';
import {
  cautionMedicinesList,
  cocMigraineAuraApplies,
  doseIncreaseBlockedReason,
  doseResumeBlockedReason,
  doseToday,
  gapDays,
  gapIsRestart,
  isExpired,
  isHigh,
  isLow,
  isBorderlineLow,
  lowerSeated,
  maximumDose,
  onHigherDose,
  posturalFall,
  repeatReading,
  repeatPhotosRequired,
  periodVisitNumber,
  startingDose,
  dosesForSex,
  daysSince,
} from './oral-minoxidil-clinical-logic';

const PREFILL_FIELD_LABEL: Record<PrefillableField, string> = {
  firstSupplyDate: 'date of the first supply',
  suppliesSoFar: 'supplies so far',
  prescriberReviewHeld: 'prescriber review held',
  suppliesSinceReview: 'supplies since the prescriber review',
  currentDose: 'current dose',
  doseIncreasedBefore: 'dose increase used',
  restartedBefore: 'restarted before',
  suppliesSinceRestart: 'supplies since the restart',
  baselineSystolic: 'baseline systolic',
  previousWeightKg: 'previous weight',
  previousCvStop: 'previous cardiovascular stop',
  previousNonCvStop: 'previous non-cardiovascular stop',
  nonCvStopRetriedBefore: 'starting dose retried before',
  returnVisitUsedBefore: 'return visit used',
};

/** Every prefilled field the pharmacist has unlocked needs a reason for the change. */
export function prefillOverrideError(history: OMSupplyHistory): string | null {
  const p = history.prefill;
  if (!p) return null;
  for (const key of Object.keys(p.overrides) as PrefillableField[]) {
    if (!(p.overrides[key] ?? '').trim()) return `The ${PREFILL_FIELD_LABEL[key]} was carried forward from the previous record (${p.consultationDate}): a reason is required to change it`;
  }
  return null;
}

export function validateOMPatientStep(patient: OMPatientDetails): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.address.trim()) return 'Patient address is required for the PGD record';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 0) return 'Date of birth is in the future: check the date entered';
  if (!patient.sex) return 'Record the patient\'s sex (the starting dose and the women\'s checks depend on it)';
  if (!patient.gpPractice.trim()) return 'The GP practice is required: GP notification within 7 days is a condition of supply';
  if (!patient.gpRegistered) return 'Confirm whether the patient is registered with a GP';
  if (!patient.gpNotificationAgreed) return 'Confirm whether the patient agrees to the GP being informed';
  return null;
}

export function validateOMConsentStep(consent: OMConsent): string | null {
  if (consent.patientDeclined) return 'Patient declines treatment: record the advice given and the decision reached, then save the record';
  if (!consent.faceToFace) return 'Confirm the consultation is face to face on the pharmacy premises (remote or telephone consultation is outside this PGD)';
  if (consent.lacksCapacity) return 'The patient lacks capacity to consent: this is an exclusion. Record the advice given and save as not supplied';
  if (!consent.offLabelScriptGiven) return 'Tick that the off-label consent script was given in substance';
  if (!consent.toldLicenceAndAlternatives) return 'Tick that the patient was told what the licence is for, why minoxidil is being used off-label, and the alternatives';
  if (!consent.acceptsOffLabel) return 'Record whether the patient accepts off-label treatment after the explanation';
  if (!consent.consentStatementSigned) return 'The patient must sign the consent statement on the consultation record: tick once signed (the signature line prints on the record)';
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService) return 'Patient must be aware this is a private service';
  if (!consent.understandsCost) return 'Tick "The patient understands what this service costs" once explained';
  return null;
}

export function validateOMHistoryStep(history: OMSupplyHistory, patient: OMPatientDetails): string | null {
  if (!history.supplyType) return 'Select whether this is a first supply, a continuation or a restart';
  if (history.onFinasteride && !history.finasterideSource.trim()) return 'Record the source of the finasteride (this pharmacy under the Male Pattern Hair Loss PGD, or prescribed elsewhere)';
  if (history.onTopicalMinoxidil && !history.topicalMinoxidilSource.trim()) return 'Record the source of the topical minoxidil';
  if (history.supplyType === 'first') return null;

  if (!history.firstSupplyDate) return 'Record the date of the first supply under this PGD';
  const sinceFirst = daysSince(history.firstSupplyDate);
  if (sinceFirst !== null && sinceFirst < 0) return 'The date of the first supply cannot be in the future';
  if (history.suppliesSoFar === null || history.suppliesSoFar < 1) return 'Record the number of supplies so far under this PGD (at least 1; counted by supply number, not reset by a gap or restart)';
  if (history.prescriberReviewHeld) {
    if (!history.prescriberReviewDate) return 'Record the date of the written prescriber review confirmation';
    if (!history.prescriberReviewBy.trim()) return 'Record who gave the written prescriber review confirmation';
    if (!history.prescriberReviewType) return 'Record how the prescriber review was held (GP; Get Real Health prescriber face to face or by video)';
    if (history.suppliesSinceReview === null || history.suppliesSinceReview < 0) return 'Record the number of supplies since the prescriber review (0 where this is the first since)';
    if (history.suppliesSinceReview > history.suppliesSoFar) return 'Supplies since the prescriber review cannot exceed the supplies so far';
  }
  if (!history.currentDose) return history.supplyType === 'restart' ? 'Record the dose the patient was taking before the gap' : 'Record the dose the patient has been taking';
  if (!dosesForSex(patient.sex).includes(history.currentDose as Exclude<typeof history.currentDose, ''>))
    return `The recorded dose is not one this PGD authorises for a ${patient.sex === 'male' ? 'man (2.5 mg or 5 mg)' : 'woman (1.25 mg or 2.5 mg)'}: check the dose and the sex recorded`;
  // The dose the patient has been taking must be consistent with the
  // course. The higher dose (men 5 mg, women 2.5 mg) is only reached by the
  // once-only increase, which is not made before the fourth supply visit;
  // so a higher current dose, or a used increase, needs at least four
  // supplies so far.
  const higherDose = onHigherDose(patient.sex, history);
  const maxLabel = maximumDose(patient.sex) === '5' ? '5 mg' : '2.5 mg';
  if (higherDose && !history.doseIncreasedBefore)
    return `The patient is recorded on the higher dose (${maxLabel}), which is only reached by the once-only increase: tick "The dose increase has already been used" (it is set automatically when the higher dose is selected)`;
  if ((higherDose || history.doseIncreasedBefore) && history.suppliesSoFar < DOSE_INCREASE_MIN_SUPPLY_NUMBER)
    return `${higherDose ? `A current dose of ${maxLabel}` : 'A used dose increase'} is not consistent with ${history.suppliesSoFar} supplies so far: the increase is not made before supply visit ${DOSE_INCREASE_MIN_SUPPLY_NUMBER}, so at least ${DOSE_INCREASE_MIN_SUPPLY_NUMBER} supplies must have been made. Check the supplies so far and the dose recorded`;
  if (history.supplyType === 'continuation' && history.restartedBefore) {
    if (history.suppliesSinceRestart === null || history.suppliesSinceRestart < 1) return 'Record the number of supplies since the most recent restart, counting the restart supply itself (at least 1)';
    if (history.suppliesSinceRestart > history.suppliesSoFar) return 'Supplies since the restart cannot exceed the supplies so far';
    if (higherDose && history.suppliesSinceRestart < DOSE_INCREASE_MIN_SUPPLY_NUMBER)
      return `A current dose of ${maxLabel} is not consistent with ${history.suppliesSinceRestart} supplies since the restart: a restart is at the starting dose and the higher dose is only resumed at or after the fourth supply visit following it. Check the supplies since the restart and the dose recorded`;
  }
  if (!history.previousCvStop) return 'Record whether the patient is returning after a course under this PGD was stopped for a cardiovascular stop';
  if (history.previousCvStop === 'yes' && history.supplyType === 'continuation')
    return 'After a cardiovascular stop the return to treatment is a restart at the starting dose whatever the gap, after the face to face prescriber review: select "Restart" as the supply type';
  if (!history.lastTabletDate) return 'Record the date the last tablet was taken, to measure any gap';
  const gap = gapDays(history);
  if (gap !== null && gap < 0) return 'The date of the last tablet cannot be in the future';
  const restartGap = gapIsRestart(history);
  if (history.supplyType === 'continuation' && gap !== null && gap > RESTART_GAP_DAYS && restartGap) {
    if (gap > AWAITING_REVIEW_MAX_GAP_DAYS)
      return `${gap} days without tablets: more than 8 weeks is a restart at the starting dose even where the patient was waiting for the prescriber review. Select "Restart" as the supply type`;
    if (!history.gapAwaitingReview)
      return `${gap} days without tablets: a gap of more than 4 weeks is a restart at the starting dose, unless it was caused only by waiting for the prescriber review after supply 6 (tick that below). Otherwise select "Restart" as the supply type`;
    return `${gap} days without tablets: the awaiting-review exception applies only after six supplies, with the prescriber review now held and no supply made since it. Select "Restart" as the supply type`;
  }
  // A restart after a cardiovascular stop is a restart whatever the gap: the
  // tablets were stopped at the symptom and are not resumed until the review.
  if (history.supplyType === 'restart' && restartGap === false && history.previousCvStop !== 'yes')
    return gap !== null && gap <= RESTART_GAP_DAYS
      ? `${gap} days without tablets is not a gap of more than 4 weeks: select "Continuation" as the supply type`
      : `${gap} days without tablets while awaiting the prescriber review after supply 6 is not a restart: select "Continuation" as the supply type`;
  // The 2 kg rule applies at a continuation only. At a restart the comparison
  // starts afresh from today's values, so the previous weight is optional.
  if (history.supplyType === 'continuation' && history.previousWeightKg === null) return 'Record the weight at the previous supply (kg), for the 2 kg rule';
  if (history.supplyType === 'continuation' && history.baselineSystolic === null)
    return 'Record the baseline systolic (the lower seated systolic at the first supply, or at the most recent restart), for the 10 mmHg rule';
  if (history.previousCvStop === 'yes' && history.cvStopReviewHeld) {
    if (!history.cvStopReviewDate) return 'Record the date of the written prescriber confirmation that treatment may restart';
    if (!history.cvStopReviewBy.trim()) return 'Record the prescriber who reviewed the patient after the cardiovascular stop';
    if (!history.cvStopReviewType) return 'Record how the review after the cardiovascular stop was held: it must be face to face (the GP, or a Get Real Health prescriber in person)';
    if (FACE_TO_FACE_CV_REVIEW_TYPES.has(history.cvStopReviewType)) {
      if (!history.cvStopReviewOedemaExamined) return 'Tick that the face to face review included examination for oedema';
      if (!history.cvStopReviewRepeatBp) return 'Tick that the face to face review included a repeat blood pressure';
      if (!history.cvStopSymptomResolvedConfirmed) return 'Tick that the written confirmation says the symptom has resolved off treatment';
    }
  }
  if (!history.previousNonCvStop) return 'Record whether a course under this PGD was previously stopped because the starting dose was not tolerated';
  if (history.seUnacceptable && !(history.seHypertrichosis || history.seHeadache || history.seInsomnia || history.seGiUpset || history.seOther.trim()))
    return 'Tick or record the side effect the patient finds unacceptable';
  if (!history.adherenceNote.trim()) return history.supplyType === 'restart' ? 'Record adherence before the gap and the reason for the gap' : 'Record adherence since the last supply';
  if (patient.sex === 'female' && history.contraceptionChanged && !history.contraceptionReplacementConfirmed)
    return 'The contraceptive method was stopped or changed: confirm the replacement method (recorded on the Women step)';
  const override = prefillOverrideError(history);
  if (override) return override;
  return null;
}

export function validateOMDiagnosisStep(diagnosis: OMDiagnosis, patient: OMPatientDetails, history: OMSupplyHistory): string | null {
  const first = history.supplyType === 'first';
  const restart = history.supplyType === 'restart';
  if (!diagnosis.scalpExamined) return restart ? 'Restart: confirm the scalp was re-examined on the premises with the hair parted, as at a first supply' : 'Confirm the scalp was examined on the premises with the hair parted';
  if (!diagnosis.onset) return 'Record the onset of the hair loss';
  if (!diagnosis.pattern) return 'Record the pattern of the hair loss';
  if (patient.sex === 'male' && diagnosis.pattern === 'female') return 'Female pattern recorded for a man: check the pattern and the sex recorded';
  if (patient.sex === 'female' && diagnosis.pattern === 'male') return 'Male pattern recorded for a woman: a receding hairline in a woman suggests frontal fibrosing alopecia (refer). Check the pattern recorded';
  if (!diagnosis.durationText.trim()) return 'Record the pattern and duration of the hair loss in words';
  if (!diagnosis.scalpFeaturesAsked) return 'Tick that each of the scalp features was examined or asked about';
  if (patient.sex === 'female' && !diagnosis.hyperandrogenismAsked) return 'Tick that each of the signs of hyperandrogenism was examined or asked about';
  if ((first || restart) && diagnosis.pullTestCount === null)
    return restart
      ? 'Restart: repeat the pull test as at a first supply and record the count (hairs released by a gentle pull on a bundle of about 50 to 60 hairs)'
      : 'Record the pull test count (hairs released by a gentle pull on a bundle of about 50 to 60 hairs)';
  if (diagnosis.trigger12Months && !diagnosis.trigger12MonthsDetail.trim()) return 'Record the trigger (childbirth, serious illness, major surgery, rapid weight loss or the medicine)';
  if (first) {
    if (!diagnosis.photoConsent) return 'Record the patient\'s consent to baseline photographs';
    if (!diagnosis.photoCrownTaken) return 'Take and record the baseline photograph of the crown from above';
    if (!diagnosis.photoFrontalTaken) return 'Take and record the baseline photograph of the frontal hairline from the front, hair parted in the midline';
    if (!diagnosis.photosStored) return 'Confirm the baseline photographs are stored in the record';
  }
  if (repeatPhotosRequired(history)) {
    const visit = periodVisitNumber(history);
    if (!diagnosis.repeatPhotosTaken) return `This is supply visit ${visit}: a full review, so repeat photographs must be taken in the same way as the baseline`;
    if (!diagnosis.response) return 'Record the response against the baseline photographs';
    if (diagnosis.response === 'not-assessed') return 'Supply visits 4 and 6 are full reviews: the response must be assessed';
  }
  if (history.supplyType === 'continuation' && diagnosis.response === 'inadequate' && !diagnosis.repeatPhotosTaken)
    return 'An inadequate response is assessed against the baseline photographs: take repeat photographs and tick that they were taken';
  return null;
}

export function validateOMWomenStep(women: OMWomen, patient: OMPatientDetails, history: OMSupplyHistory, medical: OMMedicalHistory): string | null {
  if (patient.sex !== 'female') return null;
  const first = history.supplyType === 'first';
  if (!women.questionsAsked) return 'Tick that each question on this step was put to the patient';
  if (first) {
    if (!women.resultsAvailable) return 'Record whether ferritin and thyroid results from the last 12 months were seen';
    if (women.resultsAvailable === 'yes') {
      if (women.ferritinValue === null) return 'Record the ferritin value (micrograms/L)';
      if (!women.ferritinDate) return 'Record the date of the ferritin test';
      if (!women.tshValue.trim()) return 'Record the thyroid stimulating hormone value';
      if (!women.tshWithinRange) return 'Record whether the TSH is within the laboratory reference range';
      if (!women.tshDate) return 'Record the date of the thyroid test';
      if (!women.testSource) return 'Record where the results were seen (NHS App, GP letter or laboratory report)';
      const fd = daysSince(women.ferritinDate);
      const td = daysSince(women.tshDate);
      if ((fd !== null && fd < 0) || (td !== null && td < 0)) return 'A test date cannot be in the future';
    }
  }
  if (!women.childbearingPotential) return 'Record whether the patient is of childbearing potential';
  if (women.childbearingPotential === 'no' && !women.notPotentialReason) return 'Record why she is not of childbearing potential (post-menopausal or permanently sterilised)';
  if (women.childbearingPotential === 'yes') {
    if (!women.pregnant) return 'Record that pregnancy is excluded on her own account';
    if (women.pregnant === 'no' && !women.lmpDate) return 'Record the last menstrual period';
    if (!women.contraceptionMethod) return 'Record the contraceptive method';
    if (women.contraceptionMethod !== 'none' && women.contraceptionMethod !== 'fertility-awareness' && women.contraceptionMethod !== 'withdrawal' && !women.agreesToContinue)
      return 'Tick that she agrees to continue the method and to tell the pharmacy if she stops';
    if (cocMigraineAuraApplies(women, medical)) {
      if (first && women.cocPrescriberReviewed && !women.cocReviewOutcome.trim())
        return 'Record the outcome of her prescriber\'s review of the contraceptive method';
      if (!first && !women.cocReferralRecorded)
        return 'Combined hormonal contraception with migraine with aura: supply may continue only where she is seen about it within 4 weeks and the referral is recorded. Tick that the referral is recorded';
    }
  }
  return null;
}

export function validateOMMedicalStep(medical: OMMedicalHistory, history: OMSupplyHistory): string | null {
  if (!medical.questionsAsked)
    return history.supplyType === 'restart'
      ? 'Restart: confirm the cardiovascular and medical history was re-taken and every exclusion question on this step was put to the patient again'
      : 'Confirm every cardiovascular and medical exclusion question on this step was put to the patient';
  return null;
}

export function validateOMMedicinesStep(medicines: OMMedicines, patient: OMPatientDetails, history: OMSupplyHistory): string | null {
  if (medicines.pde5OnDemand && patient.sex === 'male' && patient.age !== null && patient.age < 40 && !medicines.edVascularAsked && !medicines.edVascularDoubt)
    return 'Man under 40 using a PDE5 inhibitor: tick that exercise tolerance and chest symptoms were asked about';
  if (cautionMedicinesList(medicines).length > 0 && !medicines.cautionSatisfied)
    return 'A medicine that can lower blood pressure or cause fluid retention is ticked: record whether the pharmacist is satisfied to supply after considering blood pressure and fluid retention (refer where in doubt)';
  if (!medicines.questionsAsked)
    return history.supplyType === 'restart'
      ? 'Restart: confirm the medicines history was re-taken, every medicine in the exclusion list was asked about again and current medicines are recorded'
      : 'Confirm every medicine in the exclusion list was asked about and that current medicines are recorded';
  return null;
}

export function validateOMMeasurementsStep(m: OMMeasurements, history: OMSupplyHistory, medicines: OMMedicines): string | null {
  const first = history.supplyType === 'first';
  if (history.supplyType === 'continuation' && !history.sxQuestionsAsked) return 'Tick that each of the stop symptoms since the last visit was asked about';
  if (m.seated1Systolic === null || m.seated1Diastolic === null) return 'Record the first seated blood pressure reading (after 5 minutes rest)';
  if (m.seated2Systolic === null || m.seated2Diastolic === null) return 'Record the second seated blood pressure reading (1 to 2 minutes after the first)';
  const lower = lowerSeated(m);
  const lowerLow = !!lower && (isLow(lower) || (isBorderlineLow(lower) && m.dizzinessOrFaintness));
  if (lower && isHigh(lower) && !m.repeatTaken) return 'The lower seated reading is at or above 140/90: take a third reading after a further 5 minutes seated and record it';
  if (lowerLow && !m.repeatTaken) return 'The lower seated systolic is below the limit (below 90, or 90 to 99 with dizziness or faintness): take a third reading after a further 5 minutes seated and record it';
  if (m.repeatTaken && (m.repeatSystolic === null || m.repeatDiastolic === null)) return 'Record the third (repeat) reading';
  const rep = repeatReading(m);
  const repLow = !!rep && (isLow(rep) || (isBorderlineLow(rep) && m.dizzinessOrFaintness));
  const seatedOutsideOnRepeat = !!lower && !!rep && ((isHigh(lower) && isHigh(rep)) || (lowerLow && repLow));
  if (m.standingSystolic === null || m.standingDiastolic === null) return 'Record the standing blood pressure after 1 minute';
  const fall = posturalFall(m);
  const posturalOutside = (!!fall && (fall.systolic >= 20 || fall.diastolic >= 10)) || m.standingSymptoms;
  if (m.pulse === null) return 'Record the resting pulse';
  if ((m.pulse < 50 || m.pulse > 100) && !m.pulseRepeatTaken) return 'The resting pulse is outside 50 to 100: repeat it after a further 5 minutes seated and record the repeat (the limit applies on repeat)';
  if (m.pulseRepeatTaken && m.pulseRepeat === null) return 'Record the repeat pulse';
  const pulseOutsideOnRepeat = m.pulseRepeatTaken && m.pulseRepeat !== null && (m.pulseRepeat < 50 || m.pulseRepeat > 100);
  if (first && (seatedOutsideOnRepeat || posturalOutside || pulseOutsideOnRepeat) && !m.returnVisitForBp && !history.returnVisitUsedBefore)
    return 'Record whether this is the one permitted return visit after a blood pressure or pulse reading outside the limits on repeat';
  if (m.weightKg === null) return 'Record the weight on the pharmacy scales, in light clothing';
  if (first && m.heightCm === null) return 'Record the height at the first supply (for the body mass index)';
  if (medicines.weightLossTreatment && !m.fluidSymptomsAsked) return 'Weight loss treatment: tick that ankle swelling, tight shoes or rings and breathlessness were asked about specifically';
  return null;
}

export function validateOMSupplyStep(
  supply: OMSupply,
  history: OMSupplyHistory,
  patient: OMPatientDetails,
  diagnosis: OMDiagnosis,
  m: OMMeasurements
): string | null {
  if (history.supplyType === 'continuation') {
    if (!supply.doseDecision) return 'Record the dose decision at this review';
    if (supply.doseDecision === 'increase') {
      const why = doseIncreaseBlockedReason(patient.sex, history, diagnosis, m);
      if (why) return `Dose increase not permitted: ${why}`;
    }
    if (supply.doseDecision === 'resume') {
      const why = doseResumeBlockedReason(patient.sex, history, diagnosis, m);
      if (why) return `Resuming the higher dose not permitted: ${why}`;
    }
    if (supply.doseDecision === 'reduce') {
      if (history.currentDose === startingDose(patient.sex))
        return patient.sex === 'female'
          ? 'A woman on 1.25 mg cannot step down: where the starting dose is not tolerated, select "Stop (not a cardiovascular stop)"'
          : 'The patient is already on the starting dose: where it is not tolerated, select "Stop (not a cardiovascular stop)"';
      if (!supply.reductionReason.trim()) return 'Record the non-cardiovascular side effect that justifies the reduction';
    }
    if (supply.doseDecision === 'stop-non-cv') return 'Stopped for a non-cardiovascular side effect: record the advice given and save the record as not supplied';
    if ((supply.doseDecision === 'increase' || supply.doseDecision === 'resume' || supply.doseDecision === 'reduce') && !supply.doseChangeToldPatient)
      return 'Tick that the patient was told about the dose change';
  }
  const dose = doseToday(patient.sex, history, supply);
  if (!dose) return 'The dose cannot be determined: check the sex and supply type recorded';
  if (!supply.batchNumber.trim()) return 'Record the batch number';
  if (!supply.expiryDate) return 'Record the expiry date';
  if (isExpired(supply.expiryDate)) return 'The pack has expired: select another pack';
  if (!supply.nextReviewDate) return 'Record the next review date (8 weeks from today)';
  if (dose === '1.25' && !supply.tabletSplitterSupplied) return 'Women at 1.25 mg: show the patient how to halve the tablet along the score line and tick that a tablet splitter was offered or supplied';
  if (!supply.labelledAsDirected) return 'Tick that the medicine is labelled as a dispensed medicine with the dose in plain words and the stop wording';
  if (!supply.pilSupplied) return 'Tick that the manufacturer\'s patient information leaflet was supplied';
  if (!supply.pilLicensedUseExplained) return 'Tick that the patient was told the leaflet describes use for blood pressure because that is the licence';
  if (!supply.alternativesOffered) return 'Record which licensed alternatives were offered or discussed';
  return null;
}

export function validateOMCounsellingStep(c: OMCounselling, patient: OMPatientDetails, history: OMSupplyHistory): string | null {
  if (!c.oneDoseDaily) return 'Tick "Take one dose a day at the same time" once explained';
  if (!c.sheddingExpected) return 'Tick the shedding and response advice once explained';
  if (!c.hypertrichosisWarningWritten) return 'The hypertrichosis warning (including that the hair colour can change) must be given, in writing: tick once done';
  if (!c.rashBlisteringAdvice) return 'Tick "Stop and seek advice for a rash or blistering of the skin or mouth" once explained';
  if (!c.stopSeekHelpWritten) return 'The stop-and-seek-help advice must be given, in writing: tick once done';
  if (patient.sex === 'male' && !c.pde5Advice) return 'Men: tick the PDE5 inhibitor advice once given';
  if (!c.standSlowlyAlcoholDriving) return 'Tick the standing, alcohol and driving advice once given';
  if (patient.sex === 'female' && !c.pregnancyAdvice) return 'Women: tick the pregnancy and contraception advice once given';
  if (!c.tellDoctors) return 'Tick "Tell any doctor, dentist or pharmacist that you take minoxidil" once explained';
  if (!c.reviewDateAndGap) return 'Tick the review date, 4 week gap and six-supply (about eleven months) doctor review advice once explained';
  if (!c.keepLastWeekTablets) return 'Tick "Keep your last week of tablets until the prescriber review is confirmed" once explained';
  if (!c.toldNextReviewDate) return 'Tick that the patient was told the date the next review is due';
  if (!c.writtenRecordGiven) return 'Tick that the written record of the dose, the stop-and-seek-help advice, the hypertrichosis warning and the review date was given';
  if (!c.gpToBeInformed) return 'Tick that the GP will be informed within 7 days';
  if (history.onTopicalMinoxidil && !c.topicalSameDrugExplained) return 'Topical minoxidil in use: tick that the patient was told the oral and topical products are the same drug';
  if (c.adverseReaction && !c.adverseReactionDetails.trim()) return 'Record the adverse reaction and the action taken';
  if (!c.allCounsellingComplete) return 'Tick "All counselling completed and documented"';
  return null;
}

export function validateOMSummaryStep(summary: OMSummary, technicianProfile: boolean): string | null {
  if (technicianProfile) return 'This PGD is not used by pharmacy technicians: only a registered pharmacist may supply under it';
  if (!summary.registeredPharmacistConfirmed) return 'Confirm "I am a pharmacist registered with the GPhC": this PGD is for pharmacists only';
  if (!summary.pharmacistName.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC.trim()) return 'GPhC registration number is required';
  if (!summary.gpNotificationMethod.trim()) return 'Record how the GP will be informed within 7 days';
  return null;
}

export function validateOMExclusionOutcome(summary: OMSummary): string | null {
  if (!summary.exclusionAdvice.trim()) return 'Record the reason discussed, the advice given, the alternatives offered and the decision reached';
  if (!summary.referral) return 'Select the "Referral or next action"';
  return null;
}

export { MAX_SUPPLIES };
