/**
 * Smoking Cessation ePGD - Form Validation
 */

import { SmokingToolFormData, STEP_LABELS } from "./smoking-types";
import { calculateAge, getAllClinicalAlerts } from "./smoking-clinical-logic";

/** Whole days from date string a to date string b (b minus a). */
function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const da: Date = new Date(a);
  const db: Date = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate step 0: Patient Details
 */
export function validatePatientDetails(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!formData.firstName.trim()) {
    errors.push({ field: "firstName", message: "First name is required" });
  }

  if (!formData.lastName.trim()) {
    errors.push({ field: "lastName", message: "Last name is required" });
  }

  if (!formData.dateOfBirth) {
    errors.push({ field: "dateOfBirth", message: "Date of birth is required" });
  } else {
    const age: number | null = calculateAge(formData.dateOfBirth);
    if (age === null || age < 0) {
      errors.push({
        field: "dateOfBirth",
        message: "Please enter a valid date of birth",
      });
    } else if (age < 18) {
      // Age gate per signed PGD — adults 18+ (consistency review Jul 2026)
      errors.push({
        field: "dateOfBirth",
        message: "This PGD applies to adults aged 18 years and over",
      });
    }
  }

  if (!formData.gender.trim()) {
    errors.push({ field: "gender", message: "Gender is required" });
  }

  if (!formData.contactNumber.trim()) {
    errors.push({ field: "contactNumber", message: "Contact number is required" });
  }

  if (!formData.email.trim()) {
    errors.push({ field: "email", message: "Email address is required" });
  } else if (!isValidEmail(formData.email)) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  return errors;
}

/**
 * Validate step 1: Consent & ID
 */
export function validateConsent(formData: SmokingToolFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!formData.consentToTreatment) {
    errors.push({
      field: "consentToTreatment",
      message: "Consent to treatment is required",
    });
  }

  if (!formData.identityVerified) {
    errors.push({
      field: "identityVerified",
      message: "Identity verification is required",
    });
  }

  return errors;
}

/**
 * Validate step 2: Smoking Assessment
 */
export function validateSmokingAssessment(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { assessment } = formData;

  if (assessment.cigarettesPerDay === null) {
    errors.push({
      field: "assessment.cigarettesPerDay",
      message: "Number of cigarettes per day is required",
    });
  } else if (assessment.cigarettesPerDay < 0) {
    errors.push({
      field: "assessment.cigarettesPerDay",
      message: "Number of cigarettes must be 0 or greater",
    });
  }

  if (assessment.yearsSmoked === null) {
    errors.push({
      field: "assessment.yearsSmoked",
      message: "Years smoked is required",
    });
  } else if (assessment.yearsSmoked < 0) {
    errors.push({
      field: "assessment.yearsSmoked",
      message: "Years smoked must be 0 or greater",
    });
  }

  if (assessment.previousQuitAttempts === null) {
    errors.push({
      field: "assessment.previousQuitAttempts",
      message: "Number of previous quit attempts is required",
    });
  } else if (assessment.previousQuitAttempts < 0) {
    errors.push({
      field: "assessment.previousQuitAttempts",
      message: "Number of attempts must be 0 or greater",
    });
  }

  if (!assessment.motivationLevel) {
    errors.push({
      field: "assessment.motivationLevel",
      message: "Motivation level is required",
    });
  }

  if (!assessment.quitDate) {
    errors.push({
      field: "assessment.quitDate",
      message: "Target quit date is required",
    });
  } else {
    // PGD inclusion: set a quit date within the next 1-2 weeks.
    const today: string = new Date().toISOString().split("T")[0];
    const ahead: number | null = daysBetween(today, assessment.quitDate);
    if (ahead !== null && (ahead < 0 || ahead > 14)) {
      errors.push({
        field: "assessment.quitDate",
        message: "The PGD requires a quit date set within the next 1 to 2 weeks",
      });
    }
  }

  if (!assessment.readyToQuit) {
    errors.push({
      field: "assessment.readyToQuit",
      message: "The PGD requires the patient to be motivated and ready to quit",
    });
  }

  if (!assessment.timeToFirstCigarette) {
    errors.push({
      field: "assessment.timeToFirstCigarette",
      message: "Time to first cigarette is required for Fagerström Test",
    });
  }

  if (!assessment.whichCigaretteMostHateToGiveUp) {
    errors.push({
      field: "assessment.whichCigaretteMostHateToGiveUp",
      message: "Please answer the Fagerström Test question",
    });
  }

  if (!assessment.howManyPerDay) {
    errors.push({
      field: "assessment.howManyPerDay",
      message: "Please answer the Fagerström Test question",
    });
  }

  return errors;
}

/**
 * Validate step 3: Medical History
 */
export function validateMedicalHistory(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { medicalHistory } = formData;

  if (medicalHistory.psychiatricHistory && !medicalHistory.psychiatricDetails.trim()) {
    errors.push({
      field: "medicalHistory.psychiatricDetails",
      message: "Please specify psychiatric history details",
    });
  }

  if (!medicalHistory.renalImpairment) {
    errors.push({
      field: "medicalHistory.renalImpairment",
      message: "Renal function status is required",
    });
  }

  if (!medicalHistory.hepaticImpairment) {
    errors.push({
      field: "medicalHistory.hepaticImpairment",
      message: "Hepatic function status is required",
    });
  }

  return errors;
}

/**
 * Validate step 4: Medications
 */
export function validateMedications(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { medications } = formData;

  if (!medications.currentMedications.trim()) {
    errors.push({
      field: "medications.currentMedications",
      message: "Current medications list is required (enter 'none' if not taking any)",
    });
  }

  if (!medications.allergies.trim()) {
    errors.push({
      field: "medications.allergies",
      message: "Allergies field is required (enter 'none' if not known)",
    });
  }

  return errors;
}

