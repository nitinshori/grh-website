'use client';

import React from 'react';
import { SectionHeader, Row, AlertSummary, CounsellingGrid } from '../../shared/components/SummaryReportShell';
import type { ClinicalAlert } from '../../shared/types';
import type {
  DCbti,
  DConsent,
  DCounselling,
  DCourse,
  DDriving,
  DMedical,
  DMedicines,
  DPatientDetails,
  DScreening,
  DSleep,
  DSummary,
  DSupply,
  StopEvent,
} from '../lib/daridorexant-types';
import {
  CBTI_STATUS_LABEL,
  DARIDOREXANT_PGD_NAME,
  DARIDOREXANT_PGD_VERSION,
  DAYS,
  LABEL_DIRECTIONS,
  LABEL_WARNING,
  NATION_LABEL,
  NHS_OFFER_LABEL,
  OSA_LABEL,
  PHQ9_Q9_LABEL,
  PRODUCTS,
  RECORD_WORDS,
  REFERRAL_LABEL,
  SCR_LABEL,
  STOP_SAME_DAY_WORDING,
  STOP_WITHIN_WEEK_WORDING,
  TABLETS_PER_SUPPLY,
  UNSUITABLE_LABEL,
  VISIT_LABEL,
} from '../lib/daridorexant-types';
import {
  ageAtFirstSupply,
  bmi,
  daysSince,
  excludedMedicines,
  formatUk,
  gpLetterText,
  intervalDays,
  intervalMaxDays,
  isReviewVisit,
  isVisit1,
  isVisit2,
  isVisit3,
  needsFullAssessment,
  nextVisitWindow,
  nightsWithoutTablets,
  nonStopEffects,
  otherSleepDisorders,
  responseTest,
  sameDayStopSymptoms,
  shortNights,
  stopBang,
  stopBangApplies,
  strengthToday,
  sleepAidIsLongActing,
  supplyNumber,
  untreatedCauses,
  weekStopSymptoms,
} from '../lib/daridorexant-clinical-logic';

