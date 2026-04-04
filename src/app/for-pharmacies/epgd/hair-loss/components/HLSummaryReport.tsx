"use client";

import type { HLConsultationState } from "../lib/hair-loss-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HLSummaryReportProps {
  state: HLConsultationState;
  alerts: ClinicalAlert[];
}

export function HLSummaryReport({ state, alerts }: HLSummaryReportProps) {
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          Hair Loss — Finasteride Consultation
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
          label="Norwood-Hamilton Scale"
          value={state.clinicalAssessment.norwoodHamiltonScale || "—"}
        />
        <Row
          label="Androgenetic alopecia confirmed"
          value={state.clinicalAssessment.hasAndrogeneticAlopecia ? "Yes" : "No"}
        />
        <Row
          label="Alopecia onset"
          value={state.clinicalAssessment.alopeciaOnset || "—"}
        />
        <Row
          label="Family history"
          value={state.clinicalAssessment.familyHistory ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <div>
        <SectionHeader>Medical History</SectionHeader>
        <Row label="Liver disease" value={state.medicalHistory.liverDisease ? "Yes" : "No"} />
        <Row label="Prostate cancer" value={state.medicalHistory.prostateCancer ? "Yes" : "No"} />
        <Row label="PSA abnormalities" value={state.medicalHistory.psaAbnormalities ? "Yes" : "No"} />
        <Row
          label="Hypersensitivity"
          value={state.medicalHistory.hypersensitivity ? "Yes" : "No"}
        />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row
          label="Depressive mood/changes"
          value={state.contraindications.depressiveMood ? "Yes" : "No"}
        />
        {state.contraindications.depressiveMood && (
          <Row
            label="Details"
            value={state.contraindications.depressiveMoodDetail || "—"}
          />
        )}
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
          label="Finasteride 1mg OD supplied"
          value={state.medicineSupply.finasteride1mgOd ? "Yes" : "No"}
        />
        <Row
          label="Partner notified (teratogenic risk)"
          value={state.medicineSupply.partnerNotified ? "Yes" : "No"}
        />
        <Row
          label="Patient to monitor SE"
          value={state.medicineSupply.willMonitorSE ? "Yes" : "No"}
        />
        <Row
          label="Understands PSA effect"
          value={state.medicineSupply.understandsPSAEffect ? "Yes" : "No"}
        />
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Takes 3-6 months for effect", state.counselling.effectOnsetTime],
            ["Hair loss resumes if stopped", state.counselling.hairLossResumesStopped],
            [
              "Sexual side effects possible (~2%)",
              state.counselling.sexualSideEffects,
            ],
            ["Report mood changes to GP", state.counselling.moodChanges],
            ["Annual review recommended", state.counselling.annualReview],
            [
              "Report adverse changes immediately",
              state.counselling.reportChanges,
            ],
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
        pgdName="Hair Loss (Finasteride)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="Hair Loss (Finasteride)" />
    </div>
  );
}
