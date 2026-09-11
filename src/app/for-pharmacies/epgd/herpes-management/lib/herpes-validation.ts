import type { HerpesConsultationState } from "./herpes-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { hasHardStops } from "./herpes-clinical-logic";

// Aligned to the Genital Herpes Management PGD, version 004, issued 11 September 2026.
export function validateStep(state: HerpesConsultationState, step: number): string | null {
  const a = state.assessment;
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 16 }); // PGD inclusion: aged 16 years and over
    case 1:
      if (!a.herpesDiagnosed) return "Confirmed or highly suspected genital herpes (HSV-1 or HSV-2 positive, or clinical diagnosis) is required";
      return null;
    case 2:
      if (!a.episodeType) return "Select the episode type: first episode, recurrent episode, or suppressive therapy";
      if (a.episodeType === "first" && !a.firstEpisodeSupply) return "Record whether this is the initial 5-day supply or the day 5 review for extension";
      if (a.episodeType === "first" && a.firstEpisodeSupply === "day5Extension" && !a.newLesionsAtDay5) return "The extension to 10 days is authorised only where new lesions are still forming at day 5";
      if (a.episodeType === "recurrent" && a.hoursFromOnset === null) return "Record hours since symptom onset: recurrent treatment must start within 48 hours";
      if (a.episodeType === "suppressive" && a.recurrencesPerYear === null) return "Record the number of recurrences a year: suppressive therapy requires 6 or more";
      if (a.episodeType === "suppressive" && a.suppressiveSuppliesMade === null) return "Record how many 28-day suppressive supplies have already been made under this PGD";
      return null;
    case 3:
      if (hasHardStops(state)) return "An exclusion criterion is present: refer, do not supply";
      return null;
    case 4: {
      const c = state.counselling;
      if (
        !c.explainedNotACure ||
        !c.counselledOnCondoms ||
        !c.avoidSexDuringSymptoms ||
        !c.discussedDisclosure ||
        !c.discussedHpvAndScreening ||
        !c.discussedPregnancyPlanning ||
        !c.completeCourse ||
        !c.safetyNetting ||
        !c.yellowCardExplained ||
        !c.discussedSuppressiveOption ||
        !c.providedWrittenInfo
      ) {
        return "All follow-up advice items in the PGD must be given and recorded";
      }
      return null;
    }
    case 5:
      if (!a.medicine) return "Select aciclovir 400 mg tablets or valaciclovir 500 mg tablets";
      if (a.medicine === "valaciclovir" && a.episodeType === "recurrent" && a.recurrentCourseDays === null) return "Select the valaciclovir recurrent course length: 3, 4 or 5 days (6, 8 or 10 tablets)";
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
