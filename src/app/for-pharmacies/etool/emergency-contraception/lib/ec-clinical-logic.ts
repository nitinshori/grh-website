import type {
  ECConsultationState,
  ClinicalAlert,
  DoseRecommendation,
} from "./ec-types";

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
// EXCLUSION CHECKS — Hard stops: cannot supply
// ══════════════════════════════════════════════════════════════

export function checkExclusions(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medicalHistory, clinicalAssessment, medications } = state;
  const hours = state.clinicalAssessment.hoursSinceUPSI;

  // Currently pregnant (positive test)
  if (medicalHistory.pregnancyTestResult === "positive") {
    alerts.push({
      severity: "stop",
      code: "CURRENTLY_PREGNANT",
      message: "Patient is currently pregnant — CANNOT supply",
      detail:
        "Emergency contraception is not appropriate for patients who are already pregnant. The patient should be referred to their GP or sexual health clinic for further support.",
    });
  }

  // Severe hepatic impairment
  if (medicalHistory.severeHepatic) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment — CANNOT supply",
      detail:
        "Severe hepatic impairment is a contraindication for both levonorgestrel and ulipristal. Refer to GP.",
    });
  }

  // >120 hours since UPSI — cannot supply either option
  if (hours !== null && hours > 120) {
    alerts.push({
      severity: "stop",
      code: "TOO_LATE",
      message: `${Math.round(hours)} hours since UPSI — CANNOT supply emergency contraception`,
      detail:
        "Emergency hormonal contraception is only effective within 120 hours (5 days) of unprotected sexual intercourse. The patient should be referred to their GP or sexual health clinic to discuss the copper intrauterine device (Cu-IUD), which can be fitted up to 5 days after UPSI or up to 5 days after ovulation.",
    });
  }

  // >72 hours and considering levonorgestrel only
  if (hours !== null && hours > 72) {
    alerts.push({
      severity: "caution",
      code: "BEYOND_72HRS",
      message: `${Math.round(hours)} hours since UPSI — Levonorgestrel effectiveness reduced`,
      detail:
        "Levonorgestrel is less effective after 72 hours. Ulipristal (if available and not contraindicated) remains effective up to 120 hours and is preferred.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// CONTRAINDICATIONS & CAUTIONS
// ══════════════════════════════════════════════════════════════

export function checkContraindications(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medicalHistory, medications, clinicalAssessment } = state;

  // ULIPRISTAL-SPECIFIC CONTRAINDICATIONS

  // Severe asthma — ulipristal contraindicated
  if (medicalHistory.severeAsthma) {
    alerts.push({
      severity: "caution",
      code: "SEVERE_ASTHMA",
      message: "Severe asthma — ulipristal is contraindicated",
      detail:
        "Ulipristal acetate is contraindicated in severe asthma. Levonorgestrel is the preferred option. Refer to clinical guidance if unsure about asthma severity.",
    });
  }

  // ENZYME INDUCERS — affects both options
  if (medications.takesEnzymeInducers) {
    alerts.push({
      severity: "caution",
      code: "ENZYME_INDUCERS",
      message: `Patient takes enzyme inducers — dose adjustment required`,
      detail:
        "Patient is taking enzyme-inducing drugs (e.g. carbamazepine, phenytoin, phenobarbital, rifampicin, St John's Wort). Levonorgestrel efficacy is reduced and double dosing (3mg) should be considered. Ulipristal is less affected but may also have reduced efficacy. Consider alternative methods or refer for specialist advice.",
    });
  }

  // Already taken ulipristal this cycle — cannot use levonorgestrel
  if (medications.takesUPA) {
    alerts.push({
      severity: "caution",
      code: "PREVIOUS_UPA",
      message: "Patient has already taken ulipristal this cycle",
      detail:
        "If ulipristal has already been used, levonorgestrel should not be given as they are incompatible. Further emergency contraception use in the same cycle is not recommended. Refer to sexual health clinic for advice.",
    });
  }

  // BREASTFEEDING
  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding — special precautions required",
      detail:
        "Both medicines are safe while breastfeeding but with precautions: Levonorgestrel — express and discard for 8 hours post-dose. Ulipristal — express and discard for 7 days post-dose. Ulipristal is contraindicated if severe asthma present.",
    });
  }

  // PREVIOUS ECTOPIC
  if (medicalHistory.previousEctopic) {
    alerts.push({
      severity: "caution",
      code: "PREVIOUS_ECTOPIC",
      message: "History of ectopic pregnancy — caution advised",
      detail:
        "Patient has a history of ectopic pregnancy. Emergency contraception efficacy is not reduced, but vigilance for signs of ectopic pregnancy (unusual abdominal pain) is important. Patient should be advised to contact GP urgently if experiencing severe abdominal pain.",
    });
  }

  // PORPHYRIA
  if (medicalHistory.porphyria) {
    alerts.push({
      severity: "caution",
      code: "PORPHYRIA",
      message: "Patient has porphyria — caution advised",
      detail:
        "Hormonal contraceptives can precipitate porphyria attacks. Refer to specialist before proceeding with emergency contraception.",
    });
  }

  // CROHNS DISEASE
  if (medicalHistory.crohnsDisease) {
    alerts.push({
      severity: "caution",
      code: "CROHNS",
      message: "Patient has Crohn's disease — efficacy may be reduced",
      detail:
        "Inflammatory bowel disease may reduce efficacy of oral emergency contraception due to malabsorption. Consider alternative methods such as Cu-IUD, or refer for specialist advice.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// RED FLAGS FOR SAFEGUARDING
// ══════════════════════════════════════════════════════════════

export function checkRedFlags(state: ECConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { clinicalAssessment, patient } = state;

  // Multiple UPSI episodes
  if (clinicalAssessment.additionalUPSIInstances) {
    alerts.push({
      severity: "red-flag",
      code: "MULTIPLE_UPSI",
      message: "Multiple UPSI episodes noted this cycle",
      detail:
        "Consider whether patient is at risk of further exposure and discuss longer-term contraception and relationship safety.",
    });
  }

  // Age 13-15 safeguarding
  if (patient.age !== null && patient.age >= 13 && patient.age <= 15) {
    alerts.push({
      severity: "red-flag",
      code: "YOUNG_AGE",
      message: "Patient is under 16 — Fraser competence assessment required",
      detail:
        "For patients aged 13-15, Fraser competence must be assessed. Consider whether there are safeguarding concerns and report to local safeguarding team if abuse or coercion suspected.",
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

  // Cannot recommend if time not calculated
  if (hours === null) {
    return null;
  }

  // Cannot supply if >120 hours
  if (hours > 120) {
    return {
      medicine: "none",
      dose: "",
      reason: "Beyond 120-hour window. Refer for Cu-IUD assessment.",
    };
  }

  // Cannot supply if pregnant
  if (medicalHistory.pregnancyTestResult === "positive") {
    return {
      medicine: "none",
      dose: "",
      reason: "Patient currently pregnant.",
    };
  }

  // Cannot supply if severe hepatic impairment
  if (medicalHistory.severeHepatic) {
    return {
      medicine: "none",
      dose: "",
      reason: "Severe hepatic impairment — refer to GP.",
    };
  }

  // ─── WITHIN 72 HOURS: Both options available ───
  if (hours <= 72) {
    // Levonorgestrel is standard first-line within 72 hours

    // BUT: severe asthma → use LNG not UPA
    if (medicalHistory.severeAsthma) {
      const doubleRequired = medications.takesEnzymeInducers;
      return {
        medicine: "levonorgestrel",
        dose: doubleRequired ? "3mg" : "1.5mg",
        reason: doubleRequired
          ? "≤72 hours, severe asthma (UPA contraindicated), enzyme inducers present (double dose recommended)"
          : "≤72 hours; severe asthma contraindicates ulipristal; levonorgestrel first-line",
      };
    }

    // Check if enzyme inducers present
    if (medications.takesEnzymeInducers) {
      // Double dose LNG or consider UPA
      return {
        medicine: "levonorgestrel",
        dose: "3mg",
        reason: "≤72 hours with enzyme inducers; double-dose levonorgestrel (3mg) recommended for adequate efficacy. Ulipristal may be considered if available.",
      };
    }

    // Standard case: levonorgestrel 1.5mg
    return {
      medicine: "levonorgestrel",
      dose: "1.5mg",
      reason: "≤72 hours since UPSI; levonorgestrel 1.5mg is first-line emergency contraception.",
    };
  }

  // ─── 72-120 HOURS: Ulipristal preferred ───
  if (hours > 72 && hours <= 120) {
    // Check if severe asthma → cannot use ulipristal
    if (medicalHistory.severeAsthma) {
      return {
        medicine: "levonorgestrel",
        dose: "1.5mg",
        reason: "Beyond 72 hours (reduced LNG efficacy), but severe asthma contraindicates ulipristal. Levonorgestrel single dose offered with discussion of limited efficacy. Cu-IUD referral advised.",
      };
    }

    // Ulipristal is preferred at 72-120 hours
    return {
      medicine: "ulipristal",
      dose: "30mg",
      reason: "72-120 hours since UPSI; ulipristal (EllaOne) 30mg is more effective than levonorgestrel in this window.",
    };
  }

  return null;
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

// ══════════════════════════════════════════════════════════════
// MEDICINE AVAILABILITY CHECK
// ══════════════════════════════════════════════════════════════

export function getMedicineAvailability(state: ECConsultationState): {
  canUseLNG: boolean;
  canUseUPA: boolean;
} {
  const { medicalHistory, medications, clinicalAssessment } = state;
  const hours = clinicalAssessment.hoursSinceUPSI;

  let canUseLNG = true;
  let canUseUPA = true;

  // General exclusions
  if (
    medicalHistory.severeHepatic ||
    medicalHistory.pregnancyTestResult === "positive" ||
    hours === null ||
    hours > 120
  ) {
    canUseLNG = false;
    canUseUPA = false;
  }

  // Levonorgestrel: safe even >72 hours (less effective but no hard stop)
  if (hours !== null && hours > 120) {
    canUseLNG = false;
  }

  // Ulipristal: only up to 120 hours
  if (hours !== null && hours > 120) {
    canUseUPA = false;
  }

  // Ulipristal: contraindicated with severe asthma
  if (medicalHistory.severeAsthma) {
    canUseUPA = false;
  }

  // Already taken ulipristal: cannot use levonorgestrel with it
  if (medications.takesUPA && canUseLNG) {
    canUseLNG = false; // Don't give both together
  }

  return { canUseLNG, canUseUPA };
}
