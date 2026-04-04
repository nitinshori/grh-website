"use client";

import type { SleepMelatoninConsultationState } from "../lib/sleep-melatonin-types";
import type { ClinicalAlert } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

interface SleepMelatoninSummaryReportProps {
  state: SleepMelatoninConsultationState;
  alerts: ClinicalAlert[];
}

export function SleepMelatoninSummaryReport({ state, alerts }: SleepMelatoninSummaryReportProps) {
  const { patient, assessment, prescription, counselling, summary } = state;
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">Sleep Support — Melatonin Consultation Record</h1>
        <p className="text-xs text-gray-500 mt-1">Patient: {patient.firstName} {patient.lastName} | Age: {patient.age} years</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years` : "N/A"} />
      <Row label="DOB" value={patient.dateOfBirth} />
      <Row label="GP" value={patient.gpName || "Not provided"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Sleep Assessment</SectionHeader>
      <Row label="Sleep Onset Issue" value={assessment.sleepOnsetIssue ? "Yes" : "No"} />
      <Row label="Sleep Maintenance Issue" value={assessment.sleepMaintenanceIssue ? "Yes" : "No"} />
      <Row label="Duration of Insomnia" value={assessment.durationOfInsomnia || "Not documented"} />
      <Row label="Sleep Hygiene Attempted" value={assessment.sleepHygieneAttempted ? "Yes" : "No"} />

      <SectionHeader>Prescription Details</SectionHeader>
      <Row label="Product" value={prescription.product} />
      <Row label="Dose" value={prescription.dose} />
      <Row label="Frequency" value={prescription.frequency} />
      <Row label="Duration" value={prescription.duration} />

      <SectionHeader>Counselling Delivered</SectionHeader>
      <CounsellingGrid
        items={[
          ["Sleep hygiene reinforced as first-line", counselling.sleepHygieneReinforcedFirstLine],
          ["Avoid screens 1–2 hours before bed", counselling.avoidScreensAdvised],
          ["Gradual tapering if stopping", counselling.taperedStoppingAdvised],
          ["Not a sedative — promotes natural sleep", counselling.notASedativeExplained],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Sleep Support - Melatonin"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC}
        pharmacyName={summary.pharmacyName}
      />

      <SectionHeader>Clinical Notes</SectionHeader>
      <div className="text-xs text-navy-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
        {summary.clinicalNotes || "No additional notes"}
      </div>

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={summary.consultationDate} />
      <Row label="Time" value={summary.consultationTime} />

      <ReportFooter pgdName="Sleep Support - Melatonin" />
    </div>
  );
}
