"use client";

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

/** The fields of the client's Clinical state the printed record needs. */
export interface PeriodPainReportClinical {
  femaleConfirmed: boolean;
  primaryDysmenorrhoea: boolean;
  priorTreatment: "" | "tried-insufficient" | "unsuitable" | "not-tried";
  priorTreatmentDetail: string;
  redFlagSymptoms: boolean;
  pregnantOrSuspected: boolean;
  breastfeeding: boolean;
  ulcerOrGIBleed: boolean;
  nsaidHypersensitivity: boolean;
  severeOrganImpairment: boolean;
  otherNsaidsOrAnticoagulants: boolean;
  coagulationDisorder: boolean;
  interactingMedicines: boolean;
  inflammatoryBowelDisease: boolean;
  asthma: boolean;
  giConditionHistory: boolean;
  cardiovascularRisk: boolean;
  sleOrMctd: boolean;
  epilepsy: boolean;
  bleedingRiskMedicines: boolean;
  allergies: string;
  previousSupply: boolean;
  lastSupplyDate: string;
  previousCycles: number | null;
  notRespondingToTreatment: boolean;
  product: "naproxen" | "mefenamic-acid" | "";
  quantity: string;
  brand: string;
  withFoodAdvice: boolean;
  maxDoseAdvice: boolean;
  reviewAdvice: boolean;
  avoidAlcoholAdvice: boolean;
  noOtherNsaidsAdvice: boolean;
  stopIfReactionAdvice: boolean;
  nonDrugAdvice: boolean;
  contraceptionAlternativeAdvice: boolean;
  pilSupplied: boolean;
}

