import type {
  ECConsultationState,
  ClinicalAlert,
  DoseRecommendation,
} from "./ec-types";

// Emergency Contraception PGD v004 (11 September 2026). Two arms:
// levonorgestrel 1.5 mg (Levonelle) within 72 hours of UPSI, and ulipristal
// acetate 30 mg (ellaOne) within 120 hours.

// ══════════════════════════════════════════════════════════════
// HOURS SINCE UPSI CALCULATOR
// ══════════════════════════════════════════════════════════════

export function calculateHoursSinceUPSI(
  upsiDate: string,
  upsiTime: string
): number | null {
  if (!upsiDate || !upsiTime) return null;

  const [year, month, day] = upsiDate.split("-").map(Number);
  const [hours, minutes] = upsiTime.split(":").map(Number);

  const upsiDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  const diffMs = now.getTime() - upsiDateTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 10) / 10; // round to 1 decimal place
}

// ══════════════════════════════════════════════════════════════
// WEIGHT / BMI (FSRH: ulipristal preferred at 70 kg or over, or BMI 26 or over)
// ══════════════════════════════════════════════════════════════

export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg === null || heightCm === null || weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function isHighWeightOrBmi(state: ECConsultationState): boolean {
  const { weightKg, heightCm } = state.medicalHistory;
  const bmi = calculateBmi(weightKg, heightCm);
  return (weightKg !== null && weightKg >= 70) || (bmi !== null && bmi >= 26);
}

