"use client";

import type { ADHDMonitoringConsultationState } from "../lib/adhd-monitoring-types";
import type { ClinicalAlert } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

interface Props {
  state: ADHDMonitoringConsultationState;
  alerts: ClinicalAlert[];
}

export function ADHDMonitoringSummaryReport({ state, alerts }: Props) {
  const { patient, assessment, monitoring, summary } = state;
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">ADHD Medication Monitoring Record</h1>
        <p className="text-xs text-gray-500 mt-1">Patient: {patient.firstName} {patient.lastName}</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years` : "N/A"} />
      <Row label="GP" value={patient.gpName || "Not provided"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Current Medication</SectionHeader>
      <Row label="Medication" value={assessment.currentMedication || "Not documented"} />
      <Row label="Current Dose" value={assessment.currentDose || "Not documented"} />

      <SectionHeader>Baseline Assessment</SectionHeader>
      <Row label="Baseline Heart Rate" value={assessment.baselineHR ? `${assessment.baselineHR} bpm` : "Not recorded"} />
      <Row label="Baseline Blood Pressure" value={assessment.baselineBP || "Not recorded"} />
      <Row label="Baseline Weight" value={assessment.baselineWeight ? `${assessment.baselineWeight} kg` : "Not recorded"} />

      <SectionHeader>Current Monitoring Parameters</SectionHeader>
      <Row label="Heart Rate" value={monitoring.currentHR ? `${monitoring.currentHR} bpm` : "Not recorded"} />
      <Row label="Blood Pressure" value={monitoring.currentBP || "Not recorded"} />
      <Row label="Weight" value={monitoring.currentWeight ? `${monitoring.currentWeight} kg` : "Not recorded"} />
      <Row label="Appetite" value={monitoring.appetite || "Not documented"} />
      <Row label="Sleep Quality" value={monitoring.sleepQuality || "Not documented"} />
      <Row label="Mood Changes Reported" value={monitoring.moodChanges ? "Yes" : "No"} />
      <Row label="New/Worsening Tics" value={monitoring.ticsDeveloped ? "Yes" : "No"} />

      <PharmacistDeclaration
        pgdName="ADHD Monitoring"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC}
        pharmacyName={summary.pharmacyName}
      />

      <SectionHeader>Clinical Notes</SectionHeader>
      <div className="text-xs text-navy-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
        {summary.clinicalNotes || "No additional notes"}
      </div>

      <ReportFooter pgdName="ADHD Monitoring" />
    </div>
  );
}
