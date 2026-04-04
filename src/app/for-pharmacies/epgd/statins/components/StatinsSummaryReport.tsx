"use client";

import type { StatinsConsultationState } from "../lib/statins-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

interface StatinsSummaryReportProps {
  state: StatinsConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function StatinsSummaryReport({ state, alerts, doseRecommendation }: StatinsSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">Statin Continuation — Consultation Record</h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
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

      <SectionHeader>Lipid Assessment</SectionHeader>
      <Row label="Existing prescription" value={state.assessment.hasExistingPrescription ? "Yes" : "No"} />
      <Row label="Last lipid profile (months ago)" value={state.assessment.lastLipidProfileMonths?.toString() || "—"} />
      <Row label="Total cholesterol" value={state.assessment.totalCholesterol ? `${state.assessment.totalCholesterol} mg/dL` : "—"} />
      <Row label="LDL" value={state.assessment.ldl ? `${state.assessment.ldl} mg/dL` : "—"} />
      <Row label="HDL" value={state.assessment.hdl ? `${state.assessment.hdl} mg/dL` : "—"} />
      <Row label="Triglycerides" value={state.assessment.triglycerides ? `${state.assessment.triglycerides} mg/dL` : "—"} />
      <Row label="Current statin" value={state.assessment.currentStatin || "—"} />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="Active liver disease" value={state.medicalHistory.activeLiverDisease ? "Yes" : "No"} />
      <Row label="Elevated transaminases" value={state.medicalHistory.elevatedTransaminases ? "Yes" : "No"} />
      <Row label="Pregnant/breastfeeding" value={state.medicalHistory.pregnant || state.medicalHistory.breastfeeding ? "Yes" : "No"} />
      <Row label="CKD/renal impairment" value={state.medicalHistory.ckrenal ? "Yes" : "No"} />
      <Row label="Elderly &gt;80" value={state.medicalHistory.elderly80Plus ? "Yes" : "No"} />
      <Row label="Hypothyroidism" value={state.medicalHistory.hypothyroidism ? "Yes" : "No"} />
      <Row label="High alcohol intake" value={state.medicalHistory.highAlcoholIntake ? "Yes" : "No"} />

      <SectionHeader>Red Flags Assessment</SectionHeader>
      <Row label="Unexplained muscle pain" value={state.redFlags.unexplainedMusclePain ? "Yes — STOP & Refer" : "No"} />
      <Row label="History of myopathy" value={state.redFlags.myopathy ? "Yes — STOP" : "No"} />
      <Row label="New diabetes symptoms" value={state.redFlags.newDiabetesSymptoms ? "Yes — Refer" : "No"} />
      <Row label="Yellowing skin/eyes" value={state.redFlags.yellowing ? "Yes — STOP & Refer" : "No"} />

      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid items={[
        ["Take at time of preference (atorvastatin)", state.counselling.takeAtNightOrAnytime],
        ["Report unexplained muscle pain immediately", state.counselling.reportMusclePain],
        ["Annual blood test (LFTs &amp; lipids)", state.counselling.annualBloodTest],
        ["Lifestyle measures (diet, exercise, weight)", state.counselling.lifestyleMeasures],
      ]} />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      <PharmacistDeclaration pgdName="Statin Continuation" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />

      <ReportFooter pgdName="Statin Continuation" />
    </div>
  );
}
