"use client";

import type { AnxietyPropranololConsultationState } from "../lib/anxiety-propranolol-types";
import { doseAdvisedMg } from "../lib/anxiety-propranolol-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

const PGD_NAME = "Anxiety (Situational and Somatic Symptoms), Propranolol";
const PGD_VERSION = "PGD version 006, issued 11 September 2026 (valid to 31 July 2027)";

interface AnxietyPropranololSummaryReportProps {
  state: AnxietyPropranololConsultationState;
}

/**
 * Declaration used when an exclusion applies. The shared
 * PharmacistDeclaration states that "no exclusion criteria applied", which
 * must never be printed on a not-supplied record.
 */
function NotSuppliedDeclaration({
  pharmacistName,
  pharmacistGPhC,
  pharmacyName,
}: {
  pharmacistName: string;
  pharmacistGPhC: string;
  pharmacyName: string;
}) {
  return (
    <>
      <SectionHeader>Practitioner Declaration</SectionHeader>
      <p className="text-xs text-gray-600 mb-4">
        I confirm that this consultation was conducted under the Patient Group Direction for {PGD_NAME}, that an exclusion criterion applied, that propranolol was NOT supplied, and that the patient was advised on alternative options and referred as recorded above.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistGPhC || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacyName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>
    </>
  );
}

export function AnxietyPropranololSummaryReport({ state }: AnxietyPropranololSummaryReportProps) {
  const { patient, consent, assessment, medicalHistory, contraindications, medicineSupply, counselling, summary, alerts } = state;
  const hasStops = alerts.some((a) => a.severity === "stop");
  const dose = doseAdvisedMg(state);
  const anxietyTypeLabel =
    assessment.anxietyType === "situational"
      ? "Situational / performance anxiety"
      : assessment.anxietyType === "generalized"
        ? "Generalised anxiety disorder (outside PGD)"
        : assessment.anxietyType === "social"
          ? "Social anxiety disorder (outside PGD)"
          : "Not assessed";

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Anxiety: Propranolol ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. {PGD_VERSION}
        </p>
      </div>

      {hasStops && (
        <div className="mx-6 mb-4 px-4 py-3 border-2 border-red-600 rounded-lg print:mx-4">
          <p className="text-sm font-bold text-red-700 uppercase">Not supplied: exclusion criteria met</p>
          <p className="text-xs text-red-700 mt-1">
            Propranolol was not supplied under this PGD. The exclusion(s) are listed under Clinical Alerts. Advice given and the referral decision are recorded in the clinical notes.
          </p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age ?? ""} years`} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="NHS number" value={patient.nhsNumber || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consent</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Informed consent given" value={consent.informedConsentGiven ? "Yes" : "No"} />
          <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "No"} />
          <Row label="Aware this is a private service" value={consent.patientAwarePrivateService ? "Yes" : "No"} />
          <Row label="Copy to GP" value={consent.notifyGp ? "Yes" : "No"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
          <Row label="PGD" value={PGD_VERSION} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Anxiety Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Anxiety Type" value={anxietyTypeLabel} />
          <Row label="Trigger Situation" value={assessment.triggerSituation || "Not recorded"} />
          <Row label="Physical Symptoms" value={assessment.physicalSymptoms || "Not recorded"} />
          <Row label="Frequency" value={assessment.frequencyOfEvents || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History and Measurements</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Current medicines" value={medicalHistory.currentMedications || "Not recorded"} />
          <Row
            label="Resting heart rate"
            value={contraindications.restingHeartRate !== null ? `${contraindications.restingHeartRate} bpm` : "Not measured"}
          />
          <Row
            label="Systolic BP"
            value={contraindications.systolicBP !== null ? `${contraindications.systolicBP} mmHg` : "Not measured"}
          />
          <Row
            label="Cautions recorded"
            value={
              [
                medicalHistory.diabetes && "Diabetes",
                medicalHistory.raynauds && "Raynaud's",
                medicalHistory.hepaticImpairment && "Hepatic impairment",
                medicalHistory.renalImpairment && "Renal impairment",
                medicalHistory.firstDegreeHeartBlock && "First-degree heart block",
                medicalHistory.portalHypertension && "Portal hypertension",
                medicalHistory.mildPeripheralVascularDisease && "Mild peripheral vascular disease",
                medicalHistory.psoriasis && "Psoriasis",
                medicalHistory.myastheniaGravis && "Myasthenia gravis",
                medicalHistory.historyOfAnaphylaxis && "History of anaphylaxis",
                medicalHistory.mildDepression && "Depression (not severe, no suicidal ideation)",
              ]
                .filter(Boolean)
                .join(", ") || "None"
            }
          />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>{hasStops ? "Medicine" : "Medicine Supplied"}</SectionHeader>
        {hasStops ? (
          <p className="text-xs font-semibold text-red-700">NOT SUPPLIED. Exclusion criteria met; see Clinical Alerts.</p>
        ) : (
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Medicine" value="Propranolol 10mg tablets (generic; brand as dispensed)" />
            <Row label="Form and route" value="Tablet, oral" />
            <Row label="Dose advised" value={dose !== null ? `${dose}mg (${dose / 10} x 10mg tablet${dose > 10 ? "s" : ""}) as a single dose` : "Not recorded"} />
            <Row
              label="Regimen"
              value="As required only: a single dose 30 to 60 minutes before the anxiety-provoking situation. Not for regular daily use. One supply per situational event; review before any repeat supply and in any case at 4 weeks"
            />
            <Row label="Quantity supplied" value={medicineSupply.quantity ? `${medicineSupply.quantity} tablets of 10mg (${medicineSupply.quantity * 10}mg in total)` : "Not specified"} />
            <Row label="Date of supply" value={summary.consultationDate} />
          </div>
        )}
      </div>

      {!hasStops && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Counselling Provided</SectionHeader>
          <CounsellingGrid
            items={[
              ["As-required use only: a single dose 30 to 60 minutes before the situation, not to be taken regularly; review before any repeat", counselling.prnUseOnly],
              ["Reduces physical symptoms (tremor, palpitations, sweating)", counselling.physicalSymptoms],
              ["Not a cure for anxiety; consider psychological therapy", counselling.notACure],
              ["Does not cause dependence at PRN doses", counselling.noDependence],
              ["Do not stop suddenly if used regularly", counselling.noSuddenWithdrawal],
              ["Report breathlessness or wheeze", counselling.reportWheeze],
              ["May cause cold hands and feet", counselling.coldExtremities],
              ["Avoid alcohol (additive CNS depression)", counselling.avoidAlcohol],
              ["Do NOT use with verapamil or diltiazem", counselling.avoidVerapamil],
            ]}
          />
          <p className="text-xs text-gray-600 mt-2">Patient information leaflet supplied. Suspected adverse effects to be reported via the Yellow Card scheme (yellowcard.mhra.gov.uk) and the GP informed as appropriate.</p>
        </div>
      )}

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes{hasStops ? " and Advice Given" : ""}</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {hasStops ? (
          <NotSuppliedDeclaration
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        ) : (
          <PharmacistDeclaration
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
