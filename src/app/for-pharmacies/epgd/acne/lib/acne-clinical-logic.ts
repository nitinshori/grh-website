// Aligned to the Benzoyl Peroxide plus Clindamycin or Adapalene plus Benzoyl
// Peroxide (Acne Vulgaris) PGD, version 003, issued 11 September 2026.

import type { AcneConsultationState } from "./acne-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export const PGD_STRAPLINE =
  "Benzoyl Peroxide plus Clindamycin or Adapalene plus Benzoyl Peroxide (Acne Vulgaris) PGD, version 003, issued 11 September 2026";

export function isDuac(choice: string): boolean {
  return choice === "duac-3" || choice === "duac-5";
}

export function isEpiduo(choice: string): boolean {
  return choice === "epiduo-0.1" || choice === "epiduo-0.3";
}

export function getAllAlerts(state: AcneConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const choice = state.medicineSelection.medicineChoice;
  const duac = isDuac(choice);
  const epiduo = isEpiduo(choice);
  const ci = state.contraindications;
  const mh = state.medicalHistory;

  // Hard stops: age
  if (ci.ageUnder12 || (state.patient.age !== null && state.patient.age < 12)) {
    alerts.push({
      severity: "stop",
      code: "ACNE_AGE",
      message: "Patient under 12 years old",
      detail: "Both arms of this PGD are for individuals aged 12 years and over. Advise on alternative options; inform or refer to the GP as appropriate.",
    });
  }

  // Hard stops: pregnancy, planning pregnancy, breastfeeding
  if (ci.pregnant) {
    alerts.push({
      severity: "stop",
      code: "ACNE_PREGNANCY",
      message: "Patient is pregnant",
      detail:
        "Adapalene / benzoyl peroxide: pregnancy is an exclusion. Benzoyl peroxide / clindamycin: safety in human pregnancy is not established; for pregnancy refer the patient to the GP.",
    });
  }

  if (ci.planningPregnancy) {
    alerts.push({
      severity: epiduo ? "stop" : "caution",
      code: "ACNE_PLANNING_PREGNANCY",
      message: "Patient is planning pregnancy",
      detail: "Exclusion for adapalene / benzoyl peroxide gel. Benzoyl peroxide / clindamycin gel may be considered; refer to the GP if in doubt.",
    });
  }

  if (ci.breastfeeding) {
    // Per arm, as the document has it: the clindamycin arm refers
    // breastfeeding to the GP (stop); the adapalene arm lists it as a
    // caution (decide whether to discontinue breastfeeding; avoid the chest).
    alerts.push({
      severity: duac ? "stop" : "caution",
      code: "ACNE_BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: duac
        ? "Benzoyl peroxide / clindamycin: clindamycin is found in breast milk; for breastfeeding refer the patient to the GP."
        : epiduo
          ? "Adapalene / benzoyl peroxide (caution): a decision must be made whether to discontinue breast-feeding, weighing the benefit to the child against the benefit of therapy. Avoid application to the chest. A risk to the suckling child cannot be excluded."
          : "Benzoyl peroxide / clindamycin: refer to the GP (clindamycin is found in breast milk). Adapalene / benzoyl peroxide: caution only; decide whether to discontinue breast-feeding and avoid application to the chest.",
    });
  }

  // Hard stops: severity
  if (state.assessment.severity === "severe") {
    alerts.push({
      severity: "stop",
      code: "ACNE_SEVERE_SYSTEMIC",
      message: "Severe acne requiring systemic therapy, excluded",
      detail: "Both arms are for mild to moderate acne vulgaris. Refer to the GP or dermatology.",
    });
  }

  // Hard stops: hypersensitivity
  if (ci.hypersensitivityBenzoylPeroxide) {
    alerts.push({
      severity: "stop",
      code: "ACNE_HS_BPO",
      message: "Known hypersensitivity to benzoyl peroxide",
      detail: "Both products contain benzoyl peroxide. Cannot supply under this PGD.",
    });
  }
  if (ci.hypersensitivityClindamycinLincomycin) {
    alerts.push({
      severity: duac ? "stop" : "caution",
      code: "ACNE_HS_CLINDAMYCIN",
      message: "Known hypersensitivity to clindamycin or lincomycin",
      detail: "Exclusion for benzoyl peroxide / clindamycin gel. Adapalene / benzoyl peroxide gel may be considered.",
    });
  }
  if (ci.hypersensitivityAdapalene) {
    alerts.push({
      severity: epiduo ? "stop" : "caution",
      code: "ACNE_HS_ADAPALENE",
      message: "Known hypersensitivity to adapalene or any excipient",
      detail: "Exclusion for adapalene / benzoyl peroxide gel. Benzoyl peroxide / clindamycin gel may be considered.",
    });
  }

  // Hard stops: application site
  if (ci.brokenSkinAtSite) {
    alerts.push({
      severity: "stop",
      code: "ACNE_BROKEN_SKIN",
      message: "Broken skin at the application site",
      detail: "Exclusion for both arms.",
    });
  }
  if (ci.inflamedSkinAtSite) {
    alerts.push({
      severity: duac ? "stop" : "caution",
      code: "ACNE_INFLAMED_SKIN",
      message: "Inflamed skin at the application site",
      detail: "Exclusion for benzoyl peroxide / clindamycin gel.",
    });
  }
  if (ci.eczemaOrSunburnAtSite) {
    alerts.push({
      severity: epiduo ? "stop" : "caution",
      code: "ACNE_ECZEMA_SUNBURN",
      message: "Eczema or sunburned skin at the application site",
      detail: "Exclusion for adapalene / benzoyl peroxide gel.",
    });
  }

  // Hard stop: antibiotic-associated colitis (Duac)
  if (mh.antibioticAssociatedColitis) {
    alerts.push({
      severity: duac ? "stop" : "caution",
      code: "ACNE_COLITIS",
      message: "History of antibiotic-associated colitis",
      detail: "Exclusion for benzoyl peroxide / clindamycin gel. Adapalene / benzoyl peroxide gel may be considered.",
    });
  }

  // Red flags
  if (state.assessment.nodalCystic) {
    alerts.push({
      severity: "red-flag",
      code: "ACNE_SEVERE",
      message: "Nodular or cystic acne, consider referral",
      detail: "Severe nodulocystic acne requires specialist assessment and potentially systemic treatment. Recommend GP referral.",
    });
  }
  if (mh.scarringOrDistress) {
    alerts.push({
      severity: "red-flag",
      code: "ACNE_SCARRING_DISTRESS",
      message: "Severe scarring, persistent pigmentary changes or persistent psychological distress",
      detail: "Consider referral to a dermatologist if acne is causing severe scarring, persistent pigmentary changes or is contributing to persistent psychological distress or a mental health disorder.",
    });
  }

  // Repeat course: 12 weeks continuous use maximum. Warn when the previous
  // course ended within the last 12 weeks and had already run 12 weeks.
  const ms = state.medicineSelection;
  if (ms.repeatCourse && ms.previousCourseStartDate && ms.previousCourseEndDate) {
    const start = new Date(ms.previousCourseStartDate).getTime();
    const end = new Date(ms.previousCourseEndDate).getTime();
    const weeksOnTreatment = (end - start) / (7 * 24 * 3600 * 1000);
    const weeksSinceEnd = (Date.now() - end) / (7 * 24 * 3600 * 1000);
    if (!isNaN(weeksOnTreatment) && !isNaN(weeksSinceEnd) && weeksSinceEnd < 1 && weeksOnTreatment >= 12) {
      alerts.push({
        severity: "caution",
        code: "ACNE_CONTINUOUS_USE",
        message: "Previous course already at the 12-week continuous-use maximum",
        detail: "The previous course ran 12 weeks or more and ended within the last week; a further supply would exceed 12 weeks of continuous use. Record the review and the reason for continuing, or refer.",
      });
    }
  }

  // Cautions
  if (mh.gastrointestinalDisease) {
    alerts.push({
      severity: "caution",
      code: "ACNE_GI",
      message: "History of gastrointestinal disease",
      detail: "Benzoyl peroxide / clindamycin: use caution in patients with a history of gastrointestinal disease.",
    });
  }
  if (mh.atopic) {
    alerts.push({
      severity: "caution",
      code: "ACNE_ATOPIC",
      message: "Atopic patient",
      detail: "Benzoyl peroxide / clindamycin: use with caution in atopic patients.",
    });
  }
  if (mh.sensitiveToRetinoids) {
    alerts.push({
      severity: "caution",
      code: "ACNE_RETINOID_SENS",
      message: "History of retinoid sensitivity",
      detail: "Patient has previously reacted to retinoid products. Discuss risk-benefit before supplying adapalene / benzoyl peroxide; discontinue if excessive irritation or allergic reaction occurs.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

const DUAC_DOSE =
  "Apply a thin layer to the entire affected area once daily in the evening, after washing gently with a mild cleanser and fully drying. Wash hands after application.";
const DUAC_DURATION =
  "Up to 1 x 30 g tube per treatment course. Maximum of 12 weeks continuous use; review required for repeat courses. Store in a refrigerator (2 to 8 C) before dispensing; once dispensed store below 25 C and use within 2 months.";
const EPIDUO_DOSE =
  "Apply a thin layer to the entire affected area once daily in the evening to clean and dry skin. Wash hands after use.";
const EPIDUO_DURATION =
  "Up to 1 x 30 g tube or pump per treatment course. Initial treatment for up to 12 weeks; reassess if longer use is required. If no improvement after 4 to 8 weeks, consider the benefit of continued treatment. Store below 25 C, do not freeze.";

export function calculateDoseRecommendation(state: AcneConsultationState): DoseRecommendation | null {
  const choice = state.medicineSelection.medicineChoice;
  if (!choice) return null;

  const recommendations: Record<string, DoseRecommendation> = {
    "duac-3": {
      medicine: "Benzoyl peroxide plus clindamycin gel, clindamycin 10 mg/g + benzoyl peroxide 30 mg/g (Duac 3%), POM",
      dose: DUAC_DOSE,
      frequency: "Once daily in the evening",
      duration: DUAC_DURATION,
      reason: "Mild to moderate acne vulgaris, particularly where comedones, papules and pustules are present. The 10 mg/g + 30 mg/g strength is suitable for mild to moderate presentations and minimises the risk of skin reactions.",
    },
    "duac-5": {
      medicine: "Benzoyl peroxide plus clindamycin gel, clindamycin 10 mg/g + benzoyl peroxide 50 mg/g (Duac 5%), POM",
      dose: DUAC_DOSE,
      frequency: "Once daily in the evening",
      duration: DUAC_DURATION,
      reason: "Mild to moderate acne vulgaris where the lower strength has proven less effective, for more moderate presentations, or where the patient has previously tolerated 50 mg/g (5%) benzoyl peroxide.",
    },
    "epiduo-0.1": {
      medicine: "Adapalene 0.1% / benzoyl peroxide 2.5% gel (Epiduo), POM",
      dose: EPIDUO_DOSE,
      frequency: "Once daily in the evening",
      duration: EPIDUO_DURATION,
      reason: "Mild to moderate acne vulgaris, especially where comedones and inflammatory lesions are present.",
    },
    "epiduo-0.3": {
      medicine: "Adapalene 0.3% / benzoyl peroxide 2.5% gel (Epiduo 0.3% / 2.5%), POM",
      dose: EPIDUO_DOSE,
      frequency: "Once daily in the evening",
      duration: EPIDUO_DURATION,
      reason: "Mild to moderate acne vulgaris, especially where comedones and inflammatory lesions are present.",
    },
  };

  return recommendations[choice] || null;
}

export const MEDICINE_OPTIONS: { value: string; label: string }[] = [
  { value: "duac-3", label: "Benzoyl peroxide + clindamycin gel 10 mg/g + 30 mg/g (Duac 3%), once daily in the evening" },
  { value: "duac-5", label: "Benzoyl peroxide + clindamycin gel 10 mg/g + 50 mg/g (Duac 5%), once daily in the evening" },
  { value: "epiduo-0.1", label: "Adapalene 0.1% / benzoyl peroxide 2.5% gel (Epiduo), once daily in the evening" },
  { value: "epiduo-0.3", label: "Adapalene 0.3% / benzoyl peroxide 2.5% gel (Epiduo 0.3% / 2.5%), once daily in the evening" },
];

/** Quantity options per arm. The PGD ceiling is 1 x 30 g tube (Duac) or
 *  1 x 30 g tube or pump (Epiduo) per treatment course. */
export function getQuantityOptions(choice: string): { value: string; label: string }[] {
  if (isDuac(choice)) return [{ value: "1 x 30 g tube", label: "1 x 30 g tube" }];
  if (isEpiduo(choice)) {
    return [
      { value: "1 x 30 g tube", label: "1 x 30 g tube" },
      { value: "1 x 30 g pump", label: "1 x 30 g pump" },
    ];
  }
  return [];
}

/** Products the patient can be offered. Filtered by severity and by the
 *  arm-specific exclusions already captured, so the tool no longer offers a
 *  product it will then refuse to let the pharmacist pick. */
export function getMedicineOptions(state: AcneConsultationState): string[] {
  const severity = state.assessment.severity;
  if (severity !== "mild" && severity !== "moderate") return [];
  const ci = state.contraindications;
  const mh = state.medicalHistory;
  const duacExcluded =
    ci.hypersensitivityClindamycinLincomycin || ci.inflamedSkinAtSite || mh.antibioticAssociatedColitis || ci.breastfeeding;
  const epiduoExcluded = ci.hypersensitivityAdapalene || ci.planningPregnancy || ci.eczemaOrSunburnAtSite;
  return MEDICINE_OPTIONS.map((o) => o.value).filter((v) => {
    if (isDuac(v) && duacExcluded) return false;
    if (isEpiduo(v) && epiduoExcluded) return false;
    return true;
  });
}
