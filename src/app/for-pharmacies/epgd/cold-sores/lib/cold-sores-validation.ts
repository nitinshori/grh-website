import type { ColdSoresConsultationState } from "./cold-sores-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: ColdSoresConsultationState): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: {
      // Consent. The PGD covers patients from 12: for an under-16 the record
      // must say who consented (parental responsibility or Gillick competence).
      const base = validateConsentStep(state.consent);
      if (base) return base;
      const age = state.patient.age;
      if (age !== null && age < 16) {
        if (!state.consent.consentBasis)
          return "Patient is under 16: record whether consent came from a person with parental responsibility or from the young person assessed as Gillick competent";
        if (!state.consent.consentBasisNotes.trim())
          return "Record the basis of consent (who gave it, and for Gillick competence, the assessment made)";
      }
      return null;
    }

    case 2: // Symptom Assessment
      if (!state.symptomAssessment.isRecurrent && !state.symptomAssessment.isFirstEpisode) {
        return "Please confirm whether this is a recurrent episode (PGD inclusion) or a first episode (refer)";
      }
      if (state.symptomAssessment.daysSinceOnset === null) {
        return "Record how many days this episode has been present (consult a doctor if lesions persist beyond 10 days)";
      }
      if (!state.symptomAssessment.currentSymptoms.trim()) {
        return "Please describe current symptoms";
      }
      if (state.symptomAssessment.prodromeSigns && state.symptomAssessment.hoursFromProdrome === null) {
        return "Enter the hours since prodrome onset";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.renalImpairment && !state.medicalHistory.renalFunction.trim()) {
        return "Please describe renal function status";
      }
      return null;

    case 4: // Contraindications
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.product) return "Select aciclovir 5% cream or aciclovir 200 mg tablets";
      if (state.medicineSupply.product === "cream" && !state.medicineSupply.tubeSize) {
        return "Select the tube size (2 g or 5 g; one tube per episode)";
      }
      if (state.medicineSupply.product === "tablets" && state.medicineSupply.doseChoice !== "200") {
        return "The PGD dose is aciclovir 200 mg five times daily for 5 days";
      }
      if (state.medicineSupply.quantity === null || state.medicineSupply.quantity <= 0) {
        return "Please enter quantity to supply";
      }
      if (state.medicineSupply.product === "tablets" && state.medicineSupply.quantity !== 25) {
        return "The PGD quantity for tablets is 25 per episode (200 mg five times daily for 5 days)";
      }
      if (state.medicineSupply.product === "cream" && state.medicineSupply.quantity !== 1) {
        return "The PGD quantity for cream is one tube per episode";
      }
      if (!state.medicineSupply.brand.trim()) return "Record the brand of the product supplied (PGD records requirement)";
      return null;

    case 6: {
      // Counselling: name the first point still unticked, in the label's own words.
      const c = state.counselling;
      const points: [boolean, string][] = [
        [c.startASAP, "Start treatment at the first sign of symptoms"],
        [c.completeCourse, "Complete the 5-day course"],
        [c.contagious, "Herpes simplex is easily transmitted"],
        [c.avoidSharing, "Do not share items that touch the lesions"],
        [c.hygieneMeasures, "Hygiene"],
        [c.symptomRelief, "Symptom relief"],
        [c.safetyNetting, "Seek medical advice if symptoms worsen"],
        [c.sunExposure, "Avoid triggers where possible"],
        [c.providedPIL, "Patient information leaflet supplied with the medication"],
        [c.yellowCard, "Report suspected adverse effects via Yellow Card"],
      ];
      const missing = points.find(([done]) => !done);
      if (missing) return `Tick the counselling point "${missing[1]}" once it has been covered (all points are required)`;
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
