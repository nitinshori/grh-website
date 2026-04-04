"use client";

import type { PEConsultationState } from "../lib/pe-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface PESummaryReportProps {
  state: PEConsultationState;
  alerts: ClinicalAlert[];
}

export function PESummaryReport({ state, alerts }: PESummaryReportProps) {
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          Premature Ejaculation — Dapoxetine Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record
        </p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}, ${state.patient.gpPractice}` : "—"} />
      </div>

      {/* Consent */}
      <div>
        <SectionHeader>Consent</SectionHeader>
        <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes (${state.consent.idType})` : "No"} />
        <Row
          label="Private service awareness"
          value={state.consent.patientAwarePrivateService ? "Yes" : "No"}
        />
      </div>

      {/* Clinical Assessment */}
      <div>
        <SectionHeader>Clinical Assessment</SectionHeader>
        <Row
          label="PE type"
          value={state.clinicalAssessment.peType ? state.clinicalAssessment.peType.charAt(0).toUpperCase() + state.clinicalAssessment.peType.slice(1) : "—"}
        />
        <Row
          label="IELT (minutes)"
          value={state.clinicalAssessment.ieltMinutes !== null ? state.clinicalAssessment.ieltMinutes : "—"}
        />
        <Row
          label="Relationship distress"
          value={state.clinicalAssessment.relationshipDistress ? "Yes" : "No"}
        />
        <Row
          label="Psychological distress"
          value={state.clinicalAssessment.psychologicalDistress ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <div>
        <SectionHeader>Medical History</SectionHeader>
        <Row label="Cardiac disorder" value={state.medicalHistory.cardiacDisorder ? "Yes" : "No"} />
        <Row label="History of syncope" value={state.medicalHistory.syncope ? "Yes" : "No"} />
        <Row
          label="Severe hepatic impairment"
          value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
        />
        <Row
          label="Uncontrolled epilepsy"
          value={state.medicalHistory.uncontrolledEpilepsy ? "Yes" : "No"}
        />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Current Medications */}
      <div>
        <SectionHeader>Current Medications</SectionHeader>
        <Row
          label="MAOIs/SSRIs/SNRIs"
          value={state.currentMedications.maoisOrSsrisOrSnris ? "Yes" : "No"}
        />
        <Row
          label="Thioridazine"
          value={state.currentMedications.thioridazine ? "Yes" : "No"}
        />
        {state.currentMedications.otherMedications && (
          <Row label="Other medications" value={state.currentMedications.otherMedications} />
        )}
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row
          label="Severe/sudden adverse events"
          value={state.contraindications.hadSevereOrSuddenAE ? "Yes" : "No"}
        />
        {state.contraindications.hadSevereOrSuddenAE && (
          <Row label="Details" value={state.contraindications.aeDetail || "—"} />
        )}
      </div>

      {/* Orthostatic Hypotension */}
      <div>
        <SectionHeader>Orthostatic Hypotension Assessment</SectionHeader>
        <Row label="Lying BP" value={state.summary.lyingBP || "—"} />
        <Row label="Standing BP" value={state.summary.standingBP || "—"} />
      </div>

      {/* Clinical Alerts */}
      <div>
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Supply */}
      <div>
        <SectionHeader>Medicine Supply</SectionHeader>
        <Row
          label="Dapoxetine supplied"
          value={state.medicineSupply.dapoxetine30mgSupplied ? "Yes" : "No"}
        />
        <Row
          label="May increase to 60mg"
          value={state.medicineSupply.mayIncreaseTo60mg ? "Yes" : "No"}
        />
        <Row
          label="Patient understands usage"
          value={state.medicineSupply.understandsUsage ? "Yes" : "No"}
        />
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Take with water 1-3 hrs before", state.counselling.takeWithWater],
            ["Avoid alcohol", state.counselling.avoidAlcohol],
            ["Do not drive for 2 hours after", state.counselling.noDrive2hrs],
            ["Avoid grapefruit juice", state.counselling.avoidGrapefruit],
            ["May cause nausea/dizziness/headache", state.counselling.mayHaveSideEffects],
            ["Not for daily use (PRN only)", state.counselling.notForDaily],
            ["Review efficacy after 4 weeks", state.counselling.review4weeks],
          ]}
        />
      </div>

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </div>
      )}

      {/* Consultation Details */}
      <div>
        <SectionHeader>Consultation Details</SectionHeader>
        <Row label="Date" value={state.summary.consultationDate} />
        <Row label="Time" value={state.summary.consultationTime} />
      </div>

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Premature Ejaculation (Dapoxetine)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="Premature Ejaculation (Dapoxetine)" />
    </div>
  );
}
