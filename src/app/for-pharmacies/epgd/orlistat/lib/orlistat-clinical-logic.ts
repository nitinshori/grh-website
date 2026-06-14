import type { OrlistatConsultationState } from "./orlistat-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: OrlistatConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.medicalHistory.cholestasis) {
    alerts.push({
      severity: "stop",
      code: "CHOLESTASIS",
      message: "Cholestasis",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.chronicMalabsorption) {
    alerts.push({
      severity: "stop",
      code: "MALABSORPTION",
      message: "Chronic malabsorption syndrome",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Currently pregnant",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Currently breastfeeding",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medications.takesWarfarin) {
    alerts.push({
      severity: "stop",
      code: "WARFARIN",
      message: "Taking warfarin",
      detail: "Significant drug interaction. Do not supply.",
    });
  }

  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "caution",
      code: "GALLBLADDER",
      message: "Gallbladder disease",
      detail: "Monitor for worsening symptoms. Advise on low-fat diet.",
    });
  }

  if (state.medications.takesLevothyroxine) {
    alerts.push({
      severity: "caution",
      code: "LEVOTHYROXINE",
      message: "Taking levothyroxine",
      detail: "Orlistat may reduce absorption. Separate dosing by at least 4 hours.",
    });
  }

  if (state.medications.takesAntiEpileptics) {
    alerts.push({
      severity: "caution",
      code: "ANTI_EPILEPTICS",
      message: "Taking anti-epileptic medications",
      detail: "Risk of reduced absorption. Monitor drug levels closely.",
    });
  }

  if (state.medications.takesCiclosporin) {
    alerts.push({
      severity: "caution",
      code: "CICLOSPORIN",
      message: "Taking ciclosporin",
      detail: "Risk of reduced absorption. Monitor ciclosporin levels.",
    });
  }

  if (state.medicalHistory.chronic_diarrhea) {
    alerts.push({
      severity: "caution",
      code: "CHRONIC_DIARRHEA",
      message: "Chronic diarrhoea",
      detail: "Orlistat may worsen symptoms. Consider alternative therapy.",
    });
  }

  // Chronic kidney disease — increased hyperoxaluria / oxalate-nephropathy
  // risk. Per orlistat SmPC + recent post-marketing reports.
  if (state.medicalHistory.chronicKidneyDisease) {
    alerts.push({
      severity: "caution",
      code: "RENAL_CKD",
      message: "Chronic kidney disease / volume depletion",
      detail:
        "Orlistat may cause hyperoxaluria and oxalate nephropathy leading to renal failure, particularly in patients with underlying CKD or volume depletion. Counsel patient on adequate fluid intake; monitor renal function.",
    });
  }

  // Antiretrovirals — orlistat may reduce absorption.
  if (state.medications.takesHIVAntiretrovirals) {
    alerts.push({
      severity: "caution",
      code: "ANTIRETROVIRALS",
      message: "Concurrent HIV antiretroviral therapy",
      detail:
        "Orlistat may reduce absorption of HIV antiretroviral medications and could negatively affect their efficacy. Discuss with HIV specialist team before initiating.",
    });
  }

  // Other clinically significant drug interaction — exclusion per Janey.
  if (state.medications.otherSignificantInteraction) {
    alerts.push({
      severity: "stop",
      code: "DRUG_INTERACTION",
      message: "Clinically significant drug interaction",
      detail:
        "Excluded under this PGD. Refer to GP for medicines reconciliation before considering orlistat.",
    });
  }

  // Antiepileptic interaction — promote to a more visible caution (orlistat
  // may unbalance anticonvulsant treatment by reducing absorption →
  // convulsions). The existing takesAntiEpileptics field is already
  // captured in medications; add an explicit alert here.
  if (state.medications.takesAntiEpileptics) {
    alerts.push({
      severity: "caution",
      code: "ANTIEPILEPTICS",
      message: "Concurrent antiepileptic therapy",
      detail:
        "Orlistat may decrease absorption of antiepileptic drugs and unbalance treatment, leading to convulsions. Counsel patient; if poorly controlled epilepsy, refer to GP.",
    });
  }

  // Rectal bleeding caution — surfaces as a counselling point rather than
  // a per-patient alert; included in the patient counselling step below.

  // Severe-diarrhoea contraception caution — surfaces in counselling /
  // OC users.
  if (state.medications.takesOralContraceptives) {
    alerts.push({
      severity: "caution",
      code: "ORAL_CONTRACEPTIVE",
      message: "Patient on oral contraceptive",
      detail:
        "In case of severe diarrhoea, the efficacy of oral contraceptives may be reduced. Advise an additional barrier method during episodes of severe diarrhoea.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: OrlistatConsultationState): DoseRecommendation | null {
  return {
    medicine: "Orlistat",
    dose: "120mg",
    frequency: "Three times daily (TDS) with meals",
    duration: "12 weeks initially; continue if ≥5% weight loss achieved",
    dosingRegimen: "Take 120mg with each meal (breakfast, lunch, dinner). Omit dose if meal missed or low-fat.",
    reason: "Weight management in patients with BMI ≥30 or ≥28 with comorbidity",
  };
}
