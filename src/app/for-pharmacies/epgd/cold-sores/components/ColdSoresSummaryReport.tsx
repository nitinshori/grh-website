"use client";

import type { ColdSoresConsultationState } from "../lib/cold-sores-types";
import { PGD_VERSION_LINE } from "../lib/cold-sores-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface ColdSoresSummaryReportProps {
  state: ColdSoresConsultationState;
}

export function ColdSoresSummaryReport({ state }: ColdSoresSummaryReportProps) {
  const { patient, symptomAssessment, medicalHistory, contraindications, medicineSupply, counselling, summary, alerts, doseRecommendation } = state;
  const isCream = medicineSupply.product === "cream";

  return (
    <div className="print:p-0 space-y-0">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Cold Sores (Aciclovir cream and tablets) ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. Supplied under the {PGD_VERSION_LINE}.
        </p>
      </div>

      {/* Patient Details */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age} years`} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Obtained" : "Not recorded"} />
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

      {/* Symptom Assessment */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Symptom Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Episode Type" value={symptomAssessment.isRecurrent ? "Recurrent" : "First episode"} />
          <Row label="Current Symptoms" value={symptomAssessment.currentSymptoms || "Not recorded"} />
          {symptomAssessment.prodromeSigns && (
            <Row label="Hours Since Prodrome" value={`${symptomAssessment.hoursFromProdrome} hours`} />
          )}
        </div>
      </div>

      {/* Medical History */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          {medicalHistory.immunosuppressed && (
            <Row label="Immunosuppression" value="Currently immunosuppressed" />
          )}
          {medicalHistory.renalImpairment && (
            <Row label="Renal Function" value={medicalHistory.renalFunction || "Not detailed"} />
          )}
          {!medicalHistory.immunosuppressed && !medicalHistory.renalImpairment && (
            <Row label="Relevant History" value="No significant contraindications recorded" />
          )}
          <Row
            label="PGD exclusions checked"
            value={
              [
                contraindications.hypersensitivity && "hypersensitivity",
                contraindications.immunosuppressed && "immunocompromised",
                contraindications.severeRecurrentEpisodes && "severe recurrent episodes",
                contraindications.mucousMembraneLesions && "mucous membrane lesions",
                contraindications.pregnant && "pregnancy",
                contraindications.breastfeeding && "breastfeeding",
                contraindications.childUnder12 && "under 12",
                contraindications.renalImpairmentSevere && "severe renal impairment",
              ]
                .filter(Boolean)
                .join(", ") || "None present"
            }
          />
        </div>
      </div>

      {/* Clinical Alerts */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Recommended */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Supplied under PGD</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Medicine" value={doseRecommendation?.medicine || "Not selected"} />
          <Row label="Brand" value={medicineSupply.brand || "Not recorded"} />
          <Row label="Form and route" value={isCream ? "Cream, topical to the lips and face" : "Tablets, oral"} />
          <Row label="Dose and frequency" value={doseRecommendation ? `${doseRecommendation.dose}, ${doseRecommendation.frequency}, ${doseRecommendation.duration}` : "Not selected"} />
          <Row
            label="Quantity"
            value={
              medicineSupply.quantity
                ? isCream
                  ? `${medicineSupply.quantity} x ${medicineSupply.tubeSize || ""} tube`
                  : `${medicineSupply.quantity} tablets`
                : "Not specified"
            }
          />
          <Row label="Date of supply" value={summary.consultationDate} />
        </div>
      </div>

      {/* Counselling Provided */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Start at first sign of symptoms", counselling.startASAP],
            ["Complete the 5-day course", counselling.completeCourse],
            ["Easily transmitted: avoid kissing and oral sex until healed", counselling.contagious],
            ["Do not share items touching lesions or topical treatments", counselling.avoidSharing],
            ["Hygiene: dab not rub, wash hands, contact lenses, defer dental treatment", counselling.hygieneMeasures],
            ["Symptom relief: paracetamol / ibuprofen, fluids, self-limiting", counselling.symptomRelief],
            ["Seek advice if worsening or no improvement after 5 to 7 days", counselling.safetyNetting],
            ["Avoid triggers; SPF 15+ lip balm if sunlight triggers", counselling.sunExposure],
            ["Patient information leaflet supplied", counselling.providedPIL],
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
          pgdName="Cold Sores (Aciclovir cream and tablets)"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Cold Sores (Aciclovir cream and tablets)" />
      </div>
    </div>
  );
}
