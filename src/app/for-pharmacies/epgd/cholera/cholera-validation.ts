import type {
  CholeraPatientDetails,
  CholeraConsent,
  CholeraSummary,
} from './cholera-types';

export function validateCholeraPatientStep(
  patient: CholeraPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 2) return 'Oral cholera vaccine is not licensed below 2 years of age';
  return null;
}

export function validateCholeraStep(
  patient: CholeraPatientDetails,
  travelAssessment: {
    travelDestinationConfirmed: boolean;
    travelReasonConfirmed: boolean;
    timingConfirmed: boolean;
  }
): string | null {
  if (!patient.travelDestination.trim()) return 'Travel destination is required';
  if (!patient.travelReason) return 'Reason for vaccination must be selected';
  if (!patient.departureDate) return 'Departure date is required';
  if (!travelAssessment.travelDestinationConfirmed) return 'Please confirm travel destination';
  if (!travelAssessment.travelReasonConfirmed) return 'Please confirm the reason for vaccination';
  if (!travelAssessment.timingConfirmed) return 'Please confirm departure timing';
  return null;
}

export function validateCholeraConsentStep(
  consent: CholeraConsent
): string | null {
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService) return 'Patient must be aware this is a private service';
  if (!consent.understandsOralAdministration)
    return 'Patient must understand the vaccine is taken orally (dissolved in water)';
  if (!consent.understandsCourseSchedule)
    return 'Patient must understand the dose schedule (2–3 doses, 1–6 weeks apart)';
  if (!consent.understandsTimingBeforeTravel)
    return 'Patient must understand the course should be completed at least 1 week before travel';
  return null;
}

export function validateCholeraContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Please confirm there are no absolute contraindications';
  return null;
}

export function validateCholeraAdministrationStep(
  summary: Partial<CholeraSummary>
): string | null {
  if (!summary.vaccineType) return 'Vaccine (Dukoral / Vaxchora) must be selected';
  if (!summary.doseNumber) return 'Dose number must be selected';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateCholeraPostVaccineStep(data: {
  patientAdvised: boolean;
}): string | null {
  if (!data.patientAdvised)
    return 'Patient must be advised of common reactions and given safety information';
  return null;
}

export function validateCholeraSummaryStep(
  summary: Partial<CholeraSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}
