"use client";

import type { STIConsultationState } from "../lib/sti-types";
import type { ClinicalAlert } from "../../shared/types";
import { getWindowPeriodInfo } from "../lib/sti-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface STISummaryReportProps {
  state: STIConsultationState;
  alerts: ClinicalAlert[];
}

export function STISummaryReport({ state, alerts }: STISummaryReportProps) {
  const windowPeriods = getWindowPeriodInfo();

  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          STI Testing Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Test Requisition and Counselling Record
        </p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="Gender Identity" value={state.patient.genderIdentity || "—"} />
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
        <Row
          label="Number of sexual partners (3 months)"
          value={state.riskAssessment.numberOfPartners !== null ? state.riskAssessment.numberOfPartners : "—"}
        />
        <Row
          label="Condom usage"
          value={state.riskAssessment.condomUsage ? state.riskAssessment.condomUsage.charAt(0).toUpperCase() + state.riskAssessment.condomUsage.slice(1) : "—"}
        />
        <Row
          label="Previous STIs"
          value={state.riskAssessment.previousSTIs ? "Yes" : "No"}
        />
        {state.riskAssessment.previousSTIs && (
          <Row label="Details" value={state.riskAssessment.previousStiDetail || "—"} />
        )}
        <Row
          label="Current symptoms"
          value={state.riskAssessment.currentSymptoms ? "Yes" : "No"}
        />
        {state.riskAssessment.currentSymptoms && (
          <Row label="Details" value={state.riskAssessment.symptomDetail || "—"} />
        )}
        <Row label="MSM status" value={state.riskAssessment.msmStatus ? "Yes" : "No"} />
        <Row label="Sex worker" value={state.riskAssessment.sexWorker ? "Yes" : "No"} />
        <Row label="PWID" value={state.riskAssessment.pwid ? "Yes" : "No"} />
      </div>

      {/* Clinical Assessment */}
      <div>
        <SectionHeader>Clinical Assessment</SectionHeader>
        <Row
          label="Urethral discharge"
          value={state.clinicalAssessment.urethralDischarge ? "Yes" : "No"}
        />
        <Row
          label="Genital pain"
          value={state.clinicalAssessment.genitalPain ? "Yes" : "No"}
        />
        <Row
          label="Rectal symptoms"
          value={state.clinicalAssessment.rectalSymptoms ? "Yes" : "No"}
        />
        <Row
          label="Pharyngeal symptoms"
          value={state.clinicalAssessment.pharyngealSymptoms ? "Yes" : "No"}
        />
        <Row
          label="Systemic symptoms"
          value={state.clinicalAssessment.systemicSymptoms ? "Yes" : "No"}
        />
        {state.clinicalAssessment.systemicSymptoms && (
          <Row label="Details" value={state.clinicalAssessment.systemicDetail || "—"} />
        )}
      </div>

      {/* Tests Ordered */}
      <div>
        <SectionHeader>Tests Ordered</SectionHeader>
        {state.testSelection.ctGc && (
          <Row
            label="Chlamydia/Gonorrhoea"
            value={`Sample: ${state.testSelection.ctGcSampleType}`}
          />
        )}
        {state.testSelection.hiv && (
          <Row
            label="HIV"
            value={`Type: ${state.testSelection.hivTestType}`}
          />
        )}
        {state.testSelection.syphilis && <Row label="Syphilis serology" value="Yes" />}
        {state.testSelection.hepatitisB && <Row label="Hepatitis B serology" value="Yes" />}
        {state.testSelection.hepatitisC && <Row label="Hepatitis C serology" value="Yes" />}
      </div>

      {/* Window Periods */}
      <div>
        <SectionHeader>Window Period Information</SectionHeader>
        <div className="space-y-2">
          {state.testSelection.ctGc && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">CT/GC:</span> {windowPeriods["Chlamydia/Gonorrhoea"]}
            </p>
          )}
          {state.testSelection.hiv && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">HIV:</span> {windowPeriods.HIV}
            </p>
          )}
          {state.testSelection.syphilis && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Syphilis:</span> {windowPeriods.Syphilis}
            </p>
          )}
          {state.testSelection.hepatitisB && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Hepatitis B:</span> {windowPeriods["Hepatitis B"]}
            </p>
          )}
          {state.testSelection.hepatitisC && (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Hepatitis C:</span> {windowPeriods["Hepatitis C"]}
            </p>
          )}
        </div>
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <AlertSummary alerts={alerts} />
        </div>
      )}

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <div className="space-y-1.5 text-xs">
          <p>
            {state.counselling.windowPeriods ? "✓" : "—"} Window period information explained
          </p>
          <p>
            {state.counselling.partnerNotification ? "✓" : "—"} Partner notification discussed
          </p>
          <p>
            {state.counselling.safeSex ? "✓" : "—"} Safe sex practices advised
          </p>
          <p>
            {state.counselling.resultsTimeline ? "✓" : "—"} Results timeline explained
          </p>
          <p>
            {state.counselling.positiveTestMeaning ? "✓" : "—"} Positive test results explained
          </p>
          <p>
            {state.counselling.followUp ? "✓" : "—"} Follow-up procedures explained
          </p>
        </div>
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
        pgdName="STI Testing"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="STI Testing" />
    </div>
  );
}
