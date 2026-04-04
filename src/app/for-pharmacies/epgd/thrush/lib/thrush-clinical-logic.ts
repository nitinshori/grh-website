import type { ThrushConsultationState } from "./thrush-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: ThrushConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.bloodStainedDischarge) {
    alerts.push({ severity: "stop", code: "BLOOD_DISCHARGE", message: "Blood-stained discharge", detail: "Not typical of thrush. Refer to GP for diagnosis." });
  }

  if (state.assessment.offensiveSmell) {
    alerts.push({ severity: "stop", code: "OFFENSIVE_SMELL", message: "Offensive-smelling discharge", detail: "Not typical of thrush. May indicate BV or STI. Refer to GP." });
  }

  if (state.assessment.fever || state.assessment.pelvicPain) {
    alerts.push({ severity: "stop", code: "FEVER_PAIN", message: "Fever or pelvic pain", detail: "Not typical of uncomplicated thrush. Refer to GP for assessment." });
  }

  if (state.medicalHistory.ageUnder16 || state.medicalHistory.ageOver60) {
    alerts.push({ severity: "stop", code: "AGE_RESTRICTION", message: "Patient outside recommended age range", detail: "Refer to GP for assessment and treatment." });
  }

  if (state.medicalHistory.firstEpisode) {
    alerts.push({ severity: "stop", code: "FIRST_EPISODE", message: "First ever episode of thrush", detail: "Requires GP diagnosis confirmation before treatment." });
  }

  if (state.medicalHistory.recurrentThrush) {
    alerts.push({ severity: "caution", code: "RECURRENT", message: "Recurrent thrush (4+ episodes/year)", detail: "Advise on lifestyle measures; consider longer maintenance therapy." });
  }

  if (state.medicalHistory.pregnancy) {
    alerts.push({ severity: "caution", code: "PREGNANCY", message: "Currently pregnant", detail: "Avoid oral fluconazole; use local treatments (pessary/cream)." });
  }

  if (state.medicalHistory.diabetes) {
    alerts.push({ severity: "caution", code: "DIABETES", message: "Diabetes mellitus", detail: "Increased thrush risk; counsel on blood sugar control." });
  }

  if (state.medications.warfarin) {
    alerts.push({ severity: "caution", code: "WARFARIN", message: "Taking warfarin", detail: "Fluconazole may increase warfarin effect; monitor INR." });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: ThrushConsultationState): DoseRecommendation | null {
  if (state.medicineSelection.medicineChoice === "fluconazole-oral") {
    return { medicine: "Fluconazole", dose: "150mg", frequency: "Single dose", duration: "One-off", dosingRegimen: "Single oral dose (tablet)", reason: "Uncomplicated vulvovaginal candidiasis" };
  } else if (state.medicineSelection.medicineChoice === "clotrimazole-pessary") {
    return { medicine: "Clotrimazole", dose: "500mg", frequency: "Single dose", duration: "One-off pessary + cream", dosingRegimen: "500mg pessary (one-off) + 1% external cream as needed", reason: "Uncomplicated vulvovaginal candidiasis" };
  }
  return null;
}
