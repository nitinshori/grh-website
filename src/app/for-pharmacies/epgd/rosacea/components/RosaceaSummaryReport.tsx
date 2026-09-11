"use client";

import type { RosaceaConsultationState } from "../lib/rosacea-types";
import type { ClinicalAlert } from "../../shared/types";
import { PGD_STRAPLINE, PRODUCT_DETAILS } from "../lib/rosacea-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface RosaceaSummaryReportProps {
  state: RosaceaConsultationState;
  alerts: ClinicalAlert[];
  hasStops: boolean;
}

const SUBTYPE_LABEL: Record<string, string> = {
  erythematotelangiectatic: "Erythematotelangiectatic (flushing and redness)",
  papulopustular: "Papulopustular (bumps and pustules)",
  phymatous: "Phymatous (thickened skin)",
};

export function RosaceaSummaryReport({ state, alerts, hasStops }: RosaceaSummaryReportProps) {
  const { patient, consent, assessment, contraindications, treatment, counselling, summary } = state;
  const product = PRODUCT_DETAILS[treatment.product];
  const supplied = !hasStops && !!product;
  const azelaic = treatment.product === "azelaic-acid";

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Rosacea Treatment ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record</p>
        <p className="text-xs text-gray-100 mt-1 print:text-[10px]">{PGD_STRAPLINE}</p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Outcome</SectionHeader>
        <div className={`text-sm font-semibold px-3 py-2 rounded ${hasStops ? "bg-red-50 text-red-700" : supplied ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
          {hasStops
            ? "NOT SUPPLIED: exclusion criteria met, patient advised and referred to the GP as appropriate"
            : supplied
              ? "Supplied under PGD"
              : "Not supplied: no product selected"}
        </div>
        {hasStops && summary.exclusionAdvice && (
          <div className="mt-2">
            <Row label="Advice given / referral" value={summary.exclusionAdvice} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
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
        <SectionHeader>Consent</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Informed consent" value={consent.informedConsentGiven ? "Obtained" : "NOT recorded"} />
          <Row label="ID verified" value={consent.idVerified ? consent.idType || "Yes" : "No"} />
          <Row label="Private service" value={consent.patientAwarePrivateService ? "Patient aware" : "NOT recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Subtype" value={SUBTYPE_LABEL[assessment.subtype] || assessment.subtype || "Not recorded"} />
          <Row label="Severity" value={assessment.severity || "Not recorded"} />
          <Row
            label="Features"
            value={
              [
                assessment.flushing && "Flushing",
                assessment.erythema && "Erythema",
                assessment.papulesPostules && "Papules / pustules",
                assessment.ocularSymptoms && "Ocular symptoms",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"
            }
          />
          <Row label="Known triggers" value={assessment.triggersIdentified || "None recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Exclusion Criteria Check</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Pregnancy" value={contraindications.pregnancy ? "Yes" : "No"} />
          <Row label="Breastfeeding" value={contraindications.breastfeeding ? "Yes" : "No"} />
          <Row label="Under 18 years" value={contraindications.underEighteen ? "Yes" : "No"} />
          <Row label="Broken, irritated or eczematous facial skin" value={contraindications.brokenOrEczematousSkin ? "Yes" : "No"} />
          <Row label="Hypersensitivity to metronidazole / nitroimidazoles" value={contraindications.hypersensitivityMetronidazole ? "Yes" : "No"} />
          <Row label="Hypersensitivity to azelaic acid / excipients" value={contraindications.hypersensitivityAzelaicAcid ? "Yes" : "No"} />
          <Row label="Asthma" value={contraindications.asthma ? "Yes (caution with azelaic acid)" : "No"} />
          <Row label="Questions put to patient" value={contraindications.questionsAsked ? "Yes, confirmed by pharmacist" : "NOT confirmed"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Supplied</SectionHeader>
        {hasStops ? (
          <p className="text-xs text-red-700 font-medium">No medicine supplied: exclusion criteria met.</p>
        ) : product ? (
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Medicine" value={product.label} />
            <Row label="Brand dispensed" value={treatment.brand || "Not recorded"} />
            <Row label="Form and strength" value={treatment.strength} />
            <Row label="Dose, frequency and route" value={`Topical. ${treatment.frequency}`} />
            <Row label="Quantity supplied" value={`Supply ${treatment.supplyNumber} of up to ${product.maxSupplies}: one 30 g tube`} />
            {Number(treatment.supplyNumber) > 1 && (
              <Row label="Course" value={`Started ${treatment.courseStartDate || "?"}; previous supply ${treatment.previousSupplyDate || "?"}`} />
            )}
            <Row label="Treatment period" value={treatment.duration} />
            <Row label="Date of supply" value={summary.consultationDate} />
          </div>
        ) : (
          <p className="text-xs text-gray-500">No product selected.</p>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            [azelaic ? "Application: thin layer twice daily, 2.5 cm for the whole face, avoid eyes and broken skin, wash hands" : "Application: thin layer twice daily, avoid eyes and broken skin, wash hands", counselling.applicationAdvised],
            ["Sun protection; avoid sunbeds", counselling.sunProtectionAdvised],
            ["Trigger avoidance discussed", counselling.triggerAvoidanceAdvised],
            ["Trigger diary suggested", counselling.diaryAdvised],
            ["Emollients and camouflage cosmetics", counselling.skinCareAdvised],
            ["Review interval and treatment period explained", counselling.reviewAdvised],
            ["Follow-up advice given", counselling.followUpAdvised],
            ["Patient information leaflet supplied", counselling.pilSupplied],
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
        {hasStops ? (
          <>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for Rosacea Treatment, that the patient met one or more exclusion criteria, that no medicine was supplied under this PGD, and that the advice given and the decision reached have been recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </>
        ) : (
          <PharmacistDeclaration
            pgdName="Rosacea Treatment"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Rosacea Treatment" />
      </div>
    </div>
  );
}