interface Props {
  patient: DPatientDetails;
  consent: DConsent;
  course: DCourse;
  sleep: DSleep;
  cbti: DCbti;
  screening: DScreening;
  medical: DMedical;
  medicines: DMedicines;
  driving: DDriving;
  supply: DSupply;
  counselling: DCounselling;
  summary: DSummary;
  clinicalAlerts: ClinicalAlert[];
  isBlocked: boolean;
  stopHistory?: StopEvent[];
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');
const yn = (v: string) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not recorded');
const num = (v: number | null, unit = '') => (v === null ? 'Not recorded' : `${v}${unit}`);

export default function DaridorexantSummaryReport(props: Props) {
  const { patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply, counselling, summary, clinicalAlerts, isBlocked, stopHistory = [] } = props;
  const v1 = isVisit1(course);
  const full = needsFullAssessment(course);
  const v2 = isVisit2(course);
  const v3 = isVisit3(course);
  const review = isReviewVisit(course);
  const n = supplyNumber(course);
  const strength = strengthToday(course, medicines);
  const product = strength ? PRODUCTS[strength] : null;
  const supplied = !isBlocked && !!strength;
  const window0 = supplied ? nextVisitWindow(course) : null;
  const visitWindow = window0 && !window0.impossible ? window0 : null;
  const sb = stopBang(screening, patient);
  const b = bmi(screening);
  const r = responseTest(course, screening, supply);
  const shorts = shortNights(driving);
  const stopReasons = clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message);
  const letter = gpLetterText({
    ...props,
    pharmacistName: summary.pharmacistName,
    pharmacyName: summary.pharmacyName,
    strength,
    supplied,
    stopReasons,
    stopCodes: clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.code),
    adverseEffects: [...sameDayStopSymptoms(course), ...weekStopSymptoms(course), ...nonStopEffects(course), counselling.adverseReaction ? counselling.adverseReactionDetails : ''].filter(Boolean).join('; '),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 print:border-0 print:p-0">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-lg font-bold text-navy-900">Daridorexant (QUVIVIQ ▼) Consultation Record</h2>
        <p className="text-xs text-gray-600">
          {DARIDOREXANT_PGD_NAME}, {DARIDOREXANT_PGD_VERSION}. {supplied ? `The words: "${RECORD_WORDS}".` : 'Not supplied under this PGD.'}
        </p>
        <p className="text-xs text-gray-600">
          {formatUk(summary.consultationDate)} at {summary.consultationTime}
        </p>
      </div>

      <SectionHeader>Outcome</SectionHeader>
      <dl>
        <Row label="Visit" value={course.visitType ? VISIT_LABEL[course.visitType] : 'Not recorded'} />
        <Row label="Outcome" value={supplied ? `SUPPLIED: supply ${n} of ${3}` : isBlocked ? 'NOT SUPPLIED' : 'In progress'} />
        {isBlocked && <Row label="Reasons" value={stopReasons.join('; ')} />}
        {isBlocked && <Row label="Advice given and decision" value={summary.exclusionAdvice || 'Not recorded'} />}
        {isBlocked && <Row label="Referral" value={REFERRAL_LABEL[summary.referral]} />}
        {isBlocked && summary.riskActionRecord && <Row label="Suicide or self-harm risk: plans and intent, action taken" value={summary.riskActionRecord} />}
      </dl>

      <SectionHeader>Patient</SectionHeader>
      <dl>
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={`${formatUk(patient.dateOfBirth)} (age ${patient.age ?? '?'}; age at the first supply ${ageAtFirstSupply(patient, course) ?? '?'})`} />
        <Row label="Sex" value={patient.sex || 'Not recorded'} />
        <Row label="Address" value={patient.address || 'Not recorded'} />
        <Row label="NHS number" value={patient.nhsNumber || 'Not recorded'} />
        <Row label="GP" value={`${patient.gpName ? `${patient.gpName}, ` : ''}${patient.gpPractice || 'Not recorded'} (registered: ${yn(patient.gpRegistered)}; agrees to the GP being informed: ${yn(patient.gpNotificationAgreed)})`} />
        <Row label="Allergies and previous adverse reactions" value={medical.allergies || 'Not recorded'} />
      </dl>

      <SectionHeader>Consent</SectionHeader>
      <dl>
        <Row label="Face to face on the premises" value={yn(consent.faceToFace)} />
        <Row label="Valid informed consent; ID verified" value={`${yesNo(consent.informedConsentGiven)}; ${yesNo(consent.idVerified)}${consent.idType ? ` (${consent.idType})` : ''}`} />
        <Row label="Private service and cost understood" value={yesNo(consent.patientAwarePrivateService && consent.understandsCost)} />
        <Row label="3-supply limit, stop without adequate response, continuation is a prescriber's decision: explained" value={yesNo(consent.threeSupplyLimitExplained)} />
        <Row label="GP may decline to continue; private prescriber is the alternative: explained" value={yesNo(consent.gpMayDeclineExplained)} />
      </dl>

      <SectionHeader>Course</SectionHeader>
      <dl>
        <Row label="Supply number" value={n ? `${n} (never reset)` : 'None'} />
        <Row
          label="Course history source"
          value={
            course.manualOverride
              ? `Entered by hand, UNVERIFIED (reason: ${course.manualOverrideReason || 'not recorded'})`
              : course.recordLookup === 'found'
                ? `This pharmacy's records: ${course.carried?.suppliesOnRecord ?? 0} supplies on record`
                : course.recordLookup === 'error'
                  ? 'Records lookup failed'
                  : 'No previous record at this pharmacy'
          }
        />
        {v1 && <Row label="Previous course under this PGD at any pharmacy" value={yn(course.previousCourse)} />}
        <Row label="Daridorexant or another orexin antagonist from any other source" value={yn(course.orexinElsewhere)} />
        {review && (
          <>
            <Row label="Date of supply 1" value={formatUk(course.supply1Date)} />
            {v3 && <Row label="Date of supply 2" value={formatUk(course.previousSupplyDate)} />}
            <Row label="Days since the previous supply" value={`${intervalDays(course) ?? '?'} (limit 25 to ${intervalMaxDays(course)})`} />
            <Row label="Previous supply strength" value={course.previousStrength ? `${course.previousStrength} mg` : 'Not recorded'} />
            <Row label="Date of the last tablet" value={`${formatUk(course.lastTabletDate)} (${nightsWithoutTablets(course) ?? '?'} days without tablets, not counting ${course.withheldSinceLastTablet ?? 0} withheld)`} />
            <Row label="Nights withheld on this PGD's instruction" value={`${course.withheldNights ?? 0}${course.withheldDetails ? `: ${course.withheldDetails}` : ''}`} />
            <Row label="More than 7 nights without tablets at any point" value={yn(course.gapOver7Nights)} />
            <Row label="Adherence: nights taken of the last 14 due" value={num(course.nightsTakenOf14)} />
            <Row
              label="Regular moderate CYP3A4 inhibitor started during the course"
              value={
                course.midCourseInhibitor === 'yes'
                  ? `Yes: ${course.midCourseInhibitorName}; daridorexant stopped ${formatUk(course.midCourseStoppedDate)}; returned within 7 days: ${yn(course.midCourseReturnedWithin7)}; 50 mg tablets returned for destruction: ${yesNo(course.midCourse50Returned)}`
                  : yn(course.midCourseInhibitor)
              }
            />
            <Row label="Stop symptoms asked" value={yesNo(course.symptomsAsked)} />
            <Row label="Same-day stop symptoms" value={sameDayStopSymptoms(course).join('; ') || 'None'} />
            <Row label="Within-a-week stop symptoms" value={weekStopSymptoms(course).join('; ') || 'None'} />
            <Row label="Other side effects" value={nonStopEffects(course).join('; ') || 'None'} />
            <Row label="New shift work; restless legs; snoring with witnessed apnoea or daytime sleepiness" value={`${yn(course.reviewNewShiftWork)}; ${yn(course.reviewNewRestlessLegs)}; ${yn(course.reviewNewApnoeaOrSleepiness)}`} />
            <Row label="Patient wishes to stop" value={yesNo(course.wishesToStop)} />
          </>
        )}
        <Row label="Early supply or lost tablets request" value={yesNo(course.earlyOrLostRequest)} />
      </dl>

      {full && (
        <>
          <SectionHeader>Sleep history and diary</SectionHeader>
          <dl>
            <Row
              label="Pattern"
              value={[sleep.difficultyGettingToSleep && 'difficulty getting to sleep', sleep.difficultyStayingAsleep && 'difficulty staying asleep', sleep.wakingTooEarly && 'waking too early', sleep.unrefreshingSleep && 'unrefreshing sleep'].filter(Boolean).join(', ') || 'Not recorded'}
            />
            <Row label="Nights a week; duration" value={`${num(sleep.nightsPerWeek)} nights a week; ${num(sleep.durationMonths, ' months')}`} />
            <Row label="Usual bed and rising times" value={`${sleep.usualBedTime || '?'} to ${sleep.usualRiseTime || '?'}`} />
            <Row label="Adequate opportunity for sleep" value={yn(sleep.adequateOpportunity)} />
            <Row label="Daytime effects (patient's words)" value={`${sleep.daytimeEffects || 'Not recorded'} (considerable: ${yn(sleep.daytimeConsiderable)})`} />
            <Row
              label="Sleep diary"
              value={
                sleep.diaryKept === 'yes'
                  ? `${sleep.diaryNights} nights; consistent with the history: ${yn(sleep.diaryConsistent)}; time to fall asleep ${sleep.diaryTimeToFallAsleep}; time awake in the night ${sleep.diaryTimeAwake}; total sleep ${sleep.diaryTotalSleep}`
                  : yn(sleep.diaryKept)
              }
            />
            <Row label="Sleep hygiene followed 4 weeks; given again in writing" value={`${yn(sleep.hygieneFourWeeks)}; ${yesNo(sleep.hygieneWrittenGiven)}`} />
            <Row label="Causes considered and excluded" value={`${untreatedCauses(sleep).join('; ') || 'None present'}${sleep.causesConsideredNote ? `. ${sleep.causesConsideredNote}` : ''}`} />
            <Row label="Other sleep disorders" value={otherSleepDisorders(sleep).join('; ') || 'None'} />
          </dl>
        </>
      )}

      <SectionHeader>CBT-I</SectionHeader>
      <dl>
        {full && (
          <>
            <Row label="Gate decision" value={cbti.status ? CBTI_STATUS_LABEL[cbti.status] : 'Not recorded'} />
            {cbti.status === 'tried' && (
              <Row
                label="Programme, dates, how far"
                value={`${cbti.triedProgramme}; ${cbti.triedDates}; ${cbti.triedHowFar}. Completed or 4 weeks: ${yn(cbti.triedEngaged)}; within 2 years: ${yn(cbti.triedWithin2Years)}${cbti.triedEvidence ? `; evidence: ${cbti.triedEvidence}` : ''}`}
              />
            )}
            {cbti.status === 'not-available' && (
              <Row
                label="NHS offers checked"
                value={`${cbti.nation ? NATION_LABEL[cbti.nation] : '?'}; Talking Therapies ${yesNo(cbti.checkedTalkingTherapies)}, local digital ${yesNo(cbti.checkedLocalDigital)}, national ${yesNo(cbti.checkedNational)}; ${cbti.nhsOffer ? NHS_OFFER_LABEL[cbti.nhsOffer] : '?'}. ${cbti.notAvailableNote}`}
              />
            )}
            {cbti.status === 'unsuitable' && <Row label="Reason" value={`${cbti.unsuitableCategory ? UNSUITABLE_LABEL[cbti.unsuitableCategory] : '?'}: ${cbti.unsuitableReason}`} />}
            <Row label="Paid private or digital CBT-I: told; decision" value={`${yesNo(cbti.privateProgrammesTold)}; ${cbti.privateDecision || 'Not recorded'}`} />
            {(cbti.status === 'not-available' || cbti.status === 'unsuitable') && (
              <Row
                label="Brief CBT-I delivered"
                value={`Stimulus control ${yesNo(cbti.briefStimulusControl)}; sleep window ${cbti.sleepWindowBedTime || '?'} to ${cbti.sleepWindowRiseTime || '?'} (${yesNo(cbti.briefSleepWindow)}); diary continued ${yesNo(cbti.briefDiaryContinued)}; plan in writing ${yesNo(cbti.briefPlanInWriting)}`}
              />
            )}
          </>
        )}
        {review && <Row label="Brief CBT-I given at supply 1; reinforced today" value={`${yn(cbti.briefGivenAtSupply1)}; ${yesNo(cbti.briefReinforced)}`} />}
      </dl>

      <SectionHeader>Screening</SectionHeader>
      <dl>
        <Row label="ISI (total only; licensed form)" value={`${num(screening.isi)}${review ? ` (baseline ${course.baselineIsi ?? '?'}; change ${course.baselineIsi !== null && screening.isi !== null ? screening.isi - course.baselineIsi : '?'})` : ' (baseline)'}; completed on the licensed form: ${yesNo(screening.isiOnLicensedForm)}`} />
        <Row label="PHQ-9; question 9" value={`${num(screening.phq9)}; ${screening.phq9Q9 ? PHQ9_Q9_LABEL[screening.phq9Q9] : 'Not recorded'}`} />
        <Row label="GAD-2; GAD-7" value={`${num(screening.gad2)}; ${screening.gad7 !== null ? screening.gad7 : 'Not done'}`} />
        {full && (
          <>
            <Row label="Epworth Sleepiness Scale" value={num(screening.epworth)} />
            <Row label="Measured height, weight, BMI, neck" value={`${num(screening.heightCm, ' cm')}, ${num(screening.weightKg, ' kg')}, BMI ${b ?? '?'}, neck ${num(screening.neckCm, ' cm')}`} />
            <Row label="Sleep apnoea" value={screening.osa ? OSA_LABEL[screening.osa] : 'Not recorded'} />
            {stopBangApplies(screening) && (
              <Row label="STOP-Bang" value={`Score ${sb.score}; STOP items ${sb.stopItems}; witnessed apnoea: ${yn(screening.observed)}`} />
            )}
          </>
        )}
      </dl>

      <SectionHeader>Medical, mental health and substances</SectionHeader>
      <dl>
        <Row label="Medical exclusions asked; mental health and substances asked" value={`${yesNo(medical.questionsAsked)}; ${yesNo(medical.mentalAsked)}`} />
        <Row label="Other conditions" value={medical.otherConditions || 'None recorded'} />
      </dl>

      <SectionHeader>Medicines and Summary Care Record</SectionHeader>
      <dl>
        <Row label="Medicines checked (incl. OTC, herbal, recreational)" value={`${medicines.currentMedicines || 'Not recorded'} (checked against Appendix 4: ${yesNo(medicines.questionsAsked)})`} />
        <Row label="Excluded medicines" value={excludedMedicines(medicines).join('; ') || 'None'} />
        <Row label="Moderate CYP3A4 inhibitor setting 25 mg" value={medicines.moderateInhibitorRegular ? `${medicines.moderateInhibitorName}; stable ${yn(medicines.moderateStable)}; continuing ${yn(medicines.moderateContinue)}` : 'None'} />
        <Row label="Short course of an interacting medicine" value={medicines.shortCourseInhibitor ? medicines.shortCourseDetails : 'None'} />
        <Row label="Sleep aid stopped" value={medicines.nonPrescribedSleepAid ? `${medicines.sleepAidName}; agrees to stop ${yn(medicines.sleepAidAgreesStop)}; last dose ${formatUk(medicines.sleepAidLastDose)}${sleepAidIsLongActing(medicines) ? ` ${medicines.sleepAidLastDoseTime}; planned first dose ${formatUk(medicines.plannedFirstDoseDate)} ${medicines.plannedFirstDoseTime} (long-acting: at least 48 hours needed)` : ''}` : 'None'} />
        <Row label="Summary Care Record" value={`${medicines.scrStatus ? SCR_LABEL[medicines.scrStatus] : 'Not recorded'}${medicines.scrNote ? `: ${medicines.scrNote}` : ''}`} />
      </dl>

      <SectionHeader>Driving plan</SectionHeader>
      <dl>
        <Row label="Drives; drives for work" value={`${yn(driving.drives)}; ${yn(driving.drivesForWork)}`} />
        <Row label="Usual bedtime" value={driving.bedtime || 'Not recorded'} />
        <Row
          label="Earliest driving or alert activity"
          value={DAYS.filter((d) => driving.days[d].time).map((d) => `${d} ${driving.days[d].time}${driving.days[d].work ? ' (work)' : ''}`).join('; ') || 'None recorded'}
        />
        <Row label="Nights to skip (under 9 hours)" value={shorts.length ? shorts.map((s) => `${s.nightBefore} night (${s.hours} hours before ${s.day})`).join('; ') : 'None'} />
        <Row label="Group 2 for work; safety-critical role" value={`${yesNo(driving.group2ForWork)}; ${yesNo(driving.safetyCriticalRole)}`} />
        <Row label="Must drive early and cannot keep 9 hours" value={yn(driving.mustEarlyCannot9)} />
        {v1 && driving.drives === 'yes' && <Row label="First 4 doses before non-driving days" value={`${yn(driving.first4Arranged)}${driving.first4Plan ? `: ${driving.first4Plan}` : ''}; plan agreed: ${yesNo(driving.planAgreed)}`} />}
        {review && <Row label="Plan reconfirmed" value={yesNo(driving.reconfirmed)} />}
      </dl>

      {review && (
        <>
          <SectionHeader>{v2 ? 'Supply visit 2: early safety review' : 'Supply visit 3: effectiveness assessment'}</SectionHeader>
          <dl>
            <Row label="Wishes to continue" value={yn(supply.wishesToContinue)} />
            {v2 && <Row label="ISI unchanged or worse" value={course.baselineIsi !== null && screening.isi !== null ? yesNo(screening.isi >= course.baselineIsi) : 'Not recorded'} />}
            {v3 && (
              <>
                <Row label="(a) ISI fall of 6 or more" value={`${r.fall ?? '?'}: ${r.fallOk ? 'met' : 'not met'}`} />
                <Row label="(b) Current ISI 14 or below" value={`${screening.isi ?? '?'}: ${r.currentOk ? 'met' : 'not met'}`} />
                <Row label="(c) Daytime functioning better" value={`${yn(supply.daytimeBetter)}: ${r.daytimeOk ? 'met' : 'not met'}`} />
                <Row label="(d) Wishes to continue" value={r.wishesOk ? 'met' : 'not met'} />
                <Row label="Decision" value={r.complete ? (r.adequate && supplied ? 'Adequate response: supply 3 and handover letter' : 'Not adequate (or other criterion not met): stopped') : 'Not complete'} />
                {supplied && <Row label="Handover letter" value={`To ${supply.handoverRecipient === 'other' ? supply.handoverOtherName : 'the GP'}; sent today: ${yesNo(supply.handoverSentToday)} (${formatUk(summary.consultationDate)})`} />}
              </>
            )}
          </dl>
        </>
      )}

      {supplied && product && (
        <>
          <SectionHeader>Supply</SectionHeader>
          <dl>
            <Row label="Product" value={`${product.name}, ${product.maNumber} (from the pack: ${supply.maNumberFromPack || 'not recorded'})`} />
            <Row label="Dose" value={product.doseLabel} />
            <Row label="Quantity" value={`${TABLETS_PER_SUPPLY} tablets (one original pack)`} />
            <Row label="Batch; expiry" value={`${supply.batchNumber}; ${formatUk(supply.expiryDate)}`} />
            <Row label="Supply number; date of supply 1" value={`${n}; ${v1 ? formatUk(summary.consultationDate) : formatUk(course.supply1Date)}`} />
            <Row label="Label" value={`"${LABEL_DIRECTIONS}" plus: "${LABEL_WARNING}" (${yesNo(supply.labelled)})`} />
            <Row label="Leaflet; written record" value={`${yesNo(supply.pilSupplied)}; ${yesNo(supply.writtenRecordGiven)}`} />
            <Row label="Next supply visit window" value={visitWindow ? `${formatUk(visitWindow.from)} to ${formatUk(visitWindow.to)}, and no more than 7 days after the last tablet` : v3 ? 'None: last supply under this PGD; continuation is for a prescriber' : 'Not applicable'} />
          </dl>
        </>
      )}

      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid
        items={[
          ['Every night, within 30 minutes of bed', counselling.everyNight],
          ['Modest effect; alongside CBT-I', counselling.modestEffect],
          ['Driving advice and 9-hour rule', counselling.drivingAdvice],
          ['No alcohol; no grapefruit in the evening', counselling.alcoholGrapefruit],
          ['No other sleep aids', counselling.noOtherSleepAids],
          ['New medicines and interactions', counselling.newMedicines],
          ['Stop rules in writing', counselling.stopRulesWritten],
          ['Common side effects', counselling.commonEffects],
          ['Stop any time, no tapering', counselling.stopAnyTime],
          ['Black triangle; Yellow Card', counselling.blackTriangle],
          ['Next visit window; 7-night rule', counselling.nextVisitWindow],
          ['3-supply limit; GP may decline', counselling.gpMayDecline],
          ['Keep tablets safe; do not share', counselling.keepSafe],
          ...(patient.sex === 'female' ? ([['Pregnancy: stop and tell the GP', counselling.pregnancy]] as [string, boolean][]) : []),
          ...((patient.age ?? 0) >= 65 ? ([['Falls advice', counselling.fallsAdvice]] as [string, boolean][]) : []),
          ...(screening.osa === 'cpap-most-nights' ? ([['Continue CPAP', counselling.cpapAdvice]] as [string, boolean][]) : []),
        ]}
      />
      <p className="mt-2 text-[11px] text-gray-600">{STOP_SAME_DAY_WORDING}</p>
      <p className="mt-1 text-[11px] text-gray-600">{STOP_WITHIN_WEEK_WORDING}</p>
      <dl className="mt-2">
        <Row label="Adverse reaction; action; Yellow Card" value={counselling.adverseReaction ? `${counselling.adverseReactionDetails}; Yellow Card submitted: ${yesNo(counselling.yellowCardSubmitted)}` : 'None recorded'} />
      </dl>

      <SectionHeader>Clinical alerts</SectionHeader>
      <AlertSummary alerts={clinicalAlerts} />
      {stopHistory.length > 0 && (
        <>
          <SectionHeader>Stops raised during the consultation</SectionHeader>
          <dl>
            {stopHistory.map((e, i) => (
              <Row
                key={`${e.code}-${i}`}
                label={e.code}
                value={`${e.message}. Raised ${new Date(e.raisedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })}${e.clearedAt ? `; cleared by a changed answer ${new Date(e.clearedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })}` : '; standing'}`}
              />
            ))}
          </dl>
        </>
      )}

