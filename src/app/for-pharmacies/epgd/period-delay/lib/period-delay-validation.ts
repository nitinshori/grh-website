import type { PeriodDelayConsultationState } from "./period-delay-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { MAX_TREATMENT_DAYS } from "./period-delay-clinical-logic";

export function validateStep(step: number, state: PeriodDelayConsultationState): string | null {
  switch (step) {
    case 0: {
      // PGD v008: women aged 16 years and over.
      const base = validatePatientStep(state.patient, { minAge: 16 });
      if (base) return base;
      if (!state.medicalHistory.femaleConfirmed) return "Please confirm the patient is female";
      return null;
    }
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      if (!state.assessment.reasonForDelay) return "Reason for period delay must be selected";
      if (!state.assessment.datesNeededFor.trim()) return "Record the dates the delay is needed for";
      if (!state.assessment.lastPeriodDate) return "Date of last period is required";
      // The date the next period is due sets the start date, which is the
      // one thing that decides whether the course will work at all.
      if (!state.assessment.expectedPeriodDate) return "The date the next period is due is required";
      if (state.assessment.daysUntilExpected === null) return "Enter the date the next period is due as DD/MM/YYYY";
      if (!state.assessment.previousSuppliesLast6Months) return "Record any previous supply for period delay in the last 6 months";
      if (
        state.assessment.previousSuppliesLast6Months !== "0" &&
        state.assessment.daysSuppliedLast6Months === null
      )
        return "Record the number of days of norethisterone supplied in the last 6 months";
      return null;
    case 3:
      // PGD v008: measure or ask for height and weight; do not estimate.
      if (state.medicalHistory.heightCm === null || state.medicalHistory.weightKg === null)
        return "Height and weight are required so that BMI can be calculated and recorded";
      // A blood pressure of 140/90 or above measured today is an exclusion.
      if (state.medicalHistory.systolicBP === null || state.medicalHistory.diastolicBP === null)
        return "Record today's blood pressure";
      return null;
    case 4:
      return null;
    case 5:
      if (state.medicineSelection.daysToDelay === null || state.medicineSelection.daysToDelay < 1)
        return "Enter the number of days of treatment needed";
      if (state.medicineSelection.daysToDelay > MAX_TREATMENT_DAYS)
        return "Maximum treatment period is 14 days (42 tablets). No extension under this PGD";
      if (!state.medicineSelection.confirmed) return "Treatment must be confirmed";
      return null;
    case 6: {
      const allGiven = Object.values(state.counselling).every((v) => v === true);
      if (!allGiven) return "Every counselling point must be given and confirmed";
      return null;
    }
    case 7:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}
