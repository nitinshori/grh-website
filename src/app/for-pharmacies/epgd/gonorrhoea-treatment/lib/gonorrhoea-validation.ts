import type { GonorrhoeaConsultationState } from "./gonorrhoea-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getAllAlerts, validateAdministration } from "./gonorrhoea-clinical-logic";

/** Any stop anywhere blocks every step from Diagnostic Confirmation onwards. */
function firstStop(state: GonorrhoeaConsultationState): string | null {
  const stop = getAllAlerts(state).find((a) => a.severity === "stop");
  return stop ? "Cannot proceed: " + stop.message : null;
}

export function validateStep(state: GonorrhoeaConsultationState, step: number): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 18 }); // PGD v004: adults aged 18 years or over
    case 1: // Consent, before anything is administered
      return validateConsentStep(state.consent);
    case 2: // Diagnostic Confirmation
      if (!state.assessment.neatPositive && !state.assessment.epidemiologicalLink)
        return "Positive NAAT for N. gonorrhoeae, or strong clinical suspicion with a clear epidemiological link, is required";
      if (!state.assessment.infectionSite) return "Record the site of infection (genital, rectal or pharyngeal)";
      if (!state.assessment.ableToAttendTestOfCure) return "Patient must be able to attend the test of cure appointment at 2 weeks";
      return firstStop(state);
    case 3: // Assessment
      if (!state.assessment.pregnancyStatus) return "Record pregnancy status (not applicable, not pregnant, pregnant, or unknown)";
      if (!state.assessment.lastSexualContact.trim()) return "Record the date of last sexual contact (partner notification window is 2 weeks)";
      if (!state.assessment.partnerNotificationPlanned) return "Partner notification must be planned: contacts within the last 2 weeks";
      if (!state.assessment.testOfCurePlanned) return "Test of cure at 2 weeks must be planned";
      return firstStop(state);
    case 4: // Contraindications
      return firstStop(state);
    case 5: { // Counselling
      const c = state.counselling;
      if (!c.counselledOnTreatment) return "Confirm the patient was counselled on the treatment";
      if (!c.discussedPartnerNotification) return "Confirm partner notification was discussed";
      if (!c.counselledOnAbstinence) return "Confirm abstinence advice was given until test of cure and partner treatment";
      if (!c.offeredCoTesting) return "Confirm co-testing (chlamydia, HIV, syphilis) was offered";
      if (!c.providedWrittenInfo) return "Confirm written information (PIL) was provided";
      if (!c.testOfCureAdvice) return "Confirm the test of cure at 2 weeks advice was given";
      if (!c.injectionSiteAdvice) return "Confirm the injection site advice was given";
      if (!c.allergyAndColitisAdvice) return "Confirm the allergic reaction and severe diarrhoea advice was given";
      return firstStop(state);
    }
    case 6: // Treatment (administration)
      return firstStop(state) || validateAdministration(state);
    case 7: // Summary
      return firstStop(state) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
