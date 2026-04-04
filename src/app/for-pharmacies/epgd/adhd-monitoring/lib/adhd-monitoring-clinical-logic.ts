import type { ClinicalAlert } from "../../shared/types";
import type { ADHDMonitoringMonitoring } from "./adhd-monitoring-types";

export function getMonitoringAlerts(monitoring: ADHDMonitoringMonitoring): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (monitoring.currentHR !== null && monitoring.currentHR > 100) {
    alerts.push({ severity: "red-flag", code: "HR_ELEVATED", message: "HR &gt; 100 bpm — RED FLAG", detail: "Consider dose reduction or GP review." });
  }
  if (monitoring.currentBP && monitoring.currentBP.split("/")[0] && parseInt(monitoring.currentBP.split("/")[0]) > 140) {
    alerts.push({ severity: "red-flag", code: "BP_ELEVATED", message: "BP &gt; 140/90 — RED FLAG", detail: "Consider dose reduction or GP review." });
  }
  if (monitoring.ticsDeveloped) {
    alerts.push({ severity: "caution", code: "TICS_DEVELOPED", message: "New or worsening tics — caution", detail: "Discuss with GP; may need dose adjustment." });
  }
  if (monitoring.moodChanges) {
    alerts.push({ severity: "caution", code: "MOOD_CHANGES", message: "Mood changes reported", detail: "Assess severity; may need review." });
  }
  if (monitoring.redFlagsPresent) {
    alerts.push({ severity: "stop", code: "RED_FLAG_PRESENT", message: "Severe adverse event — STOP", detail: "Escalate to GP immediately." });
  }
  return alerts;
}

export function getAllAlerts(monitoring: ADHDMonitoringMonitoring): ClinicalAlert[] {
  return getMonitoringAlerts(monitoring);
}

export function hasHardStops(monitoring: ADHDMonitoringMonitoring): boolean {
  return !!monitoring.redFlagsPresent || (monitoring.currentHR !== null && monitoring.currentHR > 100) || !!(monitoring.currentBP && parseInt(monitoring.currentBP.split("/")[0]) > 140);
}
