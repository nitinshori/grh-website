import type {
  HepatitisAConsent,
  HepatitisACourse,
  HepatitisAExclusionOutcome,
  HepatitisAIndication,
  HepatitisAMedicalHistory,
  HepatitisAPatientDetails,
  HepatitisAPostVaccineAdvice,
  HepatitisASummary,
} from './hepatitis-a-types';
import { PRODUCTS } from './hepatitis-a-types';
import {
  ageBandFor,
  assessSecondDoseTiming,
  bleedingCautionApplies,
  daysUntil,
  doseNumberFor,
  isExpired,
  monthsSinceFirstDose,
  parseLocalDate,
  secondDoseWindow,
  SECOND_DOSE_MIN_MONTHS,
} from './hepatitis-a-clinical-logic';

/** Age from which a Gillick competence assessment is offered. The document
 *  sets no age; below this the parental route is the only one offered. */
export const GILLICK_MIN_AGE = 12;

export function validateHepatitisAPatientStep(patient: HepatitisAPatientDetails): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 0) return 'Date of birth is in the future: check the date entered';
  if (patient.age < 1) {
    return 'This PGD is for individuals aged 1 year and over: none of the products is licensed below 1 year. Record the advice given and save as not supplied';
  }
  return null;
}

export function validateHepatitisAConsentStep(
  consent: HepatitisAConsent,
  patient: HepatitisAPatientDetails
): string | null {
  const under16 = patient.age !== null && patient.age < 16;
  if (consent.patientDeclined)
    return 'Patient declines vaccination: record the advice given and the decision reached, then save the record';
  if (!patient.consentBasis) return 'Record who gave consent';
  if (patient.consentBasis === 'unobtainable')
    return 'Under 16 and valid consent cannot be obtained: this is an exclusion. Record the advice given and save as not supplied';
  if (under16 && patient.consentBasis === 'self')
    return 'Under 16: consent must come from a person with parental responsibility, or the young person must be assessed as Gillick competent';
  if (patient.consentBasis === 'gillick' && patient.age !== null && patient.age < GILLICK_MIN_AGE)
    return `Gillick competence is offered from ${GILLICK_MIN_AGE} years; record consent from a person with parental responsibility`;
  if (!under16 && patient.consentBasis !== 'self')
    return 'Aged 16 and over: the patient consents in their own right';
  if (patient.consentBasis === 'parental' && !patient.consentDetail.trim())
    return 'Record the name and relationship of the person with parental responsibility';
  if (patient.consentBasis === 'gillick' && !patient.consentDetail.trim())
    return 'Record the basis of the Gillick competence assessment';
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService) return 'Patient must be aware this is a private service';
  if (!consent.understandsCost) return 'Tick "The patient understands what this service costs" once explained';
  return null;
}

