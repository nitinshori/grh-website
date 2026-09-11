"use client";

import type { AcneConsultationState } from "../lib/acne-types";
import { PGD_STRAPLINE } from "../lib/acne-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AcneSummaryReportProps {
  state: AcneConsultationState;
}

export function AcneSummaryReport({ state }: AcneSummaryReportProps) {
  const { patient, assessment, medicalHistory, contraindications, medicineSelection, counselling, summary, alerts, doseRecommendation } = state;
  const choice = medicineSelection.medicineChoice;
  const duac = choice === "duac-3" || choice === "duac-5";
  const epiduo = choice === "epiduo-0.1" || choice === "epiduo-0.3";
  const strengthRationaleLabel: Record<string, string> = {
    "lower-strength-less-effective": "The 10 mg/g + 30 mg/g strength has proven less effective",
    "more-moderate": "More moderate presentation",
    "tolerated-5pc-bpo": "Patient has previously tolerated 50 mg/g (5%) benzoyl peroxide",
  };

  return (
    <div className="print:p-0 space-y-0">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Acne Treatment ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record
        </p>
        <p className="text-xs text-gray-100 mt-1 print:text-[10px]">{PGD_STRAPLINE}</p>
      </div>

      {/* Patient Details */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age} years`} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
        </div>
      </div>

      {/* Consultation Details */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
        </div>
      </div>

      {/* Clinical Assessment */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Severity" value={assessment.severity || "Not assessed"} />
          <Row label="Affected Area" value={assessment.affectedArea || "Not recorded"} />
          <div className="py-1.5">
            <dt className="text-xs font-medium text-gray-500 mb-1">Acne Manifestations</dt>
            <dd className="text-xs text-navy-900">
              {[
                assessment.comedones && "Comedones",
                assessment.inflammatoryPapules && "Inflammatory papules",
                assessment.pustules && "Pustules",
                assessment.nodalCystic && "Nodal/cystic lesions",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"}
            </dd>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Previous Treatments" value={medicalHistory.previousTreatments || "None recorded"} />
          <Row label="Allergies" value={medicalHistory.allergies || "NKDA"} />
          {medicalHistory.sensitiveToRetinoids && (
            <Row label="Retinoid Sensitivity" value="Confirmed, proceed with caution" />
          )}
          <Row label="Antibiotic-associated colitis" value={medicalHistory.antibioticAssociatedColitis ? "Yes" : "No"} />
          <Row label="Gastrointestinal disease" value={medicalHistory.gastrointestinalDisease ? "Yes" : "No"} />
          <Row label="Atopic" value={medicalHistory.atopic ? "Yes" : "No"} />
          <Row label="Scarring, pigmentary change or psychological distress" value={medicalHistory.scarringOrDistress ? "Yes, dermatology referral considered" : "No"} />
        </div>
      </div>

      {/* Contraindications */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Contraindications Check</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Pregnant" value={contraindications.pregnant ? "Yes" : "No"} />
          <Row label="Planning pregnancy" value={contraindications.planningPregnancy ? "Yes" : "No"} />
          <Row label="Breastfeeding" value={contraindications.breastfeeding ? "Yes" : "No"} />
          <Row label="Hypersensitivity to benzoyl peroxide" value={contraindications.hypersensitivityBenzoylPeroxide ? "Yes" : "No"} />
          <Row label="Hypersensitivity to clindamycin or lincomycin" value={contraindications.hypersensitivityClindamycinLincomycin ? "Yes" : "No"} />
          <Row label="Hypersensitivity to adapalene or excipients" value={contraindications.hypersensitivityAdapalene ? "Yes" : "No"} />
          <Row label="Broken skin at site" value={contraindications.brokenSkinAtSite ? "Yes" : "No"} />
          <Row label="Inflamed skin at site" value={contraindications.inflamedSkinAtSite ? "Yes" : "No"} />
          <Row label="Eczema or sunburn at site" value={contraindications.eczemaOrSunburnAtSite ? "Yes" : "No"} />
        </div>
      </div>

      {/* Clinical Alerts */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Recommended */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Recommended</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Medicine" value={doseRecommendation?.medicine || "Not selected"} />
          {doseRecommendation && (
            <>
              <Row label="Dose and route" value={doseRecommendation.dose} />
              <Row label="Quantity and treatment period" value={doseRecommendation.duration || "Not recorded"} />
            </>
          )}
          {choice === "duac-5" && (
            <Row label="Reason for 10 mg/g + 50 mg/g strength" value={strengthRationaleLabel[medicineSelection.strengthRationale] || "Not recorded"} />
          )}
          <Row label="Repeat course" value={medicineSelection.repeatCourse ? (medicineSelection.repeatCourseReviewed ? "Yes, review completed" : "Yes, review NOT recorded") : "No"} />
        </div>
      </div>

      {/* Counselling Provided */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Improvement not expected before 6 to 8 weeks; irritation especially at the start", counselling.improvementTimeline],
            ["Application advice (thin layer once daily in the evening, wash hands, avoid eyes and mucous membranes)", counselling.applicationAdvice],
            ["Use sunscreen and limit sun exposure", counselling.photosensitivity],
            ["Irritation advice (reduce frequency or interrupt; discontinue if severe)", counselling.irritationAdvice],
            ["Avoid over-cleaning; non-alkaline cleanser", counselling.washingAdvice],
            ["Avoid oil-based products; remove make-up daily", counselling.productAdvice],
            ["Picking or scratching increases scarring risk", counselling.scarringAdvice],
            ["Maximum 12 weeks continuous use; review for repeat courses", counselling.courseCompletion],
            [epiduo ? "Follow-up: severe skin reaction or no improvement after 4 to 8 weeks" : "Follow-up: severe skin reaction or no improvement after 8 to 12 weeks", counselling.followUpAdvice],
            ...(duac ? [["Storage: below 25 C once dispensed, use within 2 months", counselling.storageAdvice] as [string, boolean]] : []),
            ...(epiduo ? [["Bleaching of hair and fabrics; irritant cosmetics; eye contact wash", counselling.bleachingAdvice] as [string, boolean]] : []),
            ["Patient information leaflet supplied", counselling.pilSupplied],
          ]}
        />
      </div>

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      {/* Pharmacist Declaration */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <PharmacistDeclaration
          pgdName="Acne Treatment"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Acne Treatment" />
      </div>
    </div>
  );
}
