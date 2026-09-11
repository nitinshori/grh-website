import type {
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';
import { daysUntilDeparture, yearsSincePreviousDose, isExpired, RENEWAL_WINDOW_YEARS } from './typhoid-clinical-logic';

/** Age from which a Gillick competence assessment is offered. The document
 *  sets no age; below this the parental route is the only one offered. */
export const GILLICK_MIN_AGE = 12;

export function validateTyphoidPatientStep(
  patient: TyphoidPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 2) {
    // Signed PGD: travellers aged 2 years and over.
    return 'This PGD is for travellers aged 2 years and over. Refer under-2s to a travel clinic or the GP';
  }
  return null;
}

export function validateTyphoidStep(
  patient: TyphoidPatientDetails,
  travelAssessment: {
    travelDestinationConfirmed: boolean;
    travelReasonConfirmed: boolean;
    timingConfirmed: boolean;
    shortNoticeAdvised: boolean;
  }
): string | null {
  if (!patient.travelDestination.trim()) return '"Travel destination" is required';
  if (!patient.travelReason) return 'Select the "Risk region"';
  if (!patient.departureDate) return '"Departure date" is required';
  if (!patient.itinerary.trim()) return '"Itinerary" is required (the record must carry destination, itinerary and departure date)';
  if (!patient.recommendationSource.trim()) return '"Source consulted for the recommendation" is required (NaTHNaC / TravelHealthPro, with the date checked)';
  if (!patient.recommendedAnswer) return 'Answer "Is typhoid vaccination recommended for this destination on current NaTHNaC / TravelHealthPro guidance?" (Yes or No)';
  const days = daysUntilDeparture(patient.departureDate);
  // Under 2 weeks to departure the short-notice tick replaces the timing tick:
  // the two used to be required together, and the timing tick read "at least
  // 2 weeks before departure", which a short-notice traveller cannot meet.
  if (days !== null && days < 14) {
    if (!travelAssessment.shortNoticeAdvised) return 'Departure is less than 2 weeks away: tick "Travel is sooner than 2 weeks: the traveller has been told protection may be incomplete, and this is recorded"';
  } else if (!travelAssessment.timingConfirmed) {
    return 'Tick "Departure is at least 2 weeks away, so protection can develop"';
  }
  if (patient.previousTyphoidDose && !patient.previousDoseDate)
    return 'Record the date of the previous typhoid dose';
  const years = yearsSincePreviousDose(patient.previousDoseDate);
  if (patient.previousTyphoidDose && years !== null && years < 0)
    return 'The previous dose date is in the future: check the date';
  if (patient.previousTyphoidDose && years !== null && years < RENEWAL_WINDOW_YEARS)
    return 'A dose within the last 3 years that is not yet due for renewal excludes: record the advice given and save as not supplied';
  if (patient.previousTyphoidDose && years !== null && years < 3 && !patient.previousDoseRenewalAnswer)
    return 'Answer "Is the traveller returning to a risk area, with the previous dose due for renewal?" (Yes or No)';
  if (patient.previousTyphoidDose && years !== null && years < 3 && patient.previousDoseRenewalAnswer === 'yes' && !patient.previousDoseRenewalReason.trim())
    return 'Record why the previous dose is due for renewal in "Returning to a risk area: reason the dose is due for renewal"';
  return null;
}

export function validateTyphoidConsentStep(
  consent: TyphoidConsent,
  patient?: TyphoidPatientDetails
): string | null {
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (patient) {
    const under16 = patient.age !== null && patient.age < 16;
    if (!patient.consentBasis) return 'Record who gave consent';
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
  }
  if (!consent.understands5YearValidity)
    return 'Tick "Patient understands a booster is needed every 3 years..." once explained';
  if (!consent.understandsTimingRequirement)
    return 'Tick "Patient understands the vaccine takes about 2 weeks to work..." once explained';
  if (!consent.certificateRequirement)
    return 'Tick "Patient understands the vaccine is about 70 to 80% effective..." once explained';
  return null;
}

export function validateTyphoidMedicalHistoryStep(data: {
  pregnantOrBreastfeeding: boolean;
  pregnancyDecision: string;
}): string | null {
  if (data.pregnantOrBreastfeeding && !data.pregnancyDecision.trim())
    return '"Pregnancy or breastfeeding: decision recorded" is required when "Pregnant or breastfeeding" is ticked';
  return null;
}

export function validateTyphoidContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Please confirm there are no absolute contraindications';
  return null;
}

export function validateTyphoidAdministrationStep(
  summary: Partial<TyphoidSummary>
): string | null {
  if (!summary.adrenalineAvailable) return 'Tick "Adrenaline (epinephrine) 1 in 1,000 injection is immediately available..."';
  if (!summary.vaccineType) return 'Select the "Vaccine"';
  if (summary.vaccineType === 'other-vi' && !summary.vaccineBrand?.trim()) return 'Record the brand of the Vi polysaccharide vaccine given';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (isExpired(summary.expiryDate)) return 'Vaccine batch has expired: do not administer, quarantine the stock and select an in-date batch';
  if (!summary.administrationSite) return 'Select the "Administration site"';
  if (!summary.administrationTime) return '"Time of administration" is required';
  if (!summary.nextBoosterDue) return '"Next booster due (3 years)" is required';
  return null;
}

export function validateTyphoidPostVaccineStep(data: {
  patientAdvised: boolean;
  counselledReactions: boolean;
  counselledValidity: boolean;
  counselledCertificate: boolean;
  counselledFoodWater: boolean;
  counselledFeverWarning: boolean;
  observationCompleted: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
}): string | null {
  if (!data.observationCompleted)
    return 'Tick "Observed for 15 minutes after vaccination..." once the 15 minutes have elapsed';
  if (data.adverseReaction && !data.adverseReactionDetails.trim())
    return '"Adverse reaction and action taken" is required when "Adverse reaction observed" is ticked';
  if (!data.counselledFoodWater)
    return 'Tick "Food and water hygiene advice given..." (required in every case)';
  if (!data.counselledFeverWarning)
    return 'Tick "Post-travel fever warning given..." once the warning has been given';
  if (!data.counselledReactions)
    return 'Tick "Patient has been advised of common reactions..." once done';
  if (!data.counselledValidity)
    return 'Tick "Patient understands a booster is needed every 3 years..." once explained';
  if (!data.counselledCertificate)
    return 'Tick "Patient advised to seek medical attention for a serious adverse reaction..." once explained';
  if (!data.patientAdvised)
    return 'Tick "All counselling completed and documented"';
  return null;
}

export function validateTyphoidSummaryStep(
  summary: Partial<TyphoidSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}
