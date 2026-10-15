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
} from './melatonin-types';
import { PRODUCTS } from './melatonin-types';
import { previousCoursesFromRecords } from './melatonin-carry-forward';
import type { MelAlert } from './melatonin-clinical-logic';
import type { CourseStatus } from './melatonin-clinical-logic';
import {
  armADoseDecision,
  contraceptionContainsOestrogen,
  courseVerified,
  daysSince,
  isRestartOverRecordedCourse,
  isUnverifiedReview,
  londonTodayIso,
  medicineListOestrogenMatches,
  supply1GatesApply,
  armB5mgBlockedReason,
  cautionCodes,
  counsellingItems,
  isArmAReview,
  isExpired,
  isTechnician,
  parseLocalDate,
  productsForDose,
  todayLocal,
  totalPreviousCourses,
} from './melatonin-clinical-logic';

const inScore = (v: number | null, max: number) => v !== null && Number.isInteger(v) && v >= 0 && v <= max;

export function validateMelPatientStep(p: MelPatientDetails): string | null {
  if (!p.firstName.trim()) return 'Patient first name is required';
  if (!p.lastName.trim()) return 'Patient last name is required';
  if (!p.address.trim()) return 'Patient address is required for the PGD record';
  if (!p.dateOfBirth) return 'Date of birth is required';
  if (p.age === null) return 'Unable to calculate age';
  if (p.age < 0) return 'Date of birth is in the future: check the date entered';
  if (!p.sex) return "Record the patient's sex (pregnancy questions and STOP-Bang depend on it)";
  if (!p.occupation.trim()) return 'Record the occupation (the record must show that no occupational exclusion applies)';
  if (!p.gpPractice.trim()) return 'Record the GP practice';
  return null;
}

export function validateMelConsentStep(c: MelConsent): string | null {
  if (!c.arm) return 'Choose the arm: A (insomnia) or B (jet lag)';
  if (!c.practitionerRole) return 'Record whether you are a pharmacist or a pharmacy technician';
  if (!c.presentInPerson) return 'Record whether the patient is present, seen face to face on the premises (remote or telephone consultations are not covered)';
  if (!c.informedConsentGiven) return 'Valid informed consent must be obtained';
  if (!c.idVerified) return 'ID verification is required';
  if (!c.patientAwarePrivateService) return 'The patient must be aware this is a private service';
  if (c.arm === 'A') {
    if (!c.gpRegistered) return 'Confirm whether the patient is registered with a GP';
    if (!c.gpNotificationAgreed) return 'Confirm whether the patient agrees to the GP being informed within 7 days of supply 1 and at the end of the course';
    if (!c.offLabelScriptGiven) return 'Give the off-label consent script in substance and tick it';
    if (!c.toldLicenceEvidenceAlternatives) return 'Confirm the patient was told what the licence covers, why it is used, that benefit is uncertain and national guidance does not recommend it, and the alternatives';
    if (!c.acceptsOffLabel) return 'Record whether the patient consents to off-label treatment';
    if (c.acceptsOffLabel === 'yes' && !c.consentStatementSigned) return 'The patient must sign the consent statement in Appendix 4';
  }
  return null;
}

