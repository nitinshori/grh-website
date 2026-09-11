// ─── Postnatal Contraception Clinical Logic ───
// Postnatal Contraception PGD v005 (11 September 2026): desogestrel 75
// microgram tablets and Depo-Provera 150 mg/mL injection.

import type { PostnatalContraceptionState } from "./postnatal-contraception-types";
import type { ClinicalAlert } from "../../shared/types";

export function isBreastfeeding(state: PostnatalContraceptionState): boolean {
  return (
    state.assessment.breastfeedingStatus === "exclusively-breastfeeding" ||
    state.assessment.breastfeedingStatus === "mixed-feeding"
  );
}

export function getAdditionalVteRiskFactors(state: PostnatalContraceptionState): string[] {
  const a = state.assessment;
  const factors: string[] = [];
  if (a.previousVte) factors.push("previous VTE");
  if (a.thrombophilia) factors.push("thrombophilia");
  if (a.immobility) factors.push("immobility");
  if (a.bmi30OrOver) factors.push("BMI 30 or over");
  if (a.deliveryType === "caesarean") factors.push("caesarean delivery");
  if (a.postpartumHaemorrhage) factors.push("postpartum haemorrhage");
  if (a.preEclampsia) factors.push("pre-eclampsia");
  if (a.smoking) factors.push("smoking");
  return factors;
}

/** Whole days between two YYYY-MM-DD dates (b minus a), or null. */
export function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Days postpartum today, derived from the delivery date. */
export function daysSinceDelivery(deliveryDate: string): number | null {
  return daysBetween(deliveryDate, new Date().toISOString().split("T")[0]);
}

// From day 21 pregnancy must be reasonably excluded: no unprotected
// intercourse since day 21, or a negative test 21 days after the last episode.
// The question is asked as yes/no with no default; "unanswered" is neither
// excluded nor a stop (validation refuses Next until it is answered).
export function isPregnancyReasonablyExcluded(state: PostnatalContraceptionState): boolean | "unanswered" {
  const a = state.assessment;
  if (a.daysPostpartum === null || a.daysPostpartum <= 21) return true;
  if (a.unprotectedSexSinceDay21 === null) return "unanswered";
  return !a.unprotectedSexSinceDay21 || a.negativeTest21DaysAfterLastUpsi;
}

/** Depo-Provera repeat: days since the last injection, or null for a first injection. */
export function daysSinceLastInjection(state: PostnatalContraceptionState): number | null {
  const m = state.medicineSupply;
  if (m.injectionType !== "repeat") return null;
  return daysBetween(m.lastInjectionDate, m.startDate);
}

// Depo-Provera timing rule: from 6 weeks if breastfeeding; from 21 days if
// not breastfeeding and no additional VTE risk factor; otherwise refer.
export function getDepoTimingError(state: PostnatalContraceptionState): string | null {
  const days = state.assessment.daysPostpartum;
  if (days === null) return "Days postpartum must be recorded";
  if (isBreastfeeding(state)) {
    if (days < 42) return "Depo-Provera: breastfeeding women can start from 6 weeks (42 days) postpartum. Refer or use desogestrel.";
    return null;
  }
  const factors = getAdditionalVteRiskFactors(state);
  if (days < 21) return "Depo-Provera: not breastfeeding, start from 21 days postpartum. Refer or use desogestrel.";
  if (days < 42 && factors.length > 0)
    return `Depo-Provera before 6 weeks requires no additional VTE risk factor (${factors.join(", ")}). Refer or use desogestrel.`;
  return null;
}

