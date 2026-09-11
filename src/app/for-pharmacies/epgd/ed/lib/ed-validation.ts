import type { EDConsultationState } from "./ed-types";

// Returns an error message if the step is invalid, or null if valid
export function validateStep(
  step: number,
  state: EDConsultationState
): string | null {
  switch (step) {
    case 0: // Patient Details
      if (!state.patient.firstName.trim())
        return "Patient first name is required";
      if (!state.patient.lastName.trim())
        return "Patient last name is required";
      if (!state.patient.dateOfBirth) return "Date of birth is required";
      if (state.patient.age !== null && state.patient.age < 18)
        return "Patient must be 18 years or older";
      if (!state.patient.genderConfirmed)
        return "Please confirm the patient is male";
      return null;

    case 1: // Consent & ID
      if (!state.consent.informedConsentGiven)
        return "Informed consent must be obtained before proceeding";
      if (!state.consent.idVerified) return "ID verification is required";
      if (!state.consent.patientAwarePrivateService)
        return "Patient must be aware this is a private service";
      return null;

    case 2: // Presenting Complaint
      if (!state.complaint.onsetType)
        return "Please select onset type (gradual or sudden)";
      if (!state.complaint.duration) return "Please select duration of ED";
      if (!state.complaint.severity)
        return "Please select severity";
      return null;

    case 3: // Medical History
      // No mandatory fields — it's all boolean checkboxes
      // but we want to ensure the pharmacist has actively reviewed it
      return null;

    case 4: // Current Medications
      // Critical check is done by clinical logic (nitrates = hard stop)
      return null;

    case 5: // Observations
      if (!state.observations.bpTakenToday)
        return "Blood pressure must be taken today";
      if (
        state.observations.systolicBP === null ||
        state.observations.diastolicBP === null
      )
        return "Please enter blood pressure reading";
      if (
        state.observations.systolicBP < 60 ||
        state.observations.systolicBP > 250
      )
        return "Systolic BP seems incorrect — please check";
      if (
        state.observations.diastolicBP < 30 ||
        state.observations.diastolicBP > 160
      )
        return "Diastolic BP seems incorrect — please check";
      return null;

    case 6: // Red Flags & Exclusions
      // No mandatory fields — it's all boolean checkboxes
      return null;

    case 7: // Medicine Selection
      if (!state.medicineSelection.medicine)
        return "Please select a medicine";
      if (
        state.medicineSelection.medicine === "tadalafil" &&
        !state.medicineSelection.dosingRegimen
      )
        return "Please select a dosing regimen for tadalafil";
      if (!state.medicineSelection.dose) return "Please select a dose";
      if (
        state.medicineSelection.quantity < 1 ||
        state.medicineSelection.quantity > 28
      )
        return "Please enter a valid quantity (1-28 tablets)";
      return null;

    case 8: { // Counselling
      const c = state.counselling;
      const allChecked =
        c.sexualStimulationRequired &&
        c.timingAdvice &&
        c.foodInteractions &&
        c.priapismWarning &&
        c.visionHearingWarning &&
        c.noSTIProtection &&
        c.grapefruitAvoidance &&
        c.alcoholModeration &&
        c.sideEffectsExplained &&
        c.reviewAdvice;
      if (!allChecked)
        return "All counselling points must be confirmed before proceeding";
      return null;
    }

    case 9: // Summary & Print
      if (!state.summary.pharmacistName.trim())
        return "Pharmacist name is required";
      if (!state.summary.pharmacistGPhC.trim())
        return "GPhC registration number is required";
      return null;

    default:
      return null;
  }
}

// Helper to calculate age from DOB
export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
