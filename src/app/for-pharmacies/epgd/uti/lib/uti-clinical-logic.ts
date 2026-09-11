import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type {
  UTIPatientDetails,
  UTISymptoms,
  UTIMedicalHistory,
  UTIObservations,
  UTIMedicineSelection,
} from "./uti-types";

// ─── Clinical Logic for UTI Consultation ───
// Aligned to the UTI in Women aged 16 to 64 PGD, version 005, issued
// 11 September 2026. Nitrofurantoin is first line; trimethoprim only where
// nitrofurantoin is unsuitable and the reason is recorded.

/** Recurrent UTI as the PGD defines it: 2 or more episodes in the last
 *  6 months, or 3 or more in the last 12 months. */
export function isRecurrentUTI(medicalHistory: UTIMedicalHistory): boolean {
  return (
    medicalHistory.utiEpisodesLast6Months === "2+" ||
    medicalHistory.utiEpisodesLast12Months === "3+"
  );
}

/** Nitrofurantoin arm exclusions that do not exclude the patient from the
 *  PGD altogether (they open the trimethoprim gate as "contraindicated"). */
export function isNitrofurantoinContraindicated(medicalHistory: UTIMedicalHistory): boolean {
  return (
    medicalHistory.nitrofurantoinHypersensitivity ||
    medicalHistory.g6pdDeficiency ||
    medicalHistory.previousNitrofurantoinReaction ||
    medicalHistory.acutePorphyria
  );
}

/** Trimethoprim arm exclusions. */
export function isTrimethoprimContraindicated(medicalHistory: UTIMedicalHistory): boolean {
  return (
    medicalHistory.trimethoprimHypersensitivity ||
    medicalHistory.trimethoprimLast3Months ||
    medicalHistory.folateDeficiencyOrBloodDyscrasia ||
    medicalHistory.takingMethotrexate ||
    medicalHistory.takingPotassiumSparingAgent ||
    medicalHistory.takingInteractingMedicine ||
    (medicalHistory.takingWarfarin && !medicalHistory.anticoagulationServiceConsulted) ||
    medicalHistory.hepaticImpairment
  );
}