/** Days from the last menstrual period to today, or null if not recorded. */
export function daysSinceLmp(lmp: string): number | null {
  if (!lmp) return null;
  const d = new Date(lmp);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * The document excludes known or suspected pregnancy. Pregnancy is suspected
 * when the patient reports pregnancy-like symptoms or the last period was
 * more than 5 weeks ago, and only a negative test lifts the suspicion; a
 * test that was "not done" does not. Returns the reason, or null.
 */
export function getSuspectedPregnancyReason(state: ECConsultationState): string | null {
  const { medicalHistory, clinicalAssessment } = state;
  if (medicalHistory.pregnancyTestResult === "positive") return "positive pregnancy test";
  if (medicalHistory.currentlyPregnant) return "known or suspected pregnancy recorded";
  if (medicalHistory.pregnancyTestResult === "negative") return null;
  // A blank test result is "not yet answered", not "not done": the validator
  // asks for it, and the suspicion is only raised once the pharmacist has
  // recorded that no test was done (stop audit, 11 September 2026).
  if (medicalHistory.pregnancyTestResult !== "not-done") return null;
  if (clinicalAssessment.currentPregnancySymptoms) return "pregnancy-like symptoms reported and no negative pregnancy test";
  const days = daysSinceLmp(clinicalAssessment.lastMenstrualPeriod);
  if (days !== null && days > 35) return `last menstrual period ${days} days ago (more than 5 weeks) and no negative pregnancy test`;
  return null;
}

export function isKnownOrSuspectedPregnancy(state: ECConsultationState): boolean {
  return getSuspectedPregnancyReason(state) !== null;
}

/** Levonorgestrel dose fixed by the document: 3 mg with enzyme inducers
 *  (licensed) or at 70 kg or over / BMI 26 or over (off-label, FSRH);
 *  otherwise 1.5 mg. There is no lower option for these patients. */
export function getRequiredLngDose(state: ECConsultationState): { dose: "1.5mg" | "3mg"; reason: "" | "enzyme-inducers" | "weight-bmi" } {
  if (state.medications.takesEnzymeInducers) return { dose: "3mg", reason: "enzyme-inducers" };
  if (isHighWeightOrBmi(state)) return { dose: "3mg", reason: "weight-bmi" };
  return { dose: "1.5mg", reason: "" };
}

// ══════════════════════════════════════════════════════════════
// MEDICINE AVAILABILITY (per-arm exclusions and indication windows)
// ══════════════════════════════════════════════════════════════

export function getMedicineAvailability(state: ECConsultationState): {
  canUseLNG: boolean;
  canUseUPA: boolean;
  lngReasons: string[];
  upaReasons: string[];
} {
  const { medicalHistory, medications, clinicalAssessment } = state;
  const hours = clinicalAssessment.hoursSinceUPSI;
  const lngReasons: string[] = [];
  const upaReasons: string[] = [];

  // Exclusions common to both arms
  if (isKnownOrSuspectedPregnancy(state)) {
    lngReasons.push("known or suspected pregnancy");
    upaReasons.push("known or suspected pregnancy");
  }
  if (medicalHistory.severeHepatic) {
    lngReasons.push("severe hepatic impairment");
    upaReasons.push("severe hepatic impairment");
  }
  if (medicalHistory.galactoseIntolerance) {
    lngReasons.push("hereditary galactose intolerance");
    upaReasons.push("hereditary galactose intolerance");
  }
  if (hours === null) {
    lngReasons.push("time since UPSI not recorded");
    upaReasons.push("time since UPSI not recorded");
  }

  // Levonorgestrel: within 72 hours of UPSI
  if (hours !== null && hours > 72) lngReasons.push("more than 72 hours since UPSI");
  if (medicalHistory.lngHypersensitivity) lngReasons.push("hypersensitivity to levonorgestrel or any component");
  if (medicalHistory.porphyria) lngReasons.push("acute intermittent porphyria");
  if (medications.takesUPA) lngReasons.push("ulipristal already taken this cycle");

  // Ulipristal: within 120 hours of UPSI
  if (hours !== null && hours > 120) upaReasons.push("more than 120 hours since UPSI");
  if (medicalHistory.upaHypersensitivity) upaReasons.push("hypersensitivity to ulipristal acetate or any component");
  if (medicalHistory.severeAsthma) upaReasons.push("severe asthma insufficiently controlled by oral glucocorticoids");
  if (medications.takesEnzymeInducers) upaReasons.push("enzyme-inducing drugs in the last 4 weeks (ulipristal not recommended, SmPC)");

  return {
    canUseLNG: lngReasons.length === 0,
    canUseUPA: upaReasons.length === 0,
    lngReasons,
    upaReasons,
  };
}

// ══════════════════════════════════════════════════════════════
// EXCLUSION CHECKS: hard stops, cannot supply either medicine
// ══════════════════════════════════════════════════════════════

export function checkExclusions(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medicalHistory } = state;
  const hours = state.clinicalAssessment.hoursSinceUPSI;

  const pregnancyReason = getSuspectedPregnancyReason(state);
  if (pregnancyReason) {
    alerts.push({
      severity: "stop",
      code: "CURRENTLY_PREGNANT",
      message: `Known or suspected pregnancy (${pregnancyReason}): CANNOT supply`,
      detail:
        "Known or suspected pregnancy is an exclusion for both levonorgestrel and ulipristal. A negative pregnancy test lifts a suspicion based on symptoms or a late period; a test that was not done does not. Refer to the GP or sexual health clinic.",
    });
  }

  if (medicalHistory.severeHepatic) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment (e.g. cirrhosis): CANNOT supply",
      detail:
        "Severe hepatic impairment is an exclusion for both levonorgestrel and ulipristal. Refer to GP.",
    });
  }

  if (medicalHistory.galactoseIntolerance) {
    alerts.push({
      severity: "stop",
      code: "GALACTOSE",
      message: "Hereditary galactose intolerance: CANNOT supply",
      detail: "Exclusion for both levonorgestrel and ulipristal (lactose-containing tablets). Refer.",
    });
  }

  if (hours !== null && hours > 120) {
    alerts.push({
      severity: "stop",
      code: "TOO_LATE",
      message: `${Math.round(hours)} hours since UPSI: CANNOT supply emergency contraception`,
      detail:
        "Levonorgestrel is indicated within 72 hours and ulipristal within 120 hours of UPSI. Refer to the GP or sexual health clinic to discuss the copper intrauterine device (Cu-IUD), which can be fitted up to 5 days after UPSI or up to 5 days after ovulation.",
    });
  } else if (hours !== null) {
    const availability = getMedicineAvailability(state);
    if (!availability.canUseLNG && !availability.canUseUPA && alerts.length === 0) {
      alerts.push({
        severity: "stop",
        code: "NO_ORAL_OPTION",
        message: "No oral emergency contraception available under this PGD",
        detail: `Levonorgestrel: ${availability.lngReasons.join(", ")}. Ulipristal: ${availability.upaReasons.join(", ")}. Refer for a copper IUD or specialist advice.`,
      });
    }
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// CONTRAINDICATIONS AND CAUTIONS
// ══════════════════════════════════════════════════════════════

export function checkContraindications(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medicalHistory, medications, clinicalAssessment } = state;
  const hours = clinicalAssessment.hoursSinceUPSI;

  if (hours !== null && hours > 72 && hours <= 120) {
    alerts.push({
      severity: "caution",
      code: "BEYOND_72HRS",
      message: `${Math.round(hours)} hours since UPSI: levonorgestrel is outside its 72 hour indication`,
      detail:
        "Only ulipristal (within 120 hours) can be supplied under this PGD. If ulipristal is excluded, refer for a copper IUD.",
    });
  }

  if (medicalHistory.severeAsthma) {
    alerts.push({
      severity: "caution",
      code: "SEVERE_ASTHMA",
      message: "Severe asthma insufficiently controlled by oral glucocorticoids: ulipristal excluded",
      detail: "Levonorgestrel may be supplied within 72 hours if no levonorgestrel exclusion applies.",
    });
  }

  if (medicalHistory.lngHypersensitivity) {
    alerts.push({
      severity: "caution",
      code: "LNG_ALLERGY",
      message: "Hypersensitivity to levonorgestrel or any component: levonorgestrel excluded",
      detail: "Ulipristal may be supplied if no ulipristal exclusion applies.",
    });
  }

  if (medicalHistory.upaHypersensitivity) {
    alerts.push({
      severity: "caution",
      code: "UPA_ALLERGY",
      message: "Hypersensitivity to ulipristal acetate or any component: ulipristal excluded",
      detail: "Levonorgestrel may be supplied within 72 hours if no levonorgestrel exclusion applies.",
    });
  }

  if (medications.takesEnzymeInducers) {
    alerts.push({
      severity: "caution",
      code: "ENZYME_INDUCERS",
      message: "Enzyme-inducing drugs in the last 4 weeks",
      detail:
        "Anticonvulsants, rifampicin, antiretrovirals, St John's Wort: offer a copper IUD; if declined give levonorgestrel 3 mg (two tablets, licensed). Do NOT switch to ulipristal, which is not recommended in these women (SmPC). Record the reason for the 3 mg dose.",
    });
  }

  if (isHighWeightOrBmi(state)) {
    alerts.push({
      severity: "caution",
      code: "WEIGHT_BMI",
      message: "Weight 70 kg or over, or BMI 26 or over",
      detail:
        "Ulipristal is preferred (FSRH) unless unsuitable; where levonorgestrel is used give 3 mg (double dose), which is off-label per FSRH guidance. Explain this to the patient and record it.",
    });
  }

  if (medications.progestogenLast7Days) {
    alerts.push({
      severity: "caution",
      code: "PROGESTOGEN_7_DAYS",
      message: "Progestogen-containing contraceptive taken in the previous 7 days",
      detail:
        "May reduce ulipristal efficacy; consider levonorgestrel instead. Hormonal contraception must not be restarted until 5 days after ulipristal, with condoms until it is reliable again.",
    });
  }

  if (medications.takesUPA) {
    alerts.push({
      severity: "caution",
      code: "PREVIOUS_UPA",
      message: "Patient has already taken ulipristal this cycle",
      detail:
        "Repeated use in the same cycle is not recommended. Levonorgestrel should not be given after ulipristal in the same cycle. Refer to sexual health clinic for advice.",
    });
  }

  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Breastfeeding",
      detail:
        "Levonorgestrel: avoid breastfeeding for 8 hours after the dose. Ulipristal: avoid breastfeeding for 7 days after the dose.",
    });
  }

  if (medicalHistory.previousEctopic) {
    alerts.push({
      severity: "caution",
      code: "PREVIOUS_ECTOPIC",
      message: "History of ectopic pregnancy",
      detail:
        "Caution. Emergency contraception efficacy is not reduced, but advise the patient to contact the GP urgently if experiencing severe abdominal pain.",
    });
  }

  if (medicalHistory.porphyria) {
    alerts.push({
      severity: "caution",
      code: "PORPHYRIA",
      message: "Acute intermittent porphyria: levonorgestrel excluded",
      detail: "Ulipristal may be supplied if no ulipristal exclusion applies.",
    });
  }

  if (medicalHistory.crohnsDisease) {
    alerts.push({
      severity: "caution",
      code: "CROHNS",
      message: "Malabsorption condition affecting drug absorption (e.g. Crohn's disease)",
      detail:
        "May reduce efficacy of oral emergency contraception. Consider alternative methods such as Cu-IUD, or refer for specialist advice.",
    });
  }

  if (clinicalAssessment.cycleRegular && clinicalAssessment.lastMenstrualPeriod) {
    const lmp = new Date(clinicalAssessment.lastMenstrualPeriod);
    const upsi = clinicalAssessment.upsiDate ? new Date(clinicalAssessment.upsiDate) : null;
    if (upsi && !isNaN(lmp.getTime()) && !isNaN(upsi.getTime())) {
      const day = Math.floor((upsi.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (day >= 10 && day <= 17) {
        alerts.push({
          severity: "caution",
          code: "MID_CYCLE",
          message: "UPSI around mid-cycle: pregnancy risk is higher",
          detail: "Caution in the PGD. Consider the copper IUD as the most effective option and discuss with the patient.",
        });
      }
    }
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// SAFEGUARDING (PGD inclusion criteria)
// ══════════════════════════════════════════════════════════════

export function checkRedFlags(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { clinicalAssessment, patient } = state;

  if (clinicalAssessment.additionalUPSIInstances) {
    alerts.push({
      severity: "red-flag",
      code: "MULTIPLE_UPSI",
      message: "Multiple UPSI episodes noted this cycle",
      detail:
        "Consider whether patient is at risk of further exposure and discuss longer-term contraception and relationship safety.",
    });
  }

  if (clinicalAssessment.previousEC) {
    alerts.push({
      severity: "red-flag",
      code: "REPEAT_EC",
      message: "Repeated emergency contraception request",
      detail: "Repeated use in the same cycle is not recommended. Signpost to ongoing contraception.",
    });
  }

  if (patient.age !== null && patient.age < 13) {
    // Get Real Health service decision (11 September 2026): no supply under
    // 13 through this tool, even though the document says supply may still
    // be appropriate. Validator, alert and screen text all say the same.
    alerts.push({
      severity: "stop",
      code: "UNDER_13",
      message: "Aged under 13: not supplied under this ePGD",
      detail:
        "Any sexual activity under 13 is a safeguarding concern. Refer the same day to the GP or sexual health service, make a safeguarding referral (mandatory), record both, and save this consultation as not supplied.",
    });
  }

  if (patient.age !== null && patient.age >= 13 && patient.age <= 15) {
    alerts.push({
      severity: "red-flag",
      code: "YOUNG_AGE",
      message: "Aged 13 to 15: Fraser competence and safeguarding assessment required",
      detail:
        "Assess and record Fraser competence, ask about coercion, the age of the partner and any safeguarding concern, and follow the local safeguarding pathway. Record the assessment.",
    });
  }

  if (patient.age !== null && patient.age >= 13 && patient.age <= 15 && patient.fraserOutcome === "not-competent") {
    alerts.push({
      severity: "stop",
      code: "FRASER_NOT_COMPETENT",
      message: "Aged 13 to 15 and not Fraser competent: do not supply",
      detail:
        "Supply under this PGD requires Fraser competence. Refer to the GP or sexual health service, follow the local safeguarding pathway, and record the advice given.",
    });
  }

  if (patient.coercionReported === "yes") {
    alerts.push({
      severity: "red-flag",
      code: "COERCION_REPORTED",
      message: "Coercion reported",
      detail: "Follow the local safeguarding pathway and record the action taken.",
    });
  }

  if (patient.safeguardingConcern) {
    alerts.push({
      severity: "red-flag",
      code: "SAFEGUARDING_CONCERN",
      message: "Safeguarding concern identified",
      detail: "Follow the local safeguarding pathway and record the action taken.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// DOSE RECOMMENDATION ENGINE
// ══════════════════════════════════════════════════════════════

export function calculateDoseRecommendation(
  state: ECConsultationState
): DoseRecommendation | null {
  const { clinicalAssessment, medicalHistory, medications } = state;
  const hours = clinicalAssessment.hoursSinceUPSI;

  if (hours === null) {
    return null;
  }

  const availability = getMedicineAvailability(state);

  if (hours > 120) {
    return {
      medicine: "none",
      dose: "",
      reason: "Beyond the 120 hour window. Refer for Cu-IUD assessment.",
    };
  }

  if (isKnownOrSuspectedPregnancy(state)) {
    return { medicine: "none", dose: "", reason: "Known or suspected pregnancy." };
  }

  if (medicalHistory.severeHepatic) {
    return { medicine: "none", dose: "", reason: "Severe hepatic impairment: refer to GP." };
  }

  if (medicalHistory.galactoseIntolerance) {
    return { medicine: "none", dose: "", reason: "Hereditary galactose intolerance: refer." };
  }

  if (!availability.canUseLNG && !availability.canUseUPA) {
    return {
      medicine: "none",
      dose: "",
      reason: `No oral option under this PGD (levonorgestrel: ${availability.lngReasons.join(", ")}; ulipristal: ${availability.upaReasons.join(", ")}). Refer for Cu-IUD or specialist advice.`,
    };
  }

  const highWeight = isHighWeightOrBmi(state);

  // Enzyme inducers: copper IUD first; if declined, levonorgestrel 3 mg (licensed). Never ulipristal.
  if (medications.takesEnzymeInducers) {
    if (availability.canUseLNG) {
      return {
        medicine: "levonorgestrel",
        dose: "3mg",
        reason:
          "Enzyme-inducing drugs in the last 4 weeks: offer a copper IUD; if declined give levonorgestrel 3 mg (two tablets, licensed). Do not use ulipristal.",
      };
    }
    return {
      medicine: "none",
      dose: "",
      reason: `Enzyme inducers exclude ulipristal and levonorgestrel is unavailable (${availability.lngReasons.join(", ")}). Refer for a copper IUD.`,
    };
  }

  // Weight 70 kg or over, or BMI 26 or over: ulipristal preferred; otherwise LNG 3 mg off-label
  if (highWeight) {
    if (availability.canUseUPA) {
      return {
        medicine: "ulipristal",
        dose: "30mg",
        reason:
          "Weight 70 kg or over, or BMI 26 or over: ulipristal 30 mg is preferred (FSRH) unless unsuitable.",
      };
    }
    if (availability.canUseLNG) {
      return {
        medicine: "levonorgestrel",
        dose: "3mg",
        reason:
          "Weight 70 kg or over, or BMI 26 or over, and ulipristal unsuitable: levonorgestrel 3 mg (double dose), off-label per FSRH guidance. Explain this and record it.",
      };
    }
  }

  // Within 72 hours: levonorgestrel 1.5 mg first line; ulipristal if LNG unavailable
  if (hours <= 72) {
    if (availability.canUseLNG) {
      return {
        medicine: "levonorgestrel",
        dose: "1.5mg",
        reason: "Within 72 hours of UPSI: levonorgestrel 1.5 mg single dose, as soon as possible (ideally within 12 hours).",
      };
    }
    if (availability.canUseUPA) {
      return {
        medicine: "ulipristal",
        dose: "30mg",
        reason: `Levonorgestrel unavailable (${availability.lngReasons.join(", ")}): ulipristal 30 mg single dose.`,
      };
    }
  }

  // 72 to 120 hours: ulipristal only
  if (availability.canUseUPA) {
    return {
      medicine: "ulipristal",
      dose: "30mg",
      reason: "72 to 120 hours since UPSI: ulipristal (ellaOne) 30 mg is the only oral option under this PGD.",
    };
  }

  return {
    medicine: "none",
    dose: "",
    reason: `72 to 120 hours since UPSI and ulipristal excluded (${availability.upaReasons.join(", ")}). Refer for a copper IUD.`,
  };
}

// ══════════════════════════════════════════════════════════════
// CONSOLIDATED ALERT FUNCTION
// ══════════════════════════════════════════════════════════════

export function getAllAlerts(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  alerts.push(...checkExclusions(state));
  alerts.push(...checkContraindications(state));
  alerts.push(...checkRedFlags(state));

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// HARD STOP CHECK
// ══════════════════════════════════════════════════════════════

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((alert) => alert.severity === "stop");
}