export function validateHepatitisAIndicationStep(
  indication: HepatitisAIndication,
  course: HepatitisACourse
): string | null {
  // Post-exposure use is asked first: a contact of a case is referred the
  // same day whatever the travel or risk history.
  if (!indication.postExposure)
    return 'Answer "Is this a post-exposure situation (contact of a case, or exposure in an outbreak)?" (Yes or No)';
  if (indication.postExposure === 'yes')
    return 'Post-exposure situation: refer to the GP or the Health Protection Team the same day. Record the advice given and save the record';

  // Indication
  if (!indication.indicationType) return 'Select the "Indication under this PGD"';
  if (indication.indicationType === 'none')
    return 'No indication under this PGD: record the advice given and save as not supplied';
  const travel = indication.indicationType === 'travel' || indication.indicationType === 'both';
  const nonTravel = indication.indicationType === 'non-travel' || indication.indicationType === 'both';
  if (travel) {
    if (!indication.travelDestination.trim()) return '"Destination" is required';
    if (!indication.departureDate) return '"Departure date" is required';
    if (!indication.endemicityConfirmed)
      return 'Tick "The destination is an area of moderate or high hepatitis A endemicity..." (check TravelHealthPro where there is doubt)';
    const days = daysUntil(indication.departureDate);
    if (days !== null && days >= 0 && days < 14 && !indication.shortNoticeAdvised)
      return 'Departing within 2 weeks: tick "The dose is being given and the patient has been told full protection comes after about 2 weeks"';
  }
  if (nonTravel) {
    const any =
      indication.chronicLiverDisease ||
      indication.haemophiliaClottingFactors ||
      indication.injectsDrugs ||
      indication.msm ||
      indication.occupationalRisk;
    if (!any) return 'Tick at least one non-travel risk factor from the document\'s list';
    if (indication.occupationalRisk && !indication.occupationalRiskDetail.trim())
      return 'Record the occupational risk (e.g. laboratory work with the virus, sewage work, work with susceptible primates)';
  }
  if (!indication.hepBAlsoNeeded)
    return 'Answer "Does the patient also need hepatitis B protection?" (Yes or No)';
  if (indication.hepBAlsoNeeded === 'yes' && !indication.hepBDecision)
    return 'Hepatitis B also needed: choose whether to continue with hepatitis A only or to use the Hepatitis A and B (Travel) PGD';
  if (indication.hepBDecision === 'use-combined-pgd')
    return 'Continue in the Hepatitis A and B (Travel) PGD tool. Record the decision here and save as not supplied';
  if (indication.proofOfImmunityRequired)
    return 'Patient requires proof of immunity: serology is out of scope. Record the advice given and save as not supplied';

  // Course
  if (!course.courseStatus) return 'Select "Previous hepatitis A vaccination" (none, one dose, or a completed course)';
  if (course.courseStatus === 'completed') {
    if (!course.completedCourseOngoingRisk25Years)
      return 'A completed two dose course excludes unless the patient is at ongoing risk and 25 years have passed. Record the advice given and save as not supplied, or tick the exception if it applies';
    if (!course.completedCourseNote.trim())
      return 'Record what the patient told you about the completed course, the ongoing risk and the time elapsed';
  }
  if (course.courseStatus === 'one-dose') {
    if (!course.firstDoseProduct) return 'Select the "Product of the first dose"';
    if (course.firstDoseProduct === 'other' && !course.firstDoseProductOther.trim())
      return 'Record the brand of the first dose';
    if (!course.firstDoseDateKnown) return 'Answer whether the date of the first dose is known';
    if (course.firstDoseDateKnown === 'known') {
      if (!course.firstDoseDate) return '"Date of the first dose" is required';
      if (!parseLocalDate(course.firstDoseDate)) return 'Check the "Date of the first dose"';
      const months = monthsSinceFirstDose(course.firstDoseDate);
      if (months !== null && months < 0) return 'The date of the first dose is in the future: check the date';
      if (months !== null && months < SECOND_DOSE_MIN_MONTHS)
        return 'Too early: the second dose is 6 to 12 months after the first. Book it for the window; record the advice given and save as not supplied';
    } else {
      if (!course.firstDoseDateNote.trim())
        return 'Record what the patient reports about when and where the first dose was given';
      if (!course.firstDoseSixMonthsConfirmed)
        return 'Tick "The first dose was 6 months or more ago, as reliably reported by the patient"';
    }
  }
  return null;
}

export function validateHepatitisAMedicalHistoryStep(medicalHistory: HepatitisAMedicalHistory): string | null {
  if (medicalHistory.breastfeeding && !medicalHistory.breastfeedingDecision.trim())
    return '"Breastfeeding: decision recorded" is required when "Breastfeeding" is ticked';
  if (medicalHistory.immunosuppressed && !medicalHistory.immunosuppressionCounselling.trim())
    return '"Immunosuppression: counselling recorded" is required when "Immunosuppression, including HIV" is ticked';
  return null;
}

