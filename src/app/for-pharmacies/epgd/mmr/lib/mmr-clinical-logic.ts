// ─── MMR Clinical Logic ───
// Aligned to the MMRVaxPRO / Priorix PGD version 005, issued 11 September 2026.

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

  // Age: indicated from 12 months of age (PGD v005 inclusion)
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

  // Haematological / lymphatic malignancy (PGD v005 exclusion)
  if (state.medicalHistory.haematologicalMalignancy) {
    alerts.push({
      severity: "stop",
      code: "HAEMATOLOGICAL_MALIGNANCY",
      message: "Blood dyscrasia, leukaemia, lymphoma or other malignancy of the haematopoietic or lymphatic system",
      detail: "Excluded under the PGD. Refer to the GP or specialist.",
    });
  }

  // Family history of immunodeficiency (PGD v005 exclusion)
  if (state.medicalHistory.familyImmunodeficiency) {
    alerts.push({
      severity: "stop",
      code: "FAMILY_IMMUNODEFICIENCY",
      message: "Family history of congenital or hereditary immunodeficiency",
      detail: "Excluded unless immune competence has been demonstrated. Refer to the GP.",
    });
  }

  // Active untreated tuberculosis (PGD v005 exclusion)
  if (state.medicalHistory.activeUntreatedTB) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_TB",
      message: "Active untreated tuberculosis",
      detail: "Excluded under the PGD. Refer to the GP.",
    });
  }

  // Yellow fever or varicella vaccine in the previous 4 weeks (PGD v005 exclusion: defer)
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

  // Hypersensitivity to any other component (PGD v005 exclusion)
  if (state.medicalHistory.hypersensitivityOtherComponent) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY_COMPONENT",
      message: "Known hypersensitivity to a component of the vaccine",
      detail: "Excluded under the PGD. Refer to the GP.",
    });
  }

  // Anaphylaxis to a previous MMR-containing vaccine (PGD v005 exclusion)
  if (state.medicalHistory.anaphylaxisPreviousMMR) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_PREVIOUS_MMR",
      message: "Anaphylaxis to a previous measles, mumps or rubella containing vaccine",
      detail: "Excluded under the PGD. Refer to the GP or specialist allergy service.",
    });
  }

  // Egg allergy, including anaphylaxis, is not a contraindication to MMR (PGD
  // and Green Book): both products are grown on chick embryo fibroblast
  // cultures and neither is contraindicated. Informational only; the tool used
  // to refuse MMRVaxPro here, an exclusion the signed document does not contain.
  if (state.medicalHistory.anaphylaxisEgg) {
    alerts.push({
      severity: "caution",
      code: "EGG_ALLERGY_NOTE",
      message: "Egg allergy recorded: not a contraindication",
      detail: "Egg allergy is not a contraindication to MMR (PGD, Green Book chapter 21). Either product may be given. Observe for 15 minutes as for every patient.",
    });
  }

  // Two or more documented doses: the inclusion criterion is "without two
  // documented doses of MMR". Nothing in the tool asked this before.
  if (state.eligibility.documentedDoses === "2") {
    alerts.push({
      severity: "stop",
      code: "TWO_DOCUMENTED_DOSES",
      message: "Two documented doses of MMR already received",
      detail: "The PGD covers individuals without two documented doses. A third dose is not authorised under this PGD. Explain that the course is complete and refer to the GP if there is doubt about the records.",
    });
  }

  // Acute febrile illness (PGD v005 exclusion: postpone)
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "FEBRILE_ILLNESS",
      message: "Acute febrile illness",
      detail: "Vaccination should be postponed until recovery. Minor infections without fever are not a reason to delay.",
    });
  }

  // Blood products or immunoglobulin in the previous 3 months, recorded as
  // deferred: no vaccine is given today. Before this the tool carried a
  // "deferred" patient straight through to vaccine administration
  // (walkthrough review, 11 Sep 2026).
  if (state.medicalHistory.recentBloodProducts && state.medicalHistory.bloodProductsAction === "deferred") {
    alerts.push({
      severity: "stop",
      code: "BLOOD_PRODUCTS_DEFERRED",
      message: "Vaccination deferred: blood products or immunoglobulin in the previous 3 months",
      detail: "Recorded as deferred until 3 months after the blood product or immunoglobulin. No vaccine today; save the consultation as not supplied and advise when to return.",
    });
  }

  // Blood products or immunoglobulin in the previous 3 months (PGD v005 caution)
  if (state.medicalHistory.recentBloodProducts && state.medicalHistory.bloodProductsAction !== "deferred") {
    const which =
      state.medicalHistory.bloodProductsAction === "given-repeat-3-months"
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

  // Thrombocytopenia or febrile seizures (PGD v005 caution)
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
