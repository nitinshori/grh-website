"use client";

import type { EczemaConsultationState } from "../lib/eczema-types";
import { ECZEMA_PGD_VERSION, TREATED_AREA_LABEL } from "../lib/eczema-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface EczemaSummaryReportProps {
  state: EczemaConsultationState;
}

const STEROID_LABEL: Record<string, string> = {
  clobetasone: "Clobetasone butyrate 0.05% (Arm 1)",
  betamethasone: "Betamethasone valerate 0.1% (Arm 2)",
};

const COURSES_LABEL: Record<string, string> = {
  "0": "None",
  "1": "One",
  "2": "Two",
  "3-or-more": "Three or more",
};

export function EczemaSummaryReport({ state }: EczemaSummaryReportProps) {
  const { patient, consent, assessment, medicalHistory, contraindications, medicineSelection, counselling, summary, alerts } = state;
  const thinSkin = assessment.thinSkinSite || contraindications.faceOrGroin;
  const stopped = alerts.some((a) => a.severity === "stop");

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Eczema and Dermatitis ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. {ECZEMA_PGD_VERSION}
        </p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age} years`} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
          <Row
            label="Consent"
            value={
              consent.informedConsentGiven
                ? patient.age !== null && patient.age < 16
                  ? `Given by ${consent.consentBasis === "parental-responsibility" ? "a person with parental responsibility" : consent.consentBasis === "gillick-competent" ? "the young person, assessed as Gillick competent" : "not recorded"}. Basis: ${consent.consentBasisNotes || "not recorded"}`
                  : "Valid informed consent given"
                : "Not recorded"
            }
          />
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
        <SectionHeader>Eczema Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Severity (mild or moderate)" value={assessment.severity || "Not assessed"} />
          <Row
            label="Site treated"
            value={`${assessment.affectedSite || "Not recorded"}${thinSkin ? ". Face, flexures or genital skin involved (7 day cap)" : ""}${assessment.eyelids ? ". Eyelids involved (excluded)" : ""}`}
          />
          <Row
            label="Treated area"
            value={assessment.treatedArea ? TREATED_AREA_LABEL[assessment.treatedArea] : "Not recorded"}
          />
          <div className="py-1.5">
            <dt className="text-xs font-medium text-gray-500 mb-1">Manifestations</dt>
            <dd className="text-xs text-navy-900">
              {[
                assessment.isDry && "Dry",
                assessment.isRed && "Red/inflamed",
                assessment.isThickened && "Thickened skin",
                assessment.isCracked && "Cracked",
                assessment.isOozing && "Oozing/weeping",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"}
            </dd>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Previous Treatments" value={medicalHistory.previousTreatments || "None recorded"} />
          <Row label="Allergies" value={medicalHistory.allergies || "NKDA"} />
          <Row label="Courses in the last 12 months" value={COURSES_LABEL[medicalHistory.coursesLast12Months] || "Not recorded"} />
          {medicalHistory.pregnantOrBreastfeeding && (
            <Row label="Pregnancy / breastfeeding" value={medicalHistory.treatmentToBreastArea ? "Treatment to breast or nipple area (excluded)" : "Yes; site treated recorded above"} />
          )}
          {contraindications.bacterialInfection && (
            <Row
              label="Secondary infection"
              value={
                contraindications.concurrentAntibioticSupplied
                  ? "Mild and localised: oral antibiotic supplied under the Skin and Soft Tissue Infection PGD at this consultation; both supplies are in this one record."
                  : "Signs present, not treated concurrently: referred."
              }
            />
          )}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Supplied</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          {stopped ? (
            <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met; patient referred." />
          ) : (
            <>
              <Row label="Emollient as base" value={medicineSelection.emollientFirst ? "Yes" : "Not confirmed"} />
              <Row
                label="Medicine"
                value={`${STEROID_LABEL[medicineSelection.steroidChoice] || "Not specified"} ${medicineSelection.formulation || ""}`.trim()}
              />
              <Row label="Dose and route" value="Topical. Apply a thin layer once or twice daily to affected skin only, measured in fingertip units" />
              <Row
                label="Duration"
                value={
                  thinSkin
                    ? "Face, flexures or genital skin: 7 days maximum (cap explained and recorded)"
                    : "Up to 7 days initially, then review; maximum 4 weeks continuous on the trunk and limbs"
                }
              />
              <Row label="Quantity" value={medicineSelection.quantitySupplied || "Not recorded"} />
              <Row label="Batch / expiry" value={`${medicineSelection.batchNumber || "not recorded"} / ${medicineSelection.expiryDate || "not recorded"}`} />
              <Row label="Date of supply" value={summary.consultationDate} />
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Steroid first, thin layer, wait at least 30 minutes, then emollient", counselling.applyThinly],
            ["Fingertip unit shown", counselling.fingertipUnits],
            ["Emollient every day, including after the course", counselling.emollientFirst],
            ["Fire risk from emollients explained", counselling.fireRiskExplained],
            ["7 day cap on face, flexures or genital skin explained", counselling.sevenDayCapExplained],
            ["Betamethasone not on face, eyelids, folds or genital skin", counselling.notOnFaceAdvice],
            ["Step down rather than stop abruptly", counselling.stepDownApproach],
            ["Back if no better after 7 days, spreads, weeps, crusts or painful", counselling.followUpAdvice],
            ["Urgent help for rapidly painful rash, blisters, punched-out sores, unwell", counselling.urgentHelpAdvice],
            ["Avoid known triggers; no occlusion", counselling.avoidTriggers],
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
          pgdName={ECZEMA_PGD_VERSION}
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={ECZEMA_PGD_VERSION} />
      </div>
    </div>
  );
}
