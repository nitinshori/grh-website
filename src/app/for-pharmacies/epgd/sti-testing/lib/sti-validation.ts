// ─── STI Testing Validation ───

import type { STIConsultationState } from "./sti-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getAgeAlerts, getTreatmentAlerts } from "./sti-clinical-logic";

export function validateStep(state: STIConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: {
      // Patient Details. PGD v003: 16 and over; 13 to 15 only with recorded
      // Fraser competence and a safeguarding assessment with no concern;
      // under 13 never supplied.
      const base = validatePatientStep(state.patient);
      if (base) return base;
      const ageStop = getAgeAlerts(state).find((a) => a.severity === "stop");
      if (ageStop) return ageStop.message;
      if (state.patient.age !== null && state.patient.age <= 15 && !state.patient.safeguardingNotes.trim()) {
        return "Record the safeguarding assessment (partner age, coercion, exploitation indicators)";
      }
      return null;
    }

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Risk Assessment
      if (state.riskAssessment.numberOfPartners === null) {
        return "Number of partners is required";
      }
      if (!state.riskAssessment.condomUsage) {
        return "Condom usage must be specified";
      }
      return null;

    case 3: // Clinical Assessment
      // At least assess for symptoms
      return null; // Flexible assessment

    case 4: {
      // Test Selection. Testing is optional when the consultation is a
      // treatment supply for a confirmed or strongly suspected diagnosis.
      const testCount = [
        state.testSelection.ctGc,
        state.testSelection.hiv,
        state.testSelection.syphilis,
        state.testSelection.hepatitisB,
        state.testSelection.hepatitisC,
      ].filter(Boolean).length;

      if (testCount === 0 && !state.treatment.treatUnderPgd) {
        return "At least one test must be selected (or tick treatment under the PGD on the next step)";
      }

      if (state.testSelection.ctGc && !state.testSelection.ctGcSampleType) {
        return "Sample type for CT/GC must be specified";
      }

      if (state.testSelection.hiv && !state.testSelection.hivTestType) {
        return "HIV test type must be specified";
      }

      return null;
    }

    case 5: {
      // Treatment
      const t = state.treatment;
      if (!t.treatUnderPgd) return null;
      if (!t.chlamydiaDiagnosis) {
        return "Confirm the diagnosis of genital chlamydia (confirmed or strongly suspected)";
      }
      if (!t.currentMedicines.trim()) {
        return "Record the patient's current medicines (write 'none' if none): needed to check for QT-prolonging drugs and ergot derivatives";
      }
      if (!t.knownAllergies.trim()) {
        return "Record the patient's known allergies (write 'none known' if none): needed to check for tetracycline and macrolide hypersensitivity";
      }
      if (t.doxycyclineUnsuitable && !t.doxycyclineUnsuitableReason.trim()) {
        return "Record why doxycycline is unsuitable or contraindicated";
      }
      if (!t.medicine) {
        return "Select the medicine to supply (doxycycline first line; azithromycin only where doxycycline is unsuitable)";
      }
      const stop = getTreatmentAlerts(state).find((a) => a.severity === "stop");
      if (stop) return stop.message;
      return null;
    }

    case 6: {
      // Counselling
      if (
        !state.counselling.windowPeriods ||
        !state.counselling.partnerNotification ||
        !state.counselling.safeSex ||
        !state.counselling.resultsTimeline ||
        !state.counselling.positiveTestMeaning ||
        !state.counselling.followUp
      ) {
        return "All counselling points must be covered";
      }
      if (state.treatment.treatUnderPgd && state.treatment.medicine) {
        const c = state.counselling;
        if (!c.medicineAdvice || !c.abstinenceAdvice || !c.worseningAdvice || !c.pilSupplied) {
          return "All treatment counselling points must be covered and the PIL supplied";
        }
        if (!c.retestAdvice) {
          return "Advise retesting at 3 months to detect reinfection (and a test of cure at least 3 weeks after treatment where required)";
        }
        if (state.treatment.medicine === "doxycycline" && !c.contraceptionAdvice) {
          return "Advise effective contraception during and for 7 days after the doxycycline course";
        }
        if (state.treatment.medicine === "azithromycin" && !c.testOfCureAdvice) {
          return "Reinforce the need for a test of cure if symptoms persist";
        }
      }
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