export function validateMelHistoryStep(h: MelHistory, c: MelConsent, p: MelPatientDetails): string | null {
  if (c.arm === 'A') {
    if (!h.recordLookup) return "Wait for the look-up of the patient's previous melatonin records at this pharmacy (enter the name and date of birth on the Patient step)";
    if (!h.supplyNumber) return 'Record the supply number in this course (1, 2 or 3)';
    if (isUnverifiedReview(c, h)) {
      if (!h.unverifiedReason.trim()) return `Supply ${h.supplyNumber} is not verified by the pharmacy records: record the reason`;
      if (!h.supply1RecordRef.trim()) return 'Record the supply 1 record reference and date (the record seen)';
    }
    if (isRestartOverRecordedCourse(c, h) && !h.restartReason.trim()) {
      return h.carriedForward?.latestCourseState === 'open'
        ? `The pharmacy records show an arm A course open (today would be supply ${h.carriedForward.expectedSupply}): record the reason supply 1 of a new course is chosen`
        : 'The pharmacy records show an arm A course that lapsed in the last 6 months: record the reason supply 1 of a new course is chosen';
    }
    if (supply1GatesApply(c, h)) {
      if (!h.previousStopRule2) return 'Record whether a previous melatonin course ended because of next-day drowsiness or a fall (stopping rule 2)';
      if (h.previousCoursesThisPgd === null || h.previousCoursesCircadin === null) return 'Record the number of previous courses under this PGD and under the Circadin PGD (0 if none)';
      if (!Number.isInteger(h.previousCoursesThisPgd) || !Number.isInteger(h.previousCoursesCircadin) || h.previousCoursesThisPgd < 0 || h.previousCoursesCircadin < 0) return 'Previous courses must be whole numbers, 0 or more';
      if (!h.coursesAskedSpecifically) return 'Confirm the pharmacy record was checked and the patient asked specifically about supplies elsewhere and under the Circadin PGD';
      const total = totalPreviousCourses(h) ?? 0;
      if (total > 0 && !h.previousCourseEndDate) return 'Record the date the most recent course ended';
      if (h.previousCourseEndDate) {
        const d = parseLocalDate(h.previousCourseEndDate);
        if (!d || d.getTime() > todayLocal().getTime()) return 'The date the previous course ended cannot be in the future';
      }
      const recordedEnd = h.carriedForward?.lastCourseEndDate ?? '';
      if (recordedEnd && (!h.previousCourseEndDate || h.previousCourseEndDate < recordedEnd)) return `The records at this pharmacy show a course ended on ${recordedEnd}: the date the most recent course ended cannot be earlier`;
      if (total >= 2) {
        if (!h.gpReviewDocumented) return 'Two or more previous courses: record whether a GP review since the end of the most recent course is documented';
        if (h.gpReviewDocumented === 'yes' && (!h.gpReviewSource || !h.gpReviewDate)) return 'Record how the GP review is documented and its date';
        if (h.gpReviewDocumented === 'yes') {
          if (!parseLocalDate(h.gpReviewDate)) return 'Check the date of the GP review';
          if (h.gpReviewDate > londonTodayIso()) return 'The date of the GP review cannot be in the future';
        }
      }
      if (!h.inCircadinCourse) return 'Record whether the patient is currently in a course under the Circadin PGD';
      if (p.age !== null && p.age >= 55 && !h.route55Reason.trim()) return 'Aged 55 or over: record why this route (this PGD rather than the Circadin PGD) was chosen for this course';
      const found = previousCoursesFromRecords(h.carriedForward, h.supplyNumber);
      if (h.previousCoursesThisPgd !== null && h.previousCoursesThisPgd < found) return `The records at this pharmacy show ${found} previous course(s) under this PGD: the count cannot be lower`;
    }
    if (h.supplyNumber !== '1') {
      if (!h.supply1Date) return 'Record the date of supply 1 of this course';
      if (!h.lastSupplyDate) return 'Record the date of the last supply';
      const s1 = parseLocalDate(h.supply1Date);
      const last = parseLocalDate(h.lastSupplyDate);
      if (!s1 || !last) return 'Check the dates entered';
      if (last.getTime() < s1.getTime()) return 'The last supply cannot be before supply 1';
      if (last.getTime() > todayLocal().getTime()) return 'The last supply cannot be in the future';
      if (h.supplyNumber === '2' && h.supply1Date !== h.lastSupplyDate) return 'At supply 2 the last supply is supply 1: the dates must match';
      if (h.supplyNumber === '3' && h.supply1Date === h.lastSupplyDate) return 'At supply 3 the last supply is supply 2, which must be after supply 1';
      if (!h.reviewInPerson) return 'Record whether the review is in person by a pharmacist';
      if (!h.previousDose) return 'Record the dose of the last supply';
      if (courseVerified(h) && h.carriedForward && h.carriedForward.supply1Date && h.supply1Date !== h.carriedForward.supply1Date) return 'The supply 1 date is taken from the pharmacy records';
      if (h.supplyNumber === '2' && h.previousDose !== '3') return 'Supply 1 is always 3 mg';
      if (h.baselineRating === null || !inScore(h.baselineRating, 10)) return 'Record the baseline 0 to 10 sleep quality rating from supply 1';
    }
  }
  if (c.arm === 'B') {
    if (h.armBSuppliesLast12Months === null || !Number.isInteger(h.armBSuppliesLast12Months) || h.armBSuppliesLast12Months < 0) return 'Record the number of arm B supplies in the 12 months before today (0 if none)';
    if (!h.armBCountAskedSpecifically) return 'Confirm the pharmacy record was checked and the patient asked about supplies elsewhere';
    if (!h.midArmACourse) return 'Record whether the patient is in the middle of an arm A course';
    if (!h.midCircadinCourse) return 'Record whether the patient is in the middle of a Circadin course';
    if (!h.previousJetLagSupply) return 'Record whether the patient has had a previous jet lag supply under this arm';
    if (!h.previousStopRule2) return 'Record whether a previous melatonin course ended because of next-day drowsiness or a fall (stopping rule 2)';
  }
  return null;
}

