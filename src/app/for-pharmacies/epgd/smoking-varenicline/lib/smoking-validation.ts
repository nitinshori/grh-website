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
      // Age gate per signed PGD: adults 18+ (consistency review Jul 2026)
      errors.push({
        field: "dateOfBirth",
        message: "This PGD applies to adults aged 18 years and over",
      });
    }
  }

  // Gender, phone and email are not required by the document; a patient
  // without an email address used to be unable to be seen (adversarial
  // review, 11 Sep 2026). Address and GP are required records.
  if (formData.email.trim() && !isValidEmail(formData.email)) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  if (!formData.address.trim()) {
    errors.push({ field: "address", message: "Patient address is required (PGD record)" });
  }

  if (!formData.gpName.trim() && !formData.gpPractice.trim()) {
    errors.push({ field: "gpPractice", message: "The patient's GP or GP practice is required (PGD record)" });
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

  if (!formData.patientAwarePrivateService) {
    errors.push({
      field: "patientAwarePrivateService",
      message: "The patient must be aware this is a private service",
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

  if (!assessment.consultationType) {
    errors.push({
      field: "assessment.consultationType",
      message: "Select whether this is a first supply or a continuation supply",
    });
  }

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
  } else if (assessment.consultationType !== "continuation") {
    // PGD inclusion: set a quit date within the next 1-2 weeks. For a
    // continuation supply the quit date is the original one and may be in
    // the past; the pharmacist used to have to type a false future date to
    // record a week-six supply (adversarial review, 11 Sep 2026).
    const today: string = new Date().toISOString().split("T")[0];
    const ahead: number | null = daysBetween(today, assessment.quitDate);
    if (ahead !== null && (ahead < 0 || ahead > 14)) {
      errors.push({
        field: "assessment.quitDate",
        message: "The PGD requires a quit date set within the next 1 to 2 weeks",
      });
    }
  } else {
    const today: string = new Date().toISOString().split("T")[0];
    const ahead: number | null = daysBetween(today, assessment.quitDate);
    if (ahead !== null && ahead > 14) {
      errors.push({
        field: "assessment.quitDate",
        message: "For a continuation supply enter the original quit date (not more than 2 weeks ahead)",
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

  // Continuation supply: weeks completed is required and the course may
  // not run past the selected duration (12 or 24 weeks).
  const isContinuation = formData.assessment.consultationType === "continuation" || dosePlan.supplyType === "continuation";
  if (isContinuation) {
    if (dosePlan.weeksCompleted === null) {
      errors.push({
        field: "dosePlan.weeksCompleted",
        message: "Enter the weeks of treatment completed so far",
      });
    } else if (dosePlan.weeksCompleted < 0 || !Number.isInteger(dosePlan.weeksCompleted)) {
      errors.push({
        field: "dosePlan.weeksCompleted",
        message: "Weeks completed must be a whole number",
      });
    } else if (dosePlan.treatmentDuration) {
      const maxWeeks: number = dosePlan.treatmentDuration === "24-weeks-extended" ? 24 : 12;
      if (dosePlan.weeksCompleted >= maxWeeks) {
        errors.push({
          field: "dosePlan.weeksCompleted",
          message: `The ${maxWeeks}-week course is complete. No further supply under this PGD; refer to the GP`,
        });
      } else if (dosePlan.weeksCompleted + 4 > maxWeeks) {
        errors.push({
          field: "dosePlan.weeksCompleted",
          message: `A 4-week supply would take the course past ${maxWeeks} weeks. Supply ${(maxWeeks - dosePlan.weeksCompleted) * 14} tablets at most, or select the 24-week extended course if it has been agreed`,
        });
      }
    }
  }

  // Quantities. The document authorises a starter pack (first 4 weeks: 11
  // x 0.5mg for days 1 to 7, then 1mg twice daily) followed by up to 56 x
  // 1mg tablets per supply. The starter quantity used to have no upper
  // limit at all (adversarial review, 11 Sep 2026).
  const half: number = dosePlan.quantityHalfMg || 0;
  const one: number = dosePlan.quantityOneMg || 0;
  if (dosePlan.supplyType === "starter") {
    if (half <= 0 || !Number.isInteger(half)) {
      errors.push({ field: "dosePlan.quantityHalfMg", message: "Enter the number of 0.5mg tablets (11 for days 1 to 7)" });
    } else if (half > 11) {
      errors.push({ field: "dosePlan.quantityHalfMg", message: "Maximum 11 x 0.5mg tablets in a starter pack (days 1 to 7)" });
    }
    if (one < 0 || !Number.isInteger(one)) {
      errors.push({ field: "dosePlan.quantityOneMg", message: "Enter the number of 1mg tablets (0 to 42)" });
    } else if (one > 42) {
      errors.push({ field: "dosePlan.quantityOneMg", message: "Maximum 42 x 1mg tablets in a starter supply (days 8 to 28 at 1mg twice daily)" });
    }
  } else if (dosePlan.supplyType === "continuation") {
    if (half !== 0) {
      errors.push({ field: "dosePlan.quantityHalfMg", message: "A continuation supply is 1mg tablets only" });
    }
    if (one <= 0 || !Number.isInteger(one)) {
      errors.push({ field: "dosePlan.quantityOneMg", message: "Enter the number of 1mg tablets (1 to 56)" });
    } else if (one > 56) {
      errors.push({ field: "dosePlan.quantityOneMg", message: "Maximum 56 tablets per continuation supply under this PGD (4-week supply at 1mg twice daily)" });
    } else if (isContinuation && dosePlan.weeksCompleted !== null && dosePlan.treatmentDuration) {
      const maxWeeks: number = dosePlan.treatmentDuration === "24-weeks-extended" ? 24 : 12;
      const remaining: number = Math.max(0, maxWeeks - dosePlan.weeksCompleted) * 14;
      if (one > remaining) {
        errors.push({ field: "dosePlan.quantityOneMg", message: `Only ${remaining} tablets remain in the ${maxWeeks}-week course` });
      }
    }
  }

  if (!dosePlan.brand.trim()) {
    errors.push({
      field: "dosePlan.brand",
      message: "Record the product and brand supplied (PGD record: name and brand of medication)",
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

  if (!formData.pharmacistGPhC.trim()) {
    errors.push({
      field: "pharmacistGPhC",
      message: "GPhC registration number is required",
    });
  }

  // Exclusions are enforced on every step from the Contraindications
  // review onwards, including the final one (adversarial review, 11 Sep
  // 2026): a stop ticked after the review must still block Save & Print.
  const { hardStops } = getAllClinicalAlerts(formData);
  if (hardStops.length > 0) {
    errors.push({
      field: "hardStops",
      message: "An exclusion criterion applies. Varenicline cannot be supplied under this PGD; save the record as not supplied",
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
