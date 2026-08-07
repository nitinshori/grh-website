import type {
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';

export function validateTyphoidPatientStep(
  patient: TyphoidPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 18) {
    // Signed PGD covers adults aged 18 years and over.
    return 'This PGD is for adults aged 18 years and over';
  }
  return null;
}

export function validateTyphoidStep(
  patient: TyphoidPatientDetails,
  travelAssessment: {
    travelDestinationConfirmed: boolean;
    travelReasonConfirmed: boolean;
    timingConfirmed: boolean;
  }
): string | null {
  if (!patient.travelDestination.trim()) return 'Travel destination is required';
  if (!patient.travelReason) return 'Travel reason must be selected';
  if (!patient.departureDate) return 'Departure date is required';
  if (!travelAssessment.travelDestinationConfirmed) return 'Please confirm travel destination';
  if (!travelAssessment.travelReasonConfirmed) return 'Please confirm travel reason';
  if (!travelAssessment.timingConfirmed) return 'Please confirm departure timing';
  return null;
}

export function validateTyphoidConsentStep(
  consent: TyphoidConsent
): string | null {
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (!consent.understands5YearValidity)
    return 'Patient must confirm understanding that protection lasts 3 years';
  if (!consent.understandsTimingRequirement)
    return 'Patient must confirm understanding of timing requirement (at least 2 weeks before travel)';
  return null;
}

export function validateTyphoidMedicalHistoryStep(data: {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
}): string | null {
  // Medical history step should always proceed to next
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
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateTyphoidPostVaccineStep(data: {
  patientAdvised: boolean;
}): string | null {
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
