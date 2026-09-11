// ─── Hayfever Clinical Logic ───
// Aligned to the Fexofenadine and/or Dymista Allergic Rhinitis PGD,
// version 004, issued 11 September 2026.

import type { HayfeverConsultationState } from "./hayfever-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

const PGD_MIN_AGE = 12;

function fexofenadineSelected(state: HayfeverConsultationState): boolean {
  const m = state.medicineSupply.medicineSelected;
  return m === "fexofenadine" || m === "combination";
}

function dymistaSelected(state: HayfeverConsultationState): boolean {
  const m = state.medicineSupply.medicineSelected;
  return m === "dymista" || m === "combination";
}

function isUnder12(state: HayfeverConsultationState): boolean {
  return (
    state.contraindications.childUnder12 ||
    (state.patient.age !== null && state.patient.age < PGD_MIN_AGE)
  );
}

export function getAllAlerts(state: HayfeverConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (isUnder12(state)) {
    alerts.push({
      severity: "stop",
      code: "AGE_RESTRICTION",
      message: "Patient under 12 years",
      detail:
        "Both arms of this PGD exclude children under 12 years of age. Advise on alternative treatment options and how these can be accessed; inform or refer to the GP as appropriate.",
    });
  }

  // Co-existing asthma: the label has always said this is a reason to
  // refer (Medical Director's ruling, see calculateDoseRecommendation) but
  // nothing enforced it (adversarial review, 11 Sep 2026). Red flag: the
  // record shows the referral advice, and the pharmacist must act on it.
  if (state.medicalHistory.asthmaOrLrti) {
    alerts.push({
      severity: "red-flag",
      code: "ASTHMA_REFER",
      message: "Co-existing asthma or lower respiratory tract infection: refer for GP review",
      detail:
        "Hay fever with asthma is a reason to refer, not to treat here. This PGD does not authorise montelukast or any asthma treatment; the asthma needs reviewing by the GP. Record the referral and the advice given.",
    });
  }

  // Pregnancy and breastfeeding are fexofenadine-arm exclusions in the
  // document; the Dymista arm does not list them. Recent nasal surgery is a
  // Dymista-arm exclusion. Each stops its own arm and is a caution otherwise.
  if (state.contraindications.pregnant) {
    alerts.push({
      severity: fexofenadineSelected(state) ? "stop" : "caution",
      code: "PREGNANCY",
      message: "Patient is pregnant",
      detail:
        "Exclusion for fexofenadine under this PGD: do not supply fexofenadine. Dymista is not excluded by the document in pregnancy; use clinical judgement and the SPC. Advise on alternative treatment options; inform or refer to the GP as appropriate.",
    });
  }

  if (state.contraindications.breastfeeding) {
    alerts.push({
      severity: fexofenadineSelected(state) ? "stop" : "caution",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail:
        "Exclusion for fexofenadine under this PGD: do not supply fexofenadine. Dymista is not excluded by the document in breastfeeding; use clinical judgement and the SPC. Advise on alternative treatment options; inform or refer to the GP as appropriate.",
    });
  }

  if (state.medicalHistory.recentNasalSurgery) {
    alerts.push({
      severity: dymistaSelected(state) ? "stop" : "caution",
      code: "NASAL_SURGERY",
      message: "Recent nasal surgery or trauma",
      detail: "Exclusion for Dymista nasal spray: do not supply Dymista. Fexofenadine may still be considered.",
    });
  }

  if (state.medicalHistory.untreatedNasalInfection) {
    alerts.push({
      severity: dymistaSelected(state) ? "stop" : "caution",
      code: "NASAL_INFECTION",
      message: "Untreated fungal, bacterial or viral nasal infection",
      detail: "Exclusion for Dymista nasal spray: do not supply Dymista until the infection has been treated. Fexofenadine may still be considered.",
    });
  }

  if (state.contraindications.hypersensitivityFexofenadine) {
    alerts.push({
      severity: fexofenadineSelected(state) ? "stop" : "caution",
      code: "HYPERSENSITIVITY_FEXOFENADINE",
      message: "Known hypersensitivity to fexofenadine or any component of the formulation",
      detail: "Exclusion for fexofenadine: do not supply fexofenadine. Dymista may still be considered.",
    });
  }

  if (state.contraindications.hypersensitivityDymista) {
    alerts.push({
      severity: dymistaSelected(state) ? "stop" : "caution",
      code: "HYPERSENSITIVITY_DYMISTA",
      message: "Known hypersensitivity to azelastine, fluticasone or any excipient",
      detail: "Exclusion for Dymista nasal spray: do not supply Dymista. Fexofenadine may still be considered.",
    });
  }

  if (state.medicalHistory.severeHepaticImpairment) {
    alerts.push({
      severity: fexofenadineSelected(state) ? "stop" : "caution",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment",
      detail:
        "Exclusion for fexofenadine: do not supply fexofenadine. Dymista: caution in individuals with hepatic impairment.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: fexofenadineSelected(state) ? "stop" : "caution",
      code: "SEVERE_RENAL",
      message: "Severe renal impairment",
      detail: "Exclusion for fexofenadine: do not supply fexofenadine. Dymista may still be considered.",
    });
  }

  if (state.medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "CARDIOVASCULAR",
      message: "History of cardiovascular disease",
      detail: "Fexofenadine: caution in individuals with a history of cardiovascular disease.",
    });
  }

  if (state.medicalHistory.glaucoma) {
    alerts.push({
      severity: "caution",
      code: "GLAUCOMA",
      message: "Glaucoma",
      detail: "Dymista: caution in individuals with glaucoma.",
    });
  }

  if (state.medicalHistory.tuberculosis) {
    alerts.push({
      severity: "caution",
      code: "TUBERCULOSIS",
      message: "Tuberculosis",
      detail: "Dymista: caution in individuals with tuberculosis.",
    });
  }

  if (state.medicalHistory.phenylketonuria) {
    alerts.push({
      severity: "caution",
      code: "PKU",
      message: "Patient has phenylketonuria",
      detail: "Some formulations contain aspartame. Check product compatibility.",
    });
  }

  return alerts;
}

