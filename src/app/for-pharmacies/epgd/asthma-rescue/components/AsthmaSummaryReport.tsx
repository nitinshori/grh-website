"use client";

import type { AsthmaConsultationState } from "../lib/asthma-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AsthmaSummaryReportProps {
  state: AsthmaConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function AsthmaSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: AsthmaSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          Asthma Rescue (Salbutamol) — Consultation Record
        </h2>
        <p className="text-gray-500">
          Get Real Health ePGD Consultation Tool
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Row
            label="Name"
            value={`${state.patient.firstName} ${state.patient.lastName}`}
          />
          <Row label="Date of Birth" value={state.patient.dateOfBirth} />
          <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        </div>
        <div>
          <Row label="GP Name" value={state.patient.gpName || "—"} />
          <Row label="GP Practice" value={state.patient.gpPractice || "—"} />
          <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        </div>
      </div>

      {/* Consultation Details */}
      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Asthma Assessment */}
      <SectionHeader>Asthma Assessment</SectionHeader>
      <Row
        label="Existing asthma diagnosis"
        value={state.assessment.hasExistingDiagnosis ? "Yes" : "No"}
      />
      <Row
        label="Normally uses SABA"
        value={state.assessment.normallyUsesSABA ? "Yes" : "No"}
      />
      <Row
        label="Current SABA medication"
        value={state.assessment.currentSABAMedication || "—"}
      />
      <Row label="Reason for supply" value={state.assessment.reasonForSupply || "—"} />
      <Row
        label="Frequent use (&gt;3 days/week)"
        value={state.assessment.frequentUse ? "Yes" : "No"}
      />
      <Row
        label="Nocturnal symptoms"
        value={state.assessment.nocturnalSymptoms ? "Yes" : "No"}
      />
      <Row
        label="Activity limitation"
        value={state.assessment.activityLimitation ? "Yes" : "No"}
      />

      {/* Medical History */}
      <SectionHeader>Medical History</SectionHeader>
      <Row label="Asthma documented" value={state.medicalHistory.hasAsthmaRecord ? "Yes" : "No"} />
      <Row
        label="Other respiratory conditions"
        value={state.medicalHistory.otherRespiratoryConditions || "None reported"}
      />
      <Row label="Allergies" value={state.medicalHistory.allergies || "None reported"} />
      <Row label="Other conditions" value={state.medicalHistory.otherConditions || "None"} />

      {/* Red Flags */}
      <SectionHeader>Red Flags Assessment</SectionHeader>
      <Row
        label="Increasing use"
        value={state.redFlags.increasingUse ? "Yes — Refer" : "No"}
      />
      <Row
        label="Nocturnal wakenings"
        value={state.redFlags.nocturnalWakenings ? "Yes — Refer" : "No"}
      />
      <Row
        label="Activity limitation"
        value={state.redFlags.activityLimitation ? "Yes — Refer" : "No"}
      />
      <Row
        label="No existing diagnosis"
        value={state.redFlags.noExistingDiagnosis ? "Yes — STOP" : "No"}
      />
      <Row
        label="Never used salbutamol"
        value={state.redFlags.neverUsedSalbutamolBefore ? "Yes — STOP" : "No"}
      />

      {/* Medicine Supply */}
      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
          <Row label="Duration" value={doseRecommendation.duration || "—"} />
          <Row label="Reason" value={doseRecommendation.reason} />
        </>
      )}

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Reliever only, not preventer", state.counselling.relieverNotPreventer],
          [
            "Inhaler technique demonstrated",
            state.counselling.inhalerTechniqueDemonstration,
          ],
          ["Rinse mouth after use", state.counselling.rinseMouthAfterUse],
          ["Spacer use recommended", state.counselling.spacerUse],
          [
            "Seek urgent care if not resolving",
            state.counselling.seekUrgentCareIfNotResolving,
          ],
        ]}
      />

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Asthma Rescue (Salbutamol)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="Asthma Rescue (Salbutamol)" />
    </div>
  );
}
