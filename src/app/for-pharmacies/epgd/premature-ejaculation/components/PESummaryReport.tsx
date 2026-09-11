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
          Premature Ejaculation, Dapoxetine Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record. Dapoxetine 30mg/60mg tablets (Priligy) for Premature Ejaculation PGD, version 003, issued 11 September 2026
        </p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}, ${state.patient.gpPractice}` : "Not recorded"} />
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
          value={state.clinicalAssessment.peType ? state.clinicalAssessment.peType.charAt(0).toUpperCase() + state.clinicalAssessment.peType.slice(1) : "Not recorded"}
        />
        <Row
          label="IELT (minutes)"
          value={state.clinicalAssessment.ieltMinutes !== null ? state.clinicalAssessment.ieltMinutes : "Not recorded"}
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
        <Row label="Cardiac disorder (NYHA II to IV, valvular)" value={state.medicalHistory.cardiacDisorder ? "Yes" : "No"} />
        <Row label="Conduction abnormality or QT prolongation" value={state.medicalHistory.conductionOrQT ? "Yes" : "No"} />
        <Row label="Ischaemic heart disease" value={state.medicalHistory.ischaemicHeartDisease ? "Yes" : "No"} />
        <Row label="History of syncope or orthostatic hypotension" value={state.medicalHistory.syncope ? "Yes" : "No"} />
        <Row
          label="Moderate or severe hepatic impairment (Child-Pugh B or C)"
          value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
        />
        <Row label="Mild hepatic impairment (Child-Pugh A)" value={state.medicalHistory.mildHepaticImpairment ? "Yes" : "No"} />
        <Row label="Moderate or severe renal impairment" value={state.medicalHistory.renalImpairment ? "Yes" : "No"} />
        <Row label="Bipolar disorder or mania" value={state.medicalHistory.bipolarOrMania ? "Yes" : "No"} />
        <Row
          label="Uncontrolled epilepsy"
          value={state.medicalHistory.uncontrolledEpilepsy ? "Yes" : "No"}
        />
        <Row label="History of seizures" value={state.medicalHistory.seizureHistory ? "Yes" : "No"} />
        <Row label="Bleeding disorder or anticoagulant" value={state.medicalHistory.bleedingDisorderOrAnticoagulant ? "Yes" : "No"} />
        <Row label="Orthostatic hypotension risk factors" value={state.medicalHistory.orthostaticRiskFactors ? "Yes" : "No"} />
        <Row label="CYP2D6 poor metaboliser" value={state.medicalHistory.cyp2d6PoorMetaboliser ? "Yes" : "No"} />
        <Row label="Hyponatraemia risk" value={state.medicalHistory.hyponatraemiaRisk ? "Yes" : "No"} />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Current Medications */}
      <div>
        <SectionHeader>Current Medications</SectionHeader>
        <Row
          label="Serotonergic medicine (now or within 14 days)"
          value={state.currentMedications.maoisOrSsrisOrSnris ? "Yes" : "No"}
        />
        <Row
          label="Thioridazine"
          value={state.currentMedications.thioridazine ? "Yes" : "No"}
        />
        <Row label="Potent CYP3A4 inhibitor" value={state.currentMedications.potentCyp3a4Inhibitor ? "Yes" : "No"} />
        <Row label="Moderate CYP3A4 inhibitor" value={state.currentMedications.moderateCyp3a4Inhibitor ? "Yes" : "No"} />
        <Row label="PDE5 inhibitor" value={state.currentMedications.pde5Inhibitor ? "Yes" : "No"} />
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
          <Row label="Details" value={state.contraindications.aeDetail || "Not recorded"} />
        )}
      </div>

      {/* Orthostatic Hypotension */}
      <div>
        <SectionHeader>Orthostatic Hypotension Assessment</SectionHeader>
        <Row label="Lying BP" value={state.summary.lyingBP || "Not recorded"} />
        <Row label="Standing BP" value={state.summary.standingBP || "Not recorded"} />
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
          label="Medicine, form and strength"
          value={state.medicineSupply.strengthSupplied ? `Dapoxetine ${state.medicineSupply.strengthSupplied} tablets, oral` : "Not recorded"}
        />
        <Row label="Brand" value={state.medicineSupply.brand || "Not recorded"} />
        <Row label="Quantity" value={state.medicineSupply.quantity !== null ? `${state.medicineSupply.quantity} tablets` : "Not recorded"} />
        <Row label="Dose" value="One tablet 1 to 3 hours before sexual activity; maximum one dose in 24 hours; not daily" />
        <Row
          label="30mg insufficient, 60mg permitted"
          value={state.medicineSupply.mayIncreaseTo60mg ? "Yes" : "No"}
        />
        <Row label="Supplied under" value="Dapoxetine for Premature Ejaculation PGD v003, 11 September 2026" />
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
            ["Take 1 to 3 hours before, with water", state.counselling.takeWithWater],
            ["Maximum one dose per 24 hours", state.counselling.maxOnePer24h],
            ["Avoid alcohol", state.counselling.avoidAlcohol],
            ["Stand up slowly", state.counselling.standSlowly],
            ["Maintain hydration", state.counselling.hydration],
            ["No driving or machinery if dizzy or drowsy", state.counselling.noDrive2hrs],
            ["Avoid grapefruit juice", state.counselling.avoidGrapefruit],
            ["Side effects explained", state.counselling.mayHaveSideEffects],
            ["Report chest pain, severe headache or fainting", state.counselling.reportChestPainHeadacheFainting],
            ["Priapism over 4 hours: immediate attention", state.counselling.priapismWarning],
            ["Inform GP, especially before new medicines", state.counselling.informGp],
            ["Not for daily use", state.counselling.notForDaily],
            ["Review after 4 weeks / 6 doses; reassess 6-monthly", state.counselling.review4weeks],
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
