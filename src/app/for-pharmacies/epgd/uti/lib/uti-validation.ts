import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { isNitrofurantoinContraindicated } from "./uti-clinical-logic";
import type {
  UTIPatientDetails,
  UTISymptoms,
  UTIMedicalHistory,
  UTIObservations,
  UTIMedicineSelection,
  UTICounselling,
} from "./uti-types";

// ─── Step-Specific Validation ───

export function validateUTIPatientStep(patient: UTIPatientDetails): string | null {
  const baseError = validatePatientStep(patient, { minAge: 16, maxAge: 64 });
  if (baseError) return baseError;
  if (patient.femaleConfirmed === null) {
    return "Answer \"Is the patient female?\" (Yes or No)";
  }
  if (patient.femaleConfirmed === false) {
    return "The patient is not female: this PGD is for women aged 16 to 64. Save as not supplied and refer";
  }
  return null;
}

export function validateUTIConsentStep(consent: any): string | null {
  return validateConsentStep(consent);
}

export function validateUTISymptomStep(symptoms: UTISymptoms): string | null {
  // PGD v007 inclusion: two or more of dysuria, new nocturia, frequency, urgency
  const core: [boolean | null, string][] = [
    [symptoms.dysuria, "Dysuria (pain or burning on urination)"],
    [symptoms.nocturia, "New nocturia (new need to pass urine at night)"],
    [symptoms.frequency, "Frequency (increased need to pass urine)"],
    [symptoms.urgency, "Urgency (sudden, urgent need to pass urine)"],
  ];
  const unanswered = core.find(([v]) => v === null);
  if (unanswered) {
    return `Answer "${unanswered[1]}" (Yes or No)`;
  }
  const coreSymptomCount = core.filter(([v]) => v === true).length;
  if (coreSymptomCount < 2) {
    return "Fewer than two of Dysuria, New nocturia, Frequency or Urgency are present: the inclusion criterion is not met. Save as not supplied and refer";
  }

  if (!symptoms.duration) {
    return "Select the Duration of symptoms";
  }

  return null;
}

export function validateUTIMedicalHistoryStep(
  medicalHistory: UTIMedicalHistory,
  age: number | null = null
): string | null {
  // PGD v007 renal row: the question is asked in set terms and the answer
  // recorded. No default: an unasked question is not a NO.
  if (!medicalHistory.renalImpairment && !medicalHistory.kidneyDisease) {
    return "Select the Patient's answer to the kidney question (No, Does not know, or Yes)";
  }
  // Decision 43: aged 60 to 64 with a NO answer, the eGFR result relied on
  // must be recorded in full (value, date, where seen) before moving on. The
  // clinical logic raises the stop where it does not qualify.
  if (age !== null && age >= 60 && medicalHistory.renalImpairment === "none") {
    if (medicalHistory.egfrResultSeen === null) {
      return "Answer \"Has an eGFR result for this patient been seen (NHS App, GP summary or a letter)?\" (Yes or No)";
    }
  }
  if (
    age !== null &&
    age >= 60 &&
    medicalHistory.renalImpairment === "none" &&
    medicalHistory.egfrResultSeen === true
  ) {
    if (medicalHistory.egfrValue === null) {
      return "Enter the eGFR value seen (mL/min)";
    }
    if (!medicalHistory.egfrDate) {
      return "Enter the Date of the result (eGFR)";
    }
    if (!medicalHistory.egfrSource.trim()) {
      return "Select Where the result was seen (NHS App, GP summary record, or Letter)";
    }
  }
  // PGD v007: ask both recurrent UTI questions and record both answers
  if (medicalHistory.takingWarfarin && medicalHistory.anticoagulationServiceConsulted === null) {
    return "Answer \"Has the anticoagulation service been consulted and supply agreed?\" (Yes or No)";
  }
  if (!medicalHistory.utiEpisodesLast6Months) {
    return "Select UTI episodes in the last 6 months (before this one)";
  }
  if (!medicalHistory.utiEpisodesLast12Months) {
    return "Select UTI episodes in the last 12 months (before this one)";
  }
  return null;
}

export function validateUTIObservationsStep(): string | null {
  // Observations are optional - user may not have equipment
  // No validation required
  return null;
}

