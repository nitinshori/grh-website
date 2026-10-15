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
} from './daridorexant-types';
import {
  daysSince,
  isExpired,
  isReviewVisit,
  isVisit1,
  isVisit3,
  midCourseRuleApplies,
  needsFullAssessment,
  parseTime,
  shortNights,
  sleepAidIsLongActing,
  sleepAidNamedLongActing,
  strengthToday,
  supplyNumber,
} from './daridorexant-clinical-logic';
import { maxOverrideVisitNumber } from './daridorexant-carry-forward';

const inRange = (v: number | null, min: number, max: number) => v !== null && Number.isInteger(v) && v >= min && v <= max;

export function validatePatient(p: DPatientDetails): string | null {
  if (!p.firstName.trim()) return 'Patient first name is required';
  if (!p.lastName.trim()) return 'Patient last name is required';
  if (!p.address.trim()) return 'Patient address is required for the PGD record';
  if (!p.dateOfBirth) return 'Date of birth is required';
  if (p.age === null) return 'Unable to calculate age';
  if (p.age < 0) return 'Date of birth is in the future: check the date entered';
  if (!p.sex) return "Record the patient's sex (used in STOP-Bang and the pregnancy questions)";
  if (!p.gpPractice.trim()) return 'The GP practice is required: GP notification is a condition of supply';
  if (!p.gpRegistered) return 'Confirm whether the patient is registered with a GP';
  if (!p.gpNotificationAgreed) return 'Confirm whether the patient agrees to the GP being informed';
  return null;
}

export function validateConsent(c: DConsent): string | null {
  if (c.patientDeclined) return 'Patient declines: record the advice given and the decision, then save the record';
  if (!c.faceToFace) return 'Confirm whether the consultation is face to face on the pharmacy premises';
  if (!c.informedConsentGiven) return 'Valid informed consent must be obtained before proceeding';
  if (!c.idVerified) return 'ID verification is required';
  if (!c.patientAwarePrivateService) return 'The patient must understand that this is a private service';
  if (!c.understandsCost) return 'Tick that the patient understands what the service costs';
  if (!c.threeSupplyLimitExplained) return 'Tick that the 3-supply limit, the stop at supply visit 3 without an adequate response, and that continuation is a prescriber\'s decision were explained';
  if (!c.gpMayDeclineExplained) return 'Tick that the patient was told the GP may decline to continue treatment and that a private prescriber is the alternative';
  return null;
}

