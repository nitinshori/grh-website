"use client";

import type { AnxietyPropranololConsultationState } from "../lib/anxiety-propranolol-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AnxietyPropranololSummaryReportProps {
  state: AnxietyPropranololConsultationState;
}

export function AnxietyPropranololSummaryReport({ state }: AnxietyPropranololSummaryReportProps) {
  const { patient, assessment, medicineSupply, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Anxiety — Propranolol ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record
        </p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age} years`} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Anxiety Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Anxiety Type" value={assessment.anxietyType || "Not assessed"} />
          <Row label="Trigger Situation" value={assessment.triggerSituation || "Not recorded"} />
          <Row label="Physical Symptoms" value={assessment.physicalSymptoms || "Not recorded"} />
          <Row label="Frequency" value={assessment.frequencyOfEvents || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Medicine" value="Propranolol tablet" />
          <Row label="Dose" value="10–40mg PRN" />
          <Row label="Timing" value="30–60 minutes before anxiety-provoking situation" />
          <Row label="Quantity" value={medicineSupply.quantity ? `${medicineSupply.quantity} tablets` : "Not specified"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["PRN use only — not daily/regular", counselling.prnUseOnly],
            ["Reduces physical symptoms (tremor, palpitations, sweating)", counselling.physicalSymptoms],
            ["Does not cause dependence at PRN doses", counselling.noDependence],
            ["Do not stop suddenly if used regularly", counselling.noSuddenWithdrawal],
            ["Do NOT use with verapamil", counselling.avoidVerapamil],
          ]}
        />
      </div>

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <PharmacistDeclaration
          pgdName="Anxiety — Propranolol"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Anxiety — Propranolol" />
      </div>
    </div>
  );
}
