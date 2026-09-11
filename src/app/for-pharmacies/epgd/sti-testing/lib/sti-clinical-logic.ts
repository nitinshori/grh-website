// ─── STI Testing Clinical Logic ───

import type { ClinicalAlert } from "../../shared/types";
import type { STIConsultationState, STITreatmentMedicine } from "./sti-types";

// ─── Age and safeguarding (PGD v002, both arms) ───

export function getAgeAlerts(state: STIConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;
  if (age === null) return alerts;

  if (age < 13) {
    alerts.push({
      severity: "stop",
      code: "STI_UNDER_13",
      message: "Aged under 13: do not supply",
      detail:
        "Any sexual activity is a safeguarding concern. Do not supply; refer to the GP or sexual health service the same day and make a safeguarding referral.",
    });
    return alerts;
  }

  if (age <= 15) {
    if (state.patient.safeguardingConcern) {
      alerts.push({
        severity: "stop",
        code: "STI_SAFEGUARDING_CONCERN",
        message: "Aged 13 to 15 with a safeguarding concern: do not supply",
        detail:
          "Partner 18 or over, coercion, exploitation or learning disability: refer and follow the local safeguarding pathway.",
      });
    } else if (!state.patient.fraserCompetent || !state.patient.safeguardingAssessed) {
      alerts.push({
        severity: "stop",
        code: "STI_FRASER_NOT_ESTABLISHED",
        message: "Aged 13 to 15: Fraser competence and safeguarding assessment must be recorded",
        detail:
          "Supply only where Fraser competence is assessed and recorded and a safeguarding assessment (partner age, coercion, exploitation indicators) is completed with no concern. Otherwise refer and follow the local safeguarding pathway.",
      });
    } else {
      alerts.push({
        severity: "red-flag",
        code: "STI_AGE_13_15",
        message: "Aged 13 to 15: Fraser competence and safeguarding assessment recorded",
        detail: "Recorded on this consultation. Follow the local safeguarding pathway if any concern arises.",
      });
    }
  }

  return alerts;
}

// ─── Chlamydia treatment exclusions (PGD v002) ───

export function getTreatmentAlerts(state: STIConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const t = state.treatment;
  if (!t.treatUnderPgd) return alerts;

  // Exclusions that apply to both arms
  if (t.pregnant || t.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "STI_PREGNANT_BF",
      message: "Pregnant or breastfeeding: refer to the GP or sexual health service",
      detail:
        "Excluded from the doxycycline arm. For azithromycin the PGD directs referral (azithromycin is the BASHH choice in pregnancy, but a test of cure and follow-up are needed).",
    });
  }
  if (t.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "STI_SEVERE_HEPATIC",
      message: "Severe hepatic insufficiency or impairment",
      detail: "Excluded from both the doxycycline and azithromycin arms. Refer.",
    });
  }
  if (t.complicatedInfection) {
    alerts.push({
      severity: "stop",
      code: "STI_COMPLICATED",
      message: "Known or suspected complicated infection (e.g. PID)",
      detail: "This PGD covers uncomplicated genital chlamydia only. Refer to the GP or sexual health service.",
    });
  }

  const doxyBlocked = t.tetracyclineHypersensitivity || t.unableToComplyOrSwallow || t.doxycyclineUnsuitable;

  if (t.medicine === "doxycycline") {
    if (t.tetracyclineHypersensitivity) {
      alerts.push({
        severity: "stop",
        code: "STI_TETRACYCLINE_ALLERGY",
        message: "Known hypersensitivity to tetracyclines: doxycycline cannot be supplied",
        detail: "Consider the azithromycin arm if no azithromycin exclusion applies.",
      });
    }
    if (t.unableToComplyOrSwallow) {
      alerts.push({
        severity: "stop",
        code: "STI_DOXY_COMPLIANCE",
        message: "Inability to comply with the 7-day regimen or swallow capsules: doxycycline cannot be supplied",
        detail: "Consider the azithromycin arm if no azithromycin exclusion applies.",
      });
    }
    if (t.doxycyclineUnsuitable) {
      alerts.push({
        severity: "stop",
        code: "STI_DOXY_UNSUITABLE",
        message: "Doxycycline recorded as unsuitable or contraindicated",
        detail: t.doxycyclineUnsuitableReason || "Select the azithromycin arm or refer.",
      });
    }
  }

  if (t.medicine === "azithromycin") {
    if (!doxyBlocked) {
      alerts.push({
        severity: "stop",
        code: "STI_AZITHRO_NOT_INDICATED",
        message: "Azithromycin is only indicated where doxycycline is unsuitable or contraindicated",
        detail: "Record why doxycycline is unsuitable (hypersensitivity, unable to comply with 7 days or swallow capsules, or another reason) or supply doxycycline.",
      });
    }
    if (t.macrolideHypersensitivity) {
      alerts.push({
        severity: "stop",
        code: "STI_MACROLIDE_ALLERGY",
        message: "Known hypersensitivity to macrolides: azithromycin cannot be supplied",
        detail: "Refer to the GP or sexual health service for an alternative (e.g. erythromycin or amoxicillin are outside this PGD).",
      });
    }
    if (t.qtProlongation) {
      alerts.push({
        severity: "stop",
        code: "STI_QT",
        message: "History of QT prolongation or taking interacting QT-prolonging drugs: azithromycin cannot be supplied",
        detail: "Refer to the GP or sexual health service.",
      });
    }
    if (t.ergotDerivatives) {
      alerts.push({
        severity: "stop",
        code: "STI_ERGOT",
        message: "Concurrent use of ergot derivatives: azithromycin cannot be supplied",
        detail: "Refer to the GP or sexual health service.",
      });
    }
  }

  return alerts;
}