function validateStopRules(i: MelIndication): string | null {
  if (!i.stopRulesAsked) return 'Confirm each stopping rule question was asked';
  if (!i.nextDayDrowsiness || !i.fallWhileTaking || !i.newWorseMood || !i.allergySymptoms || !i.unacceptableSideEffect) return 'Answer every stopping rule question (drowsiness, falls, mood, rash or swelling, other side effects)';
  return null;
}

export function validateMelIndicationStep(i: MelIndication, c: MelConsent, h: MelHistory): string | null {
  if (c.arm === 'A' && h.supplyNumber === '1') {
    if (!i.difficultyGettingToSleep && !i.difficultyStayingAsleep && !i.wakingEarly) return 'Record the pattern: difficulty getting to sleep, staying asleep, or waking early';
    if (i.nightsPerWeek === null || i.nightsPerWeek < 0 || i.nightsPerWeek > 7) return 'Record the nights a week affected (0 to 7)';
    if (i.durationWeeks === null || i.durationWeeks < 0) return 'Record how many weeks the insomnia has been present';
    if (!i.daytimeImpact) return 'Record whether it affects daytime functioning';
    if (i.daytimeImpact === 'yes' && !i.daytimeImpactDetail.trim()) return 'Describe the effect on daytime functioning';
    if (h.baselineRating === null || !inScore(h.baselineRating, 10)) return 'Record the baseline 0 to 10 sleep quality rating (whole number)';
    if (!i.sleepHygieneRoute) return 'Record sleep hygiene: tried for at least 2 weeks, or severe daytime impairment documented';
    if (i.sleepHygieneRoute === 'tried' && i.sleepHygieneWeeks === null) return 'Record how long sleep hygiene had been followed';
    if (i.sleepHygieneRoute === 'severe-impairment' && (!i.severeImpairmentWhat.trim() || !i.severeImpairmentWhyNotWait.trim())) return 'Document the severe daytime impairment and why waiting 2 weeks is not reasonable';
    if (!i.cbtiSignposted) return 'CBT-I must be offered and signposted';
    if (!i.wishesShortCourse) return 'Record whether the patient, having been offered CBT-I, wishes to take a short course of medicine';
  }
  if (c.arm === 'A' && h.supplyNumber) {
    if (!i.shiftWork || !i.delayedSleepPattern || !i.caffeineUnaddressed) return 'Answer the shift work, delayed sleep pattern and caffeine questions (asked at every supply)';
  }
  if (isArmAReview(c, h)) {
    if (i.reviewRating === null || !inScore(i.reviewRating, 10)) return "Record today's 0 to 10 sleep quality rating (whole number)";
    if (i.nightsAffectedPerWeek === null || i.nightsAffectedPerWeek < 0 || i.nightsAffectedPerWeek > 7) return 'Record the nights a week affected (0 to 7)';
    if (!i.adherenceTimingFood) return 'Record adherence to the timing and no-food rules';
    if (i.higherDoseUnsafe && !i.higherDoseUnsafeReason.trim()) return 'Record the caution that makes a higher dose unsafe';
    const e = validateStopRules(i);
    if (e) return e;
  }
  if (c.arm === 'B') {
    if (!i.byAir) return 'Record whether the journey is by air';
    if (!i.destination.trim()) return 'Record the destination';
    if (!i.outwardDate) return 'Record the travel dates';
    if (i.timeZones === null || i.timeZones < 0 || i.timeZones > 14) return 'Record the time difference (time zones crossed)';
    if (!i.direction) return 'Record the direction of travel';
    if (!i.covers) return 'Record whether the supply covers the outward journey, the return journey, or both';
    if ((i.covers === 'both' || i.covers === 'return') && !i.returnDate) return 'Record the return date';
    if (i.covers === 'both' && !i.returnAlsoFiveZones) return 'A return journey is covered only where it also crosses 5 or more time zones: confirm, or cover one journey only';
    if (!i.insomniaAtHome) return 'Record whether this is insomnia at home rather than jet lag';
    if (!i.safetyCriticalDuringTrip) return 'Record whether the patient will be on safety-critical duty during the trip (pilot, aircrew, air traffic control or other)';
    if (!i.importAdviceGiven) return 'Give the advice to check the import rules of the destination country, and tick it';
    if (i.wants5mg && i.prev3mgJetLag) {
      if (!i.prev3mgEvidence) return 'Record how the previous 3 mg use is evidenced';
      if (i.prev3mgEvidence !== 'supplement' && i.prev3mgEvidence !== 'none' && !i.prev3mgProduct.trim()) return 'Record the previous 3 mg product and where it came from (or the record seen)';
      if (i.prev3mgInadequate && !i.prev3mgWhyInadequate.trim()) return 'Record why the previous 3 mg was inadequate';
    }
    if (h.previousJetLagSupply === 'yes') {
      const e = validateStopRules(i);
      if (e) return e;
    }
  }
  return null;
}