/** Stops that apply whatever medicine is chosen (or before one is chosen). */
function hasGeneralHardStops(state: HayfeverConsultationState): boolean {
  return isUnder12(state);
}

/** Arm-specific exclusions, applied once a medicine has been selected. */
export function hasMedicineHardStops(state: HayfeverConsultationState): boolean {
  if (fexofenadineSelected(state)) {
    if (
      state.contraindications.hypersensitivityFexofenadine ||
      state.medicalHistory.severeHepaticImpairment ||
      state.medicalHistory.renalImpairment ||
      state.contraindications.pregnant ||
      state.contraindications.breastfeeding
    ) {
      return true;
    }
  }
  if (dymistaSelected(state)) {
    if (
      state.contraindications.hypersensitivityDymista ||
      state.medicalHistory.untreatedNasalInfection ||
      state.medicalHistory.recentNasalSurgery
    ) {
      return true;
    }
  }
  return false;
}

export function hasHardStops(state: HayfeverConsultationState): boolean {
  return hasGeneralHardStops(state) || hasMedicineHardStops(state);
}

export function calculateDoseRecommendation(
  state: HayfeverConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.medicineSelected) return null;

  const brand =
    state.medicineSupply.fexofenadineBrand === "allevia"
      ? "Allevia (P)"
      : state.medicineSupply.fexofenadineBrand === "generic"
        ? "generic (POM)"
        : "brand not recorded";

  const recommendations: Record<string, DoseRecommendation> = {
    fexofenadine: {
      medicine: `Fexofenadine 120 mg tablets, ${brand}`,
      dose: "120 mg once daily, oral administration with water before food",
      frequency: "Once daily",
      duration: `${state.medicineSupply.fexofenadineQuantity ?? "?"} tablets supplied (document maximum 30, 1 month). As required for symptom control, typically seasonal use.`,
      reason: "Symptomatic relief of allergic rhinitis, including seasonal hay fever, in adults and adolescents aged 12 years and over",
    },
    dymista: {
      medicine:
        "Dymista nasal spray, suspension: azelastine hydrochloride 137 micrograms and fluticasone propionate 50 micrograms per actuation, 23 g bottle delivering 120 actuations (Viatris)",
      dose: "One spray in each nostril twice daily (morning and evening), intranasal",
      frequency: "Twice daily",
      duration: `${state.medicineSupply.dymistaBottles ?? "?"} bottle (23 g, approx. 120 sprays) supplied. Use as required; assess effectiveness after 2 to 4 weeks.`,
      reason: "Moderate to severe seasonal or perennial allergic rhinitis where monotherapy with either intranasal antihistamine or corticosteroid is not sufficient",
    },
    // Montelukast is deliberately absent. Nitin's decision, 8 September 2026:
    // do not offer it at all.
    //
    // It is not in the hayfever PGD, which authorises fexofenadine 120 mg
    // tablets and Dymista nasal spray. Montelukast for allergic rhinitis is for
    // patients who also have asthma, so supplying it from a pharmacy means
    // treating asthma without anyone reviewing the asthma. That is the model
    // ruled out for statins, hypertension and the rest. It also carries an
    // MHRA warning about neuropsychiatric reactions including sleep
    // disturbance, agitation and, rarely, suicidal thinking, which needs
    // counselling and follow-up a single supply does not provide.
    //
    // Co-existing asthma is a reason to REFER. Do not reinstate this without a
    // signed document arm and a decision from the clinical leads.
    combination: {
      medicine: `Fexofenadine 120 mg tablets (${brand}) + Dymista nasal spray (azelastine 137 micrograms / fluticasone propionate 50 micrograms per actuation, 23 g, 120 actuations)`,
      dose: "Fexofenadine 120 mg once daily with water before food + Dymista one spray in each nostril twice daily (morning and evening)",
      frequency: "Fexofenadine once daily; Dymista twice daily",
      duration: `${state.medicineSupply.fexofenadineQuantity ?? "?"} fexofenadine tablets (document maximum 30) + ${state.medicineSupply.dymistaBottles ?? "?"} Dymista bottle (23 g, approx. 120 sprays). Assess Dymista effectiveness after 2 to 4 weeks.`,
      reason: "Moderate to severe symptoms requiring dual therapy (oral antihistamine plus combination nasal spray)",
    },
  };

  return recommendations[state.medicineSupply.medicineSelected] || null;
}
