import type { BVConsultationState } from "./bv-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Bacterial Vaginosis PGD v003 (11 September 2026). Two arms:
// oral metronidazole 400 mg tablets (women 16 to 65) and metronidazole 0.75%
// vaginal gel, Zidoval (women 18 to 65). Both arms: non-pregnant women.

export function isOralChoice(choice: string): boolean {
  return choice === "metronidazole-400" || choice === "metronidazole-2g";
}

export function getAllAlerts(state: BVConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.bloodStainedDischarge) {
    alerts.push({
      severity: "stop",
      code: "BLOOD_DISCHARGE",
      message: "Blood-stained discharge",
      detail: "Not typical of BV. Refer to GP for diagnosis.",
    });
  }

  if (state.assessment.fever || state.assessment.pelvicPain) {
    alerts.push({
      severity: "stop",
      code: "FEVER_PAIN",
      message: "Fever or pelvic pain",
      detail: "Signs of pelvic inflammatory disease (lower abdominal pain, pelvic tenderness, fever): refer urgently to GP.",
    });
  }

  // Caution, not a stop: the inclusion is a clinical diagnosis of bacterial
  // vaginosis, confirmed or presumptive on clinical grounds. A first episode
  // is the commonest presentation and is within the PGD.
  if (state.medicalHistory.firstEpisode) {
    alerts.push({
      severity: "caution",
      code: "FIRST_EPISODE",
      message: "First episode of BV",
      detail: "Within the PGD: a presumptive diagnosis on clinical grounds is sufficient. Confirm the typical features (thin greyish-white discharge, fishy odour) and exclude thrush and STI before supply.",
    });
  }

  if (state.medicalHistory.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to metronidazole or nitroimidazoles",
      detail: "Excluded from both the oral and vaginal gel arms. Refer to GP.",
    });
  }

  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Pregnancy, known or suspected",
      detail: "This PGD is for non-pregnant women (both arms). Refer to GP or midwife.",
    });
  }

  if (state.medicalHistory.activePelvicInflammation) {
    alerts.push({
      severity: "stop",
      code: "PELVIC_INFLAM",
      message: "Active pelvic inflammatory disease",
      detail: "Requires specialist assessment. Refer to GP urgently.",
    });
  }

  // Oral-arm exclusions: enforced at medicine selection (gel arm remains available)
  if (state.medications.alcohol) {
    alerts.push({
      severity: "caution",
      code: "ALCOHOL",
      message: "Current alcohol consumption: excluded from oral metronidazole",
      detail: "Risk of disulfiram-like reaction. Oral metronidazole cannot be supplied; the vaginal gel arm may be used. Avoid alcohol during and for 48 hours after any oral course.",
    });
  }

  if (state.medications.lithium) {
    alerts.push({
      severity: "caution",
      code: "LITHIUM",
      message: "Concurrent lithium therapy: excluded from oral metronidazole",
      detail: "Increased lithium levels, risk of toxicity. Oral metronidazole cannot be supplied; the vaginal gel arm may be used.",
    });
  }

  if (state.medications.disulfiram) {
    alerts.push({
      severity: "caution",
      code: "DISULFIRAM",
      message: "Concurrent disulfiram therapy: excluded from oral metronidazole",
      detail: "Oral metronidazole cannot be supplied; the vaginal gel arm may be used.",
    });
  }

  if (state.medicalHistory.cnsDiseaseOrBloodDyscrasia) {
    alerts.push({
      severity: "caution",
      code: "CNS_BLOOD",
      message: "Active CNS disease or blood dyscrasia: excluded from oral metronidazole",
      detail: "Oral metronidazole cannot be supplied; the vaginal gel arm may be used.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Breastfeeding",
      detail: "Oral: significant amounts in breast milk; consider alternatives or temporary cessation. Gel: minimal systemic absorption, but caution advised.",
    });
  }

  if (state.medicalHistory.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "HEPATIC",
      message: "Hepatic impairment (mild to moderate)",
      detail: "Oral metronidazole: adjust dose or frequency.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "RENAL",
      message: "Renal impairment",
      detail: "Oral metronidazole: may require dose reduction.",
    });
  }

  if (state.medications.warfarin) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN",
      message: "Taking warfarin",
      detail: "Metronidazole may increase warfarin effect. Monitor INR closely.",
    });
  }

  if (state.medications.phenytoin) {
    alerts.push({
      severity: "caution",
      code: "PHENYTOIN",
      message: "Taking phenytoin",
      detail: "Metronidazole increases phenytoin levels.",
    });
  }

  if (state.medicalHistory.recurrentBV) {
    alerts.push({
      severity: "caution",
      code: "RECURRENT",
      message: "Recurrent BV",
      detail: "Consider underlying cause; may benefit from longer duration or maintenance therapy.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

// Arm-specific gate applied when the medicine is chosen.
export function getMedicineSelectionError(state: BVConsultationState): string | null {
  const choice = state.medicineSelection.medicineChoice;
  if (!choice) return "Medicine must be selected";
  const age = state.patient.age;
  if (isOralChoice(choice)) {
    if (state.medications.alcohol) return "Current alcohol consumption excludes oral metronidazole (disulfiram-like reaction). Select the vaginal gel or refer.";
    if (state.medications.lithium) return "Concurrent lithium therapy excludes oral metronidazole. Select the vaginal gel or refer.";
    if (state.medications.disulfiram) return "Concurrent disulfiram therapy excludes oral metronidazole. Select the vaginal gel or refer.";
    if (state.medicalHistory.cnsDiseaseOrBloodDyscrasia) return "Active CNS disease or blood dyscrasia excludes oral metronidazole. Select the vaginal gel or refer.";
    if (choice === "metronidazole-400" && !state.medicineSelection.courseDays) return "Select the course length (5, 6 or 7 days)";
    if (!state.medicineSelection.abilityConfirmed) return "Confirm the patient is able to swallow tablets";
  } else {
    if (age !== null && age < 18) return "Metronidazole vaginal gel (Zidoval) is for women aged 18 to 65; 16 and 17 year olds are treated under the oral arm";
    if (!state.medicineSelection.abilityConfirmed) return "Confirm the patient is able to insert the gel intravaginally";
  }
  return null;
}

/** Quantity supplied, in the document's terms, for the regimen chosen. */
export function quantitySupplied(state: BVConsultationState): string {
  const ms = state.medicineSelection;
  if (ms.medicineChoice === "metronidazole-400") {
    const days = parseInt(ms.courseDays, 10);
    return isNaN(days) ? "10 to 14 tablets (400 mg each)" : `${days * 2} tablets (400 mg each) for ${days} days`;
  }
  if (ms.medicineChoice === "metronidazole-2g") return "5 tablets (400 mg each): 2 g single dose";
  if (ms.medicineChoice === "metronidazole-gel") return "1 tube (40 g, 8 applications of 5 g)";
  return "";
}

export function calculateDoseRecommendation(state: BVConsultationState): DoseRecommendation | null {
  const choice = state.medicineSelection.medicineChoice;
  const days = state.medicineSelection.courseDays;

  if (choice === "metronidazole-400") {
    return {
      medicine: "Metronidazole 400mg tablets (oral)",
      dose: "400mg",
      frequency: "Twice daily",
      duration: days ? `${days} days` : "5-7 days",
      dosingRegimen: days
        ? `400 mg twice daily for ${days} days (preferred regimen); ${parseInt(days, 10) * 2} tablets supplied; swallowed with water`
        : "400 mg twice daily for 5 to 7 days (preferred regimen); 10 to 14 tablets supplied; swallowed with water",
      reason: "Uncomplicated bacterial vaginosis",
    };
  } else if (choice === "metronidazole-2g") {
    return {
      medicine: "Metronidazole 400mg tablets (oral)",
      dose: "2g",
      frequency: "Single dose",
      duration: "One-off",
      dosingRegimen: "2 g (five 400 mg tablets) as a single oral dose; 5 tablets supplied; alternative, less effective than the 5 to 7 day course",
      reason: "Uncomplicated bacterial vaginosis",
    };
  } else if (choice === "metronidazole-gel") {
    return {
      medicine: "Metronidazole 0.75% vaginal gel (Zidoval)",
      dose: "5 g applicator intravaginally",
      frequency: "Once daily at bedtime",
      duration: "5 nights",
      dosingRegimen: "One 5 g applicator inserted intravaginally once daily at bedtime for 5 nights; 1 tube (40 g, 8 applications) supplied",
      reason: "Uncomplicated bacterial vaginosis",
    };
  }

  return null;
}