export function validateMelScreensStep(s: MelScreens, c: MelConsent, h: MelHistory): string | null {
  if (c.arm === 'A') {
    if (!inScore(s.phq1, 3) || !inScore(s.phq2, 3)) return 'Score both PHQ-2 questions (0 to 3)';
    if (!inScore(s.gad1, 3) || !inScore(s.gad2, 3)) return 'Score both GAD-2 questions (0 to 3)';
    if (h.supplyNumber === '1') {
      if (!s.epworthOnLicensedForm) return "Confirm the patient completed the Epworth Sleepiness Scale on the pharmacy's licensed form";
      if (!inScore(s.epworth, 24)) return 'Record the Epworth Sleepiness Scale total (whole number, 0 to 24)';
    } else if (s.epworth !== null && !inScore(s.epworth, 24)) return 'The Epworth total must be a whole number from 0 to 24';
  }
  if (c.arm === 'A' || s.moodAnxietySymptom) {
    if (!s.selfHarmAsked) return 'Whatever the score, ask directly about thoughts of self-harm or suicide, and tick that it was asked';
    if (!s.selfHarmThoughts) return 'Record the answer about thoughts of self-harm or suicide';
  }
  if (!s.fallLast12Months) return 'Ask every patient about falls in the last 12 months';
  if (!s.redFlagsAsked) return 'Confirm every red flag on this step was asked about';
  return null;
}