export function validateCourse(c: DCourse): string | null {
  if (!c.recordLookup) return "Looking up this patient's previous daridorexant records at this pharmacy: wait a moment (name and date of birth are needed)";
  if (c.recordLookup === 'error' && !c.manualOverride)
    return "The pharmacy's previous daridorexant records could not be read: retry the look-up, or enter the course history by hand with the reason (the course is then unverified and the supply 1 assessment applies in full)";
  if (c.manualOverride && !c.manualOverrideReason.trim()) return 'Record the reason the course history is entered by hand instead of from the records';
  if (!c.visitType) return 'Select the supply visit';
  if (c.manualOverride) {
    const n = supplyNumber(c);
    const max = maxOverrideVisitNumber(c);
    if (n !== null && n > max) return `The records show ${c.carried?.suppliesOnRecord ?? 0} supplies: the visit entered by hand can be no later than supply visit ${max}`;
  }
  if (c.visitType === 'after3') return null;
  if (!c.orexinElsewhere) return 'Record whether the patient already takes daridorexant or another orexin receptor antagonist from any source';
  if (isVisit1(c)) {
    if (!c.previousCourse) return 'Record whether a course under this PGD was already started or completed at any pharmacy (patient\'s account and pharmacy records)';
    return null;
  }
  if (!c.supply1Date) return c.manualOverride ? 'Record the date of supply 1' : 'No supply 1 record was found: enter the course history by hand (reason required), or treat today as supply visit 1';
  if ((daysSince(c.supply1Date) ?? 0) < 0) return 'The date of supply 1 cannot be in the future';
  if (isVisit3(c) && !c.previousSupplyDate) return 'Record the date of supply 2';
  if (isVisit3(c) && c.previousSupplyDate < c.supply1Date) return 'Supply 2 cannot be before supply 1';
  if ((daysSince(c.previousSupplyDate) ?? 0) < 0) return 'The previous supply date cannot be in the future';
  if (!c.previousStrength) return 'Record the strength of the previous supply';
  if (!inRange(c.baselineIsi, 0, 28)) return 'Record the baseline ISI from supply 1 (0 to 28)';
  if (!c.lastTabletDate) return 'Record the date of the last tablet';
  if ((daysSince(c.lastTabletDate) ?? 0) < 0) return 'The date of the last tablet cannot be in the future';
  if (!inRange(c.withheldSinceLastTablet, 0, 60)) return 'Record how many of the nights since the last tablet were withheld on this PGD\'s instruction (0 if none)';
  if (!inRange(c.withheldNights, 0, 60)) return 'Record the nights withheld on this PGD\'s instruction since the previous supply (0 if none)';
  if ((c.withheldNights ?? 0) < (c.withheldSinceLastTablet ?? 0)) return 'Withheld nights since the previous supply must include those since the last tablet';
  if ((c.withheldNights ?? 0) > 0 && !c.withheldDetails.trim()) return 'Record the interacting medicine and the dates of the withheld nights';
  if (!c.gapOver7Nights) return 'Record whether there were more than 7 nights without tablets at any point (not counting withheld nights)';
  if (!inRange(c.nightsTakenOf14, 0, 14)) return 'Record the nights taken out of the last 14 on which a dose was due (0 to 14)';
  if (!c.midCourseInhibitor) return 'Record whether a regular moderate CYP3A4 inhibitor was started during the course';
  if (c.midCourseInhibitor === 'yes') {
    if (!c.midCourseInhibitorName.trim()) return 'Record the moderate CYP3A4 inhibitor started';
    if (!c.midCourseStoppedDate) return 'Record the date daridorexant was stopped';
    if ((daysSince(c.midCourseStoppedDate) ?? 0) < 0) return 'The date daridorexant was stopped cannot be in the future';
    if (!c.midCourseReturnedWithin7) return 'Record whether the patient returned within 7 days of stopping';
    if (c.midCourseReturnedWithin7 === 'yes' && (daysSince(c.midCourseStoppedDate) ?? 0) > 7) return `Daridorexant was stopped ${daysSince(c.midCourseStoppedDate)} days ago: the patient did not return within 7 days`;
    if (c.previousStrength === '50' && !c.midCourse50Returned) return 'The 50 mg tablets in hand are not taken and are returned for destruction: tick once returned';
    const since = daysSince(c.midCourseStoppedDate) ?? 0;
    if (since > 0 && (c.withheldSinceLastTablet ?? 0) < since) return `The ${since} nights since daridorexant was stopped for the inhibitor are withheld nights: record them in the withheld nights since the last tablet`;
  }
  if (!c.symptomsAsked) return 'Tick that every stop symptom since the last supply was asked about';
  if (!c.reviewNewShiftWork || !c.reviewNewRestlessLegs || !c.reviewNewApnoeaOrSleepiness)
    return 'Answer the new shift work, restless legs, and snoring, witnessed apnoea or daytime sleepiness questions (no new excluded condition since the last supply)';
  return null;
}

export function validateSleep(s: DSleep, c: DCourse): string | null {
  if (!needsFullAssessment(c)) return null;
  if (!s.difficultyGettingToSleep && !s.difficultyStayingAsleep && !s.wakingTooEarly && !s.unrefreshingSleep) return 'Record the pattern of the insomnia';
  if (!inRange(s.nightsPerWeek, 0, 7)) return 'Record the nights a week affected (0 to 7)';
  if (s.durationMonths === null || s.durationMonths < 0) return 'Record the duration in months';
  if (parseTime(s.usualBedTime) === null) return 'Record the usual time of going to bed (HH:MM)';
  if (parseTime(s.usualRiseTime) === null) return 'Record the usual time of getting up (HH:MM)';
  if (!s.adequateOpportunity) return 'Record whether there is adequate opportunity and circumstances for sleep';
  if (!s.daytimeEffects.trim()) return 'Record the daytime effects in the patient\'s own words';
  if (!s.daytimeConsiderable) return 'Record whether the effect on daytime functioning is considerable';
  if (!s.diaryKept) return 'Record whether a sleep diary was kept';
  if (s.diaryKept === 'yes') {
    if (!inRange(s.diaryNights, 1, 14)) return 'Record the consecutive nights the diary covers (7 to 14; where it is longer, review the most recent 14 nights)';
    if (!s.diaryConsistent) return 'Record whether the diary is consistent with the history';
    if (!s.diaryTimeToFallAsleep.trim() || !s.diaryTimeAwake.trim() || !s.diaryTotalSleep.trim())
      return 'Summarise the diary: usual time to fall asleep, time awake in the night, total sleep';
  }
  if (!s.hygieneFourWeeks) return 'Record whether sleep hygiene advice has been followed for at least the last 4 weeks';
  if (!s.hygieneWrittenGiven) return 'Sleep hygiene advice is given again in writing: tick once given';
  if (!s.causesAsked) return 'Tick that each possible cause was considered';
  if (!s.disordersAsked) return 'Tick that each other sleep disorder and narcolepsy feature was asked about';
  return null;
}

