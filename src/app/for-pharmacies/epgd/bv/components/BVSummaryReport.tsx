"use client";
import type { BVConsultationState } from "../lib/bv-types";
import { PGD_VERSION_LABEL } from "../lib/bv-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

export function BVSummaryReport({ state }: { state: BVConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Bacterial Vaginosis ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Treatment of uncomplicated bacterial vaginosis</p>
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
      <CounsellingGrid
        items={[
          ["Thin greyish-white discharge", state.assessment.thinGrayishDischarge],
          ["Fishy odour", state.assessment.fishyOdour],
          ["Odour worse after sex/menstruation", state.assessment.odourWorseSexOrMenses],
          ["Itching (if present)", state.assessment.itching],
          ["Soreness (if present)", state.assessment.soreness],
          ["Dysuria", state.assessment.dysuria],
          ["Dyspareunia", state.assessment.dyspareunia],
        ]}
      />
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid
        items={[
          ["Pregnant (known or suspected)", state.medicalHistory.pregnancy],
          ["Breastfeeding", state.medicalHistory.breastfeeding],
          ["Recurrent BV", state.medicalHistory.recurrentBV],
          ["Active pelvic inflammation", state.medicalHistory.activePelvicInflammation],
          ["Hypersensitivity to metronidazole/nitroimidazoles", state.medicalHistory.hypersensitivity],
          ["Active CNS disease or blood dyscrasia", state.medicalHistory.cnsDiseaseOrBloodDyscrasia],
          ["Hepatic impairment", state.medicalHistory.hepaticImpairment],
          ["Renal impairment", state.medicalHistory.renalImpairment],
          ["Current alcohol consumption", state.medications.alcohol],
          ["Lithium", state.medications.lithium],
          ["Disulfiram", state.medications.disulfiram],
          ["Warfarin", state.medications.warfarin],
          ["Phenytoin", state.medications.phenytoin],
        ]}
      />
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      {state.doseRecommendation && (
        <>
          <SectionHeader>Medicine Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency || "—"} />
            <Row label="Duration" value={state.doseRecommendation.duration || "—"} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
            <Row label="Ability confirmed" value={state.medicineSelection.abilityConfirmed ? (state.medicineSelection.medicineChoice === "metronidazole-gel" ? "Able to insert gel intravaginally" : "Able to swallow tablets") : "No"} />
          </div>
        </>
      )}
      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["BV symptoms explained", state.counselling.symptomsExplained],
          ["Differentiated from thrush", state.counselling.differentiateThrush],
          ["Avoid alcohol during treatment", state.counselling.noAlcoholAdvice],
          ["Avoid vaginal douching", state.counselling.avoidDouching],
          ["Complete course of treatment", state.counselling.completesCourse],
          ["Not an STI", state.counselling.notSTI],
          ["Recurrence likely (50% within 3m)", state.counselling.recurrenceAdvice],
          ["Sexual partner notification", state.counselling.sexPartnerAdvice],
          ["Seek advice if not resolved in 5 to 7 days or new symptoms", state.counselling.seekAdviceIfNotResolved],
          ["Gel: latex condoms/diaphragms, alternative contraception 5 days", state.counselling.latexAdvice],
        ]}
      />
      <PharmacistDeclaration pgdName="Bacterial Vaginosis" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      <ReportFooter pgdName="Bacterial Vaginosis" />
    </div>
  );
}