export function validateMelMedicalStep(m: MelMedical, c: MelConsent, p: MelPatientDetails): string | null {
  if (m.renalLesser && !m.renalSevere && !(c.arm === 'B' && isTechnician(c)) && !m.renalMildStable) return 'Renal impairment short of severe: record whether you are satisfied it is mild and stable';
  if (p.sex === 'female') {
    if (!m.childbearingPotential) return 'Record whether she is of childbearing potential';
    if (!m.pregnant) return 'Record whether she is or may be pregnant';
    if (m.childbearingPotential === 'yes') {
      if (!m.usingContraception) return 'Record whether she is using contraception';
      if (m.usingContraception === 'yes' && !m.contraceptiveMethod.trim()) return 'Record the contraceptive method';
    }
  }
  if (!m.questionsAsked) return 'Confirm every question on this step was asked';
  return null;
}

export function validateMelMedicinesStep(m: MelMedicines, c: MelConsent, med: MelMedical): string | null {
  if (!m.prescribedMelatonin) return 'Record whether the patient is already prescribed melatonin';
  if (!m.otherSourceMelatonin) return 'Record whether the patient takes melatonin from any other source';
  if (m.otherSourceMelatonin === 'yes' && !m.otherMelatoninWillingStop) return 'Record whether the patient is willing to stop the other melatonin';
  if (m.otherSourceMelatonin === 'yes' && m.otherMelatoninWillingStop === 'yes' && !m.otherMelatoninProduct.trim()) return 'Record the other melatonin product the patient agrees to stop';
  if (!m.oestrogen) return 'Record whether the patient takes any medicine containing an oestrogen (combined hormonal contraception as a pill, patch or ring, or HRT in any form)';
  if (m.oestrogen === 'yes' && !m.oestrogenDetail.trim()) return 'Name the oestrogen-containing medicine';
  if (contraceptionContainsOestrogen(med) && m.oestrogen !== 'yes')
    return `The contraception recorded on the Medical History step ("${med.contraceptiveMethod.trim()}") contains an oestrogen: the oestrogen answer must be yes (3 mg maximum). Correct one answer or the other`;
  if (m.sedating && !m.sedatingDetail.trim()) return 'Name the sedating medicine';
  if (!m.fullMedicineList.trim()) return 'Record the full medicine list (write "none" if none)';
  const oestrogenWords = medicineListOestrogenMatches(m);
  if (oestrogenWords.length && m.oestrogen !== 'yes')
    return `The medicine list names an oestrogen-containing product (${oestrogenWords.join(', ')}): the oestrogen answer must be yes (3 mg maximum). Correct one answer or the other`;
  if (c.arm === 'A' && !m.safetyCriticalWork) return 'Record whether the patient is a professional driver or safety-critical worker';
  if (m.alertAtNight && !m.alertAtNightAdvice.trim()) return 'Record the advice given to a patient who must be alert at night';
  if (!m.questionsAsked) return 'Confirm every question on this step was asked';
  return null;
}