export function validateCbti(b: DCbti, c: DCourse): string | null {
  if (isReviewVisit(c)) {
    if (!b.briefGivenAtSupply1) return 'Record whether brief CBT-I components were given at supply 1';
    if (b.briefGivenAtSupply1 === 'yes' && !b.briefReinforced) return 'Brief CBT-I is reinforced at supply visits 2 and 3: tick once done';
  }
  if (!needsFullAssessment(c)) return null;
  if (!b.status) return 'Record the CBT-I position';
  if (b.status === 'available-not-tried' || b.status === 'preference') return null;
  if (b.status === 'tried') {
    if (!b.triedProgramme.trim()) return 'Record the programme';
    if (!b.triedDates.trim()) return 'Record the approximate dates';
    if (!b.triedHowFar.trim()) return 'Record how far the patient got';
    if (!b.triedEngaged) return 'Record whether the programme was completed or engaged with for at least 4 weeks';
    if (!b.triedWithin2Years) return 'Record whether it was within the last 2 years';
  }
  if (b.status === 'not-available') {
    if (!b.nation) return 'Record where the patient lives';
    if (!b.checkedTalkingTherapies || !b.checkedLocalDigital || !b.checkedNational)
      return 'Check the local NHS Talking Therapies offer, any locally commissioned digital CBT-I and the national offer, and tick each';
    if (!b.nhsOffer) return 'Record the NHS CBT-I offer found';
    if (!b.notAvailableNote.trim()) return 'Record what was checked';
  }
  if (b.status === 'unsuitable') {
    if (!b.unsuitableCategory) return 'Record why CBT-I is unsuitable';
    if (!b.unsuitableReason.trim()) return 'Record the specific reason';
  }
  if (!b.privateProgrammesTold) return 'Tell the patient that paid private and digital programmes exist: tick once told';
  if (!b.privateDecision.trim()) return "Record the patient's decision about paid private or digital CBT-I";
  if (b.status === 'not-available' || b.status === 'unsuitable') {
    if (!b.briefStimulusControl || !b.briefSleepWindow || !b.briefDiaryContinued || !b.briefPlanInWriting)
      return 'Deliver each brief CBT-I component (stimulus control, a sleep window plan, continuing the sleep diary) and give the plan in writing';
    if (parseTime(b.sleepWindowRiseTime) === null || parseTime(b.sleepWindowBedTime) === null) return 'Record the sleep window: fixed getting-up time and usual bedtime (HH:MM)';
  }
  return null;
}

export function validateScreening(s: DScreening, c: DCourse): string | null {
  if (!s.isiOnLicensedForm) return "Tick that the ISI was completed by the patient on the pharmacy's licensed form";
  if (!inRange(s.isi, 0, 28)) return 'Record the ISI total (0 to 28)';
  if (!inRange(s.phq9, 0, 27)) return 'Record the PHQ-9 total (0 to 27)';
  if (!s.phq9Q9) return 'Record the answer to PHQ-9 question 9';
  if (!inRange(s.gad2, 0, 6)) return 'Record the GAD-2 total (0 to 6)';
  if ((s.gad2 ?? 0) >= 3 && !inRange(s.gad7, 0, 21)) return 'GAD-2 of 3 or more: complete the full GAD-7 (0 to 21)';
  if (!needsFullAssessment(c)) return null;
  if (!inRange(s.epworth, 0, 24)) return 'Record the Epworth Sleepiness Scale total (0 to 24)';
  if (s.heightCm === null || s.heightCm < 100 || s.heightCm > 230) return 'Record the measured height (cm)';
  if (s.weightKg === null || s.weightKg < 30 || s.weightKg > 300) return 'Record the measured weight (kg)';
  if (s.neckCm === null || s.neckCm < 20 || s.neckCm > 70) return 'Record the measured neck circumference (cm)';
  if (!s.osa) return 'Record whether the patient has diagnosed obstructive sleep apnoea';
  if (s.osa === 'none') {
    if (!s.stopBangAsked) return 'Tick that each STOP-Bang item was asked';
    if (!s.observed) return 'Record the witnessed apnoea answer (observed to stop breathing, choke or gasp in sleep)';
  }
  return null;
}

