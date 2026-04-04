"use client";

import type { HypertensionConsultationState } from "../lib/hypertension-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HypertensionSummaryReportProps {
  state: HypertensionConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export function HypertensionSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: HypertensionSummaryReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          Hypertension Monitoring + Amlodipine — Consultation Record
        </h2>
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

      <SectionHeader>BP Assessment</SectionHeader>
      <Row label="Existing hypertension diagnosis" value={state.assessment.hasExistingDiagnosis ? "Yes" : "No"} />
      <Row label="Stable on treatment (months)" value={state.assessment.stableOnTreatmentMonths?.toString() || "—"} />
      <Row
        label="Clinic BP"
        value={state.assessment.clinicSystolic && state.assessment.clinicDiastolic
          ? `${state.assessment.clinicSystolic}/${state.assessment.clinicDiastolic} mmHg`
          : "—"
        }
      />
      <Row
        label="Home BP"
        value={state.assessment.homeSystolic && state.assessment.homeDiastolic
          ? `${state.assessment.homeSystolic}/${state.assessment.homeDiastolic} mmHg`
          : "—"
        }
      />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="BP documented" value={state.medicalHistory.bpDocumented ? "Yes" : "No"} />
      <Row label="Heart failure" value={state.medicalHistory.heartFailure ? "Yes" : "No"} />
      <Row label="Severe aortic stenosis" value={state.medicalHistory.severeAorticStenosis ? "Yes" : "No"} />
      <Row label="Other conditions" value={state.medicalHistory.otherConditions || "None"} />

      <SectionHeader>Red Flags Assessment</SectionHeader>
      <Row label="BP &gt;180/110" value={state.redFlags.bpGreater180110 ? "Yes — URGENT REFERRAL" : "No"} />
      <Row label="New chest pain" value={state.redFlags.newChestPain ? "Yes — Refer" : "No"} />
      <Row label="Severe headache" value={state.redFlags.severeHeadache ? "Yes — Refer" : "No"} />
      <Row label="Visual changes" value={state.redFlags.visualChanges ? "Yes — Urgent Refer" : "No"} />

      <SectionHeader>Monitoring Review</SectionHeader>
      <Row label="Home monitoring done" value={state.monitoring.homeMonitoringDone ? "Yes" : "No"} />
      <Row label="Monitoring regularity" value={state.monitoring.regularity || "—"} />
      <Row label="Readings accurate" value={state.monitoring.bpReadingsAccurate ? "Yes" : "No"} />

      {doseRecommendation && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          <Row label="Medicine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || "—"} />
        </>
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Ankle swelling explained (not dangerous)", state.counselling.ankleSwellingExplained],
          ["Take at same time daily", state.counselling.takeAtSameTime],
          ["Grapefruit interaction warned", state.counselling.grapefruitmInteractionWarned],
          ["Regular monitoring advised (6-monthly)", state.counselling.regularMonitoring],
          ["Lifestyle advice given (salt, exercise, weight)", state.counselling.lifestyleAdvice],
          ["Do not stop suddenly", state.counselling.doNotStopSuddenly],
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
        pgdName="Hypertension Monitoring + Amlodipine"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="Hypertension Monitoring + Amlodipine" />
    </div>
  );
}
