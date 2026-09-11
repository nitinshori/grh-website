import type { OrlistatConsultationState } from "./orlistat-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: OrlistatConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.medicalHistory.cholestasis) {
    alerts.push({
      severity: "stop",
      code: "CHOLESTASIS",
      message: "Cholestasis or severe hepatic impairment",
      detail: "Exclusion under this PGD. Do not supply.",
    });
  }

  if (state.medicalHistory.chronicMalabsorption) {
    alerts.push({
      severity: "stop",
      code: "MALABSORPTION",
      message: "Chronic malabsorption syndrome",
      detail: "Exclusion under this PGD (e.g. cystic fibrosis, coeliac disease, inflammatory bowel disease). Do not supply.",
    });
  }

  if (state.medicalHistory.hypersensitivityToOrlistat) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to orlistat or any component of the formulation",
      detail: "Exclusion under this PGD. Do not supply.",
    });
  }

  if (state.medicalHistory.uncontrolledOrNewDiabetes) {
    alerts.push({
      severity: "stop",
      code: "UNCONTROLLED_DIABETES",
      message: "Uncontrolled or newly diagnosed diabetes",
      detail: "Exclusion under this PGD. Requires GP review before starting orlistat. Do not supply; refer to GP.",
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
      message: "Warfarin therapy",
      detail: "Exclusion under this PGD: relative contraindication, requires specialist assessment. Do not supply; refer to GP.",
    });
  }

  if (state.medications.takesOtherAnticoagulant) {
    alerts.push({
      severity: "caution",
      code: "ANTICOAGULANT",
      message: "Anticoagulant therapy (edoxaban, dabigatran, rivaroxaban)",
      detail: "Enhanced anticoagulant effect; requires GP liaison and INR monitoring if applicable.",
    });
  }

  if (state.weightAssessment.comorbidities.includes("type2diabetes")) {
    alerts.push({
      severity: "caution",
      code: "DIABETES",
      message: "Diabetes mellitus",
      detail: "Blood glucose control may improve; dose of antidiabetic medication (especially insulin and sulfonylureas) may require adjustment. Inform the GP.",
    });
  }

  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "caution",
      code: "GALLBLADDER",
      message: "Gallstone disease",
      detail: "Monitor for interactions and symptoms.",
    });
  }

  if (state.medications.takesBileAcidSequestrants) {
    alerts.push({
      severity: "caution",
      code: "BILE_ACID_SEQUESTRANT",
      message: "Taking a bile acid sequestrant",
      detail: "Monitor for interactions and symptoms.",
    });
  }

  if (state.medicalHistory.oxalateKidneyStones) {
    alerts.push({
      severity: "caution",
      code: "OXALATE_STONES",
      message: "History of oxalate kidney stones",
      detail: "Risk of hyperoxaluria and recurrence.",
    });
  }

  if (state.medicalHistory.chronicLiverDisease) {
    alerts.push({
      severity: "caution",
      code: "LIVER_DISEASE",
      message: "Chronic liver disease or elevated liver function tests",
      detail: "Proceed with caution; ensure baseline LFTs checked.",
    });
  }

  if (state.medications.takesLevothyroxine) {
    alerts.push({
      severity: "caution",
      code: "LEVOTHYROXINE",
      message: "Hypothyroidism: taking levothyroxine",
      detail: "Levothyroxine absorption may be reduced; monitor thyroid function and dose. Administer levothyroxine at least 4 hours before orlistat.",
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

  // PGD v002: concurrent ciclosporin therapy is an exclusion, not a caution.
  if (state.medications.takesCiclosporin) {
    alerts.push({
      severity: "stop",
      code: "CICLOSPORIN",
      message: "Concurrent ciclosporin therapy",
      detail: "Exclusion under this PGD (reduced absorption of ciclosporin). Do not supply; refer to GP.",
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

  // Chronic kidney disease, increased hyperoxaluria / oxalate-nephropathy
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

  // Antiretrovirals, orlistat may reduce absorption.
  if (state.medications.takesHIVAntiretrovirals) {
    alerts.push({
      severity: "caution",
      code: "ANTIRETROVIRALS",
      message: "Concurrent HIV antiretroviral therapy",
      detail:
        "Orlistat may reduce absorption of HIV antiretroviral medications and could negatively affect their efficacy. Discuss with HIV specialist team before initiating.",
    });
  }

  // Other clinically significant drug interaction, exclusion per Janey.
  if (state.medications.otherSignificantInteraction) {
    alerts.push({
      severity: "stop",
      code: "DRUG_INTERACTION",
      message: "Clinically significant drug interaction",
      detail:
        "Excluded under this PGD. Refer to GP for medicines reconciliation before considering orlistat.",
    });
  }

  // Antiepileptic interaction, promote to a more visible caution (orlistat
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

  // Rectal bleeding caution, surfaces as a counselling point rather than
  // a per-patient alert; included in the patient counselling step below.

  // Severe-diarrhoea contraception caution, surfaces in counselling /
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
    medicine: "Orlistat 120mg capsules",
    dose: "120mg",
    frequency: "With each main meal containing fat, up to three times daily (maximum 360mg daily)",
    duration: "Review at 12 weeks (3 months) from start; continue only if at least 5% reduction in body weight from baseline, otherwise discontinue and refer to GP",
    dosingRegimen: "Swallow capsule whole with a glass of water with or shortly before each main meal (typically breakfast, lunch and dinner). If a meal is missed or contains negligible fat, omit the dose. Supply up to 84 capsules (28-day supply).",
    reason: "Adjunct to reduced-calorie diet and lifestyle changes in adults aged 18 to 74 with BMI 30 kg/m2 or more, or BMI 28 kg/m2 or more with an obesity-related comorbidity",
  };
}
