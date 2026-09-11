"use client";

import type { ColdSoresConsultationState } from "../lib/cold-sores-types";
import { PGD_VERSION_LINE } from "../lib/cold-sores-types";
import { hasHardStops } from "../lib/cold-sores-clinical-logic";
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
  const stopped = hasHardStops(alerts);
  const under16 = patient.age !== null && patient.age < 16;

  return (
    <div className="print:p-0 space-y-0">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Cold Sores (Aciclovir cream and tablets) ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. {stopped ? "NOT SUPPLIED. Consultation under the" : "Supplied under the"} {PGD_VERSION_LINE}.
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
          <Row label="ID verified" value={state.consent.idVerified ? `Yes${state.consent.idType ? ` (${state.consent.idType})` : ""}` : "Not recorded"} />
          <Row label="Private service" value={state.consent.patientAwarePrivateService ? "Patient aware" : "Not recorded"} />
          {under16 && (
            <Row
              label="Under 16: consent from"
              value={
                state.consent.consentBasis === "parental-responsibility"
                  ? `A person with parental responsibility. ${state.consent.consentBasisNotes || ""}`
                  : state.consent.consentBasis === "gillick-competent"
                    ? `The young person, assessed as Gillick competent. ${state.consent.consentBasisNotes || ""}`
                    : "Not recorded"
              }
            />
          )}
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
          <Row
            label="Episode Type"
            value={
              symptomAssessment.isRecurrent
                ? "Recurrent herpes labialis"
                : symptomAssessment.isFirstEpisode
                  ? "First episode (not covered by the PGD)"
                  : "Not recorded"
            }
          />
          <Row label="Days present" value={symptomAssessment.daysSinceOnset !== null ? `${symptomAssessment.daysSinceOnset} days` : "Not recorded"} />
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
                (contraindications.immunosuppressed || medicalHistory.immunosuppressed || medicalHistory.recentlyImmunosuppressed) && "immunocompromised",
                contraindications.severeRecurrentEpisodes && "severe recurrent episodes",
                contraindications.mucousMembraneLesions && "mucous membrane lesions",
                contraindications.pregnant && "pregnancy",
                contraindications.breastfeeding && "breastfeeding",
                contraindications.childUnder12 && "under 12",
                symptomAssessment.isFirstEpisode && "first episode",
                symptomAssessment.daysSinceOnset !== null && symptomAssessment.daysSinceOnset > 10 && "lesions present more than 10 days",
              ]
                .filter(Boolean)
                .join(", ") || "None present"
            }
          />
          {contraindications.renalImpairmentSevere && (
            <Row label="Pharmacy safety threshold" value="Severe renal impairment (eGFR below 10 mL/min): referred (not a PGD exclusion)" />
          )}
        </div>
      </div>

      {/* Clinical Alerts */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Outcome */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Outcome</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row
            label="Outcome"
            value={stopped ? "NOT SUPPLIED: exclusion criteria met; patient referred. See clinical alerts." : "Supplied under the PGD"}
          />
          {stopped && (
            <Row label="Advice given and decision" value={summary.referralAdvice || "Not recorded"} />
          )}
          <Row label="Adverse drug reactions" value={summary.adverseDrugReactions || "None reported"} />
        </div>
      </div>

      {/* Medicine Recommended */}
      {!stopped && (
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
      )}

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
            ["Yellow Card reporting of adverse effects explained", counselling.yellowCard],
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
        {stopped ? (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for Cold Sores (Aciclovir cream and tablets), that an exclusion criterion applied, that no medicine was supplied under the PGD, and that the advice given and the referral made are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
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
            pgdName="Cold Sores (Aciclovir cream and tablets)"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName="Cold Sores (Aciclovir cream and tablets)" />
      </div>
    </div>
  );
}