      <SectionHeader>GP letter</SectionHeader>
      <p className="mb-1 text-[11px] text-gray-500">
        {supplied && v3 ? 'Handover letter (sent the same day).' : supplied && v1 ? 'Notification of supply 1 (within 7 days).' : supplied ? 'Notification of supply 2.' : 'Stop or not-supplied notification (within 7 days of any stop for a side effect).'} How sent: {summary.gpNotificationMethod || 'not recorded'}.
      </p>
      <pre className="whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-[11px] text-navy-900 print:bg-white">{letter}</pre>

      <SectionHeader>Pharmacist</SectionHeader>
      <dl>
        <Row label="Registered pharmacist declaration" value={yesNo(summary.registeredPharmacistConfirmed)} />
        <Row label="Name; GPhC" value={`${summary.pharmacistName || '?'}; ${summary.pharmacistGPhC || '?'}`} />
        <Row label="Pharmacy" value={`${summary.pharmacyName}${summary.pharmacyAddress ? `, ${summary.pharmacyAddress}` : ''}`} />
        {summary.clinicalNotes && <Row label="Clinical notes" value={summary.clinicalNotes} />}
        {review && <Row label="Days since supply 1" value={String(daysSince(course.supply1Date) ?? '?')} />}
      </dl>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Pharmacist signature</p>
          <div className="min-h-[2rem] border-b border-gray-300" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Date</p>
          <div className="min-h-[2rem] border-b border-gray-300" />
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-gray-400">
        Get Real Health ePGD, {DARIDOREXANT_PGD_NAME} | Confidential patient information | Records kept for 8 years
      </p>
    </div>
  );
}
