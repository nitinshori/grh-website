"use client";
import type { ThrushConsultationState } from "../lib/thrush-types";
import { PGD_VERSION_LABEL } from "../lib/thrush-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

export function ThrushSummaryReport({ state }: { state: ThrushConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Vaginal Thrush ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Uncomplicated vulvovaginal candidiasis treatment</p>
        <p className="text-[10px] text-gray-400">{PGD_VERSION_LABEL}</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="Female confirmed" value={state.medicalHistory.femaleConfirmed ? "Yes" : "No"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
      </div>
      <SectionHeader>Clinical Presentation</SectionHeader>
      <CounsellingGrid items={[["Vulval itching", state.assessment.vulvalItching], ["Vulval soreness", state.assessment.vulvalSoreness], ["Thick white discharge", state.assessment.thickWhiteDischarge], ["Dysuria", state.assessment.dysuria], ["Dyspareunia", state.assessment.dyspareunia]]} />
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid items={[["First episode", state.medicalHistory.firstEpisode], ["Recurrent (4+ in 12 months or 2 in 6 months)", state.medicalHistory.recurrentThrush], ["Immunosuppression", state.medicalHistory.immunocompromised], ["Diabetes", state.medicalHistory.diabetes], ["Diabetes poorly controlled", state.medicalHistory.diabetesPoorlyControlled], ["Possible STI exposure or partner with STI", state.medicalHistory.stiExposure], ["Pregnancy", state.medicalHistory.pregnancy], ["Breastfeeding", state.medicalHistory.breastfeeding], ["Hypersensitivity to fluconazole/azoles", state.medicalHistory.azoleHypersensitivity], ["Hypersensitivity to clotrimazole/imidazoles", state.medicalHistory.imidazoleHypersensitivity], ["QT-prolonging interacting drugs", state.medications.qtDrugs], ["QT prolongation or arrhythmia history", state.medicalHistory.qtHistory], ["Severe hepatic impairment", state.medicalHistory.severeHepatic], ["Severe renal impairment", state.medicalHistory.severeRenal], ["Warfarin/anticoagulant", state.medications.warfarin], ["Statins", state.medications.statins], ["Phenytoin", state.medications.phenytoin], ["Rifampicin", state.medications.rifampicin]]} />
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      {state.doseRecommendation && (
        <>
          <SectionHeader>Medicine Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
            {state.medicineSelection.medicineChoice === "clotrimazole-pessary" && (
              <Row label="Able to insert pessary" value={state.medicineSelection.abilityConfirmed ? "Confirmed" : "Not confirmed"} />
            )}
          </div>
        </>
      )}
      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid items={[["Typical symptoms explained", state.counselling.typicalSymptoms], ["Avoid irritants (douches, scented products, tight clothing)", state.counselling.avoidPerfumedProducts], ["Cotton underwear advised", state.counselling.cottonUnderwear], ["Complete treatment", state.counselling.completesTreatment], ["Resolves in 5 to 7 days; contact GP if persists or worsens", state.counselling.timelineToRelief], ["Avoid intercourse for at least 5 days (barrier damage)", state.counselling.avoidIntercourse], ["Pessary: insert with fingers, not applicator", state.counselling.insertWithFingers], ["Sexual contacts informed", state.counselling.sexualContacts], ["Recurrence (4+ per year): contact GP", state.counselling.recurrenceAdvice], ["Yellow Card advice", state.counselling.yellowCardAdvice]]} />
      <PharmacistDeclaration pgdName="Vaginal Thrush" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      <ReportFooter pgdName="Vaginal Thrush" />
    </div>
  );
}
