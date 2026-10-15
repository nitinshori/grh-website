'use client';

import React from 'react';
import { SectionHeader, Row, CounsellingGrid } from '../../shared/components/SummaryReportShell';
import type {
  MelConsent,
  MelCounselling,
  MelHistory,
  MelIndication,
  MelMedical,
  MelMedicines,
  MelPatientDetails,
  MelScreens,
  MelSummary,
  MelSupply,
} from '../lib/melatonin-types';
import {
  ARM_A_LABEL_WORDING,
  ARM_B_LABEL_WORDING,
  ARM_B_RECORD_WORDS,
  ARM_LABEL,
  MELATONIN_PGD_NAME,
  MELATONIN_PGD_VERSION,
  OFF_LABEL_RECORD_WORDS,
  PATIENT_CONSENT_STATEMENT,
  PRODUCTS,
  REFERRAL_LABEL,
} from '../lib/melatonin-types';
import type { MelAlert } from '../lib/melatonin-clinical-logic';
import {
  BAND_LABEL,
  armADoseDecision,
  armBQuantity,
  courseDay,
  courseEndLimit,
  counsellingItems,
  epworthTotal,
  formatUkDate,
  gadTotal,
  insomniaCausingList,
  courseStatus,
  courseVerified,
  isArmAReview,
  isUnverifiedReview,
  supply1GatesApply,
  OUTSIDE_WINDOW_TEXT,
  loweringList,
  nightsWithoutTablets,
  phqTotal,
  raisersList,
  ratingBand,
  ratingChange,
  reviewDay,
  reviewWindowFromToday,
  stopBangTotal,
  threeMgCapReasons,
  totalPreviousCourses,
} from '../lib/melatonin-clinical-logic';

