"use client";

import type { SkinInfectionConsultationState } from "../lib/skin-infection-types";
import { hasHardStops } from "../lib/skin-infection-logic";

interface SkinInfectionSummaryReportProps {
  state: SkinInfectionConsultationState;
}

const INFECTION_LABEL: Record<string, string> = {
  impetigo: "Impetigo",
  folliculitis: "Folliculitis",
  "infected-eczema": "Infected eczema",
  "infected-wound": "Infected wound",
  cellulitis: "Cellulitis / erysipelas (mild)",
};

const ANTIBIOTIC_LABEL: Record<string, string> = {
  flucloxacillin: "Flucloxacillin",
  clarithromycin: "Clarithromycin",
  doxycycline: "Doxycycline",
};

export function SkinInfectionSummaryReport({ state }: SkinInfectionSummaryReportProps) {
  const stopped = hasHardStops(state.alerts);
  const dose = state.doseRecommendation;

  return (
    <div className="p-8 text-sm text-gray-900">
      <h1 className="text-xl font-bold mb-1">Skin Infection PGD — Consultation Record</h1>
      <p className="text-xs text-gray-500 mb-6">
        Get Real Health ePGD · Flucloxacillin / Clarithromycin / Doxycycline ·{" "}
        {state.summary.consultationDate} {state.summary.consultationTime}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Patient</h2>
      <p>
        {state.patient.firstName} {state.patient.lastName} · DOB {state.patient.dateOfBirth}
        {state.patient.age !== null ? ` (age ${state.patient.age})` : ""}
      </p>
      <p>{state.patient.address}</p>
      <p className="mb-4">
        NHS no: {state.patient.nhsNumber || "—"} · GP: {state.patient.gpName || "—"},{" "}
        {state.patient.gpPractice || "—"}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Assessment</h2>
      <p>
        {INFECTION_LABEL[state.assessment.infectionType] || "—"} · severity{" "}
        {state.assessment.severity || "—"} · site: {state.assessment.affectedSite || "—"} · duration{" "}
        {state.assessment.durationDays || "—"} day(s)
      </p>
      <p className="mb-4">
        {state.assessment.systemicSymptoms ? "Systemic symptoms present. " : ""}
        {state.assessment.spreadingRapidly ? "Rapidly spreading. " : ""}
        {state.assessment.abscessSuspected ? "Abscess suspected. " : ""}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Allergies and history</h2>
      <p className="mb-4">{state.medicalHistory.allergies || "—"}</p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Outcome</h2>
      {stopped ? (
        <p className="mb-4 font-semibold">
          NOT SUPPLIED — exclusion criteria met; patient referred. See alerts below.
        </p>
      ) : (
        <div className="mb-4">
          <p className="font-semibold">
            Supplied: {ANTIBIOTIC_LABEL[state.antibioticSelection.choice] || "—"}{" "}
            {state.antibioticSelection.formulation}
          </p>
          {dose && (
            <p>
              {dose.medicine} — {dose.dose} — {dose.duration}
            </p>
          )}
          <p>
            Course: {state.antibioticSelection.courseDays || "—"} days · Quantity:{" "}
            {state.antibioticSelection.quantitySupplied || "—"}
          </p>
          {state.antibioticSelection.rationale && (
            <p>Rationale: {state.antibioticSelection.rationale}</p>
          )}
        </div>
      )}

      {state.alerts.length > 0 && (
        <>
          <h2 className="font-semibold border-b border-gray-300 mb-2">Clinical alerts</h2>
          <ul className="list-disc list-inside mb-4">
            {state.alerts.map((a, i) => (
              <li key={i}>
                [{a.severity.toUpperCase()}] {a.message}
              </li>
            ))}
          </ul>
        </>
      )}

      {state.summary.clinicalNotes && (
        <>
          <h2 className="font-semibold border-b border-gray-300 mb-2">Clinical notes</h2>
          <p className="mb-4">{state.summary.clinicalNotes}</p>
        </>
      )}

      <h2 className="font-semibold border-b border-gray-300 mb-2">Pharmacist</h2>
      <p>
        {state.summary.pharmacistName} · GPhC {state.summary.pharmacistGPhC}
      </p>
      <p>
        {state.summary.pharmacyName} {state.summary.pharmacyAddress}
      </p>
      <p className="mt-6 text-xs text-gray-500">
        Supplied under the Skin Infection Patient Group Direction. Signed and dated record retained
        per PGD record-keeping requirements.
      </p>
    </div>
  );
}
