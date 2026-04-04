"use client";

import type { DiabetesConsultationState } from "../lib/diabetes-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

interface DiabetesSummaryReportProps {
  state: DiabetesConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function DiabetesSummaryReport({ state, alerts, doseRecommendation }: DiabetesSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">Diabetes Monitoring + Metformin — Consultation Record</h2>
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

      <SectionHeader>Diabetes Assessment</SectionHeader>
      <Row label="Type 2 DM diagnosis" value={state.assessment.hasExistingT2DM ? "Yes" : "No"} />
      <Row label="Stable on metformin (months)" value={state.assessment.stableOnMetforminMonths?.toString() || "—"} />
      <Row label="Current metformin dose" value={state.assessment.currentMetforminDose || "—"} />
      <Row label="Last HbA1c (months ago)" value={state.assessment.lastHbA1cMonths?.toString() || "—"} />
      <Row label="Last HbA1c value" value={state.assessment.lastHbA1cValue ? `${state.assessment.lastHbA1cValue} mmol/mol` : "—"} />
      <Row label="Last eGFR (months ago)" value={state.assessment.lastEgfrMonths?.toString() || "—"} />
      <Row label="Last eGFR value" value={state.assessment.lastEgfrValue ? `${state.assessment.lastEgfrValue} mL/min/1.73m²` : "—"} />
      <Row label="Weight" value={state.assessment.weight ? `${state.assessment.weight} kg` : "—"} />
      <Row label="Systolic BP" value={state.assessment.systolicBP ? `${state.assessment.systolicBP} mmHg` : "—"} />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="Type 2 DM documented" value={state.medicalHistory.diabetesDiagnosed ? "Yes" : "No"} />
      <Row label="DKA history" value={state.medicalHistory.dka ? "Yes" : "No"} />
      <Row label="Severe hepatic impairment" value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"} />
      <Row label="Recent dehydration/sepsis/MI" value={state.medicalHistory.dehydration || state.medicalHistory.sepsis || state.medicalHistory.myocardialInfarction ? "Yes" : "No"} />

      <SectionHeader>Red Flags Assessment</SectionHeader>
      <Row label="eGFR &lt;30" value={state.redFlags.egfrBelow30 ? "Yes — STOP" : "No"} />
      <Row label="HbA1c &gt;75 mmol/mol" value={state.redFlags.hbA1cPoorControl ? "Yes — Refer" : "No"} />
      <Row label="Lactic acidosis symptoms" value={state.redFlags.lacticAcidosisSymptoms ? "Yes — STOP & Urgent Ref" : "No"} />
      <Row label="Acute conditions" value={state.redFlags.acuteConditions ? "Yes — STOP" : "No"} />

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
        ["Take with food (standard) or as directed (MR)", state.counselling.takeWithFood],
        ["GI intolerance management", state.counselling.giIntolerance],
        ["Sick day rules explained", state.counselling.sickDayRules],
        ["Alcohol moderation advised", state.counselling.alcoholModeration],
        ["Annual review (eyes, feet, kidneys)", state.counselling.annualReview],
      ]} />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      <PharmacistDeclaration pgdName="Diabetes Monitoring + Metformin" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />

      <ReportFooter pgdName="Diabetes Monitoring + Metformin" />
    </div>
  );
}
