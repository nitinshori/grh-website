"use client";

import type { SmokingNRTConsultationState } from "../lib/smoking-nrt-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface SmokingNRTSummaryReportProps {
  state: SmokingNRTConsultationState;
}

export function SmokingNRTSummaryReport({ state }: SmokingNRTSummaryReportProps) {
  const { patient, assessment, nrtSelection, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Smoking Cessation — NRT ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. PGD version 002, issued 11 September 2026: nicotine 24-hour patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear) and nicotine lozenges or gum 2mg and 4mg.
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
        <SectionHeader>Smoking Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Cigarettes/Day" value={assessment.cigarettesPerDay || "—"} />
          <Row label="Time to First Cigarette" value={assessment.timeToFirstCigarette || "Not recorded"} />
          <Row label="Quit Date" value={assessment.quitDate || "Not set"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>NRT Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          {nrtSelection.usePatches && (
            <Row label="Nicotine 24-hour patches" value={`${nrtSelection.patchStrength || "Selected"}${nrtSelection.patchQuantity ? `, ${nrtSelection.patchQuantity} patches` : ""}`} />
          )}
          {nrtSelection.useOralForm && (
            <Row label="Oral NRT" value={`${nrtSelection.oralFormType || "Selected"} ${nrtSelection.oralStrength}${nrtSelection.oralQuantity ? `, ${nrtSelection.oralQuantity} pieces` : ""}`} />
          )}
          <Row label="Course" value="8 to 12 weeks; review at 2 weeks, 4 weeks, then regularly" />
          <Row label="Combination Therapy" value={nrtSelection.combinationTherapy ? "Yes" : "No"} />
          <Row label="Behavioral Support" value={nrtSelection.behavioralSupport ? "Arranged" : "Not arranged"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Combination therapy more effective than single form", counselling.combinationBetter],
            ["Quit date set and discussed", counselling.quitDate],
            ["Behavioral/psychological support arranged", counselling.behavioralSupport],
            ["Side effects and product-specific advice explained", counselling.sideEffects],
            ["Continue for the full 8 to 12 weeks; step-down explained", counselling.courseDuration],
            ["Correct technique explained", counselling.correctTechnique],
            ["Use enough NRT", counselling.useEnough],
            ["Do not smoke while using NRT", counselling.doNotSmoke],
            ["Withdrawal symptoms improve within 2 to 3 weeks", counselling.withdrawalSymptoms],
            ["Driving if dizzy; glucose monitoring if diabetic", counselling.drivingWarning],
            ["Seek immediate attention for chest pain, palpitations, breathlessness", counselling.cardiovascularSymptoms],
            ["Report severe skin reactions or oral irritation", counselling.reportReactions],
            ["Inform if pregnant or planning pregnancy", counselling.pregnancyAdvice],
            ["Follow-up at 2 weeks, 4 weeks, monthly; PIL supplied", counselling.followUpSchedule],
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
          pgdName="Smoking Cessation — NRT"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Smoking Cessation — NRT" />
      </div>
    </div>
  );
}