/**
 * Validate step 5: Contraindications Review
 */
export function validateContraindications(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!formData.contradicationsReviewed) {
    errors.push({
      field: "contradicationsReviewed",
      message: "Contraindications must be reviewed before continuing",
    });
  }

  if (!formData.pharmacistApproves) {
    errors.push({
      field: "pharmacistApproves",
      message: "Pharmacist approval is required",
    });
  }

  // Exclusion criteria are enforced: a hard stop blocks supply.
  const { hardStops } = getAllClinicalAlerts(formData);
  if (hardStops.length > 0) {
    errors.push({
      field: "hardStops",
      message: "An exclusion criterion applies. Varenicline cannot be supplied under this PGD; advise on alternatives and inform or refer to the GP",
    });
  }

  return errors;
}

/**
 * Validate step 6: Dose Titration Plan
 */
export function validateDosePlan(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { dosePlan } = formData;

  if (!dosePlan.startDate) {
    errors.push({
      field: "dosePlan.startDate",
      message: "Varenicline start date is required",
    });
  }

  if (!dosePlan.quitDate) {
    errors.push({
      field: "dosePlan.quitDate",
      message: "Target quit date is required",
    });
  } else if (dosePlan.startDate) {
    // PGD: quit date should be on day 8-14 of treatment (when 1mg twice
    // daily is established). Start date is day 1.
    const gap: number | null = daysBetween(dosePlan.startDate, dosePlan.quitDate);
    if (gap !== null && (gap < 7 || gap > 13)) {
      errors.push({
        field: "dosePlan.quitDate",
        message: "Quit date should be on day 8 to 14 of treatment (7 to 13 days after the start date)",
      });
    }
  }

  if (!dosePlan.treatmentDuration) {
    errors.push({
      field: "dosePlan.treatmentDuration",
      message: "Treatment duration is required",
    });
  }

  if (!dosePlan.supplyType) {
    errors.push({
      field: "dosePlan.supplyType",
      message: "Select the supply: starter pack, or continuation supply of up to 56 tablets",
    });
  }

  if (dosePlan.quantity <= 0) {
    errors.push({
      field: "dosePlan.quantity",
      message: "Quantity must be greater than 0",
    });
  } else if (dosePlan.supplyType === "continuation" && dosePlan.quantity > 56) {
    errors.push({
      field: "dosePlan.quantity",
      message: "Maximum 56 tablets per continuation supply under this PGD (4-week supply at 1mg twice daily)",
    });
  }

  return errors;
}

/**
 * Validate step 7: Counselling
 */
export function validateCounselling(
  formData: SmokingToolFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { counselling } = formData;

  const requiredFields: Array<keyof typeof counselling> = [
    "neuropsychiatricWarning",
    "drivingWarning",
    "alcoholWarning",
    "nauseaManagement",
    "vividDreams",
    "completeCourseAdvice",
    "behaviouralSupport",
    "quitDatePlanning",
    "returnIfWorsening",
    "physicalSymptomsWarning",
    "slipUpAdvice",
    "followUpSchedule",
    "pregnancyAdvice",
    "doNotStopSuddenly",
  ];

  requiredFields.forEach((field) => {
    if (!counselling[field]) {
      errors.push({
        field: `counselling.${field}`,
        message: "All counselling advice must be acknowledged",
      });
    }
  });

  return errors;
}

/**
 * Validate step 8: Summary
 */
export function validateSummary(formData: SmokingToolFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!formData.pharmacistName.trim()) {
    errors.push({
      field: "pharmacistName",
      message: "Pharmacist name is required",
    });
  }

  if (!formData.pharmacistGMCNumber.trim()) {
    errors.push({
      field: "pharmacistGMCNumber",
      message: "GPhC registration number is required",
    });
  }

  if (!formData.consultationDate) {
    errors.push({
      field: "consultationDate",
      message: "Consultation date is required",
    });
  }

  if (!formData.pharmacyName.trim()) {
    errors.push({
      field: "pharmacyName",
      message: "Pharmacy name is required",
    });
  }

  if (!formData.pharmacyAddressLine1.trim()) {
    errors.push({
      field: "pharmacyAddressLine1",
      message: "Pharmacy address is required",
    });
  }

  if (!formData.pharmacyPostcode.trim()) {
    errors.push({
      field: "pharmacyPostcode",
      message: "Pharmacy postcode is required",
    });
  }

  return errors;
}

/**
 * Validate entire step based on step number
 */
export function validateStep(
  stepNumber: number,
  formData: SmokingToolFormData
): ValidationError[] {
  switch (stepNumber) {
    case 0:
      return validatePatientDetails(formData);
    case 1:
      return validateConsent(formData);
    case 2:
      return validateSmokingAssessment(formData);
    case 3:
      return validateMedicalHistory(formData);
    case 4:
      return validateMedications(formData);
    case 5:
      return validateContraindications(formData);
    case 6:
      return validateDosePlan(formData);
    case 7:
      return validateCounselling(formData);
    case 8:
      return validateSummary(formData);
    default:
      return [];
  }
}

/**
 * Helper function to validate email
 */
function isValidEmail(email: string): boolean {
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get validation errors for current step and all previous steps
 */
export function getValidationErrorsUpToStep(
  currentStep: number,
  formData: SmokingToolFormData
): ValidationError[] {
  const allErrors: ValidationError[] = [];

  for (let step: number = 0; step <= currentStep; step++) {
    allErrors.push(...validateStep(step, formData));
  }

  return allErrors;
}