export function validateHepatitisAAdministrationStep(
  summary: HepatitisASummary,
  patient: HepatitisAPatientDetails,
  indication: HepatitisAIndication,
  course: HepatitisACourse,
  medicalHistory: HepatitisAMedicalHistory
): string | null {
  if (!summary.adrenalineAvailable) return 'Tick "Adrenaline (epinephrine) 1 in 1,000 injection is immediately available..."';
  if (!summary.product) return 'Select the "Vaccine given"';
  const band = ageBandFor(patient.age);
  if (band && PRODUCTS[summary.product].ageBand !== band)
    return band === 'adult'
      ? 'Aged 16 and over: the adult products are Havrix Monodose or Avaxim. Select the product for the patient\'s age'
      : 'Aged 1 to 15 inclusive: the paediatric products are Havrix Junior Monodose or Avaxim Junior. Select the product for the patient\'s age';
  // The Avaxim SmPC advice on pregnancy is applied to both Avaxim products.
  if (
    medicalHistory.pregnant &&
    (summary.product === 'avaxim' || summary.product === 'avaxim-junior') &&
    !summary.pregnancyRiskBenefitNote.trim()
  )
    return 'Avaxim in pregnancy: record the assessment of risks and benefits (Havrix is preferred)';
  if (medicalHistory.latexSensitivity && summary.product === 'avaxim' && !summary.latexPresentationChecked)
    return 'Latex sensitivity with adult Avaxim: tick that the presentation in hand was checked';
  const doseNumber = doseNumberFor(course);
  if (doseNumber === 'second' && course.firstDoseDateKnown === 'known') {
    const timing = assessSecondDoseTiming(course.firstDoseProduct, course.firstDoseDate, summary.product);
    if (timing.beyondWindow && !course.offLabelDecisionRecorded)
      return 'Second dose beyond the licensed window: tick "Informed off-label decision, explained to the patient and recorded"';
  }
  if (!summary.batchNumber.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (isExpired(summary.expiryDate)) return 'Vaccine batch has expired: do not administer, quarantine the stock and select an in-date batch';
  if (!summary.route) return 'Select the "Route"';
  const bleeding = bleedingCautionApplies(indication, medicalHistory);
  if (summary.route === 'subcutaneous' && !bleeding)
    return 'The subcutaneous route is for a bleeding disorder, thrombocytopenia, anticoagulation or haemophilia on plasma-derived clotting factors only; otherwise the route is intramuscular';
  if (bleeding && summary.route === 'intramuscular' && !summary.bleedingPrecautionsConfirmed)
    return 'Bleeding disorder or anticoagulation, intramuscular route: tick "Fine needle, 23 gauge or finer, and firm pressure without rubbing for at least 2 minutes"';
  if (!summary.administrationSite) return 'Select the "Administration site"';
  if (summary.coAdministered && !summary.coAdministeredDetails.trim())
    return 'Record the other vaccine given at this visit and its site';
  if (!summary.administrationTime) return '"Time of administration" is required';
  if (doseNumber === 'first') {
    if (!summary.secondDoseDue) return '"Second dose due" is required (6 to 12 months from today)';
    const win = secondDoseWindow();
    if (summary.secondDoseDue < win.earliest || summary.secondDoseDue > win.latest)
      return `"Second dose due" must be 6 to 12 months from today (${win.earliest} to ${win.latest})`;
  }
  return null;
}

export function validateHepatitisAPostVaccineStep(
  advice: HepatitisAPostVaccineAdvice,
  indication: HepatitisAIndication,
  course: HepatitisACourse
): string | null {
  const doseNumber = doseNumberFor(course);
  if (!advice.observationCompleted)
    return 'Tick "Observed for 15 minutes after vaccination, seated..." once the 15 minutes have elapsed';
  if (advice.adverseReaction && !advice.adverseReactionDetails.trim())
    return '"Adverse reaction and action taken" is required when "Adverse reaction observed" is ticked';
  if (!advice.counselledOneDoseProtection)
    return 'Tick "One dose protects from about 2 weeks and lasts about a year" once explained';
  if (!advice.counselledSecondDose)
    return doseNumber === 'first'
      ? 'Tick "Second dose in 6 to 12 months gives protection for at least 25 years; booked now" once explained'
      : 'Tick "Course complete: protection for at least 25 years, no further routine boosters" once explained';
  // The missed-date advice belongs to a first dose: after the second dose
  // there is no further date to miss.
  if (doseNumber === 'first' && !advice.counselledMissedDose)
    return 'Tick "If the second dose date is missed, come anyway: the course does not need restarting" once explained';
  if (!advice.counselledFoodWater)
    return 'Tick "Food and water hygiene advice given" (required in every case)';
  if (!advice.counselledReactions)
    return 'Tick "Common self-limiting reactions explained" once done';
  if (indication.hepBAlsoNeeded === 'yes' && !advice.counselledHepBNotCovered)
    return 'Hepatitis B was discussed: tick "This vaccine does not protect against hepatitis B or C" once explained';
  if (!advice.counselledFollowUp)
    return 'Tick "Follow-up advice given" once explained';
  if (!advice.pilSupplied)
    return 'Tick "Patient information leaflet for the product given supplied"';
  if (!advice.writtenRecordGiven)
    return doseNumber === 'first'
      ? 'Tick "Written record given: product, batch number, date and the date the second dose is due"'
      : 'Tick "Written record given: product, batch number and date, and that the course is complete"';
  if (!advice.toldSecondDoseDate)
    return doseNumber === 'first'
      ? 'Tick "The patient was told the date the second dose is due"'
      : 'Tick "The patient was told the course is complete and no further dose is due"';
  if (!advice.patientAdvised) return 'Tick "All counselling completed and documented"';
  return null;
}

/** What the document requires to be documented when the patient is excluded
 *  or declines: the reason discussed, the advice given (food and water
 *  hygiene in every case), the decision reached and the referral. */
export function validateHepatitisAExclusionOutcome(outcome: HepatitisAExclusionOutcome): string | null {
  if (!outcome.foodWaterAdviceGiven) return 'Tick "Food and water hygiene advice given" (required whether or not vaccine is given)';
  if (!outcome.adviceGiven.trim()) return 'Record the reason discussed, the advice given and the decision reached';
  if (!outcome.referral) return 'Select the "Referral or next action"';
  return null;
}

export function validateHepatitisASummaryStep(summary: Partial<HepatitisASummary>): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}
