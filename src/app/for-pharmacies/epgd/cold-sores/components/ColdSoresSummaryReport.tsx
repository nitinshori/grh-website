"use client";

import type { ColdSoresConsultationState } from "../lib/cold-sores-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface ColdSoresSummaryReportProps {
  state: ColdSoresConsultationState;
}

export function ColdSoresSummaryReport({ state }: ColdSoresSummaryReportProps) {
  const { patient, symptomAssessment, medicalHistory, medicineSupply, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Cold Sores — Oral Aciclovir ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record
        </p>
      </div>

      {/* Patient Details */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age} years`} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
        </div>
      </div>

      {/* Consultation Details */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
        </div>
      </div>

      {/* Symptom Assessment */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Symptom Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Episode Type" value={symptomAssessment.isRecurrent ? "Recurrent" : "First episode"} />
          <Row label="Current Symptoms" value={symptomAssessment.currentSymptoms || "Not recorded"} />
          {symptomAssessment.prodromeSigns && (
            <Row label="Hours Since Prodrome" value={`${symptomAssessment.hoursFromProdrome} hours`} />
          )}
        </div>
      </div>

      {/* Medical History */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          {medicalHistory.immunosuppressed && (
            <Row label="Immunosuppression" value="Currently immunosuppressed" />
          )}
          {medicalHistory.renalImpairment && (
            <Row label="Renal Function" value={medicalHistory.renalFunction || "Not detailed"} />
          )}
          {!medicalHistory.immunosuppressed && !medicalHistory.renalImpairment && (
            <Row label="Relevant History" value="No significant contraindications recorded" />
          )}
        </div>
      </div>

      {/* Clinical Alerts */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Recommended */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Medicine" value={`Oral Aciclovir ${medicineSupply.doseChoice || "—"}mg`} />
          <Row label="Dosage" value={`${medicineSupply.doseChoice}mg 5 times daily for 5 days`} />
          <Row label="Quantity" value={medicineSupply.quantity ? `${medicineSupply.quantity} tablets` : "Not specified"} />
        </div>
      </div>

      {/* Counselling Provided */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Start ASAP at first tingle (prodrome)", counselling.startASAP],
            ["Complete full 5-day course", counselling.completeCourse],
            ["Contagious until lesions fully crusted", counselling.contagious],
            ["Avoid kissing &amp; sharing utensils/toothbrush", counselling.avoidSharing],
            ["Sun exposure may trigger recurrence", counselling.sunExposure],
          ]}
        />
      </div>

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      {/* Pharmacist Declaration */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <PharmacistDeclaration
          pgdName="Cold Sores — Oral Aciclovir"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Cold Sores — Oral Aciclovir" />
      </div>
    </div>
  );
}
