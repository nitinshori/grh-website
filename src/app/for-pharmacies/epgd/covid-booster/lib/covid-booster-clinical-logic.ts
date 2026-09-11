import type { CovidBoosterConsultationState } from "./covid-booster-types";
import { COVID_PRODUCTS } from "./covid-booster-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Aligned to the COVID-19 Vaccination 2026/27 PGD version 008, issued 11 September 2026.

const DAY_MS = 24 * 60 * 60 * 1000;
/** Minimum interval between COVID-19 vaccine doses: 3 months, operationalised as 91 days (13 weeks) as in the NHS programme. */
export const MIN_INTERVAL_DAYS = 91;

/** Days since an ISO date, or null when missing or invalid. */
export function daysSince(date: string): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

/** True when the interval since the previous dose is known and under 3 months. */
export function intervalTooShort(state: CovidBoosterConsultationState): boolean {
  if (!state.assessment.previousCovidVaccine) return false;
  const d = daysSince(state.assessment.previousDoseDate);
  return d !== null && d < MIN_INTERVAL_DAYS;
}

/** NHS-eligible cohorts for autumn 2026 (PGD v008 guideline summary). */
export function nhsEligible(state: CovidBoosterConsultationState): boolean {
  const age = state.patient.age;
  return (
    state.assessment.immunosuppressed ||
    state.assessment.careHomeResident ||
    (age !== null && age >= 75)
  );
}

