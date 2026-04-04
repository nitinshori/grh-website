"use client";

import type { TestosteroneWomenConsultationState } from "../lib/testosterone-women-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface TestosteroneWomenSummaryReportProps {
  state: TestosteroneWomenConsultationState;
  alerts: ClinicalAlert[];
}

export function TestosteroneWomenSummaryReport({ state, alerts }: TestosteroneWomenSummaryReportProps) {
  const { patient, assessment, prescription, monitoring, summary } = state;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">
          Testosterone for Women Consultation Record
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Patient: {patient.firstName} {patient.lastName} | Age: {patient.age} years
        </p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years` : "N/A"} />
      <Row label="DOB" value={patient.dateOfBirth} />
      <Row label="NHS Number" value={patient.nhsNumber || "Not provided"} />
      <Row label="GP" value={patient.gpName || "Not provided"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Menopausal Assessment</SectionHeader>
      <Row label="Female (confirmed)" value={assessment.femaleConfirmed ? "Yes" : "No"} />
      <Row label="Age &gt;=40 (confirmed)" value={assessment.ageConfirmed ? "Yes" : "No"} />
      <Row label="Menopausal Status" value={assessment.menopausalStatus || "N/A"} />
      <Row label="Libido Dysfunction" value={assessment.libioDysfunction ? "Yes" : "No"} />
      <Row label="Current HRT Type" value={assessment.hrtType || "Not documented"} />
      <Row label="Duration on HRT" value={assessment.onHRTDuration ? `${assessment.onHRTDuration} months` : "Not documented"} />

      <SectionHeader>Contraindications Assessment</SectionHeader>
      <CounsellingGrid
        items={[
          ["Breast cancer history", false],
          ["Endometrial cancer history", false],
          ["Active liver disease", false],
          ["Pregnancy", false],
        ]}
      />

      <SectionHeader>Prescription Details</SectionHeader>
      <Row label="Product" value={prescription.productName || "Not specified"} />
      <Row label="Strength" value={prescription.strength} />
      <Row label="Dosage" value={prescription.dosage} />
      <Row label="Frequency" value={prescription.frequency} />
      <Row label="Application Site" value={prescription.applicationSite || "Not specified"} />
      <Row label="Review Period" value={prescription.duration} />

      <SectionHeader>Monitoring Plan</SectionHeader>
      <CounsellingGrid
        items={[
          ["Baseline testosterone level checked", monitoring.baselineTestosteroneLevel],
          ["6-month follow-up planned", monitoring.sixMonthFollowUpPlanned],
          ["Levels should remain in female range", monitoring.levelsShouldRemainInFemaleRange],
          ["Side effects discussed", monitoring.sideEffectsDiscussed],
        ]}
      />

      <SectionHeader>Key Counselling Points Covered</SectionHeader>
      <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
        <li>Pea-sized amount applied daily to clean, dry skin</li>
        <li>May cause facial hypertrichosis in some women</li>
        <li>Monitor for virilisation symptoms</li>
        <li>Baseline testosterone levels before starting</li>
        <li>Review at 3&ndash;6 months to ensure female range</li>
        <li>Continue HRT as prescribed</li>
      </ul>

      <PharmacistDeclaration
        pgdName="Testosterone for Women"
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
      <Row label="Pharmacy" value={summary.pharmacyName || "N/A"} />

      <ReportFooter pgdName="Testosterone for Women" />
    </div>
  );
}
