import type { ThrushConsultationState } from "./thrush-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Vaginal Thrush PGD v003 (11 September 2026). Two arms: fluconazole 150 mg
// capsule and clotrimazole 500 mg vaginal pessary. Non-pregnant women aged 16
// to 60 (the exclusion row governs; the inclusion row says 16 to 65).

export function getAllAlerts(state: ThrushConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;

  // Exclusions common to both arms
  if (state.assessment.bloodStainedDischarge) {
    alerts.push({ severity: "stop", code: "BLOOD_DISCHARGE", message: "Abnormal or blood-stained vaginal bleeding", detail: "Exclusion. Refer to GP for diagnosis." });
  }

  if (state.assessment.vulvalUlcers) {
    alerts.push({ severity: "stop", code: "VULVAL_ULCERS", message: "Vulval ulcers, sores or blisters", detail: "Exclusion. Refer to GP." });
  }

  if (state.assessment.offensiveSmell) {
    alerts.push({ severity: "stop", code: "OFFENSIVE_SMELL", message: "Foul-smelling discharge", detail: "Exclusion. Not typical of thrush; may indicate BV or STI. Refer to GP." });
  }

  if (state.assessment.fever || state.assessment.pelvicPain || state.assessment.dysuria || state.assessment.systemicUpset) {
    alerts.push({ severity: "stop", code: "FEVER_PAIN", message: "Lower abdominal pain, dysuria, fever or systemic upset", detail: "Exclusion. Refer to GP for assessment." });
  }

  if ((age !== null && (age < 16 || age > 60)) || state.medicalHistory.ageUnder16 || state.medicalHistory.ageOver60) {
    alerts.push({ severity: "stop", code: "AGE_RESTRICTION", message: "Aged under 16 or over 60", detail: "Exclusion. Refer to GP for assessment and treatment." });
  }

  if (state.medicalHistory.firstEpisode) {
    alerts.push({ severity: "stop", code: "FIRST_EPISODE", message: "First episode of symptoms", detail: "Needs a diagnosis; refer." });
  }

  if (state.medicalHistory.recurrentThrush || (state.assessment.recurrentEpisodes !== null && state.assessment.recurrentEpisodes >= 4)) {
    alerts.push({ severity: "stop", code: "RECURRENT", message: "Recurrent candidiasis: 4 or more episodes in 12 months, or 2 in the last 6 months", detail: "Exclusion. Refer to GP for investigation." });
  }

  if (state.medicalHistory.immunocompromised) {
    alerts.push({ severity: "stop", code: "IMMUNOSUPPRESSION", message: "Immunosuppression", detail: "Exclusion. Refer to GP." });
  }

  if (state.medicalHistory.diabetesPoorlyControlled) {
    alerts.push({ severity: "stop", code: "DIABETES_POOR", message: "Diabetes that is poorly controlled", detail: "Exclusion. Refer to GP." });
  } else if (state.medicalHistory.diabetes) {
    alerts.push({ severity: "caution", code: "DIABETES", message: "Diabetes mellitus", detail: "Increased thrush risk; counsel on blood sugar control. Poorly controlled diabetes is an exclusion." });
  }

  if (state.medicalHistory.stiExposure) {
    alerts.push({ severity: "stop", code: "STI_EXPOSURE", message: "Possible exposure to a sexually transmitted infection, or a partner with an STI", detail: "Exclusion. Refer to GP or sexual health service." });
  }

  // Arm-specific exclusions (enforced at medicine selection)
  if (state.medicalHistory.azoleHypersensitivity) {
    alerts.push({ severity: "caution", code: "AZOLE_ALLERGY", message: "Hypersensitivity to fluconazole or azoles: fluconazole excluded", detail: "Fluconazole cannot be supplied. Clotrimazole pessary may be considered if no imidazole hypersensitivity." });
  }
  if (state.medicalHistory.imidazoleHypersensitivity) {
    alerts.push({ severity: "caution", code: "IMIDAZOLE_ALLERGY", message: "Hypersensitivity to clotrimazole or imidazoles: pessary excluded", detail: "Clotrimazole pessary cannot be supplied." });
  }
  if (state.medicalHistory.pregnancy) {
    alerts.push({ severity: "caution", code: "PREGNANCY", message: "Pregnancy: fluconazole excluded", detail: "Oral fluconazole is contraindicated in pregnancy. Topical antifungal only: the applicator should not be used; advise inserting the pessary with fingers." });
  }
  if (state.medicalHistory.breastfeeding) {
    alerts.push({ severity: "caution", code: "BREASTFEEDING", message: "Breastfeeding: fluconazole excluded", detail: "Relative contraindication due to insufficient data. Clotrimazole pessary may be used." });
  }
  if (state.medications.qtDrugs) {
    alerts.push({ severity: "caution", code: "QT_DRUGS", message: "Terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin: fluconazole excluded", detail: "Risk of QT prolongation and torsades de pointes. Fluconazole cannot be supplied." });
  }
  if (state.medicalHistory.qtHistory) {
    alerts.push({ severity: "caution", code: "QT_HISTORY", message: "History of QT prolongation or cardiac arrhythmias: fluconazole excluded", detail: "Fluconazole cannot be supplied." });
  }
  if (state.medicalHistory.severeHepatic) {
    alerts.push({ severity: "caution", code: "SEVERE_HEPATIC", message: "Severe hepatic impairment (Child-Pugh score over 9): fluconazole excluded", detail: "Fluconazole cannot be supplied." });
  }
  if (state.medicalHistory.severeRenal) {
    alerts.push({ severity: "caution", code: "SEVERE_RENAL", message: "Severe renal impairment (eGFR under 20 mL/min): fluconazole excluded", detail: "Fluconazole cannot be supplied." });
  }

  // Cautions
  if (state.medicalHistory.mildModerateHepatic) {
    alerts.push({ severity: "caution", code: "HEPATIC", message: "Hepatic impairment (mild to moderate)", detail: "Fluconazole: monitor closely." });
  }
  if (state.medicalHistory.mildModerateRenal) {
    alerts.push({ severity: "caution", code: "RENAL", message: "Renal impairment (mild to moderate)", detail: "Fluconazole: dose adjustment may be needed." });
  }
  if (state.medications.warfarin) {
    alerts.push({ severity: "caution", code: "WARFARIN", message: "Warfarin or other oral anticoagulant", detail: "Fluconazole increases anticoagulant effect; monitor INR." });
  }
  if (state.medications.statins) {
    alerts.push({ severity: "caution", code: "STATINS", message: "Statins", detail: "Fluconazole increases statin levels." });
  }
  if (state.medications.phenytoin) {
    alerts.push({ severity: "caution", code: "PHENYTOIN", message: "Phenytoin", detail: "Fluconazole increases phenytoin levels." });
  }
  if (state.medications.rifampicin) {
    alerts.push({ severity: "caution", code: "RIFAMPICIN", message: "Rifampicin", detail: "Reduced fluconazole levels." });
  }
  if (state.medicalHistory.cannotRetainPessary) {
    alerts.push({ severity: "caution", code: "PESSARY_RETENTION", message: "May not retain a pessary (abnormal anatomy, severe prolapse)", detail: "Pessary arm caution: ensure the patient can retain the pessary." });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

// Arm-specific gate applied when the medicine is chosen.
export function getMedicineSelectionError(state: ThrushConsultationState): string | null {
  const choice = state.medicineSelection.medicineChoice;
  if (!choice) return "Medicine must be selected";
  const h = state.medicalHistory;
  if (choice === "fluconazole-oral") {
    if (h.pregnancy) return "Pregnancy: oral fluconazole is contraindicated. Select the clotrimazole pessary or refer.";
    if (h.breastfeeding) return "Breastfeeding excludes fluconazole (insufficient data). Select the clotrimazole pessary or refer.";
    if (h.azoleHypersensitivity) return "Hypersensitivity to fluconazole or azoles: fluconazole cannot be supplied.";
    if (state.medications.qtDrugs) return "Concurrent terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin: fluconazole cannot be supplied.";
    if (h.qtHistory) return "History of QT prolongation or cardiac arrhythmias: fluconazole cannot be supplied.";
    if (h.severeHepatic) return "Severe hepatic impairment (Child-Pugh over 9): fluconazole cannot be supplied.";
    if (h.severeRenal) return "Severe renal impairment (eGFR under 20): fluconazole cannot be supplied.";
  } else {
    if (h.imidazoleHypersensitivity) return "Hypersensitivity to clotrimazole or imidazoles: the pessary cannot be supplied.";
    if (!state.medicineSelection.abilityConfirmed) return "Confirm the patient is able to insert the pessary intravaginally";
  }
  return null;
}

export function calculateDoseRecommendation(state: ThrushConsultationState): DoseRecommendation | null {
  const combi = state.medicineSelection.combiPack;
  if (state.medicineSelection.medicineChoice === "fluconazole-oral") {
    return {
      medicine: "Fluconazole 150mg capsule",
      dose: "150mg",
      frequency: "Single dose",
      duration: "One-off",
      dosingRegimen: combi
        ? "Single oral dose of 150 mg, swallowed whole (1 capsule) + clotrimazole 1% external cream (Duo pack)"
        : "Single oral dose of 150 mg, swallowed whole (1 capsule supplied)",
      reason: "Uncomplicated vulvovaginal candidiasis",
    };
  } else if (state.medicineSelection.medicineChoice === "clotrimazole-pessary") {
    return {
      medicine: "Clotrimazole 500mg vaginal pessary",
      dose: "500mg",
      frequency: "Single dose",
      duration: combi ? "One-off pessary + cream" : "One-off",
      dosingRegimen: combi
        ? "Single 500 mg pessary inserted intravaginally at night (1 pessary) + clotrimazole 1% external cream (Combi pack)"
        : "Single 500 mg pessary inserted intravaginally at night (1 pessary supplied); treatment completed in one night",
      reason: "Uncomplicated vulvovaginal candidiasis",
    };
  }
  return null;
}