export function validateUTIRedFlagsStep(symptoms: UTISymptoms): string | null {
  // PGD v007: the record must show the Appendix 1 red flags were asked about
  if (!symptoms.redFlagsAsked) {
    return "Tick \"All Appendix 1 red flags have been asked about with this patient\" (tick any that are present above first)";
  }
  return null;
}

export function validateUTIMedicineSelectionStep(
  medicineSelection: UTIMedicineSelection,
  medicalHistory?: UTIMedicalHistory
): string | null {
  if (!medicineSelection.medicine) {
    return "Select the Medicine";
  }

  if (!medicineSelection.dose) {
    return "Select the Dose";
  }

  if (medicineSelection.duration !== "3 days") {
    return "Select the Duration: the course is 3 days, one course per episode";
  }

  if (medicineSelection.medicine === "trimethoprim" && !medicineSelection.trimethoprimReason) {
    return "Trimethoprim is second line only. Select the Reason nitrofurantoin is unsuitable";
  }

  // "Contraindicated" must match the history recorded on the medical history
  // step; the record cannot state a contraindication the history denies.
  if (
    medicineSelection.medicine === "trimethoprim" &&
    medicineSelection.trimethoprimReason === "contraindicated" &&
    medicalHistory &&
    !isNitrofurantoinContraindicated(medicalHistory)
  ) {
    return "No nitrofurantoin contraindication is recorded on the medical history step. Go back and record it, or choose a different reason";
  }

  return null;
}

export function validateUTICounsellingStep(
  counselling: UTICounselling,
  medicine: UTIMedicineSelection["medicine"]
): string | null {
  // All counselling points in the PGD must be given and recorded before
  // proceeding. The message names the first unticked point in the words of
  // its label, so the pharmacist knows which box to tick.
  const isTrim = medicine === "trimethoprim";
  const requiredCounselling: [boolean, string][] = [
    [counselling.completeCourse, isTrim ? "Take one tablet twice a day for 3 days" : "Take one capsule twice a day for 3 days"],
    [counselling.howToTake, isTrim ? "Take the doses at evenly spaced intervals" : "Take with food or milk"],
  ];
  if (!isTrim) {
    requiredCounselling.push([counselling.darkUrine, "Your urine may go dark yellow or brown"]);
  }
  requiredCounselling.push(
    [counselling.hydrationAdvice, "Drink plenty of fluids"],
    [counselling.stopAndSeekAdvice, isTrim ? "Seek advice promptly if you get a sore throat, fever, mouth ulcers, unusual bruising or bleeding" : "Stop and seek advice if you develop new numbness, tingling or pins and needles"],
    [counselling.symptomsToReturn, "48 HOUR safety netting given in these terms"],
    [counselling.immediateActionAdvice, "Seek help IMMEDIATELY, not in 48 hours"],
    [counselling.pilSupplied, "Patient information leaflet supplied with the product"],
    [counselling.disposalAdvice, "Return any unused medicine to a pharmacy"],
  );

  const missing = requiredCounselling.find(([done]) => !done);
  if (missing) {
    return `Tick "${missing[1]}" once it has been given. Every point without "(optional)" is required`;
  }

  return null;
}

export function validateUTISummaryStep(summary: any): string | null {
  return validateSummaryStep(summary);
}

// ─── All-steps validation (for determining if Next button should be active) ───

export function validateUTIStep(
  stepIndex: number,
  state: {
    patient: UTIPatientDetails;
    consent: any;
    symptoms: UTISymptoms;
    medicalHistory: UTIMedicalHistory;
    observations: UTIObservations;
    medicineSelection: UTIMedicineSelection;
    counselling: UTICounselling;
    summary: any;
  }
): string | null {
  switch (stepIndex) {
    case 0:
      return validateUTIPatientStep(state.patient);
    case 1:
      return validateUTIConsentStep(state.consent);
    case 2:
      return validateUTISymptomStep(state.symptoms);
    case 3:
      return validateUTIMedicalHistoryStep(state.medicalHistory, state.patient.age);
    case 4:
      return validateUTIObservationsStep();
    case 5:
      return validateUTIRedFlagsStep(state.symptoms);
    case 6:
      return validateUTIMedicineSelectionStep(state.medicineSelection, state.medicalHistory);
    case 7:
      return validateUTICounsellingStep(state.counselling, state.medicineSelection.medicine);
    case 8:
      return validateUTISummaryStep(state.summary);
    default:
      return null;
  }
}
