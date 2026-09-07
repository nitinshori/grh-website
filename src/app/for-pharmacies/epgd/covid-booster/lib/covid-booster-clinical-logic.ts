import type { CovidBoosterConsultationState } from "./covid-booster-types";
import { COVID_PRODUCTS } from "./covid-booster-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: CovidBoosterConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Anaphylaxis to previous COVID vaccine
  if (state.assessment.anaphylaxisToPreviousDose) {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_PREV",
      message: "Anaphylaxis to previous COVID-19 vaccine",
      detail: "Contraindicated. Do not administer booster.",
    });
  }

  // Anaphylaxis to PEG/polysorbate
  if (state.assessment.anaphylaxisToPEG || state.assessment.anaphylaxisToPolysorbate) {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_COMPONENT",
      message: "Anaphylaxis to vaccine component (PEG/polysorbate)",
      detail: "Contraindicated. Do not administer booster.",
    });
  }

  // Severe febrile illness
  if (state.assessment.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "COVID_FEBRILE",
      message: "Severe febrile illness present",
      detail: "Defer vaccination until patient has recovered and is afebrile.",
    });
  }

  // Caution: Anticoagulants
  if (state.assessment.onAnticoagulants) {
    alerts.push({
      severity: "caution",
      code: "COVID_ANTICOAGULANT",
      message: "Patient on anticoagulant therapy",
      detail:
        "Increased bleeding risk at injection site. Apply firm pressure for 2-3 minutes post-injection. Counsel on bruising risk.",
    });
  }

  // Myocarditis or pericarditis after a previous mRNA dose.
  //
  // This was a "caution" in v003 of the tool while the PGD listed it under
  // EXCLUSION criteria: "History of myocarditis or pericarditis following a
  // previous dose of an mRNA COVID-19 vaccine. Refer for specialist advice;
  // do not give a further mRNA dose under this PGD." The tool was softer than
  // the document it operates under. It is a stop.
  if (state.assessment.myocarditisHistory) {
    alerts.push({
      severity: "stop",
      code: "COVID_MYOCARDITIS",
      message: "Myocarditis or pericarditis after a previous mRNA COVID-19 vaccine",
      detail:
        "Excluded under this PGD. Do not give a further mRNA dose (Comirnaty or Spikevax). Refer for specialist advice.",
    });
  }

  // Primary course in someone unvaccinated AND immunosuppressed is excluded.
  if (!state.assessment.previousCovidVaccine && state.assessment.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "COVID_PRIMARY_COURSE_IMMUNOSUPPRESSED",
      message: "Primary course in an unvaccinated, immunosuppressed patient",
      detail:
        "This PGD does not cover primary courses in individuals who are unvaccinated and immunosuppressed, or any schedule requiring more than one dose in the season. Refer.",
    });
  }

  // Comirnaty XFG must be given in preference to LP.8.1 for the highest risk.
  const age = state.patient.age;
  if (
    state.supply.vaccineProduct === "comirnaty-lp81" &&
    (state.assessment.immunosuppressed || (age !== null && age >= 75))
  ) {
    alerts.push({
      severity: "stop",
      code: "COVID_LP81_HIGH_RISK",
      message: "Comirnaty LP.8.1 selected for a high-risk patient",
      detail:
        "PGD v004 requires Comirnaty XFG, the current 2026/27 formulation, for anyone immunosuppressed or aged 75 and over. Use XFG stock, or rebook.",
    });
  }

  if (state.supply.vaccineProduct === "comirnaty-lp81") {
    alerts.push({
      severity: "caution",
      code: "COVID_LP81_RUNOUT",
      message: "Comirnaty LP.8.1 is the previous seasonal formulation",
      detail:
        "Permitted under PGD v004 from existing stock only, until that stock is used up or reaches its expiry date. Tell the patient this is the previous formulation and that XFG is the current one, and record that you did. Check the variant printed on the syringe label before injecting.",
    });
  }

  if (state.assessment.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "COVID_IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail:
        "The immune response may be reduced and protection may be limited. Vaccination is still recommended. This patient is eligible for NHS vaccination and must be told they can have it free of charge on the NHS.",
    });
  }

  return alerts;
}

export function hasHardStops(state: CovidBoosterConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: CovidBoosterConsultationState): DoseRecommendation | null {
  if (!state.assessment.ageConfirmed) {
    return null;
  }

  // The dose volume is NOT the same for all four products: Comirnaty is
  // 0.3 mL, Spikevax and Nuvaxovid are 0.5 mL. Until a product is chosen
  // there is no single correct volume to display.
  //
  // v003 of this tool displayed a fixed "0.3 mL" alongside the label
  // "XBB.1.5 or current variant-updated formulation". XBB.1.5 was the
  // 2023/24 strain, three seasons out of date, and the fixed volume was
  // wrong for two of the four products in the PGD.
  const chosen = state.supply.vaccineProduct;
  if (!chosen) {
    return {
      medicine: "Select the product held before recording a dose",
      dose: "Comirnaty 0.3 mL. Spikevax and Nuvaxovid 0.5 mL.",
      frequency: "Single dose",
      duration: "One dose for the 2026/27 season",
      reason:
        "Comirnaty XFG is the vaccine of choice under PGD v004. Comirnaty LP.8.1 may be used from existing stock only, and not for patients who are immunosuppressed or aged 75 and over.",
    };
  }

  const product = COVID_PRODUCTS[chosen];
  return {
    medicine: product.label,
    dose: `${product.volume}, intramuscular, into the deltoid`,
    frequency: "Single dose",
    duration: "One dose for the 2026/27 season",
    reason:
      chosen === "comirnaty-lp81"
        ? "Existing stock of the previous seasonal formulation. Permitted under PGD v004 until stock is exhausted or expires. The patient must be told."
        : "Administered under COVID-19 PGD v004, 2026/27 season.",
  };
}
