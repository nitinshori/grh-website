'use client';

import React from 'react';
import { SectionHeader, Row, AlertSummary, CounsellingGrid } from '../../shared/components/SummaryReportShell';
import type { ClinicalAlert } from '../../shared/types';
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
  PrefillableField,
} from '../oral-minoxidil-types';
import {
  BASELINE_SYSTOLIC_DEFINITION,
  CONTRACEPTION_LABEL,
  CV_STOP_REVIEW_TYPE_LABEL,
  DOSE_INFO,
  LABEL_STOP_WORDING,
  OFF_LABEL_CONSENT_SCRIPT,
  OFF_LABEL_RECORD_WORDS,
  ORAL_MINOXIDIL_PGD_NAME,
  ORAL_MINOXIDIL_PGD_VERSION,
  PATIENT_CONSENT_STATEMENT,
  PRESCRIBER_REVIEW_TYPE_LABEL,
  PRODUCT,
  REFERRAL_LABEL,
  STOP_AND_SEEK_HELP_ADVICE,
  SUPPLY_TYPE_LABEL,
  TEST_SOURCE_LABEL,
} from '../oral-minoxidil-types';
import {
  applicableBaselineSystolic,
  bmi,
  cardiovascularDiseaseList,
  cautionMedicinesList,
  cocMigraineAuraApplies,
  doseToday,
  increaseUsed,
  effectivePulse,
  effectiveSeated,
  excludedMedicinesList,
  hyperandrogenismFeatures,
  isCardiovascularStop,
  lowerSeated,
  maximumDose,
  nonAndrogeneticFeatures,
  onHigherDose,
  periodVisitNumber,
  posturalFall,
  prescriberReviewSoughtToday,
  repeatPhotosRequired,
  repeatReading,
  stopSymptomList,
  stopSymptomUrgency,
  suppliesCounted,
  tabletsFor,
  todaySupplyNumber,
  visitNumberSinceRestart,
  weightChange,
} from '../oral-minoxidil-clinical-logic';

interface Props {
  patient: OMPatientDetails;
  consent: OMConsent;
  history: OMSupplyHistory;
  diagnosis: OMDiagnosis;
  women: OMWomen;
  medical: OMMedicalHistory;
  medicines: OMMedicines;
  measurements: OMMeasurements;
  supply: OMSupply;
  counselling: OMCounselling;
  summary: OMSummary;
  clinicalAlerts: ClinicalAlert[];
  isBlocked: boolean;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');
const reading = (s: number | null, d: number | null) => (s !== null && d !== null ? `${s}/${d} mmHg` : 'Not recorded');

function SignatureBlock({ name, gphc, pharmacy }: { name: string; gphc: string; pharmacy: string }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
        <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{name || ''}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">GPhC registration number</p>
        <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{gphc || ''}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
        <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacy || ''}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist signature and date</p>
        <div className="border-b border-gray-300 min-h-[2rem]" />
      </div>
    </div>
  );
}

