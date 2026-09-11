import type { CovidBoosterConsultationState } from "./covid-booster-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { intervalTooShort, nhsEligible } from "./covid-booster-clinical-logic";

// Aligned to the COVID-19 Vaccination 2026/27 PGD version 006, issued 11 September 2026.

export function validateStep(state: CovidBoosterConsultationState, step: number): string | null {
  switch (step) {
    // PGD v006 covers 12 years and over. This tool previously enforced 18,
    // which turned away patients the PGD authorises.
    case 0:
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1:
      if (!state.assessment.ageConfirmed) {
        return "Please confirm patient is 12 years or older";
      }
      if (!state.assessment.nhsStatus) {
        return "Record whether the patient does not qualify for NHS vaccination, or qualifies but prefers to be vaccinated privately having been told of their NHS entitlement";
      }
      if (nhsEligible(state) && state.assessment.nhsStatus === "not-eligible") {
        return "This patient is eligible for NHS vaccination (75 and over, care home resident or immunosuppressed) and must be told they can have it free of charge before any private supply";
      }
      // A previous dose is NOT required. The SPC states the vaccine is given
      // regardless of prior vaccination status, and the PGD only excludes a
      // primary course where the patient is ALSO immunosuppressed.
      if (!state.assessment.previousCovidVaccine && state.assessment.immunosuppressed) {
        return "Primary course in an unvaccinated, immunosuppressed patient is excluded by the PGD. Refer.";
      }
      if (intervalTooShort(state) && !state.assessment.shorterIntervalNationalGuidance) {
        return "Less than 3 months since the last COVID-19 vaccine dose: excluded unless a shorter interval is specifically advised in national guidance for this individual";
      }
      if (!state.assessment.timelinessEligible) {
        return "Please confirm at least 3 months since the last COVID-19 vaccine dose, or that this is a first dose";
      }
      return null;

    case 2:
      return null;

    case 3:
      if (
        !state.counselling.explainedBoosterRationale ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedObservationPeriod ||
        !state.counselling.discussedSeriousReactions ||
        !state.counselling.providedWrittenInfo ||
        !state.counselling.explainedYellowCard
      ) {
        return "All counselling items, including the cardiac warning signs, Yellow Card reporting and the written information, must be completed";
      }
      return null;

    case 4: {
      const s = state.supply;
      if (!s.vaccineProduct) return "Select the vaccine product actually given";
      if (!s.batchNumber.trim()) return "Batch number is required. A recall cannot be actioned without it";
      if (!s.expiryDate) return "Vaccine expiry date is required";
      if (s.expiryDate < state.summary.consultationDate) {
        return "The stock held has passed its labelled expiry date. Do not administer; rebook rather than substitute";
      }
      if (!s.administrationSite) return "Administration site is required";
      if (!s.administrationTime) return "Administration time is required";
      if (
        state.assessment.myocarditisHistory &&
        (s.vaccineProduct === "comirnaty-xfg" || s.vaccineProduct === "comirnaty-lp81" || s.vaccineProduct === "spikevax-lp81")
      ) {
        return "Myocarditis or pericarditis after a previous mRNA dose: do not give a further mRNA dose under this PGD";
      }
      if (state.assessment.capillaryLeakHistory && s.vaccineProduct === "spikevax-lp81") {
        return "History of capillary leak syndrome: Spikevax vaccination must be planned with appropriate medical experts, not given under this tool";
      }
      if (s.vaccineProduct === "comirnaty-lp81") {
        const age = state.patient.age;
        if (state.assessment.immunosuppressed || (age !== null && age >= 75)) {
          return "Comirnaty XFG must be given in preference to LP.8.1 for patients who are immunosuppressed or aged 75 and over. Use XFG, or rebook.";
        }
        if (!s.lp81FormulationExplained) {
          return "Confirm the patient was told this is the previous seasonal formulation and that XFG is the current one";
        }
      }
      return null;
    }

    case 5: {
      const consentError = validateConsentStep(state.consent);
      if (consentError) return consentError;
      const age = state.patient.age;
      if (age !== null && age < 16) {
        const s = state.supply;
        if (!s.consentBasis)
          return "Under 16: record whether consent came from a person with parental responsibility or from the young person as Gillick competent";
        if (s.consentBasis === "parental" && !s.parentName.trim())
          return "Record the name of the person with parental responsibility";
        if (s.consentBasis === "parental" && !s.parentRelationship.trim())
          return "Record the relationship of the person with parental responsibility to the patient";
        if (s.consentBasis === "gillick" && !s.gillickBasis.trim())
          return "Record the basis of the Gillick competence assessment";
      }
      return validateSummaryStep(state.summary);
    }

    case 6:
    case 7:
      return null;

    default:
      return null;
  }
}