export function hasTreatmentStops(state: STIConsultationState): boolean {
  return [...getAgeAlerts(state), ...getTreatmentAlerts(state)].some((a) => a.severity === "stop");
}

// ─── Treatment plan shown and recorded (PGD "Details of the medicine") ───

export interface STITreatmentPlan {
  medicine: Exclude<STITreatmentMedicine, "">;
  product: string;
  dose: string;
  quantity: string;
  duration: string;
  route: string;
  cautions: string[];
}

export function getTreatmentPlan(state: STIConsultationState): STITreatmentPlan | null {
  const t = state.treatment;
  if (!t.treatUnderPgd || !t.medicine) return null;
  if (t.medicine === "doxycycline") {
    return {
      medicine: "doxycycline",
      product: "Doxycycline 100mg capsules",
      dose: "100 mg twice daily for 7 days",
      quantity: "14 capsules",
      duration: "7 days continuous course",
      route: "Oral, with a full glass of water while sitting or standing",
      cautions: [
        "Take with water and remain upright for 30 minutes to avoid oesophageal irritation.",
        "Avoid sun exposure during and after treatment (photosensitivity).",
        "Abstain from sexual activity until treatment and partner treatment are completed.",
        "Use effective contraception during and for 7 days after completing the course.",
      ],
    };
  }
  return {
    medicine: "azithromycin",
    product: "Azithromycin 500mg tablets",
    dose: "1 g (two 500 mg tablets) on day 1, then 500 mg (one tablet) once daily on days 2 and 3. Total 2 g over 3 days.",
    quantity: "4 x 500 mg tablets (total 2 g)",
    duration: "3 days",
    route: "Oral, with or without food",
    cautions: [
      "Use with caution in mild to moderate liver or kidney impairment.",
      "Do not take antacids 2 hours before or after a dose.",
      "Abstain from sexual activity for 7 days after treatment and until partners are treated.",
      "Test of cure if symptoms persist or in pregnancy.",
    ],
  };
}

// ─── Get all clinical alerts ───

export function getAllAlerts(state: STIConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  alerts.push(...getAgeAlerts(state));
  alerts.push(...getTreatmentAlerts(state));

  // Recommendation: MSM should have regular testing
  if (state.riskAssessment.msmStatus) {
    alerts.push({
      severity: "caution",
      code: "STI_MSM",
      message: "MSM patients should have regular STI screening",
      detail: "Recommend 3-6 monthly testing for sexually active MSM.",
    });
  }

  // Recommendation: Current symptoms suggest symptomatic screening
  if (state.clinicalAssessment.systemicSymptoms) {
    alerts.push({
      severity: "caution",
      code: "STI_SYSTEMIC",
      message: "Systemic symptoms present",
      detail: "May indicate acute infection or other conditions. Counsel appropriately.",
    });
  }

  return alerts;
}

// ─── Determine recommended tests based on risk assessment ───

export function getRecommendedTests(state: STIConsultationState): string[] {
  const tests: string[] = [];

  // Symptomatic or high-risk patients: comprehensive screening
  if (
    state.clinicalAssessment.urethralDischarge ||
    state.clinicalAssessment.genitalPain ||
    state.clinicalAssessment.rectalSymptoms ||
    state.clinicalAssessment.pharyngealSymptoms ||
    (state.riskAssessment.numberOfPartners !== null && state.riskAssessment.numberOfPartners > 1) ||
    state.riskAssessment.msmStatus ||
    state.riskAssessment.sexWorker ||
    state.riskAssessment.pwid
  ) {
    tests.push("Chlamydia/Gonorrhoea (CT/GC)");
    tests.push("HIV");
    tests.push("Syphilis");
  }

  // All patients
  if (state.testSelection.ctGc) {
    tests.push("Chlamydia/Gonorrhoea (CT/GC)");
  }
  if (state.testSelection.hiv) {
    tests.push("HIV");
  }
  if (state.testSelection.syphilis) {
    tests.push("Syphilis");
  }
  if (state.testSelection.hepatitisB) {
    tests.push("Hepatitis B");
  }
  if (state.testSelection.hepatitisC) {
    tests.push("Hepatitis C");
  }

  return [...new Set(tests)];
}

// ─── Get window period information ───

export function getWindowPeriodInfo(): { [key: string]: string } {
  return {
    "Chlamydia/Gonorrhoea": "Window period: 2 weeks. Early infection may not be detected.",
    HIV: "Window period: 45 days for 4th generation (Ab+Ag) tests. Acute infection may not be detected.",
    Syphilis: "Window period: 12 weeks from infection. Early syphilis may test negative.",
    "Hepatitis B": "Window period: 12 weeks. Recent infection may not be detected.",
    "Hepatitis C": "Window period: 12 weeks. Recent infection may not be detected.",
  };
}
