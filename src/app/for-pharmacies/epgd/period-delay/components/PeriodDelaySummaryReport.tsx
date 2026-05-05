"use client";
import type { PeriodDelayConsultationState } from "../lib/period-delay-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

export function PeriodDelaySummaryReport({ state }: { state: PeriodDelayConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Period Delay ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Norethisterone 5mg — short-term delay of menstruation</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
      </div>
      <SectionHeader>Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Reason for delay" value={state.assessment.reasonForDelay || "—"} />
        <Row label="Last period date" value={state.assessment.lastPeriodDate || "—"} />
        <Row label="Regular cycle" value={state.assessment.cycleRegular ? "Yes" : "No"} />
        <Row label="Days until expected period" value={state.assessment.daysUntilExpected?.toString() || "—"} />
        <Row label="Previous use of norethisterone" value={state.assessment.previousUse ? "Yes" : "No"} />
      </div>
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid items={[
        ["Pregnancy", state.medicalHistory.pregnancy],
        ["Breastfeeding", state.medicalHistory.breastfeeding],
        ["Liver disease", state.medicalHistory.liverDisease],
        ["History of DVT/PE", state.medicalHistory.historyOfDVT || state.medicalHistory.historyOfPE],
        ["History of stroke", state.medicalHistory.historyOfStroke],
        ["Breast cancer", state.medicalHistory.activeBreastCancer],
        ["Undiagnosed vaginal bleeding", state.medicalHistory.abnormalVaginalBleeding],
        ["Hormonal contraception", state.medicalHistory.hormonalContraception],
      ]} />
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      {state.doseRecommendation && (
        <>
          <SectionHeader>Treatment Plan</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency} />
            <Row label="Duration" value={state.doseRecommendation.duration} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
          </div>
        </>
      )}
      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid items={[
        ["How to take explained", state.counselling.howToTake],
        ["Start 3 days before period", state.counselling.startThreeDaysBefore],
        ["Maximum duration explained", state.counselling.maxDuration],
        ["Period returns 2-3 days after stopping", state.counselling.periodReturnsAfter],
        ["Side effects discussed", state.counselling.sideEffects],
        ["Not a contraceptive", state.counselling.notContraceptive],
        ["Seek help if unwell", state.counselling.seekHelpIfUnwell],
      ]} />
      <PharmacistDeclaration pgdName="Period Delay (Norethisterone)" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      <ReportFooter pgdName="Period Delay (Norethisterone)" />
    </div>
  );
}