export function PeriodPainSummaryReport({
  patient,
  consent,
  clinical: c,
  summary,
  alerts,
  strapline,
}: {
  patient: BasePatientDetails;
  consent: BaseConsent;
  clinical: PeriodPainReportClinical;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  strapline: string;
}) {
  const stopped = alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && Boolean(c.product);
  const productName =
    c.product === "naproxen" ? "Naproxen tablets" : c.product === "mefenamic-acid" ? "Mefenamic acid" : "";
  const dose =
    c.product === "naproxen"
      ? "Initially 500 mg, then 250 mg every 6 to 8 hours as needed. Maximum 1250 mg on day 1, then up to 1000 mg daily. Up to 3 days per cycle."
      : c.product === "mefenamic-acid"
        ? "500 mg three times a day, up to 3 days per cycle. Do not exceed the stated dose."
        : "";
  const dash = "Not recorded";
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Period Pain (Dysmenorrhoea) ePGD Consultation Record</h2>
        <p className="text-[10px] text-gray-400">{strapline}</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={patient.dateOfBirth || dash} />
        <Row label="Age" value={patient.age !== null ? `${patient.age} years` : dash} />
        <Row label="Female confirmed" value={c.femaleConfirmed ? "Yes" : "No"} />
        <Row label="Address" value={patient.address || dash} />
        <Row label="NHS number" value={patient.nhsNumber || dash} />
        <Row label="GP" value={[patient.gpName, patient.gpPractice].filter(Boolean).join(", ") || dash} />
      </div>
      <SectionHeader>Consent</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Valid informed consent given" value={consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "No"} />
        <Row label="Aware this is a private service" value={consent.patientAwarePrivateService ? "Yes" : "No"} />
      </div>
      <SectionHeader>Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Primary dysmenorrhoea confirmed" value={c.primaryDysmenorrhoea ? "Yes" : "No"} />
        <Row
          label="Paracetamol or antispasmodic tried for at least one cycle (inclusion criterion)"
          value={
            c.priorTreatment === "tried-insufficient"
              ? `Tried and insufficient: ${c.priorTreatmentDetail || "details not recorded"}`
              : c.priorTreatment === "unsuitable"
                ? `Unsuitable: ${c.priorTreatmentDetail || "reason not recorded"}`
                : c.priorTreatment === "not-tried"
                  ? "Not yet tried (inclusion criterion not met; advised and review after one cycle)"
                  : dash
          }
        />
        <Row label="Allergies" value={c.allergies || dash} />
        <Row label="Previous supply under this PGD" value={c.previousSupply ? `Yes: last supply ${c.lastSupplyDate || "date not recorded"}, ${c.previousCycles ?? "unknown number of"} previous cycle(s)` : "No"} />
        <Row label="Not responding after 3 to 6 months of treatment" value={c.notRespondingToTreatment ? "Yes (referred)" : "No"} />
      </div>
      <SectionHeader>Exclusions and Cautions</SectionHeader>
      <CounsellingGrid
        items={[
          ["Features of secondary dysmenorrhoea", c.redFlagSymptoms],
          ["Known or suspected pregnancy", c.pregnantOrSuspected],
          ["Breastfeeding", c.breastfeeding],
          ["Peptic ulcer or GI bleed history", c.ulcerOrGIBleed],
          ["NSAID or aspirin hypersensitivity", c.nsaidHypersensitivity],
          ["Severe hepatic, renal or cardiac impairment", c.severeOrganImpairment],
          ["Other NSAIDs or anticoagulants", c.otherNsaidsOrAnticoagulants],
          ["Coagulation disorder", c.coagulationDisorder],
          ["Interacting medication", c.interactingMedicines],
          ["Inflammatory bowel disease", c.inflammatoryBowelDisease],
          ["Asthma (caution)", c.asthma],
          ["GI condition history (caution)", c.giConditionHistory],
          ["Cardiovascular risk (caution)", c.cardiovascularRisk],
          ["SLE or MCTD (caution)", c.sleOrMctd],
          ["Epilepsy (caution)", c.epilepsy],
          ["Corticosteroid or SSRI (caution)", c.bleedingRiskMedicines],
        ]}
      />
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />
      <SectionHeader>Supply</SectionHeader>
      {supplied ? (
        <div className="space-y-1.5">
          <Row label="Medicine" value={productName} />
          <Row label="Brand" value={c.brand || dash} />
          <Row label="Dose" value={dose} />
          <Row label="Form and route" value={c.product === "naproxen" ? "Tablet, oral, with or after food" : "Capsule or tablet, oral, with or after food"} />
          <Row label="Quantity supplied" value={c.quantity || dash} />
          <Row label="Date and time of supply" value={`${summary.consultationDate} ${summary.consultationTime}`.trim()} />
          <Row label="Supplied under" value={strapline} />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Row label="Outcome" value={stopped ? "NOT SUPPLIED: exclusion criteria met. Patient advised and referred as recorded." : "No medicine selected"} />
        </div>
      )}
      <SectionHeader>Counselling and Advice Given</SectionHeader>
      <CounsellingGrid
        items={[
          ["Take with or after food; report unusual abdominal symptoms", c.withFoodAdvice],
          ["Maximum dose explained; lowest effective dose, up to 3 days per cycle", c.maxDoseAdvice],
          ["Avoid alcohol; monitor for GI discomfort or bleeding", c.avoidAlcoholAdvice],
          ["No other NSAIDs (including aspirin)", c.noOtherNsaidsAdvice],
          ["Stop and seek advice for hypersensitivity signs", c.stopIfReactionAdvice],
          ["When to seek medical advice; gynaecology referral if no response in 3 to 6 months", c.reviewAdvice],
          ["Local heat and TENS may help", c.nonDrugAdvice],
          ["Hormonal contraception as an alternative first-line treatment", c.contraceptionAlternativeAdvice],
          ["Patient information leaflet supplied", c.pilSupplied],
        ]}
      />
      {summary.clinicalNotes && (
        <div className="space-y-1.5">
          <Row label="Clinical notes and advice given" value={summary.clinicalNotes} />
        </div>
      )}
      {supplied ? (
        <PharmacistDeclaration
          pgdName="Period Pain (Naproxen or Mefenamic acid)"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      ) : (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">No medicine was supplied under this PGD. Advice given and the decision reached are recorded above.</p>
          <div className="space-y-1.5">
            <Row label="Name" value={summary.pharmacistName || dash} />
            <Row label="GPhC number" value={summary.pharmacistGPhC || dash} />
            <Row label="Pharmacy" value={summary.pharmacyName || dash} />
            <Row label="Date" value={summary.consultationDate || dash} />
          </div>
        </>
      )}
      <ReportFooter pgdName="Period Pain (Dysmenorrhoea)" />
    </div>
  );
}