export function validateMelSupplyStep(
  s: MelSupply,
  c: MelConsent,
  h: MelHistory,
  i: MelIndication,
  p: MelPatientDetails,
  med: MelMedical,
  meds: MelMedicines,
  alerts: MelAlert[]
): string | null {
  if (!s.dose) return 'Choose the dose';
  if (c.arm === 'A') {
    const d = armADoseDecision(p, h, i, meds);
    if (!d || !d.options.includes(s.dose)) return 'The dose is not one the arm A review rules allow today';
  }
  if (c.arm === 'B' && s.dose === '5') {
    const why = armB5mgBlockedReason(p, i, meds);
    if (!i.wants5mg || why) return `5 mg is not permitted: ${why ?? 'the 5 mg criteria have not been recorded'}`;
  }
  if (!s.product) return 'Choose the product';
  if (!productsForDose(s.dose, c.arm).includes(s.product as Exclude<typeof s.product, ''>)) return 'One product and strength per supply: the product must match the dose (only Adaflex 5 mg is supplied at 5 mg)';
  if (s.product === 'colonis-3' && med.lactoseIntolerance) return 'The Colonis tablet contains lactose: supply Adaflex 3 mg instead';
  if (s.product === 'colonis-3' && p.sex === 'male' && !med.manPlanningPregnancy) return 'Colonis tablet for a man: ask whether he and his partner are planning a pregnancy';
  if (!s.batchNumber.trim()) return 'Record the batch number';
  if (!s.expiryDate) return 'Record the expiry date';
  if (isExpired(s.expiryDate)) return 'The stock is out of date';
  if (!s.packType) return 'Record whether a full original pack or a part pack was supplied';
  if (c.arm === 'B' && s.packType === 'full-pack') return 'Arm B supplies (5 or 10 tablets) are always part packs';
  if (s.product && PRODUCTS[s.product].strengthMg !== Number(s.dose)) return 'The product strength does not match the dose';
  if (!s.labelled) return 'Label as a dispensed medicine with the wording shown and BNF cautionary label 2';
  if (!s.pilSupplied) return 'Supply the patient information leaflet (or a copy with a part pack)';
  if (c.arm === 'A' && h.supplyNumber !== '3' && !s.reviewBooked) return 'Book or write down the review window for the patient';
  const missing = cautionCodes(alerts).filter((code) => !s.acknowledgedCautions.includes(code));
  if (missing.length) return 'Acknowledge every caution listed on this step';
  return null;
}

export function validateMelCounsellingStep(c: MelCounselling, consent: MelConsent, opts: { maleColonisPlanning: boolean; supplyNumber: string }): string | null {
  const missing = counsellingItems(consent.arm, c, opts).filter(([, , v]) => !v);
  if (missing.length) return `Counselling not complete: ${missing[0][1].split('.')[0]}`;
  if (c.adverseReaction && !c.adverseReactionDetails.trim()) return 'Record the adverse reaction and the action taken';
  if (!c.allCounsellingComplete) return 'Confirm all counselling was completed and documented';
  return null;
}

export function validateMelSummaryStep(s: MelSummary, c: MelConsent, h: MelHistory, course: CourseStatus): string | null {
  if (!s.declarationConfirmed) return 'Confirm the practitioner declaration';
  if (!s.pharmacistName.trim()) return 'Practitioner name is required';
  if (!s.pharmacistGPhC.trim()) return 'GPhC registration number is required';
  if (c.arm === 'A' && !s.gpNotificationMethod.trim()) return 'Record how the GP is informed';
  if (c.arm === 'A' && h.supplyNumber === '1') {
    if (!s.gpLetterSent) return 'Record whether the GP letter has been sent (within 7 days of supply 1)';
    if (s.gpLetterSent === 'yes') {
      const d = daysSince(s.gpLetterSentDate);
      if (d === null) return 'Record the date the GP letter was sent';
      if (d < 0) return 'The date the GP letter was sent cannot be in the future';
    }
  }
  if (course.ended && !s.endOfCourseGpInformed) return 'END OF COURSE: the GP is informed of the end of the course. Tick it';
  return null;
}

/** The not-supplied record: reason, advice, referral and the arm's advice requirement. */
export function validateMelExclusionOutcome(s: MelSummary, c: MelConsent, course: CourseStatus): string | null {
  if (!s.exclusionAdvice.trim()) return 'Record the reason, the advice given and the decision reached';
  if (!s.referral) return 'Record the referral or next action';
  if (c.arm === 'A' && !s.exclusionSleepHygieneGiven) return 'Give the sleep hygiene advice in Appendix 1 in every case, and signpost CBT-I';
  if (c.arm === 'B' && !s.exclusionJetLagAdviceGiven) return 'Give the non-drug jet lag advice in Appendix 3';
  if (course.ended && (!s.endOfCourseGpInformed || !s.gpNotificationMethod.trim())) return 'END OF COURSE: the GP is informed of the end of the course. Tick it and record how';
  return null;
}
