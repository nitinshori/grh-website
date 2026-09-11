"use client";

import type { HLConsultationState } from "../lib/hair-loss-types";
import type { ClinicalAlert } from "../../shared/types";
import { PGD_STRAPLINE } from "../lib/hair-loss-clinical-logic";
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
          Hair Loss, Finasteride Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record
        </p>
        <p className="text-xs text-gray-500 mt-1">{PGD_STRAPLINE}</p>
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
        <Row label="Suspected or diagnosed prostate cancer" value={state.medicalHistory.prostateCancer ? "Yes" : "No"} />
        <Row label="Raised PSA under investigation" value={state.medicalHistory.psaAbnormalities ? "Yes" : "No"} />
        <Row
          label="Hypersensitivity to finasteride or any component"
          value={state.medicalHistory.hypersensitivity ? "Yes" : "No"}
        />
        <Row label="Current 5-alpha-reductase inhibitor use" value={state.medicalHistory.current5ARI ? "Yes" : "No"} />
        <Row label="Galactose intolerance / Lapp lactase deficiency / glucose-galactose malabsorption" value={state.medicalHistory.galactoseIntolerance ? "Yes" : "No"} />
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
          label="Finasteride 1 mg tablets, 1 mg orally once daily, supplied"
          value={state.medicineSupply.finasteride1mgOd ? "Yes" : "No"}
        />
        <Row
          label="Quantity supplied"
          value={state.medicineSupply.quantityMonths ? `${state.medicineSupply.quantityMonths} months of treatment (first review after 3 to 6 months)` : "Not recorded"}
        />
        <Row
          label="Tablets not to be handled by women who are or may become pregnant; partner informed"
          value={state.medicineSupply.partnerNotified ? "Yes" : "No"}
        />
        <Row
          label="Condom advice (female partner pregnant or likely to become pregnant)"
          value={state.medicineSupply.condomAdvice ? "Yes" : "No"}
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
            ["Continuous use 3 to 6 months before stabilisation; peak at 2 years; must continue", state.counselling.effectOnsetTime],
            ["If stopped, effects reverse by 6 months, baseline by 9 to 12 months", state.counselling.hairLossResumesStopped],
            [
              "Sexual side effects possible (libido, erectile dysfunction, ejaculation, breast tenderness; infertility reports)",
              state.counselling.sexualSideEffects,
            ],
            ["Psychological side effects: report mood changes; stop and seek advice", state.counselling.moodChanges],
            ["Report breast changes promptly (lumps, pain, gynaecomastia, nipple discharge)", state.counselling.breastChanges],
            ["Review after 3 to 6 months; reassess if no improvement after 12 months", state.counselling.annualReview],
            ["Realistic expectations, dose, scalp protection, psychosocial effects", state.counselling.expectations],
            [
              "Seek medical advice if adverse effects or systemically very unwell",
              state.counselling.reportChanges,
            ],
            ["PIL and patient card supplied", state.counselling.pilAndCardSupplied],
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
