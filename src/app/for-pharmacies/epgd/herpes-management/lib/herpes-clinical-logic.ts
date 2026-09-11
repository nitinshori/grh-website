import type { HerpesConsultationState } from "./herpes-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Aligned to the Genital Herpes Management PGD, version 004, issued
// 11 September 2026. Exclusions are hard stops; cautions are warnings.

export function getAllAlerts(state: HerpesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;
  const age = state.patient.age;

  // Hard stops (PGD exclusion criteria)
  if (age !== null && age < 16) {
    alerts.push({
      severity: "stop",
      code: "HERPES_AGE",
      message: "Patient is under 16",
      detail: "This PGD covers patients aged 16 years and over. Refer.",
    });
  }

  if (a.emergencyFeatures) {
    alerts.push({
      severity: "stop",
      code: "HERPES_EMERGENCY",
      message: "Suspected disseminated infection, meningitis or encephalitis, or inability to pass urine",
      detail: "Emergency referral (999 or A&E) for ANY patient. Not a PGD supply.",
    });
  }

  if (a.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HERPES_HYPERSENSITIVITY",
      message: "Hypersensitivity to aciclovir or valaciclovir",
      detail: "Excluded. Refer.",
    });
  }

  if (a.severeRenalImpairment) {
    alerts.push({
      severity: "stop",
      code: "HERPES_RENAL",
      message: "Significant renal impairment (eGFR below 30 mL/min)",
      detail: "Excluded under this PGD. Refer to the GP or GUM clinic.",
    });
  }

  if (a.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "HERPES_HEPATIC",
      message: "Severe hepatic impairment",
      detail: "Excluded. Refer.",
    });
  }

  if (a.immunocompromised) {
    alerts.push({
      severity: "stop",
      code: "HERPES_IMMUNOCOMPROMISED",
      message: "Immunocompromised patient, any presentation",
      detail: "HIV, chemotherapy, transplant, biologic or high-dose steroid therapy: refer to specialist. Higher risk of severe or disseminated disease.",
    });
  }

  if (a.pregnant || a.pregnancyFirstEpisode) {
    alerts.push({
      severity: "stop",
      code: "HERPES_PREGNANCY",
      message: "Pregnancy at any gestation",
      detail: "Refer to the GP or GUM clinic. A first episode in pregnancy needs specialist management; suppressive treatment from 36 weeks is a prescriber decision.",
    });
  }

  if (a.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "HERPES_BREASTFEEDING",
      message: "Breastfeeding",
      detail: "Refer to the GP or GUM clinic.",
    });
  }

  if (a.episodeType === "recurrent" && a.hoursFromOnset !== null && a.hoursFromOnset > 48) {
    alerts.push({
      severity: "stop",
      code: "HERPES_RECURRENT_LATE",
      message: "Recurrent episode: more than 48 hours since symptom onset",
      detail: "Recurrent episode treatment under this PGD starts within 48 hours of symptom onset (vesicle or prodrome). Refer or advise supportive care.",
    });
  }

  if (a.episodeType === "suppressive" && a.recurrencesPerYear !== null && a.recurrencesPerYear < 6) {
    alerts.push({
      severity: "stop",
      code: "HERPES_SUPPRESSIVE_FREQUENCY",
      message: "Suppressive therapy requires 6 or more recurrences a year",
      detail: "Fewer than 6 recurrences a year: suppressive therapy is not authorised under this PGD.",
    });
  }

  if (a.episodeType === "suppressive" && a.suppressiveSuppliesMade !== null && a.suppressiveSuppliesMade >= 3) {
    alerts.push({
      severity: "stop",
      code: "HERPES_SUPPRESSIVE_CAP",
      message: "Maximum 3 months' suppressive supply already made under this PGD",
      detail: "GP or GUM review is required before any further supply.",
    });
  }

  // Cautions
  if (a.moderateRenalImpairment) {
    alerts.push({
      severity: "caution",
      code: "HERPES_RENAL_MODERATE",
      message: "Renal impairment (eGFR 30 to 60 mL/min)",
      detail: "Dose adjustment may be required. Ensure adequate hydration.",
    });
  }

  if (age !== null && age >= 65) {
    alerts.push({
      severity: "caution",
      code: "HERPES_ELDERLY",
      message: "Elderly patient: increased risk of renal impairment",
      detail: "Adequate hydration essential.",
    });
  }

  if (a.mildModerateHepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "HERPES_HEPATIC_MILD",
      message: "Hepatic impairment (mild to moderate)",
      detail: "Monitor closely.",
    });
  }

  if (a.dehydrationRisk) {
    alerts.push({
      severity: "caution",
      code: "HERPES_DEHYDRATION",
      message: "Dehydration",
      detail: "Ensure adequate fluid intake; risk of crystalline nephropathy if dehydrated.",
    });
  }

  if (a.neurologicalDisease) {
    alerts.push({
      severity: "caution",
      code: "HERPES_NEURO",
      message: "Neurological disease",
      detail: "Neurological reactions (confusion, tremor, hallucinations) are rare but possible, particularly with renal impairment.",
    });
  }

  return alerts;
}