export default function OralMinoxidilSummaryReport({
  patient,
  consent,
  history,
  diagnosis,
  women,
  medical,
  medicines,
  measurements,
  supply,
  counselling,
  summary,
  clinicalAlerts,
  isBlocked,
}: Props) {
  const isWoman = patient.sex === 'female';
  const isMan = patient.sex === 'male';
  const isFirst = history.supplyType === 'first';
  const isRestart = history.supplyType === 'restart';
  const isReview = history.supplyType === 'continuation' || isRestart;
  const dose = doseToday(patient.sex, history, supply);
  const doseInfo = dose ? DOSE_INFO[dose] : null;
  const tablets = tabletsFor(dose);
  const supplyNumber = todaySupplyNumber(history);
  const visit = periodVisitNumber(history);
  const visitSinceRestart = visitNumberSinceRestart(history);
  const fullReview = repeatPhotosRequired(history);
  const reviewSought = prescriberReviewSoughtToday(history);
  const counted = suppliesCounted(history);
  const baseline = applicableBaselineSystolic(history, measurements);
  const higherAfter = !!dose && dose === maximumDose(patient.sex);
  const lower = lowerSeated(measurements);
  const repeat = repeatReading(measurements);
  const effective = effectiveSeated(measurements);
  const fall = posturalFall(measurements);
  const pulse = effectivePulse(measurements);
  const b = bmi(measurements);
  const change = weightChange(history, measurements);
  const cvStop = isCardiovascularStop(clinicalAlerts, history);
  const stops = clinicalAlerts.filter((a) => a.severity === 'stop');
  const features = nonAndrogeneticFeatures(diagnosis, patient.sex);
  const ha = hyperandrogenismFeatures(diagnosis);
  const cvd = cardiovascularDiseaseList(medical);
  const excluded = excludedMedicinesList(medicines);
  const cautionMeds = cautionMedicinesList(medicines);
  const stopSymptoms = stopSymptomList(history, measurements, change);
  const urgency = stopSymptomUrgency(history, measurements);
  const over65 = clinicalAlerts.some((a) => a.code === 'AGE_OVER_65');
  const cocApplies = cocMigraineAuraApplies(women, medical);
  const prefill = history.prefill;
  const overrideKeys = prefill ? (Object.keys(prefill.overrides) as PrefillableField[]) : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">
          {ORAL_MINOXIDIL_PGD_NAME} ePGD. {ORAL_MINOXIDIL_PGD_VERSION}. Pharmacists only.
        </p>
        <p className="mt-2 text-sm font-semibold text-navy-900">
          {isBlocked ? 'NOT SUPPLIED. ' : ''}
          {OFF_LABEL_RECORD_WORDS}
        </p>
        {isBlocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">
            {consent.patientDeclined
              ? 'NOT SUPPLIED: the patient declined treatment after counselling. No medicine was supplied under this PGD.'
              : cvStop
              ? 'NOT SUPPLIED: CARDIOVASCULAR STOP. No further supply under this PGD until a prescriber has reviewed the patient and confirmed in writing that treatment may restart.'
              : 'NOT SUPPLIED: no medicine was supplied under this PGD. The reason is recorded under Exclusion Outcome below.'}
          </p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6 print:space-y-4">
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
            <Row label="Address" value={patient.address || 'Not provided'} />
            <Row label="Date of birth" value={patient.dateOfBirth} />
            <Row label="Age" value={patient.age !== null ? `${patient.age} years` : 'N/A'} />
            <Row label="Sex" value={patient.sex === 'male' ? 'Male' : patient.sex === 'female' ? 'Female' : 'Not recorded'} />
            <Row label="NHS number" value={patient.nhsNumber || 'Not provided'} />
            <Row label="GP name" value={patient.gpName || 'Not provided'} />
            <Row label="GP practice" value={patient.gpPractice || 'Not provided'} />
            <Row label="Registered with a GP" value={patient.gpRegistered === 'yes' ? 'Yes' : patient.gpRegistered === 'no' ? 'No (exclusion)' : 'Not recorded'} />
            <Row
              label="GP notification"
              value={
                patient.gpNotificationAgreed === 'yes'
                  ? `Patient agrees to the GP being informed of the supply, any dose change and any stop for a side effect, within 7 days${summary.gpNotificationMethod ? ` (${summary.gpNotificationMethod})` : ''}`
                  : patient.gpNotificationAgreed === 'no'
                  ? 'Patient will not allow the GP to be informed (exclusion)'
                  : 'Not recorded'
              }
            />
          </div>
        </div>

        <div>
          <SectionHeader>Supply Type and Treatment History</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Supply type" value={history.supplyType ? SUPPLY_TYPE_LABEL[history.supplyType] : 'Not recorded'} />
            {prefill && (
              <>
                <Row label="Carried forward from the previous record" value={`Record ${prefill.recordId}, consultation of ${prefill.consultationDate}${prefill.previousSupplied ? ` (supply ${prefill.previousSupplyNumber ?? '?'}, ${prefill.previousDoseLabel ?? 'dose not recorded'})` : ' (not supplied)'}. Prefilled: ${prefill.fields.map((f) => `${f} = ${String(prefill.values[f])}`).join('; ')}`} />
                <Row label="Carried-forward values changed by the pharmacist" value={overrideKeys.length ? overrideKeys.map((k) => `${k}: was ${String(prefill.values[k])}, now ${String(history[k])}; reason: ${prefill.overrides[k] || 'NOT recorded'}`).join('. ') : 'None'} />
              </>
            )}
            {isReview && over65 && (
              <Row label="Patient turned 66 during treatment" value={`Finishes the 8 week supply in hand (${history.supplyType === 'restart' ? 'restart' : 'continuation'} course, supply ${history.suppliesSoFar ?? '?'}, ${history.currentDose ? DOSE_INFO[history.currentDose].label : 'dose not recorded'}), then referred to a prescriber; no further supply under this PGD`} />
            )}
            {isReview && (
              <>
                <Row label="Date of the first supply" value={history.firstSupplyDate || 'Not recorded'} />
                <Row label="Supplies so far under this PGD" value={history.suppliesSoFar !== null ? `${history.suppliesSoFar}, counted by supply number from the first supply and not reset by a gap or restart (maximum six between prescriber reviews)` : 'Not recorded'} />
                <Row label="Today's supply visit" value={supplyNumber !== null ? `Supply ${supplyNumber} from the first supply${history.prescriberReviewHeld && visit !== null ? `; supply visit ${visit} of the period since the prescriber review` : ''}${visitSinceRestart !== null && !isRestart ? `; supply visit ${visitSinceRestart} since the most recent restart` : ''}${fullReview ? ' (full review with repeat photographs)' : ''}${reviewSought ? ' (record sent for the prescriber review)' : ''}` : 'Not recorded'} />
                <Row
                  label="Prescriber review"
                  value={
                    history.prescriberReviewHeld
                      ? `Written confirmation held, dated ${history.prescriberReviewDate || 'not recorded'}, from ${history.prescriberReviewBy || 'not recorded'} (${history.prescriberReviewType ? PRESCRIBER_REVIEW_TYPE_LABEL[history.prescriberReviewType] : 'type not recorded'}); ${history.suppliesSinceReview ?? '?'} supplies since`
                      : 'None held since the first supply'
                  }
                />
                <Row label={isRestart ? 'Dose the patient was taking before the gap' : 'Dose the patient has been taking'} value={history.currentDose ? `${DOSE_INFO[history.currentDose].label}${onHigherDose(patient.sex, history) ? ' (the higher dose)' : ''}` : 'Not recorded'} />
                <Row label="Dose increase (once in the whole course)" value={increaseUsed(patient.sex, history) ? 'Already used before today' : 'Not yet used before today'} />
                <Row label="Restarted at the starting dose before today" value={history.restartedBefore ? `Yes; ${history.suppliesSinceRestart ?? '?'} supplies since the most recent restart (counting the restart supply)` : 'No'} />
                <Row label="Last tablet taken" value={history.lastTabletDate || 'Not recorded'} />
                {history.supplyType === 'continuation' && history.gapAwaitingReview && <Row label="Gap of more than 4 weeks" value="Caused only by waiting for the prescriber review after supply 6, patient off tablets for no more than 8 weeks: not a restart" />}
                <Row label="Weight at the previous supply" value={isRestart ? `Restart: the comparison starts afresh; today's weight (${measurements.weightKg !== null ? `${measurements.weightKg} kg` : 'not yet recorded'}) becomes the new previous weight${history.previousWeightKg !== null ? ` (last recorded ${history.previousWeightKg} kg, for information)` : ''}` : history.previousWeightKg !== null ? `${history.previousWeightKg} kg` : 'Not recorded'} />
                <Row label={`Baseline systolic (${BASELINE_SYSTOLIC_DEFINITION})`} value={isRestart ? `New baseline recorded today: ${baseline !== null ? `${baseline} mmHg` : 'not yet recorded'}` : history.baselineSystolic !== null ? `${history.baselineSystolic} mmHg` : 'Not recorded'} />
                <Row
                  label="Previous cardiovascular stop"
                  value={
                    history.previousCvStop === 'yes'
                      ? history.cvStopReviewHeld
                        ? `Yes; prescriber review ${history.cvStopReviewType ? CV_STOP_REVIEW_TYPE_LABEL[history.cvStopReviewType] : 'type not recorded'}, dated ${history.cvStopReviewDate || 'not recorded'}, by ${history.cvStopReviewBy || 'not recorded'}; examination for oedema: ${yesNo(history.cvStopReviewOedemaExamined)}; repeat blood pressure: ${yesNo(history.cvStopReviewRepeatBp)}; written confirmation that the symptom has resolved off treatment and treatment may restart: ${history.cvStopSymptomResolvedConfirmed ? 'held' : 'NOT held'}. The restart is at the starting dose whatever the dose before the stop`
                        : 'Yes; NO face to face prescriber confirmation held (exclusion)'
                      : history.previousCvStop === 'no'
                      ? 'No'
                      : 'Not recorded'
                  }
                />
                <Row
                  label="Previous non-cardiovascular stop (starting dose not tolerated)"
                  value={
                    history.previousNonCvStop === 'yes'
                      ? history.nonCvStopRetriedBefore
                        ? 'Yes, and the starting dose was tried once more and not tolerated again: the PGD no longer applies (exclusion)'
                        : isRestart
                        ? 'Yes; this restart is the one further try the PGD allows'
                        : 'Yes; the one further try the PGD allows is in progress'
                      : history.previousNonCvStop === 'no'
                      ? 'No'
                      : 'Not recorded'
                  }
                />
                {!isRestart && <Row label="Each stop symptom since the last visit asked about" value={history.sxQuestionsAsked ? 'Yes, confirmed by the pharmacist' : 'NOT confirmed'} />}
                <Row label={isRestart ? 'Stop symptoms (restart: the "since the last visit" checklist does not apply; dizziness or faintness today is judged under the hypotension rule)' : 'Stop symptoms since the last visit, and dizziness or faintness today'} value={stopSymptoms.length ? `${stopSymptoms.join(', ')} (cardiovascular stop; refer ${urgency === 'same-day' ? 'the same day' : 'routine GP within a week'})` : 'None'} />
                <Row
                  label="Non-cardiovascular side effects"
                  value={
                    [
                      history.seHypertrichosis ? `hypertrichosis${history.seHypertrichosisMinds ? ' (the patient minds)' : ' (the patient does not mind)'}` : null,
                      history.seHeadache ? 'headache' : null,
                      history.seInsomnia ? 'insomnia' : null,
                      history.seGiUpset ? 'gastrointestinal upset' : null,
                      history.seOther.trim() || null,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'
                  }
                />
                {history.seUnacceptable && <Row label="Side effect unacceptable to the patient" value="Yes" />}
                <Row label="Adherence" value={history.adherenceNote || 'Not recorded'} />
              </>
            )}
            <Row label="Finasteride" value={history.onFinasteride ? `Yes: ${history.finasterideSource || 'source not recorded'} (concurrent use permitted)` : 'No'} />
            <Row label="Topical minoxidil" value={history.onTopicalMinoxidil ? `Yes: ${history.topicalMinoxidilSource || 'source not recorded'} (concurrent use permitted; same drug explained)` : 'No'} />
            <Row label="Oral minoxidil from another source" value={history.oralMinoxidilElsewhere ? 'Yes (exclusion)' : 'No'} />
          </div>
        </div>

        <div>
          <SectionHeader>Diagnosis and Examination</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Onset" value={diagnosis.onset === 'gradual' ? 'Gradual, over months or years' : diagnosis.onset === 'sudden' ? 'Sudden (exclusion)' : 'Not recorded'} />
            <Row label="Pattern" value={diagnosis.pattern === 'male' ? 'Male pattern (bitemporal recession, vertex thinning)' : diagnosis.pattern === 'female' ? 'Female pattern (diffuse thinning over the crown, frontal hairline preserved)' : diagnosis.pattern === 'other' ? 'Other pattern (exclusion)' : 'Not recorded'} />
            <Row label="Pattern and duration" value={diagnosis.durationText || 'Not recorded'} />
            <Row label={isRestart ? 'Scalp re-examined on the premises at the restart, hair parted' : 'Scalp examined on the premises, hair parted'} value={yesNo(diagnosis.scalpExamined)} />
            <Row label="Each scalp feature examined or asked about" value={diagnosis.scalpFeaturesAsked ? 'Yes, confirmed by the pharmacist' : 'NOT confirmed'} />
            <Row label="Scalp normal (no redness, scale, pustules, scarring, pain or itch)" value={diagnosis.redness || diagnosis.scale || diagnosis.pustules || diagnosis.scarring || diagnosis.pain || diagnosis.itch ? 'No: ' + features.filter((f) => ['scalp redness', 'scale', 'pustules', 'scarring', 'scalp pain', 'itch'].includes(f)).join(', ') : 'Yes'} />
            <Row label="No patches of complete loss" value={diagnosis.patchesCompleteLoss ? 'Patches present (exclusion)' : 'Confirmed'} />
            <Row label="No scarring, follicular openings present" value={diagnosis.scarring || diagnosis.lossFollicularOpenings ? 'Scarring or loss of follicular openings (exclusion)' : 'Confirmed'} />
            <Row label="Broken hairs" value={diagnosis.brokenHairs ? 'Present (exclusion)' : 'None'} />
            <Row label="Hairline" value={isWoman ? (diagnosis.womanHairlineRecession ? 'Receding frontal or temporal hairline in a woman (exclusion)' : 'Frontal hairline preserved') : diagnosis.pattern === 'male' ? 'Bitemporal recession, typical male pattern' : 'Recorded above'} />
            <Row label="Eyebrows" value={diagnosis.eyebrowLoss ? 'Loss of the eyebrows (frontal fibrosing alopecia: exclusion)' : 'Preserved'} />
            <Row label={isRestart ? 'Pull test (repeated at the restart)' : 'Pull test'} value={diagnosis.pullTestCount !== null ? `${diagnosis.pullTestCount} hairs released from a bundle of about 50 to 60${diagnosis.pullTestCount >= 6 && (isFirst || isRestart) ? ' (6 or more: exclusion)' : ''}` : isFirst || isRestart ? 'Not recorded' : 'Not required at review'} />
            <Row label="Heavy diffuse shedding" value={diagnosis.heavyDiffuseShedding ? (isFirst || isRestart ? `Yes (exclusion at ${isFirst ? 'the first supply' : 'a restart, as at a first supply'})` : diagnosis.sheddingBeyond12Weeks ? 'Yes, persisting beyond 12 weeks of treatment (stop: referred for diagnosis)' : 'Yes, within the first 12 weeks of treatment (expected; not a reason to stop)') : 'No'} />
            <Row label="Began or worsened within 12 months of childbirth, serious illness, surgery, rapid weight loss or a new medicine" value={diagnosis.trigger12Months ? `Yes: ${diagnosis.trigger12MonthsDetail || 'detail not recorded'} (exclusion)` : 'No'} />
            {isWoman && <Row label="Hyperandrogenism" value={`${ha.length ? `${ha.join(', ')} (exclusion)` : 'None: no hirsutism, new acne, irregular periods, deepening voice or PCOS diagnosis'}; each examined or asked about: ${diagnosis.hyperandrogenismAsked ? 'yes, confirmed by the pharmacist' : 'NOT confirmed'}`} />}
            <Row
              label="Baseline photographs"
              value={
                isFirst
                  ? diagnosis.photoCrownTaken && diagnosis.photoFrontalTaken && diagnosis.photosStored
                    ? `Taken with the patient's consent and stored in the record: crown from above and frontal hairline from the front, hair parted in the midline, same room lighting; to be repeated at supply visits 4 and 6`
                    : 'NOT recorded as taken and stored'
                  : 'Taken at the first supply'
              }
            />
            {isReview && (
              <>
                <Row label="Repeat photographs" value={diagnosis.repeatPhotosTaken ? 'Taken in the same way as the baseline' : fullReview ? `NOT taken (required at supply visit ${visit})` : 'Not required at this review'} />
                <Row label="Response against the baseline photographs" value={diagnosis.response === 'adequate' ? `Adequate${diagnosis.responseNote ? `: ${diagnosis.responseNote}` : ''}` : diagnosis.response === 'inadequate' ? `Inadequate${diagnosis.responseNote ? `: ${diagnosis.responseNote}` : ''}` : diagnosis.response === 'not-assessed' ? 'Not assessed at this review' : 'Not recorded'} />
              </>
            )}
          </div>
        </div>

        {isWoman && (
          <div>
            <SectionHeader>Woman: Blood Tests, Pregnancy and Contraception</SectionHeader>
            <div className="space-y-1.5">
              {isFirst ? (
                women.resultsAvailable === 'yes' ? (
                  <>
                    <Row label="Ferritin" value={`${women.ferritinValue ?? '?'} micrograms/L, tested ${women.ferritinDate || 'date not recorded'}${women.ferritinValue !== null && women.ferritinValue < 30 ? ' (below 30: exclusion)' : ''}`} />
                    <Row label="Thyroid stimulating hormone" value={`${women.tshValue || '?'}, ${women.tshWithinRange === 'yes' ? 'within the laboratory reference range' : women.tshWithinRange === 'no' ? 'OUTSIDE the reference range (exclusion)' : 'range not recorded'}, tested ${women.tshDate || 'date not recorded'}`} />
                    <Row label="Results seen by the pharmacist" value={women.testSource ? TEST_SOURCE_LABEL[women.testSource] : 'Source not recorded'} />
                  </>
                ) : (
                  <Row label="Ferritin and thyroid results" value={women.resultsAvailable === 'no' ? 'Not available from the last 12 months: not supplied today; advised to obtain them and return' : 'Not recorded'} />
                )
              ) : (
                <Row label="Ferritin and thyroid results" value="Seen and recorded at the first supply" />
              )}
              <Row label="Each question on the Women step put to the patient" value={women.questionsAsked ? 'Yes, confirmed by the pharmacist' : 'NOT confirmed'} />
              <Row label="Thyroid or iron problem under investigation or not yet stable" value={women.thyroidOrIronUnstable ? 'Yes (exclusion)' : 'No'} />
              <Row label="Childbearing potential" value={women.childbearingPotential === 'yes' ? 'Yes' : women.childbearingPotential === 'no' ? `No: ${women.notPotentialReason === 'post-menopausal' ? 'post-menopausal (12 months without periods after the age of 45 with no other cause)' : women.notPotentialReason === 'sterilised' ? 'permanently sterilised' : 'reason not recorded'}` : 'Not recorded'} />
              <Row label="Breastfeeding excluded (asked of every woman)" value={women.breastfeeding ? 'Breastfeeding (exclusion)' : 'Yes'} />
              <Row label="Planning a pregnancy during treatment (asked of every woman)" value={women.planningPregnancy ? 'Yes (exclusion)' : 'No'} />
              {women.childbearingPotential === 'yes' && (
                <>
                  <Row label="Pregnancy excluded" value={women.pregnant === 'no' ? `Yes, on her own account; last menstrual period ${women.lmpDate || 'not recorded'}` : women.pregnant === 'yes' ? 'PREGNANT (exclusion)' : 'Not recorded'} />
                  <Row label="Contraceptive method" value={women.contraceptionMethod ? `${CONTRACEPTION_LABEL[women.contraceptionMethod]}${women.agreesToContinue ? '; agrees to continue and to tell the pharmacy if she stops' : ''}` : 'Not recorded'} />
                  {cocApplies && (
                    <Row
                      label={women.cocWithMigraineAura ? 'Contraception caution' : 'Contraception caution (triggered automatically: combined hormonal contraception and migraine with aura on the Medical step)'}
                      value={
                        isFirst
                          ? women.cocPrescriberReviewed
                            ? `Combined hormonal contraception with migraine with aura: her prescriber has reviewed the method and she attends with the outcome (${women.cocReviewOutcome || 'not recorded'})`
                            : 'Combined hormonal contraception with migraine with aura: NOT supplied at a first supply until her prescriber has reviewed the method and she attends with the outcome'
                          : `Combined hormonal contraception with migraine with aura at a continuation visit: supply continues on the existing method; referred to be seen about it within 4 weeks, referral recorded: ${yesNo(women.cocReferralRecorded)}`
                      }
                    />
                  )}
                  {isReview && <Row label="Method stopped or changed since the last supply" value={history.contraceptionChanged ? (history.contraceptionReplacementConfirmed ? 'Yes; replacement method confirmed and recorded above' : 'Yes; replacement NOT confirmed') : 'No'} />}
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <SectionHeader>Cardiovascular History and Medical History</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Cardiovascular disease" value={cvd.length ? `${cvd.join('; ')} (exclusion)` : 'None: no ischaemic heart disease, MI, heart failure, arrhythmia, valvular disease, cardiomyopathy, congenital heart disease, stroke or TIA, peripheral arterial disease, pulmonary hypertension, POTS or orthostatic intolerance, pericarditis, pericardial or pleural effusion'} />
            <Row label="Hypertension (treated, untreated or lifestyle)" value={medical.hypertension ? 'Yes (exclusion)' : 'No'} />
            <Row label="Hypotension or orthostatic intolerance" value={medical.hypotensionOrOrthostatic ? 'Yes (exclusion)' : 'No'} />
            <Row label="Syncope" value={medical.unexplainedSyncope ? 'Unexplained syncope (exclusion)' : medical.syncopeLast12Months ? 'Syncope in the last 12 months (exclusion)' : 'None unexplained, none in the last 12 months'} />
            <Row label="Phaeochromocytoma" value={medical.phaeochromocytoma ? 'Yes (exclusion)' : 'No'} />
            <Row label="Renal impairment (eGFR below 60, CKD 3 or worse, dialysis)" value={medical.renalImpairment ? 'Yes (exclusion)' : 'No'} />
            <Row label="Hepatic impairment" value={medical.hepaticImpairment ? 'Yes (exclusion)' : 'No'} />
            <Row label="Untreated anaemia" value={medical.untreatedAnaemia ? 'Yes (exclusion)' : 'No'} />
            <Row label="Thyroid disease not stable on treatment" value={medical.unstableThyroid ? 'Yes (exclusion)' : 'No'} />
            <Row label="Eating disorder" value={medical.eatingDisorder ? 'Yes (exclusion)' : 'No'} />
            <Row label="Migraine with aura" value={medical.migraineWithAura ? `Yes (caution${isWoman && women.contraceptionMethod === 'combined-hormonal' ? ': with combined hormonal contraception, the contraception rule applies' : ''})` : 'No'} />
            <Row label="Hypersensitivity to minoxidil or an excipient" value={medical.hypersensitivity ? 'Yes (exclusion)' : 'No'} />
            <Row label="Hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption" value={medical.hereditaryGalactose ? 'Yes (exclusion)' : 'No'} />
            <Row label="Other conditions" value={medical.otherConditions || 'None recorded'} />
            <Row label="Exclusion questions put to the patient" value={medical.questionsAsked ? 'Yes, confirmed by the pharmacist' : 'NOT confirmed'} />
            <Row label="Pharmacist clinical doubt about suitability" value={medical.pharmacistDoubt ? `Yes: referred, not supplied${medical.pharmacistDoubtReason.trim() ? ` (${medical.pharmacistDoubtReason.trim()})` : ''}` : 'None'} />
          </div>
        </div>

        <div>
          <SectionHeader>Current Medicines</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicines in the exclusion list" value={excluded.length ? `${excluded.join('; ')} (exclusion)` : 'None taken: no antihypertensive, beta-blocker, calcium channel blocker, diuretic, alpha-blocker, nitrate, sacubitril/valsartan, clonidine, moxonidine or methyldopa, daily PDE5 inhibitor, SGLT2 inhibitor, stimulant, regular decongestant, non-prescribed stimulant or systemic corticosteroid'} />
            <Row label="PDE5 inhibitor on demand" value={medicines.pde5OnDemand ? `Yes (caution: advice given)${isMan && patient.age !== null && patient.age < 40 ? `; man under 40: exercise tolerance and chest symptoms ${medicines.edVascularAsked ? 'asked about' : 'NOT asked about'}${medicines.edVascularDoubt ? '; doubt about vascular disease: referred' : ''}` : ''}` : 'No'} />
            <Row label="Other blood pressure lowering or fluid retaining medicines (cautions)" value={cautionMeds.length ? `${cautionMeds.join(', ')}: blood pressure measured with that in mind, warned about dizziness and swelling. Pharmacist satisfied to supply after considering blood pressure and fluid retention: ${medicines.cautionSatisfied === 'yes' ? 'yes' : medicines.cautionSatisfied === 'no' ? 'NO (referred, not supplied)' : 'not recorded'}` : 'None'} />
            <Row label="Weight loss treatment" value={medicines.weightLossTreatment ? `Yes (caution): fluid symptoms asked about specifically: ${yesNo(measurements.fluidSymptomsAsked)}` : 'No'} />
            <Row label="Current medicines recorded" value={medicines.currentMedicines || 'None'} />
            <Row label="Medicines questions put to the patient" value={medicines.questionsAsked ? 'Yes, confirmed by the pharmacist' : 'NOT confirmed'} />
          </div>
        </div>

        <div>
          <SectionHeader>Measurements Today</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Seated reading 1 (after 5 minutes rest)" value={reading(measurements.seated1Systolic, measurements.seated1Diastolic)} />
            <Row label="Seated reading 2 (1 to 2 minutes later)" value={reading(measurements.seated2Systolic, measurements.seated2Diastolic)} />
            <Row label="Lower seated reading (recorded)" value={lower ? `${lower.systolic}/${lower.diastolic} mmHg` : 'Not recorded'} />
            <Row label="Repeat (third reading after a further 5 minutes)" value={measurements.repeatTaken ? (repeat ? `${repeat.systolic}/${repeat.diastolic} mmHg` : 'Taken, values not recorded') : 'Not taken'} />
            {isFirst && measurements.returnVisitForBp && <Row label="Return visit after a reading outside the limits on repeat" value={measurements.returnVisitForBp === 'yes' ? 'Yes: this is the one permitted return visit' : 'No: first visit (may return once on another day)'} />}
            <Row label="Reading applied to the limits" value={effective ? `${effective.systolic}/${effective.diastolic} mmHg (limits: systolic 100 to 139, diastolic below 90; 90 to 99 only without dizziness or faintness; hypertension and hypotension both decided on repeat)` : 'Not recorded'} />
            <Row label="Dizziness or faintness today" value={yesNo(measurements.dizzinessOrFaintness)} />
            <Row label="Standing blood pressure (after 1 minute)" value={reading(measurements.standingSystolic, measurements.standingDiastolic)} />
            <Row label="Postural change" value={fall ? `Systolic ${fall.systolic >= 0 ? 'fall' : 'rise'} of ${Math.abs(fall.systolic)} mmHg, diastolic ${fall.diastolic >= 0 ? 'fall' : 'rise'} of ${Math.abs(fall.diastolic)} mmHg (limit: fall of 20 systolic or 10 diastolic); symptoms on standing: ${yesNo(measurements.standingSymptoms)}` : 'Not calculated'} />
            <Row label="Resting pulse" value={measurements.pulse !== null ? `${measurements.pulse} per minute${measurements.pulseRepeatTaken && measurements.pulseRepeat !== null ? `; repeat ${measurements.pulseRepeat} per minute` : ''} (limits 50 to 100)` : 'Not recorded'} />
            <Row label="Weight (pharmacy scales, light clothing)" value={measurements.weightKg !== null ? `${measurements.weightKg} kg${change !== null ? ` (${change >= 0 ? '+' : ''}${change} kg since the previous supply)` : ''}` : 'Not recorded'} />
            {isFirst && (
              <>
                <Row label="Height" value={measurements.heightCm !== null ? `${measurements.heightCm} cm` : 'Not recorded'} />
                <Row label="Body mass index" value={b !== null ? `${b} kg/m2${b < 18.5 ? ' (below 18.5: exclusion)' : ''}` : 'Not calculated'} />
              </>
            )}
            <Row
              label={`Baseline systolic (${BASELINE_SYSTOLIC_DEFINITION})`}
              value={
                baseline !== null
                  ? `${baseline} mmHg${isFirst ? ' (recorded today at the first supply)' : isRestart ? ' (new baseline recorded today at the restart)' : ' (carried from the first supply or the most recent restart)'}`
                  : 'Not recorded'
              }
            />
            {history.supplyType === 'continuation' && baseline !== null && effective && (
              <Row label="Systolic against baseline" value={`${effective.systolic} mmHg today against ${baseline} mmHg baseline (${effective.systolic - baseline >= 0 ? '+' : ''}${effective.systolic - baseline} mmHg; a higher dose needs 100 or more and not more than 10 mmHg below the baseline)`} />
            )}
          </div>
        </div>

        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={clinicalAlerts} />
        </div>

        {isBlocked ? (
          <div>
            <SectionHeader>Exclusion Outcome</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Reason" value={stops.map((a) => a.message).join('; ')} />
              {cvStop && <Row label="Cardiovascular stop" value="Stop the tablets; no dose reduction; no further supply under this PGD until a prescriber has reviewed the patient and confirmed in writing that treatment may restart. Report the event via Yellow Card. GP informed within 7 days." />}
              <Row label="Advice given, alternatives offered and decision" value={summary.exclusionAdvice || 'Not recorded'} />
              <Row label="Licensed alternatives offered" value={supply.alternativesOffered === 'topical' ? 'Topical minoxidil 5%' : supply.alternativesOffered === 'finasteride' ? 'Finasteride under the Male Pattern Hair Loss PGD' : supply.alternativesOffered === 'both' ? 'Topical minoxidil 5% and finasteride under the Male Pattern Hair Loss PGD' : supply.alternativesOffered === 'none' ? 'None offered: referred for diagnosis first' : 'Not recorded'} />
              <Row label="Referral or next action" value={REFERRAL_LABEL[summary.referral]} />
              {isReview && <Row label="Stop-and-seek-help advice given in writing" value={yesNo(counselling.stopSeekHelpWritten)} />}
              <Row label="Medicine" value="Not supplied" />
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader>Medicine Supplied</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Product" value={`${PRODUCT.name}, ${PRODUCT.plNumber}`} />
              <Row label="Basis of supply" value={`${OFF_LABEL_RECORD_WORDS}. Licensed use is severe hypertension at 5 mg to 100 mg daily with a diuretic and a beta-blocker; use for hair loss is authorised under this PGD on the basis of the 2024 international consensus, the 2021 safety series of 1,404 patients and the 2024 randomised trial.`} />
              <Row label="Dose" value={doseInfo ? `${doseInfo.label}: ${doseInfo.labelWords}` : 'Not determined'} />
              <Row label="Number of tablets" value={tablets !== null ? `${tablets} tablets of 2.5 mg (8 weeks, 56 days)` : 'Not determined'} />
              <Row label="Batch number" value={supply.batchNumber || 'Not recorded'} />
              <Row label="Expiry date" value={supply.expiryDate || 'Not recorded'} />
              <Row label="Supply type" value={history.supplyType ? SUPPLY_TYPE_LABEL[history.supplyType] : 'Not recorded'} />
              <Row label="Date of the first supply" value={isFirst ? summary.consultationDate : history.firstSupplyDate || 'Not recorded'} />
              <Row label="Supply number" value={supplyNumber !== null ? `Supply ${supplyNumber} from the first supply${history.prescriberReviewHeld && visit !== null ? `, supply visit ${visit} of the current period` : ''}; ${counted ?? 0} supplies so far ${history.prescriberReviewHeld ? 'since the last prescriber review' : 'under this PGD'} before today (maximum six between prescriber reviews, counted by supply number and not reset by a gap or restart)` : 'Not recorded'} />
              {history.supplyType === 'continuation' && (
                <Row
                  label="Dose decision"
                  value={
                    supply.doseDecision === 'unchanged'
                      ? 'Dose unchanged'
                      : supply.doseDecision === 'increase'
                      ? `Increased from ${history.currentDose ? DOSE_INFO[history.currentDose].label : '?'} to ${doseInfo?.label ?? '?'} (the one increase in the patient's whole course, at or after supply visit 4): response inadequate against the baseline photographs${diagnosis.responseNote ? ` (${diagnosis.responseNote})` : ''}; starting dose tolerated without a stop symptom or hypertrichosis the patient minds; systolic ${effective?.systolic ?? '?'} mmHg (100 or more, not more than 10 below the baseline ${history.baselineSystolic ?? '?'}); pulse ${pulse ?? '?'} within limits. Patient told: ${yesNo(supply.doseChangeToldPatient)}`
                      : supply.doseDecision === 'resume'
                      ? `Resumed the higher dose ${doseInfo?.label ?? '?'} from the starting dose ${history.currentDose ? DOSE_INFO[history.currentDose].label : '?'} (increase already used once; restarted at the starting dose; supply visit ${visitSinceRestart ?? '?'} since the restart): response inadequate against the baseline photographs${diagnosis.responseNote ? ` (${diagnosis.responseNote})` : ''}; no stop symptom or hypertrichosis the patient minds; systolic ${effective?.systolic ?? '?'} mmHg (100 or more, not more than 10 below the restart baseline ${history.baselineSystolic ?? '?'}); pulse ${pulse ?? '?'} within limits. Not a second increase. Patient told: ${yesNo(supply.doseChangeToldPatient)}`
                      : supply.doseDecision === 'reduce'
                      ? `Reduced from ${history.currentDose ? DOSE_INFO[history.currentDose].label : '?'} to the starting dose ${doseInfo?.label ?? '?'} for a non-cardiovascular side effect: ${supply.reductionReason || 'not recorded'}. Patient told: ${yesNo(supply.doseChangeToldPatient)}`
                      : 'Not recorded'
                  }
                />
              )}
              {isReview && (
                <Row label="Dose increase status after this supply" value={`Increase used: ${increaseUsed(patient.sex, history) || supply.doseDecision === 'increase' ? 'yes' : 'no'}; on the higher dose: ${higherAfter ? 'yes' : 'no'}`} />
              )}
              {history.supplyType === 'restart' && <Row label="Restart" value={`Started again at the starting dose after a gap of more than 4 weeks: scalp re-examined and pull test repeated as at a first supply, medicines and cardiovascular history re-taken, new baseline blood pressure recorded today (${baseline !== null ? `${baseline} mmHg` : 'not recorded'}); the count of supplies continues from where it was${history.doseIncreasedBefore ? '; the increase already used may be resumed at or after the fourth supply visit following this restart if the conditions are met' : ''}`} />}
              <Row label="Tablet splitter" value={dose === '1.25' ? (supply.tabletSplitterSupplied ? 'Offered or supplied; shown how to halve the tablet along the score line, other half kept and taken within 24 hours' : 'NOT recorded') : 'Not applicable'} />
              <Row label="Label" value={supply.labelledAsDirected && doseInfo ? `Dispensed medicine labelled with the patient's name, "${doseInfo.labelWords}", the date and the pharmacy, and: "${LABEL_STOP_WORDING}"` : 'NOT confirmed'} />
              <Row label="Patient information leaflet" value={supply.pilSupplied ? `Supplied${supply.pilLicensedUseExplained ? '; told it describes use for blood pressure because that is the licence' : ''}` : 'NOT supplied'} />
              <Row label="Next review due" value={`${supply.nextReviewDate || 'Not recorded'} (8 weeks, before the supply runs out); patient told: ${yesNo(counselling.toldNextReviewDate)}`} />
              {fullReview ? <Row label={`Supply visit ${visit} full review`} value={`Repeat photographs ${diagnosis.repeatPhotosTaken ? 'taken' : 'NOT taken'}; response ${diagnosis.response || 'not recorded'}`} /> : null}
              {reviewSought && <Row label="Prescriber review" value="Sought at this visit (supply 6): this record, with the photographs and the blood pressure, pulse and weight record, is sent for the prescriber review, which must be complete before a seventh supply. Patient told to keep the last week of tablets until it is confirmed" />}
              <Row label="Supplied under this PGD" value="Yes" />
            </div>
          </div>
        )}

        <div>
          <SectionHeader>Off-Label Consent</SectionHeader>
          <p className="text-xs text-gray-700 mb-2 italic">&quot;{OFF_LABEL_CONSENT_SCRIPT}&quot;</p>
          <div className="space-y-1.5">
            <Row label="Script given in substance" value={yesNo(consent.offLabelScriptGiven)} />
            <Row label="Told the supply is off-label, what the licence is for, why it is being used, and the alternatives offered" value={yesNo(consent.toldLicenceAndAlternatives)} />
            <Row label="Patient accepts off-label treatment" value={consent.acceptsOffLabel === 'yes' ? 'Yes' : consent.acceptsOffLabel === 'no' ? 'No (exclusion)' : 'Not recorded'} />
            <Row label="Consent statement signed by the patient" value={yesNo(consent.consentStatementSigned)} />
          </div>
          <div className="mt-3 rounded border border-gray-300 p-3">
            <p className="text-xs font-semibold text-gray-700">Patient consent statement (Appendix 3)</p>
            <p className="text-xs text-gray-700 mt-1">&quot;{PATIENT_CONSENT_STATEMENT}&quot;</p>
            <div className="mt-3 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Patient signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[2rem]">{summary.consultationDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeader>Patient Counselling and Consent</SectionHeader>
          <CounsellingGrid
            items={[
              ['Informed consent obtained', consent.informedConsentGiven],
              ['ID verified', consent.idVerified],
              ['Face to face on the pharmacy premises', consent.faceToFace],
              ['Patient aware of private service', consent.patientAwarePrivateService],
              ['Understands what the service costs', consent.understandsCost],
              ['One dose a day at the same time; women halve the tablet', counselling.oneDoseDaily],
              ['Shedding in the first 4 to 8 weeks expected; improvement 3 to 6 months; gain lost on stopping', counselling.sheddingExpected],
              ['Hypertrichosis warning given, in writing (extra hair; hair colour can change)', counselling.hypertrichosisWarningWritten],
              ['Stop and seek advice for a rash or blistering of the skin or mouth', counselling.rashBlisteringAdvice],
              ['Stop-and-seek-help advice given, in writing', counselling.stopSeekHelpWritten],
              ...(isMan ? [['PDE5 inhibitor advice (light-headedness; sit or lie down; no second dose that day)', counselling.pde5Advice] as [string, boolean]] : []),
              ['Stand up slowly, go easy on alcohol, do not drive if dizzy', counselling.standSlowlyAlcoholDriving],
              ...(isWoman ? [['Must not become pregnant; keep using contraception; stop before trying for a baby', counselling.pregnancyAdvice] as [string, boolean]] : []),
              ['Tell any doctor, dentist or pharmacist; stop and seek advice if a heart or BP medicine is started', counselling.tellDoctors],
              ['Return at the review date; a gap of more than 4 weeks means restarting; after six supplies (about eleven months) a doctor must review', counselling.reviewDateAndGap],
              ['Keep the last week of tablets until the prescriber review is confirmed', counselling.keepLastWeekTablets],
              ['Told the next review date', counselling.toldNextReviewDate],
              ['Written record given: dose, stop-and-seek-help advice, hypertrichosis warning, review date', counselling.writtenRecordGiven],
              ['GP to be informed within 7 days', counselling.gpToBeInformed],
              ...(history.onTopicalMinoxidil ? [['Oral and topical products are the same drug; stopping the topical once the oral is established is reasonable', counselling.topicalSameDrugExplained] as [string, boolean]] : []),
              ...(consent.patientDeclined ? [['Patient declined treatment after counselling', true] as [string, boolean]] : []),
            ]}
          />
          <div className="mt-3 rounded border border-gray-300 p-3">
            <p className="text-xs font-semibold text-gray-700">Written advice for the patient (copy given)</p>
            <p className="text-xs text-gray-700 mt-1">{STOP_AND_SEEK_HELP_ADVICE}</p>
            <p className="text-xs text-gray-700 mt-1">Extra fine hair on the face, arms or body is the commonest side effect, and the colour of your hair can change. Both go away over a few months if you stop, and where you are above the starting dose it can be lowered. Stop and seek advice for a rash or blistering of the skin or mouth.</p>
            <p className="text-xs text-gray-700 mt-1">After six supplies (about eleven months) a doctor must review you before we can continue; keep your last week of tablets until that review is confirmed. A gap of more than 4 weeks means starting again at the first dose.</p>
            {doseInfo && !isBlocked && <p className="text-xs text-gray-700 mt-1">Your dose: {doseInfo.labelWords}. Next review: {supply.nextReviewDate || 'to be confirmed'}.</p>}
          </div>
        </div>

        <div>
          <SectionHeader>Adverse Drug Reactions</SectionHeader>
          <Row label="Adverse reaction and action taken" value={counselling.adverseReaction ? counselling.adverseReactionDetails || 'Yes, details not recorded' : 'None reported. Suspected reactions are reported via yellowcard.mhra.gov.uk; every cardiovascular adverse event is reported because this is an off-label use.'} />
        </div>

        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
            <Row label="Pharmacy" value={[summary.pharmacyName, summary.pharmacyAddress].filter(Boolean).join(', ') || 'Not recorded'} />
            <Row label="Record retention" value="Signed, dated, legible and contemporaneous; kept for 8 years" />
          </div>
        </div>

        <div>
          <SectionHeader>Pharmacist Declaration (pharmacists only)</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            {isBlocked
              ? `I confirm that I am a pharmacist registered with the General Pharmaceutical Council, that I am named and authorised to supply under the Patient Group Direction for ${ORAL_MINOXIDIL_PGD_NAME} (${ORAL_MINOXIDIL_PGD_VERSION}), that I assessed this patient face to face on the premises, that no medicine was supplied under the PGD for the reason recorded above, and that the advice given and the decision reached are recorded above.`
              : `I confirm that I am a pharmacist registered with the General Pharmaceutical Council, that I am named and authorised to supply under the Patient Group Direction for ${ORAL_MINOXIDIL_PGD_NAME} (${ORAL_MINOXIDIL_PGD_VERSION}), that I have completed the required training, that I examined the scalp and measured the blood pressure on the premises, that the patient was told the supply is off-label and consented on that basis, and that this consultation was conducted in accordance with that PGD: the patient met all inclusion criteria and no exclusion criteria applied. This PGD is not used by pharmacy technicians.`}
          </p>
          <SignatureBlock name={summary.pharmacistName} gphc={summary.pharmacistGPhC} pharmacy={summary.pharmacyName} />
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-[10px] text-gray-400">
            Get Real Health ePGD, {ORAL_MINOXIDIL_PGD_NAME} Consultation Record | Confidential Patient Information | Retain for 8 years
          </p>
        </div>
      </div>
    </div>
  );
}