interface Props {
  patient: MelPatientDetails;
  consent: MelConsent;
  history: MelHistory;
  indication: MelIndication;
  screens: MelScreens;
  medical: MelMedical;
  medicines: MelMedicines;
  supply: MelSupply;
  counselling: MelCounselling;
  summary: MelSummary;
  alerts: MelAlert[];
  isBlocked: boolean;
  gpText: string;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');
const yn = (v: string) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not recorded');

function AlertList({ alerts }: { alerts: MelAlert[] }) {
  if (!alerts.length) return <p className="text-xs text-gray-500">No clinical alerts raised.</p>;
  const order = { stop: 0, caution: 1, info: 2 } as const;
  return (
    <div className="space-y-1.5">
      {[...alerts]
        .sort((a, b) => order[a.severity] - order[b.severity])
        .map((a) => (
          <div key={a.code} className={`rounded px-2 py-1.5 text-xs ${a.severity === 'stop' ? 'bg-red-50 text-red-700' : a.severity === 'caution' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
            <span className="font-semibold uppercase">{a.severity}:</span> {a.message} <span className="opacity-70">({a.code})</span>
          </div>
        ))}
    </div>
  );
}

export default function MelatoninSummaryReport({ patient, consent, history, indication, screens, medical, medicines, supply, counselling, summary, alerts, isBlocked, gpText }: Props) {
  const armA = consent.arm === 'A';
  const armB = consent.arm === 'B';
  const supply1 = armA && history.supplyNumber === '1';
  const review = isArmAReview(consent, history);
  const product = supply.product ? PRODUCTS[supply.product] : null;
  const supplied = !isBlocked && !!supply.dose && !!product;
  const course = courseStatus(consent, history, alerts, supplied);
  const gates = supply1GatesApply(consent, history);
  const unverified = isUnverifiedReview(consent, history);
  const band = ratingBand(history, indication);
  const change = ratingChange(history, indication);
  const decision = armA ? armADoseDecision(patient, history, indication, medicines) : null;
  const win = reviewWindowFromToday();
  const limit = armA && history.supplyNumber ? courseEndLimit(history, history.supplyNumber) : null;
  const caps = threeMgCapReasons(patient, medicines);
  const tablets = armA ? 30 : armBQuantity(indication);
  const ep = epworthTotal(screens);
  const redFlagStops = alerts.filter((a) => a.severity === 'stop');
  const counsellingList = counsellingItems(consent.arm, counselling, {
    maleColonisPlanning: patient.sex === 'male' && supply.product === 'colonis-3' && medical.manPlanningPregnancy === 'yes',
    supplyNumber: history.supplyNumber,
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 print:border-0 print:p-0">
      <div className="mb-4 border-b border-gray-300 pb-3">
        <h2 className="text-lg font-bold text-navy-900">{MELATONIN_PGD_NAME}: Consultation Record</h2>
        <p className="text-xs text-gray-600">
          Get Real Health {MELATONIN_PGD_VERSION}. {consent.arm ? ARM_LABEL[consent.arm] : 'Arm not recorded'}.
        </p>
        <p className="mt-1 text-xs font-semibold text-navy-900">
          Outcome: {isBlocked ? `NOT SUPPLIED (${REFERRAL_LABEL[summary.referral]})` : supplied ? 'SUPPLIED' : 'Not yet supplied'}
        </p>
      </div>

      <SectionHeader>Patient</SectionHeader>
      <dl>
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={`${formatUkDate(patient.dateOfBirth)} (age ${patient.age ?? '?'})`} />
        <Row label="Age confirmed as 18 or over" value={yesNo(patient.age !== null && patient.age >= 18)} />
        <Row label="Sex" value={patient.sex || 'Not recorded'} />
        <Row label="Address" value={patient.address || 'Not recorded'} />
        <Row label="NHS number" value={patient.nhsNumber || 'Not recorded'} />
        <Row label="GP" value={[patient.gpName, patient.gpPractice, patient.gpAddress].filter(Boolean).join(', ') || 'Not recorded'} />
        <Row label="Occupation" value={`${patient.occupation || 'Not recorded'}${armA ? `; professional driver or safety-critical worker: ${yn(medicines.safetyCriticalWork)}` : ''}`} />
        <Row label="Consultation" value={`${formatUkDate(summary.consultationDate)} at ${summary.consultationTime}; face to face on the premises: ${yn(consent.presentInPerson)}`} />
      </dl>

      <SectionHeader>Consent{armA ? ' and off-label statement' : ''}</SectionHeader>
      <dl>
        <Row label="Practitioner" value={consent.practitionerRole === 'technician' ? 'Pharmacy technician (arm B only)' : consent.practitionerRole === 'pharmacist' ? 'Pharmacist' : 'Not recorded'} />
        <Row label="Valid informed consent" value={yesNo(consent.informedConsentGiven)} />
        <Row label="Capacity; request by carer or relative; care home" value={`Lacks capacity: ${yesNo(consent.lacksCapacity)}; carer or relative request: ${yesNo(consent.requestByCarerOrRelative)}; care home: ${yesNo(consent.livesInCareHome)}`} />
        {armA && (
          <>
            <Row label="Off-label status" value="OFF-LABEL by indication. Adaflex is licensed for jet lag in adults and for insomnia in children aged 6 to 17 with ADHD, not for insomnia in adults. No UK guideline recommends immediate-release melatonin for insomnia in adults." />
            <Row label="Told: off-label, licence, why used, benefit uncertain, guidance does not recommend it, alternatives" value={yesNo(consent.toldLicenceEvidenceAlternatives)} />
            <Row label="Off-label consent script given" value={yesNo(consent.offLabelScriptGiven)} />
            <Row label="Consents to off-label treatment" value={yn(consent.acceptsOffLabel)} />
            <Row label="GP registered; agrees to GP being informed" value={`${yn(consent.gpRegistered)}; ${yn(consent.gpNotificationAgreed)}`} />
          </>
        )}
      </dl>
      {armA && (
        <div className="mt-3 rounded border border-gray-300 p-3">
          <p className="text-xs text-gray-800">&quot;{PATIENT_CONSENT_STATEMENT}&quot;</p>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Patient signature</p>
              <div className="min-h-[2rem] border-b border-gray-300" />
              <p className="mt-1 text-[11px] text-gray-500">Signed on the record: {yesNo(consent.consentStatementSigned)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Date</p>
              <div className="min-h-[2rem] border-b border-gray-300" />
            </div>
          </div>
        </div>
      )}

      {armA && (
        <>
          <SectionHeader>The course</SectionHeader>
          <dl>
            <Row label="Supply number" value={history.supplyNumber ? `${history.supplyNumber} of 3` : 'Not recorded'} />
            <Row
              label="Course verified from the pharmacy records"
              value={
                courseVerified(history)
                  ? `Yes (record of ${formatUkDate(history.carriedForward?.consultationDate ?? '')})`
                  : history.recordLookup === 'found'
                    ? `Records show supply ${history.carriedForward?.expectedSupply ?? '?'}`
                    : history.recordLookup === 'none'
                      ? 'No previous record at this pharmacy'
                      : history.recordLookup === 'error'
                        ? 'Look-up failed'
                        : 'Not looked up'
              }
            />
            {unverified && <Row label="UNVERIFIED COURSE: reason; supply 1 record" value={`${history.unverifiedReason}; ${history.supply1RecordRef}`} />}
            {history.supplyNumber === '1' && history.restartReason.trim() !== '' && <Row label="Supply 1 while the records show an open or lapsed course: reason" value={history.restartReason} />}
            {gates && <Row label="Previous course ended under stopping rule 2" value={yn(history.previousStopRule2)} />}
            <Row label="Shift work; delayed sleep pattern; caffeine not addressed (asked today)" value={`${yn(indication.shiftWork)}; ${yn(indication.delayedSleepPattern)}; ${yn(indication.caffeineUnaddressed)}`} />
            {course.ended && <Row label="END OF COURSE" value={course.reason} />}
            {course.outsideWindow && <Row label="Review" value={`Not supplied: ${OUTSIDE_WINDOW_TEXT}. The course has not ended.`} />}
            {gates && (
              <>
                <Row label="Previous courses (this PGD; Circadin PGD)" value={`${history.previousCoursesThisPgd ?? '?'}; ${history.previousCoursesCircadin ?? '?'} (total ${totalPreviousCourses(history) ?? '?'}), from the pharmacy record and the patient's account; asked specifically: ${yesNo(history.coursesAskedSpecifically)}`} />
                <Row label="Previous course ended" value={history.previousCourseEndDate ? formatUkDate(history.previousCourseEndDate) : 'None'} />
                {(totalPreviousCourses(history) ?? 0) >= 2 && <Row label="GP review before a third or later course" value={history.gpReviewDocumented === 'yes' ? `Documented (${history.gpReviewSource}, ${formatUkDate(history.gpReviewDate)}); advises against: ${yesNo(history.gpReviewAdvisesAgainst)}` : 'Not documented'} />}
                <Row label="Currently in a Circadin course" value={yn(history.inCircadinCourse)} />
                {patient.age !== null && patient.age >= 55 && <Row label="Aged 55 or over: route chosen and why" value={`This PGD, arm A. ${history.route55Reason}`} />}
                <Row label="Insomnia" value={`${[indication.difficultyGettingToSleep && 'getting to sleep', indication.difficultyStayingAsleep && 'staying asleep', indication.wakingEarly && 'waking early'].filter(Boolean).join(', ') || 'pattern not recorded'}; ${indication.nightsPerWeek ?? '?'} nights a week for ${indication.durationWeeks ?? '?'} weeks; daytime effect: ${indication.daytimeImpactDetail || yn(indication.daytimeImpact)}`} />
                <Row label="Sleep hygiene first" value={indication.sleepHygieneRoute === 'tried' ? `Followed for ${indication.sleepHygieneWeeks ?? '?'} weeks before supply 1` : indication.sleepHygieneRoute === 'severe-impairment' ? `Severe daytime impairment: ${indication.severeImpairmentWhat}; why waiting 2 weeks is not reasonable: ${indication.severeImpairmentWhyNotWait}` : 'Not tried'} />
              </>
            )}
            {supply1 && <Row label="CBT-I signposted; wishes a short course" value={`${yesNo(indication.cbtiSignposted)}; ${yn(indication.wishesShortCourse)}`} />}
            <Row label="Baseline sleep quality (0 to 10)" value={history.baselineRating ?? 'Not recorded'} />
            {review && (
              <>
                <Row label="Date of supply 1; last supply" value={`${formatUkDate(history.supply1Date)}; ${formatUkDate(history.lastSupplyDate)}`} />
                <Row label="Review date and day number" value={`${formatUkDate(summary.consultationDate)}, day ${reviewDay(history) ?? '?'} after the last supply (day ${courseDay(history) ?? '?'} after supply 1); nights without tablets: ${nightsWithoutTablets(history)}`} />
                <Row label="Reviewed in person by a pharmacist" value={yn(history.reviewInPerson)} />
                <Row label="Sleep rating today; band" value={`${indication.reviewRating ?? '?'} (change ${change ?? '?'}); ${band ? BAND_LABEL[band] : 'not recorded'}; ${indication.nightsAffectedPerWeek ?? '?'} nights a week affected`} />
                <Row label="Adherence to timing and no-food rules" value={yn(indication.adherenceTimingFood)} />
                <Row label="Stopping rules asked" value={`Next-day drowsiness ${yn(indication.nextDayDrowsiness)}; fall ${yn(indication.fallWhileTaking)}${indication.fallWhileTakingInjury ? ' (with injury)' : ''}; new or worse mood ${yn(indication.newWorseMood)}; rash, swelling or breathing ${yn(indication.allergySymptoms)}; unacceptable side effect ${yn(indication.unacceptableSideEffect)}${indication.sideEffectsDetail ? `; ${indication.sideEffectsDetail}` : ''}`} />
                <Row label="Previous dose" value={history.previousDose ? `${history.previousDose} mg` : 'Not recorded'} />
                <Row label="Review decision" value={decision?.text ?? 'Not determined'} />
              </>
            )}
          </dl>
        </>
      )}

      {armB && (
        <>
          <SectionHeader>The journey</SectionHeader>
          <dl>
            <Row label="By air; destination" value={`${yn(indication.byAir)}; ${indication.destination || 'not recorded'}`} />
            <Row label="Dates" value={`Outward ${formatUkDate(indication.outwardDate)}${indication.returnDate ? `; return ${formatUkDate(indication.returnDate)}` : ''}`} />
            <Row label="Time zones crossed; direction" value={`${indication.timeZones ?? '?'}; ${indication.direction || 'not recorded'}`} />
            <Row label="The supply covers" value={indication.covers === 'both' ? 'Both journeys (return also crosses 5 or more time zones)' : indication.covers || 'Not recorded'} />
            <Row label="Insomnia at home; safety-critical duty during the trip" value={`${yn(indication.insomniaAtHome)}; ${yn(indication.safetyCriticalDuringTrip)}`} />
            <Row label="Arm B supplies in 12 months including today" value={history.armBSuppliesLast12Months !== null ? `${history.armBSuppliesLast12Months + (supplied ? 1 : 0)} (from the pharmacy record and as reported by the patient)` : 'Not recorded'} />
            <Row label="Mid arm A or Circadin course" value={`${yn(history.midArmACourse)}; ${yn(history.midCircadinCourse)}`} />
            <Row label="Previous course ended under stopping rule 2" value={yn(history.previousStopRule2)} />
            <Row label="Import rules advice given" value={yesNo(indication.importAdviceGiven)} />
            {indication.wants5mg && <Row label="5 mg: previous 3 mg use" value={`For jet lag ${yesNo(indication.prev3mgJetLag)}, tolerated ${yesNo(indication.prev3mgTolerated)}, inadequate ${yesNo(indication.prev3mgInadequate)}; ${indication.prev3mgEvidence || 'evidence not recorded'}; ${indication.prev3mgProduct}; ${indication.prev3mgWhyInadequate}`} />}
            {history.previousJetLagSupply === 'yes' && <Row label="Previous supply: stopping rules" value={`Drowsiness ${yn(indication.nextDayDrowsiness)}; fall ${yn(indication.fallWhileTaking)}; mood ${yn(indication.newWorseMood)}; rash or swelling ${yn(indication.allergySymptoms)}; unacceptable side effect ${yn(indication.unacceptableSideEffect)}`} />}
          </dl>
        </>
      )}

      <SectionHeader>Red flags, screens and falls</SectionHeader>
      <dl>
        {armA && (
          <>
            <Row label="PHQ-2; GAD-2" value={`${phqTotal(screens) ?? '?'}; ${gadTotal(screens) ?? '?'}`} />
            <Row label="STOP-Bang; Epworth" value={`${stopBangTotal(screens, patient)} of 8${screens.sbObserved ? ' (witnessed pauses)' : ''}; ${ep ?? 'not recorded'} of 24`} />
          </>
        )}
        <Row label="Thoughts of self-harm or suicide" value={screens.selfHarmAsked ? `Asked: ${yn(screens.selfHarmThoughts)}${screens.immediateRisk ? ' (immediate risk)' : ''}` : 'Not asked'} />
        <Row label="Falls in the last 12 months" value={`${yn(screens.fallLast12Months)}${screens.fallWithInjury ? ' (with injury)' : ''}`} />
        <Row label="Every red flag asked" value={yesNo(screens.redFlagsAsked)} />
      </dl>

      <SectionHeader>Medical history and medicines</SectionHeader>
      <dl>
        <Row label="Renal impairment short of severe" value={medical.renalLesser ? `Yes; mild and stable: ${yn(medical.renalMildStable)}` : 'No'} />
        <Row label="Diabetes or impaired glucose tolerance" value={yesNo(medical.diabetes)} />
        {patient.sex === 'female' && <Row label="Pregnancy, breastfeeding, contraception" value={`Childbearing potential ${yn(medical.childbearingPotential)}; pregnant ${yn(medical.pregnant)}; breastfeeding ${yesNo(medical.breastfeeding)}; planning ${yesNo(medical.planningPregnancy)}; contraception ${medical.childbearingPotential === 'yes' ? `${yn(medical.usingContraception)}${medical.contraceptiveMethod ? ` (${medical.contraceptiveMethod})` : ''}` : 'not applicable'}`} />}
        <Row label="Full medicine list" value={medicines.fullMedicineList || 'Not recorded'} />
        <Row label="Oestrogen" value={medicines.oestrogen === 'yes' ? `Yes: ${medicines.oestrogenDetail} (3 mg maximum)` : yn(medicines.oestrogen)} />
        <Row label="Melatonin from any source" value={`Prescribed: ${yn(medicines.prescribedMelatonin)}; other source: ${yn(medicines.otherSourceMelatonin)}${medicines.otherMelatoninProduct ? ` (agrees to stop: ${medicines.otherMelatoninProduct})` : ''}`} />
        {raisersList(medicines).length > 0 && <Row label="Raise melatonin levels" value={raisersList(medicines).join(', ')} />}
        {medicines.sedating && <Row label="Sedating medicine" value={medicines.sedatingDetail} />}
        {loweringList(medicines).length > 0 && <Row label="Lower melatonin levels" value={loweringList(medicines).join(', ')} />}
        {armA && <Row label="Medicines that could cause insomnia (incl. decongestants)" value={insomniaCausingList(medicines).join('; ') || 'None'} />}
        {medicines.alertAtNight && <Row label="Must be alert at night: advice" value={medicines.alertAtNightAdvice} />}
        {caps.length > 0 && <Row label="3 mg maximum" value={caps.join('; ')} />}
      </dl>

      <SectionHeader>Clinical alerts</SectionHeader>
      <AlertList alerts={alerts} />

      {supplied && product && (
        <>
          <SectionHeader>Supply</SectionHeader>
          <dl>
            <Row label="Product" value={`${product.name}, ${product.plNumber}`} />
            <Row label="Strength and dose" value={armA ? `${supply.dose} mg (one tablet) once nightly, 1 to 2 hours before bedtime` : `${supply.dose} mg once daily at destination bedtime, up to 5 nights per journey`} />
            <Row label="Quantity" value={`${tablets ?? '?'} tablets; ${supply.packType === 'part-pack' ? 'part pack' : 'full original pack'}`} />
            <Row label="Batch; expiry" value={`${supply.batchNumber}; ${formatUkDate(supply.expiryDate)}`} />
            <Row label="Label" value={armA ? ARM_A_LABEL_WORDING : ARM_B_LABEL_WORDING} />
            {armA && history.supplyNumber && <Row label="Tablets in the course so far (including today)" value={`${Number(history.supplyNumber) * 30} (last tablet no later than ${limit ? formatUkDate(limit) : '?'}, day 103 after supply 1)`} />}
            {armA && history.supplyNumber !== '3' && <Row label="Next review window" value={`${formatUkDate(win.start)} to ${formatUkDate(win.end)} (day 21 to day 30), accepted up to ${formatUkDate(win.acceptedUntil)} (day 37). In person, by a pharmacist. Booked or written down: ${yesNo(supply.reviewBooked)}`} />}
            {armA && history.supplyNumber === '3' && <Row label="End of course" value={`Supply 3 is the last supply. The GP is informed at the end of the course (informed: ${yesNo(summary.endOfCourseGpInformed)}). No further melatonin under this PGD for 6 months; after two courses in total, none until a GP review is documented.`} />}
            <Row label="Cautions acknowledged" value={supply.acknowledgedCautions.join(', ') || 'None'} />
          </dl>
        </>
      )}

      {!isBlocked && (
        <>
          <SectionHeader>Counselling given</SectionHeader>
          <CounsellingGrid items={counsellingList.map(([, label, v]) => [label, v] as [string, boolean])} />
          {counselling.adverseReaction && <p className="mt-2 text-xs text-gray-800">Adverse reaction and action taken: {counselling.adverseReactionDetails}</p>}
        </>
      )}

      {isBlocked && (
        <>
          <SectionHeader>Not supplied</SectionHeader>
          <dl>
            <Row label="Reasons" value={redFlagStops.map((a) => a.message).join('; ')} />
            <Row label="Advice and decision" value={summary.exclusionAdvice || 'Not recorded'} />
            <Row label="Referral" value={REFERRAL_LABEL[summary.referral]} />
            {armA && <Row label="Sleep hygiene (Appendix 1) given and CBT-I signposted" value={yesNo(summary.exclusionSleepHygieneGiven)} />}
            {armB && <Row label="Jet lag advice (Appendix 3) given" value={yesNo(summary.exclusionJetLagAdviceGiven)} />}
            {course.ended && <Row label="End of course: GP informed" value={`${yesNo(summary.endOfCourseGpInformed)}${summary.gpNotificationMethod ? ` (${summary.gpNotificationMethod})` : ''}`} />}
          </dl>
        </>
      )}

      {armA && (
        <>
          <SectionHeader>GP notification</SectionHeader>
          <p className="mb-1 text-xs text-gray-600">Within 7 days of supply 1 and at the end of the course, with the patient&apos;s consent. Method: {summary.gpNotificationMethod || 'not recorded'}.</p>
          {supply1 && supplied && <p className="mb-1 text-xs text-gray-800">Supply 1 letter sent: {summary.gpLetterSent === 'yes' ? `yes, ${formatUkDate(summary.gpLetterSentDate)}` : summary.gpLetterSent === 'no' ? 'no, not yet (due within 7 days of supply 1)' : 'not recorded'}.</p>}
          {course.ended && <p className="mb-1 text-xs text-gray-800">End of course ({course.reason}): GP informed {yesNo(summary.endOfCourseGpInformed)}.</p>}
          {gpText && <pre className="whitespace-pre-wrap rounded border border-gray-200 p-2 font-sans text-xs text-gray-800">{gpText}</pre>}
        </>
      )}

      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical notes</SectionHeader>
          <p className="whitespace-pre-wrap text-xs text-gray-800">{summary.clinicalNotes}</p>
        </>
      )}

      <SectionHeader>Declaration</SectionHeader>
      <p className="mb-3 text-xs text-gray-700">
        {armA ? `"${OFF_LABEL_RECORD_WORDS}"` : armB ? `"${ARM_B_RECORD_WORDS}"` : ''}. Declaration confirmed: {yesNo(summary.declarationConfirmed)}.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">{consent.practitionerRole === 'technician' ? 'Pharmacy technician' : 'Pharmacist'} name</p>
          <p className="min-h-[1.5rem] border-b border-gray-300 pb-1 text-sm text-navy-900">{summary.pharmacistName}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">GPhC registration number</p>
          <p className="min-h-[1.5rem] border-b border-gray-300 pb-1 text-sm text-navy-900">{summary.pharmacistGPhC}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Pharmacy</p>
          <p className="min-h-[1.5rem] border-b border-gray-300 pb-1 text-sm text-navy-900">{summary.pharmacyName}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Signature and date</p>
          <div className="min-h-[2rem] border-b border-gray-300" />
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-gray-400">
        Get Real Health ePGD, {MELATONIN_PGD_NAME}, {MELATONIN_PGD_VERSION} | Confidential Patient Information | Records kept for 8 years
      </p>
    </div>
  );
}
