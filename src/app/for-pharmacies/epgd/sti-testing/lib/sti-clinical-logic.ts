// ─── STI Testing Clinical Logic ───

import type { ClinicalAlert } from "../../shared/types";
import type { STIConsultationState } from "./sti-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: STIConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

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