export function getAllAlerts(state: PostnatalContraceptionState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const h = state.medicalHistory;

  // Exclusions common to both arms
  if (h.knownOrSuspectedPregnancy || isPregnancyReasonablyExcluded(state) === false) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: h.knownOrSuspectedPregnancy
        ? "Known or suspected pregnancy"
        : "Pregnancy not reasonably excluded (unprotected intercourse since day 21 without a negative test 21 days after the last episode)",
      detail: "Exclusion for both arms. Exclude pregnancy before supply, or refer.",
    });
  }

  if (h.currentBreastCancer) {
    alerts.push({
      severity: "stop",
      code: "CURRENT_BREAST_CANCER",
      message: "Current or suspected breast cancer",
      detail: "Sex hormone-dependent malignancy. Excluded from both arms. Refer to specialist.",
    });
  }

  if (h.severeLiverDisease) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC_DISEASE",
      message: "Severe hepatic impairment or liver disease",
      detail: "Excluded from both arms.",
    });
  }

  if (h.liverTumours) {
    alerts.push({
      severity: "stop",
      code: "LIVER_TUMOURS",
      message: "Liver tumours",
      detail: "Desogestrel exclusion (severe hepatic impairment or liver tumours). Refer.",
    });
  }

  if (h.unexplainedVaginalBleeding) {
    alerts.push({
      severity: "stop",
      code: "UNEXPLAINED_BLEEDING",
      message: "Undiagnosed vaginal bleeding",
      detail: "Excluded from both arms; may indicate pathology requiring investigation.",
    });
  }

  if (h.activeThromboembolicDisorder) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_VTE",
      message: "Active thromboembolic disorder",
      detail: "Desogestrel exclusion. Seek urgent medical advice for DVT/PE symptoms.",
    });
  }

  // Porphyria is not an exclusion in either arm of the PGD: caution only.
  if (h.porphyria) {
    alerts.push({
      severity: "caution",
      code: "PORPHYRIA",
      message: "Porphyria",
      detail: "Not an exclusion in the PGD. Check the SmPC and BNF for the chosen product; seek specialist advice if in doubt.",
    });
  }

  // Breast cancer treated within the last 5 years is UKMEC 3 for
  // progestogen-only methods: outside the "UKMEC 1 or 2" inclusion. Refer.
  if (h.breastCancerWithin5Years) {
    alerts.push({
      severity: "stop",
      code: "BREAST_CANCER_UNDER_5_YEARS",
      message: "History of breast cancer within the last 5 years",
      detail: "UKMEC 3 for progestogen-only methods, so the inclusion criterion (UKMEC 1 or 2) is not met. Refer for specialist advice.",
    });
  }

  // Arm-specific exclusions (enforced when the medicine is chosen)
  if (h.desogestrelHypersensitivity) {
    alerts.push({
      severity: "caution",
      code: "DSG_ALLERGY",
      message: "Hypersensitivity to desogestrel or any excipients: desogestrel excluded",
      detail: "Depo-Provera may be considered if no Depo-Provera exclusion applies.",
    });
  }
  if (h.mpaHypersensitivity) {
    alerts.push({
      severity: "caution",
      code: "MPA_ALLERGY",
      message: "Hypersensitivity to medroxyprogesterone acetate or any excipients: Depo-Provera excluded",
      detail: "Desogestrel may be considered if no desogestrel exclusion applies.",
    });
  }
  if (h.severeCardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "SEVERE_CVD",
      message: "Severe cardiovascular disease: Depo-Provera excluded",
      detail: "Desogestrel may be considered if no desogestrel exclusion applies.",
    });
  }
  if (h.meningioma) {
    alerts.push({
      severity: "caution",
      code: "MENINGIOMA",
      message: "Meningioma, current or previous: Depo-Provera excluded",
      detail: "Depo-Provera SmPC contraindication. Desogestrel may be considered.",
    });
  }

  // Cautions
  if (h.pastBreastCancer) {
    alerts.push({
      severity: "caution",
      code: "PAST_BREAST_CANCER",
      message: "History of breast cancer (more than 5 years ago)",
      detail: "Caution in both arms. Specialist advice recommended if less than 5 years clear.",
    });
  }
  if (h.functionalOvarianCysts) {
    alerts.push({ severity: "caution", code: "OVARIAN_CYSTS", message: "Functional ovarian cysts", detail: "Desogestrel caution." });
  }
  if (h.diabetes) {
    alerts.push({ severity: "caution", code: "DIABETES", message: "Diabetes", detail: "Caution in both arms." });
  }
  if (h.hypertension) {
    alerts.push({ severity: "caution", code: "HYPERTENSION", message: "Hypertension", detail: "Desogestrel caution." });
  }
  if (h.migraine) {
    alerts.push({ severity: "caution", code: "MIGRAINE", message: "Migraine", detail: "Caution in both arms." });
  }
  if (h.depression) {
    alerts.push({ severity: "caution", code: "DEPRESSION", message: "Depression", detail: "Caution in both arms." });
  }
  if (h.sleWithAntiphospholipidAntibodies) {
    alerts.push({
      severity: "caution",
      code: "SLE_ANTIPHOSPHOLIPID",
      message: "SLE with antiphospholipid antibodies",
      detail: "Caution due to thrombotic risk. Specialist evaluation recommended.",
    });
  }

  const vte = getAdditionalVteRiskFactors(state);
  if (vte.length > 0) {
    alerts.push({
      severity: "caution",
      code: "VTE_RISK",
      message: `Additional VTE risk factor: ${vte.join(", ")}`,
      detail: "Depo-Provera before 6 weeks postpartum is only for women who are not breastfeeding with no additional VTE risk factor; otherwise refer. Desogestrel is not affected.",
    });
  }

  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "caution",
      code: "ADOLESCENT",
      message: "Aged 16 or 17",
      detail: "Depo-Provera arm is for women 18 and over (adolescent bone mineral density concern). Desogestrel arm only.",
    });
  }

  if (state.assessment.daysPostpartum !== null && state.assessment.daysPostpartum > 365) {
    alerts.push({
      severity: "red-flag",
      code: "NOT_POSTNATAL",
      message: "More than 1 year postpartum",
      detail: "This PGD is for postnatal women. Standard contraception PGD may be more appropriate.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

// Arm-specific gate applied when the medicine is chosen.
export function getMedicineSupplyError(state: PostnatalContraceptionState): string | null {
  const m = state.medicineSupply;
  const h = state.medicalHistory;
  const age = state.patient.age;
  if (!m.medicineChoice) return "Select the medicine to supply";

  if (m.medicineChoice === "desogestrel") {
    if (h.desogestrelHypersensitivity) return "Hypersensitivity to desogestrel or excipients: desogestrel cannot be supplied";
    if (m.quantity <= 0) return "Number of tablets to supply is required";
    if (m.quantity > 84) return "Maximum supply is 3 months (3 x 28 = 84 tablets)";
    if (!m.startDate) return "Start date is required";
  } else {
    if (age !== null && age < 18) return "Depo-Provera is for women aged 18 and over; use the desogestrel arm";
    if (h.mpaHypersensitivity) return "Hypersensitivity to medroxyprogesterone acetate: Depo-Provera cannot be given";
    if (h.severeCardiovascularDisease) return "Severe cardiovascular disease: Depo-Provera cannot be given";
    if (h.meningioma) return "Meningioma, current or previous: Depo-Provera cannot be given";
    const timing = getDepoTimingError(state);
    if (timing) return timing;
    if (!m.injectionType) return "Record whether this is the first Depo-Provera injection or a repeat";
    if (!m.startDate) return "Date of injection is required";
    if (m.injectionType === "repeat") {
      if (!m.lastInjectionDate) return "Repeat injection: the date of the last injection is required";
      const since = daysSinceLastInjection(state);
      if (since === null || since < 0) return "The last injection date must be before the date of this injection";
      if (since > 89) {
        // The dose row is every 12 weeks plus or minus 5 days (79 to 89 days).
        if (!m.lateRepeatPregnancyExcluded)
          return `Repeat injection is ${since} days after the last (beyond 12 weeks plus 5 days): pregnancy must be reasonably excluded before giving it, or refer`;
        if (!m.lateRepeatBarrierAdvised)
          return "Late repeat: record that a barrier method for the next 7 days was advised";
      }
    }
    if (!m.injectionSite) return "Injection site (gluteal or deltoid, deep intramuscular) is required";
    if (!m.batchNumber.trim()) return "Batch number is required";
    if (!m.expiryDate) return "Expiry date is required";
    if (m.expiryDate < new Date().toISOString().split("T")[0]) return "The expiry date has passed: this stock cannot be used";
    if (!m.nextInjectionDue) return "Next injection due date could not be derived from the date of injection";
  }
  if (!m.ukmecConfirmed) return "Confirm UKMEC 2025 category 1 or 2 for the chosen method (inclusion criterion)";
  if (!m.administeredBy.trim()) return "Supplied by (name/credentials) is required";
  return null;
}
