"use client";

import type { COPDConsultationState } from "../lib/copd-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface COPDSummaryReportProps {
  state: COPDConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function COPDSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: COPDSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          COPD Symptom Management — Consultation Record
        </h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
      </div>

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

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>COPD Assessment</SectionHeader>
      <Row label="Existing COPD diagnosis" value={state.assessment.hasExistingDiagnosis ? "Yes" : "No"} />
      <Row
        label="MRC breathlessness scale"
        value={state.assessment.mrcBreathlessnessScale ? `Grade ${state.assessment.mrcBreathlessnessScale}` : "—"}
      />
      <Row
        label="Exacerbation frequency"
        value={state.assessment.exacerbationFrequency || "—"}
      />
      <Row
        label="Current inhaler regimen"
        value={state.assessment.currentInhalerRegimen || "—"}
      />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="COPD documented" value={state.medicalHistory.copdDocumented ? "Yes" : "No"} />
      <Row label="Smoking status" value={state.medicalHistory.smokingStatus || "—"} />
      <Row
        label="Other respiratory conditions"
        value={state.medicalHistory.otherRespiratoryConditions || "None"}
      />
      <Row label="Other conditions" value={state.medicalHistory.otherConditions || "None"} />

      <SectionHeader>Red Flags Assessment</SectionHeader>
      <Row
        label="MRC Grade 5"
        value={state.redFlags.mrcGrade5 ? "Yes — STOP" : "No"}
      />
      <Row
        label="Suspected exacerbation"
        value={state.redFlags.suspectedExacerbation ? "Yes — STOP" : "No"}
      />
      <Row
        label="New haemoptysis"
        value={state.redFlags.newHaemoptysis ? "Yes — Refer" : "No"}
      />
      <Row
        label="Weight loss"
        value={state.redFlags.weightLoss ? "Yes — Refer" : "No"}
      />
      <Row
        label="Recurrent infections"
        value={state.redFlags.recurrentInfections ? "Yes — Refer" : "No"}
      />

      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
          <Row label="Duration" value={doseRecommendation.duration || "—"} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Not replacement for maintenance therapy", state.counselling.notReplacementForMaintenance],
          ["GP review advised", state.counselling.gpReviewAdvised],
          ["Inhaler technique demonstrated", state.counselling.inhalerTechniqueShown],
          ["Smoking cessation advice given", state.counselling.smokingCessationAdvised],
          ["Symptom management explained", state.counselling.symptomMgmtExplained],
        ]}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      <PharmacistDeclaration
        pgdName="COPD Symptom Management"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="COPD Symptom Management" />
    </div>
  );
}