export function getAllAlerts(state: CovidBoosterConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.patient.age !== null && state.patient.age < 12) {
    alerts.push({
      severity: "stop",
      code: "COVID_UNDER_12",
      message: "Patient is under 12 years",
      detail:
        "Excluded. Refer to the GP or a service commissioned to vaccinate children. Age-specific presentations and dose volumes are outside this PGD.",
    });
  }

  // Anaphylaxis to previous COVID vaccine
  if (state.assessment.anaphylaxisToPreviousDose === "yes") {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_PREV",
      message: "Anaphylaxis to previous COVID-19 vaccine",
      detail: "Contraindicated. Do not administer booster.",
    });
  }

  // Hypersensitivity to the active substance or an excipient (PEG for mRNA, polysorbate 80 for Nuvaxovid)
  if (state.assessment.anaphylaxisToPEG === "yes" || state.assessment.anaphylaxisToPolysorbate === "yes") {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_COMPONENT",
      message: "Known hypersensitivity to the active substance or an excipient (PEG or polysorbate 80)",
      detail: "Excluded under the PGD. Refer, do not vaccinate.",
    });
  }

  // Acute severe febrile illness
  if (state.assessment.severeFebrilIllness === "yes") {
    alerts.push({
      severity: "stop",
      code: "COVID_FEBRILE",
      message: "Acute severe febrile illness",
      detail: "Postpone until recovered. A minor infection without fever is not a contraindication.",
    });
  }

  // Confirmed current COVID-19 infection
  if (state.assessment.currentCovidInfection) {
    alerts.push({
      severity: "stop",
      code: "COVID_CURRENT_INFECTION",
      message: "Confirmed current COVID-19 infection",
      detail:
        "Defer until recovered. A 4 week interval from a positive test or symptom onset is commonly applied, and 12 weeks in 5 to 17 year olds who are not in a risk group.",
    });
  }

  // Interval since the previous dose
  if (intervalTooShort(state)) {
    if (state.assessment.shorterIntervalNationalGuidance) {
      alerts.push({
        severity: "caution",
        code: "COVID_INTERVAL_SHORT_ADVISED",
        message: "Less than 3 months (91 days) since the last COVID-19 vaccine dose",
        detail:
          "Permitted only because a shorter interval is specifically advised in national guidance for this individual. Record the guidance relied on in the clinical notes.",
      });
    } else {
      alerts.push({
        severity: "stop",
        code: "COVID_INTERVAL_SHORT",
        message: "Less than 3 months (91 days) since the last COVID-19 vaccine dose",
        detail:
          "Excluded: a minimum interval of 3 months (91 days) is required between COVID-19 vaccine doses, unless a shorter interval is specifically advised in national guidance for that individual.",
      });
    }
  }

  // Bleeding disorder not assessed as safe for IM injection
  if (state.assessment.bleedingDisorder && !state.assessment.bleedingDisorderAssessedSafe) {
    alerts.push({
      severity: "stop",
      code: "COVID_BLEEDING_DISORDER",
      message: "Bleeding disorder without a clinical assessment that intramuscular injection is safe",
      detail:
        "Excluded until intramuscular injection has been assessed as safe by a clinician familiar with the individual's bleeding risk. Refer.",
    });
  }

  // Caution: anticoagulation or an assessed bleeding disorder
  if (state.assessment.onAnticoagulants || (state.assessment.bleedingDisorder && state.assessment.bleedingDisorderAssessedSafe)) {
    alerts.push({
      severity: "caution",
      code: "COVID_ANTICOAGULANT",
      message: "Anticoagulation or bleeding disorder",
      detail:
        "Vaccinate intramuscularly with a 23 gauge or finer needle, apply firm pressure without rubbing for at least 2 minutes, and advise on the risk of haematoma.",
    });
  }

  // Pregnancy. Signatories' decision 16 (11 Sep 2026): pregnancy is not itself
  // an eligible group; a pregnant individual is vaccinated under this PGD only
  // where they are in an NHS-eligible group (75 and over, care home resident,
  // immunosuppressed). Otherwise refer, do not vaccinate.
  if (state.assessment.pregnant) {
    if (nhsEligible(state)) {
      alerts.push({
        severity: "caution",
        code: "COVID_PREGNANCY",
        message: "Pregnant and in an NHS-eligible group",
        detail:
          "The Green Book supports COVID-19 vaccination in pregnancy where the individual is otherwise eligible. Tell the patient of their NHS entitlement, give an mRNA vaccine (Comirnaty XFG in preference; Nuvaxovid is not selected in pregnancy under this tool), and record the eligible group that applies.",
      });
    } else {
      alerts.push({
        severity: "stop",
        code: "COVID_PREGNANCY_NOT_ELIGIBLE",
        message: "Pregnant and not in an NHS-eligible group",
        detail:
          "Pregnancy is not itself an eligible group in the 2026/27 programme. A pregnant individual who is not aged 75 or over, a care home resident or immunosuppressed is excluded under this PGD: refer to the GP or maternity service. Do not vaccinate.",
      });
    }
  }

  // Caution: capillary leak syndrome (Spikevax)
  if (state.assessment.capillaryLeakHistory) {
    alerts.push({
      severity: "caution",
      code: "COVID_CAPILLARY_LEAK",
      message: "History of capillary leak syndrome",
      detail:
        "Flare-ups have been reported in the first days after Spikevax. Vaccination should be planned in collaboration with appropriate medical experts; Spikevax cannot be selected under this tool. Be alert to hypotension and oedema.",
    });
  }

  // NHS entitlement must be explained before private supply
  if (nhsEligible(state) && state.assessment.nhsStatus === "not-eligible") {
    alerts.push({
      severity: "stop",
      code: "COVID_NHS_ENTITLEMENT",
      message: "Patient is eligible for NHS vaccination but recorded as not eligible",
      detail:
        "Adults aged 75 and over, care home residents and the immunosuppressed are eligible under the NHS programme and must be told they can be vaccinated free of charge before any private supply proceeds.",
    });
  }

  // Myocarditis or pericarditis after a previous mRNA dose.
  //
  // This was a "caution" in v003 of the tool while the PGD listed it under
  // EXCLUSION criteria: "History of myocarditis or pericarditis following a
  // previous dose of an mRNA COVID-19 vaccine. Refer for specialist advice;
  // do not give a further mRNA dose under this PGD." The tool was softer than
  // the document it operates under. It is a stop.
  if (state.assessment.myocarditisHistory) {
    alerts.push({
      severity: "stop",
      code: "COVID_MYOCARDITIS",
      message: "Myocarditis or pericarditis after a previous mRNA COVID-19 vaccine",
      detail:
        "Excluded under this PGD. Do not give a further mRNA dose (Comirnaty or Spikevax). Refer for specialist advice.",
    });
  }

  // Primary course in someone unvaccinated AND immunosuppressed is excluded.
  if (!state.assessment.previousCovidVaccine && state.assessment.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "COVID_PRIMARY_COURSE_IMMUNOSUPPRESSED",
      message: "Primary course in an unvaccinated, immunosuppressed patient",
      detail:
        "This PGD does not cover primary courses in individuals who are unvaccinated and immunosuppressed, or any schedule requiring more than one dose in the season. Refer.",
    });
  }

  // Comirnaty XFG must be given in preference to LP.8.1 for the highest risk.
  const age = state.patient.age;
  if (
    state.supply.vaccineProduct === "comirnaty-lp81" &&
    (state.assessment.immunosuppressed || (age !== null && age >= 75))
  ) {
    alerts.push({
      severity: "stop",
      code: "COVID_LP81_HIGH_RISK",
      message: "Comirnaty LP.8.1 selected for a high-risk patient",
      detail:
        "PGD v008 requires Comirnaty XFG, the current 2026/27 formulation, for anyone immunosuppressed or aged 75 and over. Use XFG stock, or rebook rather than substitute.",
    });
  }

  if (state.supply.vaccineProduct === "comirnaty-lp81") {
    alerts.push({
      severity: "caution",
      code: "COVID_LP81_RUNOUT",
      message: "Comirnaty LP.8.1 is the previous seasonal formulation",
      detail:
        "Permitted under PGD v008 from existing stock only, until that stock is used up or reaches its expiry date. Tell the patient this is the previous formulation and that XFG is the current one, and record that you did. Check the variant printed on the syringe label before injecting.",
    });
  }

  if (state.assessment.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "COVID_IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail:
        "The immune response may be reduced and protection may be limited. Vaccination is still recommended. This patient is eligible for NHS vaccination and must be told they can have it free of charge on the NHS.",
    });
  }

  return alerts;
}