export function getUTIClinicalAlerts(
  patient: UTIPatientDetails,
  symptoms: UTISymptoms,
  medicalHistory: UTIMedicalHistory,
  observations: UTIObservations,
  medicineSelection: UTIMedicineSelection
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── EXCLUSION CRITERIA (STOP) ───

  if (!patient.femaleConfirmed) {
    alerts.push({
      severity: "stop",
      code: "MALE_PATIENT",
      message: "Patient gender not confirmed as female",
      detail: "UTI PGD is for females aged 16-64 only. Any UTI in a man is complicated by definition and needs assessment. Refer.",
    });
  }

  if (patient.age !== null && patient.age < 16) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient is under 16 years of age",
      detail: "This PGD is for patients aged 16-64. Refer to GP.",
    });
  }

  if (patient.age !== null && patient.age > 64) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_OLD",
      message: "Patient is over 64 years of age",
      detail: "This PGD is for patients aged 16-64. Refer to GP.",
    });
  }

  // Inclusion: two or more of dysuria, new nocturia, frequency, urgency.
  const coreSymptomCount = [
    symptoms.dysuria,
    symptoms.nocturia,
    symptoms.frequency,
    symptoms.urgency,
  ].filter(Boolean).length;
  if (coreSymptomCount === 1) {
    alerts.push({
      severity: "stop",
      code: "SINGLE_SYMPTOM",
      message: "Only one core urinary symptom present",
      detail:
        "PGD v005 requires two or more of: dysuria, new nocturia, urinary frequency or urgency. Where only one symptom is present, refer rather than supply.",
    });
  }

  if (symptoms.duration === "> 7 days") {
    alerts.push({
      severity: "stop",
      code: "DURATION_OVER_7_DAYS",
      message: "Symptoms present for more than 7 days",
      detail: "Excluded. Refer for assessment and culture rather than empirical treatment.",
    });
  }

  if (symptoms.duration === "unknown") {
    alerts.push({
      severity: "stop",
      code: "DURATION_UNKNOWN",
      message: "Duration of symptoms not established",
      detail:
        "Inclusion requires symptoms present for 7 days or fewer. Establish the duration; if it cannot be established, refer.",
    });
  }

  if (medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Patient is pregnant",
      detail: "Nitrofurantoin and trimethoprim are contraindicated in pregnancy. Refer to GP.",
    });
  }

  if (medicalHistory.pregnancyPossible) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY_POSSIBLE",
      message: "Pregnancy is possible",
      detail: "Pregnant, possibly pregnant, or breastfeeding is an exclusion. Ask; do not assume. Refer.",
    });
  }

  if (medicalHistory.catheterised) {
    alerts.push({
      severity: "stop",
      code: "CATHETERISED",
      message: "Indwelling urinary catheter, or catheter removed within the last 7 days",
      detail:
        "Catheter-associated infection is not uncomplicated UTI and does not respond to a 3 day course. Refer.",
    });
  }

  if (isRecurrentUTI(medicalHistory)) {
    alerts.push({
      severity: "stop",
      code: "RECURRENT_UTI",
      message: "Recurrent UTI (2 or more in 6 months, or 3 or more in 12 months)",
      detail: "Excluded from this PGD and referred for investigation, whatever the current symptoms.",
    });
  }

  if (medicalHistory.antibioticThisEpisode) {
    alerts.push({
      severity: "stop",
      code: "ANTIBIOTIC_THIS_EPISODE",
      message: "An antibiotic has already been taken for this episode",
      detail:
        "One course per episode, whether supplied here, by a GP, or obtained elsewhere. Treatment failure needs culture, not a second guess. Refer.",
    });
  }

  if (medicalHistory.previousUTIWithin4Weeks) {
    alerts.push({
      severity: "stop",
      code: "UTI_WITHIN_4_WEEKS",
      message: "Previous UTI within last 4 weeks",
      detail: "Risk of treatment failure and resistance. Refer to GP for further investigation.",
    });
  }

  // ─── APPENDIX 1 RED FLAGS (all stops) ───

  if (symptoms.haematuria) {
    alerts.push({
      severity: "stop",
      code: "VISIBLE_HAEMATURIA",
      message: "Visible blood in the urine",
      detail:
        "Appendix 1 red flag. Visible haematuria requires investigation in its own right, and not only for infection. Refer.",
    });
  }

  if (symptoms.feverRigors || (observations.temperature !== null && observations.temperature >= 38)) {
    alerts.push({
      severity: "stop",
      code: "FEVER_RIGORS",
      message: symptoms.feverRigors
        ? "Fever, rigors or shivering"
        : "Temperature 38 C or above",
      detail:
        "Appendix 1 red flag. A lower UTI does not cause fever; this suggests the infection has reached the kidney or the bloodstream. Refer the same day.",
    });
  }

  if (symptoms.loinFlankPain) {
    alerts.push({
      severity: "stop",
      code: "LOIN_FLANK_PAIN",
      message: "Loin or flank pain, or back pain below the ribs",
      detail: "Appendix 1 red flag. Suggests pyelonephritis. Refer the same day; a 3 day course will not treat it.",
    });
  }

  if (symptoms.nauseaVomiting) {
    alerts.push({
      severity: "stop",
      code: "NAUSEA_VOMITING",
      message: "Nausea or vomiting",
      detail:
        "Appendix 1 red flag. Suggests upper tract involvement, and an oral antibiotic may not be absorbed. Refer.",
    });
  }

  if (symptoms.confusionDrowsiness) {
    alerts.push({
      severity: "stop",
      code: "CONFUSION_DROWSINESS",
      message: "Confusion, new drowsiness, or feeling very unwell",
      detail:
        "Appendix 1 red flag. Possible sepsis. Refer urgently; out of hours, direct to NHS 111 or urgent care rather than waiting for the surgery.",
    });
  }

  if (symptoms.systemicallyUnwell) {
    alerts.push({
      severity: "stop",
      code: "SYSTEMICALLY_UNWELL",
      message: "Patient appears systemically unwell",
      detail: "Appendix 1 red flag. Possible sepsis. Refer urgently.",
    });
  }

  if (medicalHistory.knownAbnormalUrinaryTract) {
    alerts.push({
      severity: "stop",
      code: "ABNORMAL_URINARY_TRACT",
      message: "Known structural or functional abnormality of the urinary tract, or renal stones",
      detail: "Excluded. Refer to GP for assessment and appropriate management.",
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "Excluded. Immunocompromised patients require specialist management. Refer to GP.",
    });
  }

  // ─── CAUTIONS ───

  // Breastfeeding is an EXCLUSION in both arms. The tool
  // previously raised it as a caution and steered the pharmacist towards
  // trimethoprim, which is a supply the PGD does not authorise.
  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail:
        "Excluded from both arms of this PGD. Refer. Do not substitute trimethoprim for nitrofurantoin on the basis of breastfeeding.",
    });
  }

  if (medicalHistory.diabetesUncontrolled) {
    alerts.push({
      severity: "caution",
      code: "NEUROPATHY_RISK",
      message: "Diabetes, or a condition causing peripheral neuropathy",
      detail:
        "Increases the risk of nitrofurantoin-associated neuropathy. Counsel on new numbness or tingling and to stop and seek advice.",
    });
  }

  // Renal function under PGD v005.
  //
  // The PGD asks a question that can be answered at the counter: "Have you
  // ever been told you have kidney disease, or that your kidneys do not work
  // as well as they should?" Known kidney disease is an exclusion from BOTH
  // arms: trimethoprim accumulates in renal impairment and causes
  // hyperkalaemia, so it is not the safe fallback the tool used to present it as.
  if (medicalHistory.kidneyDisease) {
    alerts.push({
      severity: "stop",
      code: "KIDNEY_DISEASE",
      message: "Known kidney disease, or under renal follow-up",
      detail:
        "Excluded from both arms of this PGD. Refer. Trimethoprim is not an alternative here: it accumulates in renal impairment and causes hyperkalaemia.",
    });
  }

  if (medicalHistory.renalImpairment === "moderate" || medicalHistory.renalImpairment === "severe") {
    alerts.push({
      severity: "stop",
      code: "RENAL_IMPAIRMENT",
      message:
        medicalHistory.renalImpairment === "severe"
          ? "Severe renal impairment (eGFR under 30)"
          : "Moderate renal impairment (eGFR 30 to 44)",
      detail: "This PGD is unsuitable in either arm. Refer to the GP.",
    });
  }

  // Aged 60 to 64: a NO answer alone is not enough. The PGD excludes where
  // renal function is unknown in this age band and refers for a renal
  // function check first. Below 60, an unknown answer with no history is not
  // a bar.
  if (
    patient.age !== null &&
    patient.age >= 60 &&
    (medicalHistory.renalImpairment === "unknown" || medicalHistory.renalImpairment === "none")
  ) {
    alerts.push({
      severity: "stop",
      code: "RENAL_UNKNOWN_OLDER",
      message: "Renal function not known, patient aged 60 to 64",
      detail:
        "PGD v005 excludes supply where renal function is unknown in a patient aged 60 to 64. Refer for a renal function check first. Supply only where a recent result has been seen and is adequate.",
    });
  }

  // ─── SEXUALLY TRANSMITTED INFECTION (exclusion, refer for testing) ───

  if (symptoms.vaginalDischarge) {
    alerts.push({
      severity: "stop",
      code: "VAGINAL_DISCHARGE",
      message: "Vaginal discharge present",
      detail:
        "Excluded. Chlamydia, gonorrhoea and trichomonas are alternative diagnoses. Refer for testing rather than treating empirically for UTI.",
    });
  }

  if (symptoms.pelvicPain) {
    alerts.push({
      severity: "stop",
      code: "PELVIC_PAIN",
      message: "Pelvic pain present",
      detail: "Excluded. Raises a sexually transmitted infection as an alternative diagnosis. Refer for testing.",
    });
  }

  if (symptoms.abnormalBleeding) {
    alerts.push({
      severity: "stop",
      code: "ABNORMAL_BLEEDING",
      message: "Intermenstrual or post-coital bleeding",
      detail: "Excluded. Raises a sexually transmitted infection as an alternative diagnosis. Refer for testing.",
    });
  }

  if (symptoms.stiHistory) {
    alerts.push({
      severity: "stop",
      code: "STI_HISTORY",
      message: "History suggesting a sexually transmitted infection (for example a new or recent sexual partner)",
      detail: "Excluded. Refer for chlamydia, gonorrhoea and trichomonas testing.",
    });
  }

  if (symptoms.suprapubicPain) {
    alerts.push({
      severity: "red-flag",
      code: "LOIN_FLANK_PAIN_RISK",
      message: "Suprapubic/lower abdominal pain present",
      detail: "While consistent with UTI, severe pain may suggest pyelonephritis. Assess severity and ask specifically about loin or flank pain.",
    });
  }

  // ─── ARM-SPECIFIC EXCLUSIONS ───

  const nitroCI = isNitrofurantoinContraindicated(medicalHistory);
  const trimCI = isTrimethoprimContraindicated(medicalHistory);

  if (nitroCI && trimCI) {
    alerts.push({
      severity: "stop",
      code: "BOTH_ARMS_EXCLUDED",
      message: "Nitrofurantoin and trimethoprim are both excluded for this patient",
      detail: "Neither arm of this PGD can be used. Refer to GP.",
    });
  } else if (nitroCI) {
    if (medicineSelection.medicine === "nitrofurantoin") {
      alerts.push({
        severity: "stop",
        code: "NITROFURANTOIN_EXCLUDED",
        message: "Nitrofurantoin is excluded for this patient",
        detail:
          "Hypersensitivity, G6PD deficiency, a previous pulmonary, neuropathic or hepatic reaction to nitrofurantoin, or acute porphyria excludes the nitrofurantoin arm. Select trimethoprim and record the reason as contraindicated.",
      });
    } else {
      alerts.push({
        severity: "caution",
        code: "NITROFURANTOIN_CONTRAINDICATED",
        message: "Nitrofurantoin is contraindicated for this patient",
        detail: "Trimethoprim arm only. Record the reason nitrofurantoin is unsuitable.",
      });
    }
  } else if (trimCI && medicineSelection.medicine === "trimethoprim") {
    alerts.push({
      severity: "stop",
      code: "TRIMETHOPRIM_EXCLUDED",
      message: "Trimethoprim is excluded for this patient",
      detail:
        "Hypersensitivity, trimethoprim in the last 3 months, folate deficiency or blood dyscrasia, methotrexate, a potassium-sparing agent (including ACE inhibitors and ARBs), phenytoin, azathioprine, ciclosporin, digoxin, repaglinide, dofetilide, warfarin without anticoagulation service advice, or hepatic impairment excludes the trimethoprim arm.",
    });
  }

  if (medicalHistory.takingWarfarin && medicalHistory.anticoagulationServiceConsulted) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN_INR",
      message: "Warfarin or other coumarin anticoagulant",
      detail: "Trimethoprim raises the INR. Anticoagulation service consulted; record the advice given.",
    });
  }

  if (medicineSelection.medicine === "trimethoprim" && !nitroCI && medicineSelection.trimethoprimReason === "") {
    alerts.push({
      severity: "caution",
      code: "TRIMETHOPRIM_GATE",
      message: "Trimethoprim selected: record why nitrofurantoin is unsuitable",
      detail:
        "Supply trimethoprim only where nitrofurantoin is contraindicated, not tolerated, or unavailable the same day. Patient preference is not a reason.",
    });
  }

  return alerts;
}

