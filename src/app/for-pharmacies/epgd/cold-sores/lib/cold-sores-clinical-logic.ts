import type { ColdSoresConsultationState } from "./cold-sores-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Aligned to the Cold Sores (Herpes Labialis) PGD, version 002, issued
// 11 September 2026: aciclovir 5% cream (P) and aciclovir 200 mg tablets (POM).

export function getAllAlerts(state: ColdSoresConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const c = state.contraindications;
  const age = state.patient.age;

  // Hard stops (PGD inclusion and exclusion criteria)
  if (c.childUnder12 || (age !== null && age < 12)) {
    alerts.push({
      severity: "stop",
      code: "CS_AGE",
      message: "Patient under 12 years old",
      detail: "This PGD covers adults and adolescents aged 12 years and over. Refer to the GP.",
    });
  }

  if (state.symptomAssessment.isFirstEpisode) {
    alerts.push({
      severity: "stop",
      code: "CS_FIRST_EPISODE",
      message: "First episode: not a clinical diagnosis of recurrent herpes labialis",
      detail:
        "The PGD inclusion criterion is a clinical diagnosis of recurrent herpes labialis. A first episode should be assessed by the GP; refer rather than supply.",
    });
  }

  if (c.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "CS_HYPERSENSITIVITY",
      message: "Known hypersensitivity to aciclovir, valaciclovir or any excipient",
      detail: "Excluded. Advise on alternatives and refer to the GP as appropriate.",
    });
  }

  if (c.immunosuppressed || state.medicalHistory.immunosuppressed || state.medicalHistory.recentlyImmunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "CS_IMMUNOSUPPRESSED",
      message: "Immunocompromised patient",
      detail:
        "Excluded from this PGD (risk of severe or systemic HSV). Refer to the GP or specialist.",
    });
  }

  if (c.severeRecurrentEpisodes) {
    alerts.push({
      severity: "stop",
      code: "CS_SEVERE_RECURRENT",
      message: "Severe recurrent episodes",
      detail: "Excluded from this PGD. Refer to the GP for assessment, which may include oral antiviral or suppressive therapy.",
    });
  }

  if (c.pregnant) {
    alerts.push({
      severity: "stop",
      code: "CS_PREGNANCY",
      message: "Pregnancy: refer to a prescriber",
      detail:
        "The PGD excludes pregnancy unless assessed as appropriate by the prescriber. That assessment is not available under a PGD supply; refer to the GP.",
    });
  }

  if (c.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "CS_BREASTFEEDING",
      message: "Breastfeeding: refer to a prescriber",
      detail:
        "The PGD excludes breastfeeding unless assessed as appropriate by the prescriber. That assessment is not available under a PGD supply; refer to the GP.",
    });
  }

  if (c.mucousMembraneLesions) {
    alerts.push({
      severity: "stop",
      code: "CS_MUCOUS_MEMBRANES",
      message: "Lesions on mucous membranes (eyes, inside the mouth, genitals)",
      detail:
        "Excluded: the PGD covers herpes labialis of the lips and face only. Cream must not be used on mucous membranes. Eye involvement needs urgent ophthalmology referral.",
    });
  }

  if (c.renalImpairmentSevere) {
    alerts.push({
      severity: "stop",
      code: "CS_RENAL_SEVERE",
      message: "Severe renal impairment (eGFR below 10 mL/min): refer to GP",
      detail:
        "Pharmacy safety threshold, not a PGD exclusion criterion: the PGD lists renal impairment as a caution. Aciclovir requires significant dose adjustment at this level; a prescriber should assess.",
    });
  }

  if (state.symptomAssessment.daysSinceOnset !== null && state.symptomAssessment.daysSinceOnset > 10) {
    alerts.push({
      severity: "stop",
      code: "CS_OVER_10_DAYS",
      message: "Lesions present for more than 10 days",
      detail:
        "The PGD: if lesions are still present after 10 days, the patient should be advised to consult a doctor. Cold sores lasting more than 10 days or spreading are a referral. Do not supply.",
    });
  }

  // Cautions
  if (state.medicalHistory.renalImpairment && !c.renalImpairmentSevere) {
    alerts.push({
      severity: "caution",
      code: "CS_RENAL_MILD_MOD",
      message: "Impaired renal function: caution with oral aciclovir",
      detail:
        "The PGD advises caution when administering aciclovir to patients with impaired renal function; adequate hydration should be maintained.",
    });
  }

  if (age !== null && age >= 65) {
    alerts.push({
      severity: "caution",
      code: "CS_ELDERLY",
      message: "Elderly patient: likely reduced renal function",
      detail: "Caution with oral aciclovir; advise adequate hydration.",
    });
  }

  // Late presentation
  if (state.symptomAssessment.hoursFromProdrome !== null && state.symptomAssessment.hoursFromProdrome > 48) {
    alerts.push({
      severity: "red-flag",
      code: "CS_LATE_START",
      message: "More than 48 hours since prodrome: reduced efficacy",
      detail:
        "Treatment should start at the first sign of symptoms (tingling or itching). Effectiveness diminishes beyond 48 hours.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: ColdSoresConsultationState): DoseRecommendation | null {
  const supply = state.medicineSupply;
  if (!supply.product) return null;

  if (supply.product === "cream") {
    return {
      medicine: `Aciclovir 5% cream${supply.tubeSize ? `, ${supply.tubeSize} tube` : ""}`,
      dose: "Apply to the affected area of the lips or face",
      frequency: "five times daily at approximately four-hour intervals",
      duration: "5 days",
      dosingRegimen:
        "Apply five times daily at approximately four-hour intervals for 5 days. If lesions have not healed, continue for up to 10 days. If still present after 10 days, consult a doctor. Up to one 2 g or 5 g tube per episode.",
      reason: "Recurrent herpes labialis of the lips and face. Legal category P; supplied and recorded to PGD standard.",
    };
  }

  return {
    medicine: "Aciclovir 200 mg tablets",
    dose: "200 mg",
    frequency: "five times daily",
    duration: "5 days",
    dosingRegimen:
      "200 mg five times daily for 5 days: 25 tablets per episode. Tablets may be dispersed in a minimum of 50 mL of water or swallowed whole with a little water, with or without food.",
    reason: "Recurrent herpes labialis of the lips and face. Legal category POM.",
  };
}
