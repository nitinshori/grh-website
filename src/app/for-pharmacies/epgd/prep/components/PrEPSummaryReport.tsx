"use client";

import type { PrEPConsultationState } from "../lib/prep-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface PrEPSummaryReportProps {
  state: PrEPConsultationState;
  alerts: ClinicalAlert[];
}

export function PrEPSummaryReport({ state, alerts }: PrEPSummaryReportProps) {
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          PrEP — HIV Pre-exposure Prophylaxis Consultation
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

      {/* Risk Assessment */}
      <div>
        <SectionHeader>Risk Assessment</SectionHeader>
        <Row label="MSM" value={state.riskAssessment.msm ? "Yes" : "No"} />
        <Row label="Trans person" value={state.riskAssessment.transPerson ? "Yes" : "No"} />
        {state.riskAssessment.transPerson && (
          <Row label="Details" value={state.riskAssessment.transPersonDetails || "—"} />
        )}
        <Row
          label="Heterosexual with HIV+ partner"
          value={state.riskAssessment.heterosexualWithHivPartner ? "Yes" : "No"}
        />
        <Row
          label="Sex worker or partner"
          value={state.riskAssessment.sexWorkerOrPartner ? "Yes" : "No"}
        />
        <Row label="PWID" value={state.riskAssessment.pwid ? "Yes" : "No"} />
        <Row label="Chemsex" value={state.riskAssessment.chemsex ? "Yes" : "No"} />
        {state.riskAssessment.otherRiskFactors && (
          <Row label="Other risk factors" value={state.riskAssessment.otherRiskFactors} />
        )}
      </div>

      {/* Baseline Tests */}
      <div>
        <SectionHeader>Baseline Testing</SectionHeader>
        <Row
          label="HIV negative confirmed"
          value={state.baselineTests.hivTestConfirmedNegative ? "Yes" : "No"}
        />
        <Row label="HIV test date" value={state.baselineTests.hivTestDate || "—"} />
        <Row
          label="Hepatitis B antigen"
          value={state.baselineTests.hepatitisBAntigenResult || "—"}
        />
        <Row
          label="eGFR (mL/min/1.73m²)"
          value={state.baselineTests.eGfr !== null ? state.baselineTests.eGfr : "—"}
        />
        <Row
          label="STI screening completed"
          value={state.baselineTests.stiScreening ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <div>
        <SectionHeader>Medical History</SectionHeader>
        <Row
          label="Active Hepatitis B infection"
          value={state.medicalHistory.activeHepatitisB ? "Yes" : "No"}
        />
        <Row
          label="Severe kidney disease"
          value={state.medicalHistory.severeKidneyDisease ? "Yes" : "No"}
        />
        <Row
          label="Bone density issues"
          value={state.medicalHistory.boneDensityIssues ? "Yes" : "No"}
        />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row label="HIV positive" value={state.contraindications.hivPositive ? "Yes" : "No"} />
        <Row label="eGFR <60" value={state.contraindications.eGfrBelow60 ? "Yes" : "No"} />
        <Row label="Unknown HIV status" value={state.contraindications.unknownHivStatus ? "Yes" : "No"} />
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
          label="Emtricitabine/Tenofovir 200/245mg supplied"
          value={state.medicineSupply.emtricitabineTenofovir200245 ? "Yes" : "No"}
        />
        <Row
          label="Dosing regimen"
          value={state.medicineSupply.dosingRegimen ? (state.medicineSupply.dosingRegimen === "daily" ? "Daily" : "Event-based") : "—"}
        />
        {state.medicineSupply.dosingRegimen === "daily" && (
          <Row
            label="Daily dosing understood"
            value={state.medicineSupply.understandsDailyDosing ? "Yes" : "No"}
          />
        )}
        {state.medicineSupply.dosingRegimen === "event-based" && (
          <Row
            label="Event-based dosing understood"
            value={state.medicineSupply.understandsEventBased ? "Yes" : "No"}
          />
        )}
        <Row
          label="Renal monitoring arranged"
          value={state.medicineSupply.renalMonitoring ? "Yes" : "No"}
        />
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Not substitute for condoms", state.counselling.notSubstituteForCondoms],
            ["Regular HIV testing (every 3 months)", state.counselling.regularHivTesting],
            ["Renal monitoring every 3-6 months", state.counselling.renalMonitoring],
            ["Take with food", state.counselling.takeWithFood],
            ["Adherence is critical", state.counselling.adherenceCritical],
            ["Missed dose management", state.counselling.missedDose],
            ["PEP available if exposure while off PrEP", state.counselling.pepAvailable],
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
        pgdName="PrEP (HIV Pre-exposure Prophylaxis)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="PrEP (HIV Pre-exposure Prophylaxis)" />
    </div>
  );
}