export function validateMedical(m: DMedical): string | null {
  if (!m.questionsAsked) return 'Tick that every medical exclusion question was asked';
  if (!m.mentalAsked) return 'Tick that every mental health and substance question was asked';
  if (!m.allergies.trim()) return 'Record allergies and previous adverse reactions ("none known" where none)';
  return null;
}

export function validateMedicines(m: DMedicines, c: DCourse): string | null {
  if (!m.questionsAsked) return 'Tick that the medicines were checked against Appendix 4, including over the counter, herbal and recreational products';
  if (!m.currentMedicines.trim()) return 'Record the current medicines ("none" where none)';
  if (m.moderateInhibitorRegular) {
    if (!m.moderateInhibitorName.trim()) return 'Record the moderate CYP3A4 inhibitor';
    if (!m.moderateStable) return 'Record whether it is at a stable dose';
    if (!m.moderateContinue) return 'Record whether it is expected to continue for the rest of the course';
  }
  if (isReviewVisit(c) && c.midCourseInhibitor === 'yes' && !m.moderateInhibitorRegular)
    return 'A regular moderate CYP3A4 inhibitor was started during the course: tick it under moderate inhibitors';
  if (midCourseRuleApplies(c, m) && c.midCourseInhibitor !== 'yes')
    return 'The previous supply was 50 mg and a regular moderate CYP3A4 inhibitor is taken now: it was started during the course. Go back to Visit and Course, answer "started during the course: yes" and record the procedure (stopped, 7-day return, withheld nights, 50 mg tablets returned for destruction)';
  if (m.shortCourseInhibitor && !m.shortCourseDetails.trim()) return 'Record the short-course medicine and the dates';
  if (m.nonPrescribedSleepAid) {
    if (!m.sleepAidName.trim()) return 'Record the sleep aid';
    if (!m.sleepAidAgreesStop) return 'Record whether the patient agrees to stop it';
    if (m.sleepAidAgreesStop === 'yes' && !m.sleepAidLastDose) return 'Record when the sleep aid was (or will be) stopped';
    if (sleepAidNamedLongActing(m) && !m.sleepAidLongActing) return 'The sleep aid named is promethazine, a long-acting sedating antihistamine: tick it (48 hours from its last dose to the first dose)';
    if (m.sleepAidAgreesStop === 'yes' && sleepAidIsLongActing(m)) {
      if (parseTime(m.sleepAidLastDoseTime) === null) return 'Record the time of the last dose of the long-acting sedating antihistamine (HH:MM)';
      if (!m.plannedFirstDoseDate || parseTime(m.plannedFirstDoseTime) === null) return 'Record the date and time of the planned first (or next) dose of daridorexant, for the 48-hour gap';
    }
  }
  if (!m.scrStatus) return 'Record the Summary Care Record check';
  if ((m.scrStatus === 'no-record' || m.scrStatus === 'cannot-access') && !m.scrNote.trim()) return 'Record why the record was not checked';
  return null;
}

export function validateDriving(d: DDriving, c: DCourse): string | null {
  if (!d.drives) return 'Record whether the patient drives';
  if (parseTime(d.bedtime) === null) return 'Record the usual bedtime (HH:MM)';
  for (const [day, plan] of Object.entries(d.days)) {
    if (plan.time && parseTime(plan.time) === null) return `The time entered for ${day} is not a valid time (HH:MM)`;
  }
  if (!d.drivesForWork) return 'Record whether the patient drives for work';
  const shorts = shortNights(d);
  if (!d.mustEarlyCannot9)
    return shorts.length >= 3
      ? `${shorts.length} nights a week would need the dose skipped: answer explicitly whether the patient can reliably keep 9 hours`
      : 'Record whether the patient must drive or do other alert work early in the morning and cannot reliably keep 9 hours';
  if (isVisit1(c)) {
    if (d.drives === 'yes') {
      if (!d.first4Arranged) return 'Record whether the first 4 doses can be taken on nights before a day with no driving';
      if (d.first4Arranged === 'yes' && !d.first4Plan.trim()) return 'Record the agreed nights for the first 4 doses';
    }
    if (!d.planAgreed) return 'A workable plan is agreed before supply: tick once agreed';
  } else if (!d.reconfirmed) return 'Tick that the driving plan and the 9-hour rule were reconfirmed';
  return null;
}

