"use client";
import type { BVConsultationState } from "../lib/bv-types";
import { PGD_VERSION_LABEL } from "../lib/bv-types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";
import { quantitySupplied } from "../lib/bv-clinical-logic";

const REFERRED_LABELS: Record<string, string> = {
  gp: "GP",
  midwife: "Midwife or maternity service",
  "sexual-health": "Sexual health service",
  other: "Other",
};

export function BVSummaryReport({ state }: { state: BVConsultationState }) {
  // A stop anywhere means nothing was supplied under this PGD: the supply
  // section and the "no exclusion criteria applied" declaration must not print.
  const hasStop = state.alerts.some((a) => a.severity === "stop");
  const supplied = !hasStop && state.doseRecommendation !== null;
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
        <Row label="Date of Birth" value={state.patient.dateOfBirth || "Not recorded"} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}${state.patient.gpPractice ? `, ${state.patient.gpPractice}` : ""}` : "Not recorded"} />
        <Row label="Female confirmed" value={state.medicalHistory.femaleConfirmed ? "Yes" : "No"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
      </div>
      <SectionHeader>Consultation Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Date" value={state.summary.consultationDate} />
        <Row label="Time" value={state.summary.consultationTime} />
        <Row label="Informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes${state.consent.idType ? ` (${state.consent.idType})` : ""}` : "No"} />
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
          ["Blood-stained discharge (red flag)", state.assessment.bloodStainedDischarge],
          ["Fever (red flag)", state.assessment.fever],
          ["Pelvic pain (red flag)", state.assessment.pelvicPain],
        ]}
      />
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <Row label="Exclusion and caution questions asked and answered" value={state.medicalHistory.exclusionsAskedAndAnswered ? "Yes" : "Not recorded"} />
      <CounsellingGrid
        items={[
          ["First episode of BV", state.medicalHistory.firstEpisode],
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
      {hasStop && (
        <>
          <SectionHeader>Outcome: Not Supplied</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine supplied" value="None. Exclusion criteria met; see clinical alerts above." />
            <Row label="Referred to" value={REFERRED_LABELS[state.exclusionOutcome.referredTo] || "Not recorded"} />
            <Row label="Advice given and decision reached" value={state.exclusionOutcome.adviceGiven || "Not recorded"} />
          </div>
        </>
      )}
      {supplied && state.doseRecommendation && (
        <>
          <SectionHeader>Medicine Supplied</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="Brand" value={state.medicineSelection.brand || "Not recorded"} />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency" value={state.doseRecommendation.frequency || "—"} />
            <Row label="Duration" value={state.doseRecommendation.duration || "—"} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || "—"} />
            <Row label="Quantity supplied" value={quantitySupplied(state)} />
            <Row label="Ability confirmed" value={state.medicineSelection.abilityConfirmed ? (state.medicineSelection.medicineChoice === "metronidazole-gel" ? "Able to insert gel intravaginally" : "Able to swallow tablets") : "No"} />
            <Row label="Supplied under" value={PGD_VERSION_LABEL} />
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
          ["PIL supplied", state.counselling.pilSupplied],
        ]}
      />
      <p className="text-xs text-gray-600">
        Adverse effects: report to a healthcare provider or via the Yellow Card scheme (https://yellowcard.mhra.gov.uk).
      </p>
      {hasStop ? (
        <>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the Patient Group Direction for Bacterial Vaginosis,
            that exclusion criteria applied, that no medicine was supplied under the PGD, and that the advice given and the
            decision reached are recorded above.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistGPhC || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacyName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
              <div className="border-b border-gray-300 min-h-[2rem]" />
            </div>
          </div>
        </>
      ) : (
        <PharmacistDeclaration pgdName="Bacterial Vaginosis" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      )}
      <ReportFooter pgdName="Bacterial Vaginosis" />
    </div>
  );
}
