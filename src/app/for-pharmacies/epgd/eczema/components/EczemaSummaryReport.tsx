"use client";

import type { EczemaConsultationState } from "../lib/eczema-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface EczemaSummaryReportProps {
  state: EczemaConsultationState;
}

export function EczemaSummaryReport({ state }: EczemaSummaryReportProps) {
  const { patient, assessment, medicalHistory, medicineSelection, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Eczema Flare Management ePGD</h1>
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
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
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
        <SectionHeader>Eczema Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Severity" value={assessment.severity || "Not assessed"} />
          <Row label="Affected Site" value={assessment.affectedSite || "Not recorded"} />
          <div className="py-1.5">
            <dt className="text-xs font-medium text-gray-500 mb-1">Manifestations</dt>
            <dd className="text-xs text-navy-900">
              {[
                assessment.isDry && "Dry",
                assessment.isRed && "Red/inflamed",
                assessment.isThickened && "Thickened skin",
                assessment.isCracked && "Cracked",
                assessment.isOozing && "Oozing/weeping",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"}
            </dd>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Previous Treatments" value={medicalHistory.previousTreatments || "None recorded"} />
          <Row label="Allergies" value={medicalHistory.allergies || "NKDA"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Emollient First" value={medicineSelection.emollientFirst ? "Yes" : "Not confirmed"} />
          <Row label="Steroid" value={medicineSelection.steroidChoice || "Not specified"} />
          {medicineSelection.addFusicidAcid && (
            <Row label="Fusidic Acid 2%" value="Yes (if secondary bacterial infection)" />
          )}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Emollient as base — most important", counselling.emollientFirst],
            ["Fingertip unit dosing for steroids", counselling.fingertipUnits],
            ["Apply steroid thinly to avoid side effects", counselling.applyThinly],
            ["Step-down approach (reduce frequency)", counselling.stepDownApproach],
            ["Avoid known triggers (irritants, allergens)", counselling.avoidTriggers],
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
          pgdName="Eczema Flare Management"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Eczema Flare Management" />
      </div>
    </div>
  );
}
