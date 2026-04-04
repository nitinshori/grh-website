"use client";

import type { AcneConsultationState } from "../lib/acne-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AcneSummaryReportProps {
  state: AcneConsultationState;
}

export function AcneSummaryReport({ state }: AcneSummaryReportProps) {
  const { patient, assessment, medicalHistory, medicineSelection, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Acne Treatment ePGD</h1>
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

      {/* Clinical Assessment */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Severity" value={assessment.severity || "Not assessed"} />
          <Row label="Affected Area" value={assessment.affectedArea || "Not recorded"} />
          <div className="py-1.5">
            <dt className="text-xs font-medium text-gray-500 mb-1">Acne Manifestations</dt>
            <dd className="text-xs text-navy-900">
              {[
                assessment.comedones && "Comedones",
                assessment.inflammatoryPapules && "Inflammatory papules",
                assessment.pustules && "Pustules",
                assessment.nodalCystic && "Nodal/cystic lesions",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"}
            </dd>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Previous Treatments" value={medicalHistory.previousTreatments || "None recorded"} />
          <Row label="Allergies" value={medicalHistory.allergies || "NKDA"} />
          {medicalHistory.sensitiveToRetinoids && (
            <Row label="Retinoid Sensitivity" value="Confirmed — proceed with caution" />
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
          <Row label="Medicine" value={medicineSelection.medicineChoice || "Not selected"} />
          {medicineSelection.inadequateResponse && (
            <>
              <Row label="Inadequate Response" value="Documented" />
              <Row
                label="Lymecycline Added"
                value={medicineSelection.addLymecycline ? "Yes — 408mg OD for 12 weeks" : "No"}
              />
            </>
          )}
        </div>
      </div>

      {/* Counselling Provided */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["6–8 weeks to see improvement", counselling.improvementTimeline],
            ["Photosensitivity warning (retinoids)", counselling.photosensitivity],
            ["Avoid excess washing", counselling.washingAdvice],
            ["Use non-comedogenic products", counselling.productAdvice],
            ["Complete antibiotic course (if prescribed)", counselling.courseCompletion],
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
          pgdName="Acne Treatment"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Acne Treatment" />
      </div>
    </div>
  );
}