export function validateSupply(s: DSupply, c: DCourse, m: DMedicines): string | null {
  if (isReviewVisit(c) && !s.wishesToContinue) return 'Record whether the patient wishes to continue';
  if (isVisit3(c) && !s.daytimeBetter) return 'Record whether the patient reports that their daytime functioning is better';
  if (!strengthToday(c, m)) return 'The strength cannot be determined: check the moderate CYP3A4 inhibitor answers on the Medicines step';
  if (!s.batchNumber.trim()) return 'Record the batch number';
  if (!s.expiryDate) return 'Record the expiry date';
  if (isExpired(s.expiryDate)) return 'The pack has expired: do not supply';
  if (!s.maNumberFromPack.trim()) return 'Record the marketing authorisation number printed on the pack supplied';
  if (!s.labelled) return 'Label as directed, with the additional warning: tick once done';
  if (!s.pilSupplied) return "Supply the manufacturer's patient information leaflet";
  if (!s.writtenRecordGiven) return 'Give the written record (dose, stop rules, driving plan, next visit window): tick once given';
  if (isVisit3(c)) {
    if (!s.handoverRecipient) return 'Record who the handover letter is sent to';
    if (s.handoverRecipient === 'other' && !s.handoverOtherName.trim()) return 'Record the prescriber the patient chooses';
    if (!s.handoverSentToday) return 'The handover letter is sent the same day: tick once sent';
  }
  return null;
}

export function validateCounselling(k: DCounselling, opts: { female: boolean; age65: boolean; cpap: boolean }): string | null {
  const required: [boolean, string][] = [
    [k.everyNight, 'every night, within 30 minutes of bed, not if forgotten'],
    [k.modestEffect, 'the modest effect, alongside sleep habits and CBT-I'],
    [k.drivingAdvice, 'the driving advice'],
    [k.alcoholGrapefruit, 'no alcohol, no grapefruit in the evening'],
    [k.noOtherSleepAids, 'no other sleep aids or drowsy medicines'],
    [k.newMedicines, 'new medicines and the interacting-medicine rules'],
    [k.stopRulesWritten, 'the stop rules in writing'],
    [k.commonEffects, 'the common side effects'],
    [k.stopAnyTime, 'stopping at any time without tapering'],
    [k.blackTriangle, 'the black triangle and Yellow Card'],
    [k.nextVisitWindow, 'the next visit window and the 7-night rule'],
    [k.gpMayDecline, 'the 3-supply limit and that the GP may decline'],
    [k.keepSafe, 'keep the tablets safe; do not share'],
  ];
  if (opts.female) required.push([k.pregnancy, 'pregnancy: stop and tell the GP']);
  if (opts.age65) required.push([k.fallsAdvice, 'falls advice']);
  if (opts.cpap) required.push([k.cpapAdvice, 'continue CPAP']);
  const missing = required.find(([v]) => !v);
  if (missing) return `Counselling point not ticked: ${missing[1]}`;
  if (k.adverseReaction && !k.adverseReactionDetails.trim()) return 'Record the adverse reaction and the action taken';
  if (k.adverseReaction && !k.yellowCardSubmitted) return 'Black triangle medicine: report every suspected adverse reaction via the Yellow Card scheme and tick once submitted';
  if (!k.allComplete) return 'Tick that all counselling was completed and documented';
  return null;
}

export function validateSummary(s: DSummary, technician: boolean): string | null {
  if (technician) return 'This PGD is not used by pharmacy technicians';
  if (!s.registeredPharmacistConfirmed) return 'Confirm that you are a pharmacist registered and practising with the GPhC, named and authorised under this PGD';
  if (!s.pharmacistName.trim()) return 'Pharmacist name is required';
  if (!s.pharmacistGPhC.trim()) return 'GPhC registration number is required';
  if (!s.gpNotificationMethod.trim()) return 'Record how the GP will be informed';
  return null;
}

export function validateExclusionOutcome(s: DSummary, riskPresent: boolean): string | null {
  if (!s.exclusionAdvice.trim()) return 'Record the reason explained, the advice given and the decision reached';
  if (!s.referral) return 'Record the referral or next action';
  if (riskPresent && !s.riskActionRecord.trim()) return 'Suicide or self-harm risk: record that plans and intent were asked about and what was done';
  return null;
}
