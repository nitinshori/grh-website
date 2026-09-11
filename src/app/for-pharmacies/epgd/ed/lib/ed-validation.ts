import type { EDConsultationState } from "./ed-types";
import {
  getAvailableDoses,
  getDoseCaps,
  getArmAvailability,
  getMaxQuantity,
  calculateDoseRecommendation,
} from "./ed-clinical-logic";

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
      if (state.patient.dateOfBirth > new Date().toISOString().split("T")[0])
        return "Date of birth cannot be in the future: check the date";
      if (state.patient.age !== null && state.patient.age < 18)
        return "Patient must be 18 years or older";
      if (!state.patient.genderConfirmed)
        return "Please confirm the patient is male";
      // Records row: name, address, date of birth and the GP with whom he is registered
      if (!state.patient.address.trim())
        return "Patient address is required (PGD records row)";
      if (!state.patient.gpName.trim() && !state.patient.gpPractice.trim())
        return "Record the GP or practice with whom the patient is registered";
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
        return "Cardiovascular fitness: select the answer to the walk-a-mile / two-flights question (PGD v008 Appendix 1)";
      if (!state.observations.exerciseToleranceNotes.trim())
        return "Cardiovascular fitness: type the 'Patient's answer in his own words' (PGD records row)";
      if (!state.observations.symptomsQuestionAsked)
        return "Cardiovascular fitness: select No or Yes to 'chest pain, breathlessness or palpitations on exertion, or during sex'";
      if (state.complaint.previousTreatment) {
        if (!state.complaint.previousPDE5Inhibitor)
          return "Record whether the previous treatment was a PDE5 inhibitor, and which";
        if (
          state.complaint.previousPDE5Inhibitor !== "none" &&
          !state.complaint.previousPDE5Dose.trim()
        )
          return "Record the dose of the previous PDE5 inhibitor";
      }
      return null;

    case 3: // Medical History
      // The two selects start blank so the record never states "none" for a
      // question that was not asked (walkthrough review, 11 Sep 2026).
      if (!state.medicalHistory.hepaticImpairment)
        return "Select 'Hepatic impairment (liver disease)': None, Mild-moderate or Severe";
      if (!state.medicalHistory.renalImpairment)
        return "Select 'Renal impairment (kidney disease)': None, Moderate or Severe";
      return null;

    case 4: // Current Medications
      // Critical check is done by clinical logic (nitrates = hard stop)
      if (!state.medications.poppersQuestionAsked)
        return "Poppers: ask the direct question and select 'Patient's answer' (No, or Yes) before proceeding";
      if (
        (state.medications.takesAlphaBlockers || state.medications.takesDoxazosin) &&
        !state.medications.alphaBlockerDetails.trim()
      )
        return "Alpha-blocker: type the 'Alpha-blocker details' (which one, dose, how long)";
      if (
        (state.medications.takesAlphaBlockers || state.medications.takesDoxazosin) &&
        !state.medications.alphaBlockerStabilityAnswered
      )
        return "Alpha-blocker: select Yes or No to 'Is he stable on the alpha-blocker'";
      if (!state.medications.allergies.trim())
        return "Type the 'Known allergies' (NKDA if none): the record must not assume no allergies";
      return null;

    case 5: // Observations
      if (!state.observations.bpTakenToday)
        return "Measure the blood pressure now and tick 'Blood pressure taken today'";
      if (
        state.observations.systolicBP === null ||
        state.observations.diastolicBP === null
      )
        return "Enter both 'Systolic BP' and 'Diastolic BP' in mmHg";
      if (
        state.observations.systolicBP < 60 ||
        state.observations.systolicBP > 250
      )
        return "'Systolic BP' must be between 60 and 250 mmHg: check the reading";
      if (
        state.observations.diastolicBP < 30 ||
        state.observations.diastolicBP > 160
      )
        return "'Diastolic BP' must be between 30 and 160 mmHg: check the reading";
      return null;

    case 6: // Red Flags & Exclusions
      // No mandatory fields: it's all boolean checkboxes
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
      const maxQty = getMaxQuantity(sel.medicine, sel.dosingRegimen, caps);
      if (sel.quantity < 1 || sel.quantity > maxQty)
        return `Please enter a valid quantity (1 to ${maxQty} tablets)`;
      if (!sel.brand.trim())
        return "Type the 'Brand supplied'";
      // A choice between authorised regimens is allowed, but the reason must
      // be on the record whenever it differs from the recommendation. The
      // reason used to be required only if the pharmacist chose to tick a box.
      const rec = calculateDoseRecommendation(state);
      const differs =
        rec !== null &&
        (sel.medicine !== rec.medicine ||
          sel.dose !== rec.dose ||
          (sel.medicine === "tadalafil" && sel.dosingRegimen !== rec.dosingRegimen));
      if (differs && !sel.overrideReason.trim())
        return "Record the reason for choosing a different medicine, regimen or dose from the recommendation";
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
        c.reviewAdvice &&
        c.pilSupplied &&
        c.disposalAdvice;
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
