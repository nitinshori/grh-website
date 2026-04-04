"use client";

import type { AlcoholReductionConsultationState } from "../lib/alcohol-reduction-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AlcoholReductionSummaryReportProps {
  state: AlcoholReductionConsultationState;
}

export function AlcoholReductionSummaryReport({ state }: AlcoholReductionSummaryReportProps) {
  const { patient, assessment, medicineSupply, counselling, summary, alerts } = state;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Alcohol Reduction — Nalmefene ePGD</h1>
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
        <SectionHeader>Alcohol Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="AUDIT Score" value={`${assessment.auditScore} / 40`} />
          <Row label="Units/Week" value={`${assessment.unitPerWeek} units`} />
          <Row label="Binge Drinking" value={assessment.bingeDrinking ? "Yes" : "No"} />
          <Row label="Dependence Level" value={assessment.dependenceLevel || "Not assessed"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Medicine" value="Nalmefene 18mg" />
          <Row label="Dosing" value="PRN — take 1–2 hours before anticipated drinking" />
          <Row label="Maximum" value="1 tablet per day" />
          <Row label="Quantity" value={medicineSupply.quantity ? `${medicineSupply.quantity} tablets` : "Not specified"} />
          <Row label="Psychosocial Support" value={medicineSupply.psychosocialSupport ? "Arranged" : "Not arranged"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["PRN dosing — not daily", counselling.prnDosing],
            ["Take 1–2 hours before drinking", counselling.beforeDrinking],
            ["Reduces reward/craving, not abstinence-based", counselling.rewardMechanism],
            ["Does NOT cause disulfiram-like reaction", counselling.noDisulfiramReaction],
            ["MUST avoid opioids (blocks effect &amp; causes withdrawal)", counselling.avoidOpioids],
            ["Continue psychosocial/behavioral support", counselling.psychosocialSupport],
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
          pgdName="Alcohol Reduction — Nalmefene"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Alcohol Reduction — Nalmefene" />
      </div>
    </div>
  );
}
