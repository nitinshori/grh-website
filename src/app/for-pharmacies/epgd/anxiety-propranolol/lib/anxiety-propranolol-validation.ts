import type { AnxietyPropranololConsultationState } from "./anxiety-propranolol-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: AnxietyPropranololConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      // PGD v006: adults aged 18 years and over.
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.anxietyType) return "Please select anxiety type";
      if (!state.assessment.triggerSituation.trim()) return "Please describe trigger situation";
      if (!state.assessment.physicalSymptoms.trim()) return "Please describe physical symptoms";
      return null;

    case 3:
      return null;

    case 4:
      // The medicines list underpins the interaction exclusions (another
      // beta-blocker, verapamil, diltiazem) and is part of the record.
      if (!state.medicalHistory.currentMedications.trim())
        return "Record the patient's current medicines and doses (enter 'none' if nothing)";
      return null;

    case 5: {
      // The document excludes on measured thresholds; the record must show
      // both were measured before a beta-blocker was supplied.
      const hr = state.contraindications.restingHeartRate;
      const sbp = state.contraindications.systolicBP;
      if (hr === null) return "Measure and record the resting heart rate";
      if (hr < 20 || hr > 250) return "Resting heart rate must be between 20 and 250 bpm";
      if (sbp === null) return "Measure and record the systolic blood pressure";
      if (sbp < 50 || sbp > 300) return "Systolic blood pressure must be between 50 and 300 mmHg";
      return null;
    }

    case 6: {
      // Decision 55 (11 Sep 2026): as-required use only, a single dose before
      // the situation. There is no regimen choice and no daily maximum.
      if (!["10", "20", "30", "40"].includes(state.medicineSupply.propranololDose))
        return "Select the dose advised (10, 20, 30 or 40mg as a single dose)";
      const q = state.medicineSupply.quantity;
      if (q === null) return "Please enter quantity to supply";
      if (q < 1) return "Please enter quantity to supply";
      // PGD v002: 10mg tablets only, and the whole supply must stay below
      // 320mg. 28 x 10mg is 280mg.
      if (q > 28) return "Maximum 28 tablets of 10mg under this PGD (280mg in total)";
      return null;
    }

    case 7: {
      // Name the unticked points in the words of their labels, so the
      // pharmacist knows which box to tick (walkthrough review, 11 Sep 2026).
      const c = state.counselling;
      const missing: string[] = [];
      if (!c.prnUseOnly) missing.push("As-required use only");
      if (!c.physicalSymptoms) missing.push("Reduces physical anxiety symptoms");
      if (!c.notACure) missing.push("Not a cure for anxiety");
      if (!c.noDependence) missing.push("Does NOT cause dependence");
      if (!c.noSuddenWithdrawal) missing.push("Must not be stopped suddenly if taken regularly");
      if (!c.reportWheeze) missing.push("Report any breathlessness or wheeze");
      if (!c.coldExtremities) missing.push("May cause cold hands and feet");
      if (!c.avoidAlcohol) missing.push("Avoid alcohol");
      if (!c.avoidVerapamil) missing.push("Do NOT use with verapamil or diltiazem");
      if (missing.length)
        return `Tick every counselling point. Not yet ticked: ${missing.join("; ")}`;
      return null;
    }

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
