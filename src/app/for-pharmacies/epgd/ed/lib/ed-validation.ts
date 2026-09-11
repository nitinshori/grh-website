import type { EDConsultationState } from "./ed-types";
import { getAvailableDoses, getDoseCaps, getArmAvailability } from "./ed-clinical-logic";

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
      if (!state.observations.exerciseTolerance)
        return "The cardiovascular fitness question must be asked and the answer recorded (PGD v006 Appendix 1)";
      return null;

    case 3: // Medical History
      // No mandatory fields — it's all boolean checkboxes
      // but we want to ensure the pharmacist has actively reviewed it
      return null;

    case 4: // Current Medications
      // Critical check is done by clinical logic (nitrates = hard stop)
      if (!state.medications.poppersQuestionAsked)
        return "Ask the direct question about poppers and record the answer before proceeding";
      if (state.medications.takesAlphaBlockers && !state.medications.alphaBlockerDetails.trim())
        return "Record which alpha-blocker the patient takes";
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
        return "Systolic BP seems incorrect, please check";
      if (
        state.observations.diastolicBP < 30 ||
        state.observations.diastolicBP > 160
      )
        return "Diastolic BP seems incorrect, please check";
      return null;

    case 6: // Red Flags & Exclusions
      // No mandatory fields — it's all boolean checkboxes
      return null;

    case 7: { // Medicine Selection
      const sel = state.medicineSelection;
      if (!sel.medicine)
        return "Please select a medicine";
      const arms = getArmAvailability(state);
      if (sel.medicine === "sildenafil" && !arms.sildenafil)
        return "Sildenafil is excluded for this patient (ritonavir or cobicistat). Select tadalafil or refer";
      if (sel.medicine === "tadalafil" && !arms.tadalafil)
        return "Tadalafil is excluded for this patient (doxazosin). Select sildenafil or refer";
      if (
        sel.medicine === "tadalafil" &&
        !sel.dosingRegimen
      )
        return "Please select a dosing regimen for tadalafil";
      const caps = getDoseCaps(state);
      if (sel.medicine === "tadalafil" && sel.dosingRegimen === "daily" && !caps.tadalafilDailyAllowed)
        return "Tadalafil once-daily dosing is excluded in severe renal impairment";
      if (!sel.dose) return "Please select a dose";
      if (!getAvailableDoses(sel.medicine, sel.dosingRegimen, caps).includes(sel.dose))
        return "The selected dose exceeds the limit the PGD sets for this patient";
      const maxQty = sel.medicine === "tadalafil" && sel.dosingRegimen === "daily" ? 28 : 8;
      if (sel.quantity < 1 || sel.quantity > maxQty)
        return `Please enter a valid quantity (1 to ${maxQty} tablets)`;
      if (!sel.brand.trim())
        return "Record the brand supplied";
      if (sel.pharmacistOverride && !sel.overrideReason.trim())
        return "Record the reason for overriding the recommendation";
      return null;
    }

    case 8: { // Counselling
      const c = state.counselling;
      const allChecked =
        c.sexualStimulationRequired &&
        c.timingAdvice &&
        c.foodInteractions &&
        c.priapismWarning &&
        c.visionHearingWarning &&
        c.noSTIProtection &&
        c.maxOneDoseIn24Hours &&
        c.nitrateWarningGiven &&
        c.chestPainAdvice &&
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