export function hasExclusionCriteria(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function getDoseRecommendation(
  medicalHistory: UTIMedicalHistory,
  allergies: string
): DoseRecommendation {
  // Default: Nitrofurantoin, first line
  const nitroUnsuitable =
    isNitrofurantoinContraindicated(medicalHistory) ||
    allergies.toLowerCase().includes("nitrofurantoin");
  if (!nitroUnsuitable) {
    return {
      medicine: "Nitrofurantoin 100mg modified release capsules",
      dose: "100mg",
      frequency: "Twice daily",
      duration: "3 days",
      dosingRegimen:
        "Nitrofurantoin 100mg modified release capsules, one twice daily for 3 days with food or milk (6 capsules)",
      reason: "First line under this PGD for uncomplicated UTI in non-pregnant women aged 16 to 64",
    };
  }

  // Trimethoprim is SECOND LINE and is gated: it may be used
  // only where nitrofurantoin is contraindicated, not tolerated, or
  // unavailable, and the reason must be recorded. It is not the fallback for
  // renal impairment or breastfeeding, both of which exclude the patient
  // from this PGD altogether.
  return {
    medicine: "Trimethoprim 200mg tablets",
    dose: "200mg",
    frequency: "Twice daily",
    duration: "3 days",
    dosingRegimen: "Trimethoprim 200mg tablets, one twice daily for 3 days, about 12 hours apart (6 tablets)",
    reason:
      "Second line. Use only where nitrofurantoin is contraindicated, not tolerated, or unavailable. Record which applies. Patient preference is not a reason.",
  };
}

export function getMedicineQuantity(medicine: string, duration: string): number {
  // PGD v005: one 3 day course, 6 capsules or 6 tablets. No repeat supply.
  void medicine;
  void duration;
  return 6;
}

export function validateMedicineSelection(
  medicine: string,
  dose: string,
  medicalHistory: UTIMedicalHistory
): string | null {
  if (!medicine) {
    return "Please select a medicine";
  }

  if (
    medicalHistory.renalImpairment === "moderate" ||
    medicalHistory.renalImpairment === "severe" ||
    medicalHistory.kidneyDisease
  ) {
    return "PGD v005 excludes both arms where there is known kidney disease or measured renal impairment. Refer; do not substitute trimethoprim.";
  }

  if (!dose) {
    return "Please select a dose";
  }

  return null;
}

export function getCounsellingRequired(medicalHistory: UTIMedicalHistory): {
  label: string;
  required: boolean;
}[] {
  return [
    { label: "Complete the full course (6 doses over 3 days)", required: true },
    { label: "Drink plenty of fluids", required: true },
    {
      label: "If you are no better in 48 hours, or you get worse at any point, contact your GP or NHS 111 the same day. Do not wait.",
      required: true,
    },
    {
      label:
        "Seek help IMMEDIATELY for: a temperature, shivering or shaking; pain in the back or side below the ribs; feeling or being sick; visible blood in the urine; confusion, drowsiness or feeling very unwell",
      required: true,
    },
    {
      label: "Cranberry products are not evidence-based for treatment",
      required: false,
    },
    {
      label: "Paracetamol or ibuprofen can be used for the pain if they suit you",
      required: false,
    },
    {
      label: "Avoid sexual activity until symptoms resolve",
      required: false,
    },
    medicalHistory.pregnancyPossible
      ? {
          label: "Discuss contraception options, confirm not at risk of pregnancy",
          required: true,
        }
      : { label: "", required: false },
  ].filter((item) => item.label !== "");
}
