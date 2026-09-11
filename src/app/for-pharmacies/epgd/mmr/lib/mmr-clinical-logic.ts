// ─── MMR Clinical Logic ───
// Aligned to the MMRVaxPRO / Priorix PGD version 004, issued 11 September 2026.

import type { MMRConsultationState } from "./mmr-types";
import type { ClinicalAlert } from "../../shared/types";

/** Whole months between a date of birth and a reference date (today by default). */
export function ageInMonths(dob: string, reference?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const ref = reference ? new Date(reference) : new Date();
  if (isNaN(ref.getTime())) return null;
  let months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth());
  if (ref.getDate() < birth.getDate()) months--;
  return months;
}

export function getAllAlerts(state: MMRConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age: indicated from 12 months of age (PGD v004 inclusion)
  const months = ageInMonths(state.patient.dateOfBirth);
  if (months !== null && months < 12) {
    alerts.push({
      severity: "stop",
      code: "UNDER_12_MONTHS",
      message: "Patient is under 12 months of age",
      detail:
        "This PGD covers individuals aged 12 months and over. Doses given before the first birthday do not count towards the course. Refer to the GP.",
    });
  }

  // Pregnancy contraindication
  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Pregnant or planning pregnancy within one month",
      detail: "MMR vaccine is contraindicated in pregnancy or where pregnancy is planned within one month. Advise to avoid pregnancy for 1 month after vaccination.",
    });
  }

  // Immunosuppression
  if (state.medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Immunocompromised or receiving immunosuppressive therapy",
      detail: "Live attenuated MMR vaccine is contraindicated. Refer to the GP or specialist.",
    });
  }

  // Haematological / lymphatic malignancy (PGD v004 exclusion)
  if (state.medicalHistory.haematologicalMalignancy) {
    alerts.push({
      severity: "stop",
      code: "HAEMATOLOGICAL_MALIGNANCY",
      message: "Blood dyscrasia, leukaemia, lymphoma or other malignancy of the haematopoietic or lymphatic system",
      detail: "Excluded under the PGD. Refer to the GP or specialist.",
    });
  }

  // Family history of immunodeficiency (PGD v004 exclusion)
  if (state.medicalHistory.familyImmunodeficiency) {
    alerts.push({
      severity: "stop",
      code: "FAMILY_IMMUNODEFICIENCY",
      message: "Family history of congenital or hereditary immunodeficiency",
      detail: "Excluded unless immune competence has been demonstrated. Refer to the GP.",
    });
  }

  // Active untreated tuberculosis (PGD v004 exclusion)
  if (state.medicalHistory.activeUntreatedTB) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_TB",
      message: "Active untreated tuberculosis",
      detail: "Excluded under the PGD. Refer to the GP.",
    });
  }

  // Yellow fever or varicella vaccine in the previous 4 weeks (PGD v004 exclusion: defer)
  if (state.medicalHistory.liveVaccineLast4Weeks) {
    alerts.push({
      severity: "stop",
      code: "LIVE_VACCINE_4_WEEKS",
      message: "Yellow fever or varicella vaccine within the previous 4 weeks",
      detail: "Defer MMR until 4 weeks have elapsed. Never give yellow fever vaccine and MMR on the same day.",
    });
  }

  // Anaphylaxis to neomycin
  if (state.medicalHistory.anaphylaxisNeomycin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_NEOMYCIN",
      message: "Hypersensitivity to neomycin",
      detail: "MMR vaccine is contraindicated due to neomycin content.",
    });
  }

  // Anaphylaxis to gelatin
  if (state.medicalHistory.anaphylaxisGelatin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_GELATIN",
      message: "Hypersensitivity to gelatin",
      detail: "MMR vaccine is contraindicated due to gelatin content.",
    });
  }

  // Hypersensitivity to any other component (PGD v004 exclusion)
  if (state.medicalHistory.hypersensitivityOtherComponent) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY_COMPONENT",
      message: "Known hypersensitivity to a component of the vaccine",
      detail: "Excluded under the PGD. Refer to the GP.",
    });
  }

  // Anaphylaxis to a previous MMR-containing vaccine (PGD v004 exclusion)
  if (state.medicalHistory.anaphylaxisPreviousMMR) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_PREVIOUS_MMR",
      message: "Anaphylaxis to a previous measles, mumps or rubella containing vaccine",
      detail: "Excluded under the PGD. Refer to the GP or specialist allergy service.",
    });
  }

  // Anaphylaxis to egg (MMRVaxPro specific; the PGD notes egg allergy is not a contraindication to MMR)
  if (state.medicalHistory.anaphylaxisEgg && state.vaccineAdmin.vaccine === "MMRVaxPro") {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_EGG",
      message: "Anaphylaxis to egg with MMRVaxPro selected",
      detail: "Egg allergy is not a contraindication to MMR (Green Book), but this tool does not give MMRVaxPro after egg anaphylaxis. Select Priorix (egg-free).",
    });
  }

  // Acute febrile illness (PGD v004 exclusion: postpone)
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "FEBRILE_ILLNESS",
      message: "Acute febrile illness",
      detail: "Vaccination should be postponed until recovery. Minor infections without fever are not a reason to delay.",
    });
  }

  // Blood products or immunoglobulin in the previous 3 months (PGD v004 caution)
  if (state.medicalHistory.recentBloodProducts) {
    const which =
      state.medicalHistory.bloodProductsAction === "deferred"
        ? " Recorded: deferred."
        : state.medicalHistory.bloodProductsAction === "given-repeat-3-months"
          ? " Recorded: protection needed now, given and to be repeated after 3 months."
          : " Record which applied.";
    alerts.push({
      severity: "caution",
      code: "RECENT_BLOOD_PRODUCTS",
      message: "Blood products or immunoglobulin in the previous 3 months",
      detail:
        "Defer where possible; where protection is needed now, give and repeat after 3 months (Green Book)." + which,
    });
  }

  // Thrombocytopenia or febrile seizures (PGD v004 caution)
  if (state.medicalHistory.thrombocytopeniaOrFebrileSeizures) {
    alerts.push({
      severity: "caution",
      code: "THROMBOCYTOPENIA_FEBRILE_SEIZURES",
      message: "History of thrombocytopenia or febrile seizures",
      detail: "Use caution in children with a history of thrombocytopenia or febrile seizures. Counsel on fever management and when to seek advice.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
