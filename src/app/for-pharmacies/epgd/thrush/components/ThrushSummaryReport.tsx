"use client";
import type { ThrushConsultationState } from "../lib/thrush-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

export function ThrushSummaryReport({ state }: { state: ThrushConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Vaginal Thrush ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Uncomplicated vulvovaginal candidiasis treatment</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
      </div>
      <SectionHeader>Clinical Presentation</SectionHeader>
      <CounsellingGrid items={[["Vulval itching", state.assessment.vulvalItching], ["Vulval soreness", state.assessment.vulvalSoreness], ["Thick white discharge", state.assessment.thickWhiteDischarge], ["Dysuria", state.assessment.dysuria], ["Dyspareunia", state.assessment.dyspareunia]]} />
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid items={[["Diabetes", state.medicalHistory.diabetes], ["Pregnancy", state.medicalHistory.pregnancy], ["Immunocompromised", state.medicalHistory.immunocompromised], ["Recurrent thrush (4+/year)", state.medicalHistory.recurrentThrush]]} />
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      {state.doseRecommendation && (
        <>
          <SectionHeader>Medicine Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
          </div>
        </>
      )}
      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid items={[["Typical symptoms explained", state.counselling.typicalSymptoms], ["Avoid perfumed products", state.counselling.avoidPerfumedProducts], ["Cotton underwear advised", state.counselling.cottonUnderwear], ["Complete treatment", state.counselling.completesTreatment], ["Timeline to relief (1-3 days)", state.counselling.timelineToRelief], ["Sexual contacts informed", state.counselling.sexualContacts], ["Recurrence advice given", state.counselling.recurrenceAdvice]]} />
      <PharmacistDeclaration pgdName="Vaginal Thrush" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      <ReportFooter pgdName="Vaginal Thrush" />
    </div>
  );
}