export function hasHardStops(state: HerpesConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

/** The PGD regimen for the chosen medicine and episode type. */
export function calculateDoseRecommendation(state: HerpesConsultationState): DoseRecommendation | null {
  const a = state.assessment;
  if (!a.medicine || !a.episodeType) return null;

  if (a.medicine === "aciclovir") {
    switch (a.episodeType) {
      case "first":
        return {
          medicine: "Aciclovir 400 mg tablets",
          dose: "400 mg three times daily",
          dosingRegimen: a.firstEpisodeSupply === "day5Extension"
            ? "Day 5 review: a further 15 tablets, to 10 days, because new lesions are still forming"
            : "Initial supply, 5 days: 15 tablets",
          reason: a.firstEpisodeSupply === "day5Extension"
            ? "First episode, day 5 review supply."
            : "First episode, initial supply. Review at day 5; extend only where new lesions are still forming.",
        };
      case "recurrent":
        return {
          medicine: "Aciclovir 400 mg tablets",
          dose: "800 mg three times daily",
          dosingRegimen: "2 days: 12 tablets, starting within 48 hours of symptom onset",
          reason: "Recurrent episode.",
        };
      case "suppressive":
        return {
          medicine: "Aciclovir 400 mg tablets",
          dose: "400 mg twice daily",
          dosingRegimen: "56 tablets per 28 days; maximum 3 supplies (168 tablets) under this PGD before GP or GUM review",
          reason: "Suppressive therapy, 6 or more recurrences a year.",
        };
      default:
        return null;
    }
  }

  switch (a.episodeType) {
    case "first":
      return {
        medicine: "Valaciclovir 500 mg tablets",
        dose: "500 mg twice daily",
        dosingRegimen: a.firstEpisodeSupply === "day5Extension"
          ? "Day 5 review: a further 10 tablets, to 10 days, because new lesions are still forming"
          : "Initial supply, 5 days: 10 tablets",
        reason: a.firstEpisodeSupply === "day5Extension"
          ? "First episode, day 5 review supply."
          : "First episode, initial supply. Review at day 5; extend only where new lesions are still forming.",
      };
    case "recurrent":
      return {
        medicine: "Valaciclovir 500 mg tablets",
        dose: "500 mg twice daily",
        dosingRegimen: a.recurrentCourseDays
          ? `${a.recurrentCourseDays} days: ${a.recurrentCourseDays * 2} tablets, starting within 48 hours of symptom onset`
          : "Select 3, 4 or 5 days (6, 8 or 10 tablets), starting within 48 hours of symptom onset",
        reason: "Recurrent episode.",
      };
    case "suppressive":
      return {
        medicine: "Valaciclovir 500 mg tablets",
        dose: "500 mg once daily",
        dosingRegimen: "28 tablets per 28 days; maximum 3 supplies (84 tablets) under this PGD before GP or GUM review",
        reason: "Suppressive therapy, 6 or more recurrences a year.",
      };
    default:
      return null;
  }
}
