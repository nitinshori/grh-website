import type { TRTConsultationState } from "./trt-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: TRTConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.prostateCancer) {
    alerts.push({
      severity: "stop",
      code: "TRT_PROSTATE_CANCER",
      message: "History of prostate cancer",
      detail: "Contraindicated. Testosterone increases risk of progression",
    });
  }

  if (state.assessment.breastCancer) {
    alerts.push({
      severity: "stop",
      code: "TRT_BREAST_CANCER",
      message: "History of breast cancer",
      detail: "Contraindicated due to androgen sensitivity",
    });
  }

  if (state.assessment.polycythaemia) {
    alerts.push({
      severity: "stop",
      code: "TRT_POLYCYTHAEMIA",
      message: "Polycythaemia (Hct &gt;54%)",
      detail: "Contraindicated. Risk of thrombotic complications",
    });
  }

  if (state.assessment.psa !== null && state.assessment.psa > 4) {
    alerts.push({
      severity: "caution",
      code: "TRT_PSA_ELEVATED",
      message: "PSA &gt; 4 ng/mL",
      detail: "Requires urology assessment before starting TRT",
    });
  }

  return alerts;
}

export function hasHardStops(state: TRTConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}
