import type {
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';
import { daysUntilDeparture, yearsSincePreviousDose } from './typhoid-clinical-logic';

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
  if (!patient.travelDestination.trim()) return 'Travel destination is required';
  if (!patient.travelReason) return 'Risk region must be selected';
  if (!patient.departureDate) return 'Departure date is required';
  if (!patient.itinerary.trim()) return 'Itinerary is required (the record must carry destination, itinerary and departure date)';
  if (!patient.recommendationSource.trim()) return 'Record the source consulted for the recommendation (NaTHNaC / TravelHealthPro, with the date checked)';
  if (!travelAssessment.travelDestinationConfirmed) return 'Confirm typhoid vaccination is recommended for this destination on current NaTHNaC / TravelHealthPro guidance';
  if (!travelAssessment.travelReasonConfirmed) return 'Please confirm the risk region';
  if (!travelAssessment.timingConfirmed) return 'Please confirm departure timing';
  const days = daysUntilDeparture(patient.departureDate);
  if (days !== null && days < 14 && !travelAssessment.shortNoticeAdvised)
    return 'Departure is less than 2 weeks away: confirm the traveller has been told protection may be incomplete';
  if (patient.previousTyphoidDose && !patient.previousDoseDate)
    return 'Record the date of the previous typhoid dose';
  const years = yearsSincePreviousDose(patient.previousDoseDate);
  if (patient.previousTyphoidDose && years !== null && years < 3 && !patient.previousDoseRenewalReason.trim())
    return 'A dose within the last 3 years excludes unless the traveller is returning to a risk area and the previous dose is due for renewal: record the reason, or refer';
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
    if (patient.consentBasis === 'parental' && !patient.consentDetail.trim())
      return 'Record the name and relationship of the person with parental responsibility';
    if (patient.consentBasis === 'gillick' && !patient.consentDetail.trim())
      return 'Record the basis of the Gillick competence assessment';
  }
  if (!consent.understands5YearValidity)
    return 'Patient must confirm understanding that a booster is needed every 3 years if travel to risk areas continues';
  if (!consent.understandsTimingRequirement)
    return 'Patient must confirm understanding of timing (at least 2 weeks before travel)';
  if (!consent.certificateRequirement)
    return 'Patient must confirm understanding that the vaccine is about 70 to 80% effective, does not cover paratyphoid, and that food and water precautions remain the main protection';
  return null;
}

export function validateTyphoidMedicalHistoryStep(data: {
  pregnantOrBreastfeeding: boolean;
  pregnancyDecision: string;
}): string | null {
  if (data.pregnantOrBreastfeeding && !data.pregnancyDecision.trim())
    return 'Pregnancy or breastfeeding: discuss and record the decision';
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
  if (!summary.adrenalineAvailable) return 'Confirm adrenaline 1 in 1,000, a written anaphylaxis protocol and a telephone are immediately available';
  if (!summary.vaccineType) return 'Vaccine must be selected';
  if (summary.vaccineType === 'other-vi' && !summary.vaccineBrand?.trim()) return 'Record the brand of the Vi polysaccharide vaccine given';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  if (!summary.nextBoosterDue) return 'Record the date the next booster is due';
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
}): string | null {
  if (!data.observationCompleted)
    return 'Confirm the 15 minute observation period was completed';
  if (!data.counselledFoodWater)
    return 'Food and water hygiene advice must be given and recorded in every case';
  if (!data.counselledFeverWarning)
    return 'The post-travel fever warning must be given and recorded';
  if (!data.counselledReactions || !data.counselledValidity || !data.counselledCertificate)
    return 'Please confirm all counselling points';
  if (!data.patientAdvised)
    return 'Patient must be advised of common reactions and given safety information';
  return null;
}

export function validateTyphoidSummaryStep(
  summary: Partial<TyphoidSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}