export function hasHardStops(state: CovidBoosterConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: CovidBoosterConsultationState): DoseRecommendation | null {
  if (!state.assessment.ageConfirmed) {
    return null;
  }

  // The dose volume is NOT the same for all four products: Comirnaty is
  // 0.3 mL, Spikevax and Nuvaxovid are 0.5 mL. Until a product is chosen
  // there is no single correct volume to display.
  //
  // v003 of this tool displayed a fixed "0.3 mL" alongside the label
  // "XBB.1.5 or current variant-updated formulation". XBB.1.5 was the
  // 2023/24 strain, three seasons out of date, and the fixed volume was
  // wrong for two of the four products in the PGD.
  const chosen = state.supply.vaccineProduct;
  if (!chosen) {
    return {
      medicine: "Select the product held before recording a dose",
      dose: "Comirnaty 0.3 mL. Spikevax and Nuvaxovid 0.5 mL.",
      frequency: "Single dose",
      duration: "One dose for the 2026/27 season",
      reason:
        "Comirnaty XFG is the vaccine of choice under PGD v008. Comirnaty LP.8.1 may be used from existing stock only, and not for patients who are immunosuppressed or aged 75 and over. Spikevax LP.8.1 where Comirnaty is unavailable; Nuvaxovid JN.1 where the mRNA vaccines are unavailable or unsuitable.",
    };
  }

  const product = COVID_PRODUCTS[chosen];
  return {
    medicine: product.label,
    dose: `${product.volume}, intramuscular, into the deltoid`,
    frequency: "Single dose",
    duration: "One dose for the 2026/27 season",
    reason:
      chosen === "comirnaty-lp81"
        ? "Existing stock of the previous seasonal formulation. Permitted under PGD v008 until stock is exhausted or expires. The patient must be told."
        : "Administered under COVID-19 PGD v008, 2026/27 season.",
  };
}
