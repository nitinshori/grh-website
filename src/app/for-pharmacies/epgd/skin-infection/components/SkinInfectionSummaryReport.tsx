"use client";

import type { SkinInfectionConsultationState } from "../lib/skin-infection-types";
import { PGD_VERSION_LABEL } from "../lib/skin-infection-types";
import {
  hasHardStops,
  getAgeBand,
  AGE_BAND_LABEL,
  isCellulitisPgd,
  isMoreExtensiveInfection,
} from "../lib/skin-infection-logic";

interface SkinInfectionSummaryReportProps {
  state: SkinInfectionConsultationState;
}

const INFECTION_LABEL: Record<string, string> = {
  impetigo: "Impetigo",
  folliculitis: "Folliculitis",
  "infected-eczema": "Infected eczema",
  "infected-wound": "Infected wound",
  cellulitis: "Cellulitis (mild)",
};

const ANTIBIOTIC_LABEL: Record<string, string> = {
  flucloxacillin: "Flucloxacillin",
  clarithromycin: "Clarithromycin",
  doxycycline: "Doxycycline",
};

const RENAL_LABEL: Record<string, string> = {
  "not-known-no-concern": "not known, no reason to suspect impairment",
  "known-crcl-30-or-above": "known impairment, CrCl 30 mL/min or above",
  "crcl-below-30-or-suspected": "CrCl below 30 mL/min or suspected significant impairment",
  "crcl-below-10": "CrCl below 10 mL/min",
};

export function SkinInfectionSummaryReport({ state }: SkinInfectionSummaryReportProps) {
  const stopped = hasHardStops(state.alerts);
  const dose = state.doseRecommendation;
  const cellulitisPgd = isCellulitisPgd(state);
  const a = state.assessment;
  const band = getAgeBand(state.patient.age);
  const title = cellulitisPgd ? "Cellulitis PGD: Consultation Record" : "Skin and Soft Tissue Infection PGD: Consultation Record";
  const isCellulitisCase = a.infectionType === "cellulitis";

  return (
    <div className="p-8 text-sm text-gray-900">
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="text-xs text-gray-500 mb-1">
        Get Real Health ePGD. Flucloxacillin / Clarithromycin / Doxycycline.{" "}
        {state.summary.consultationDate} {state.summary.consultationTime}
      </p>
      <p className="text-xs text-gray-500 mb-6">{PGD_VERSION_LABEL[state.variant]}</p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Patient</h2>
      <p>
        {state.patient.firstName} {state.patient.lastName}. DOB {state.patient.dateOfBirth}
        {state.patient.age !== null ? ` (age ${state.patient.age})` : ""}
        {!cellulitisPgd && band ? `. Age band: ${AGE_BAND_LABEL[band]}` : ""}
      </p>
      <p>{state.patient.address}</p>
      <p className="mb-4">
        NHS no: {state.patient.nhsNumber || "not recorded"}. GP: {state.patient.gpName || "not recorded"},{" "}
        {state.patient.gpPractice || "not recorded"}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Consent</h2>
      <p className="mb-4">
        Informed consent {state.consent.informedConsentGiven ? "given" : "NOT recorded"}.
        {!cellulitisPgd && state.patient.age !== null && state.patient.age < 16 && (
          <>
            {" "}
            Under 16: consent from{" "}
            {state.consent.consentBasis === "parental-responsibility"
              ? "a person with parental responsibility"
              : state.consent.consentBasis === "gillick-competent"
                ? "the young person, assessed as Gillick competent"
                : "not recorded"}
            . Basis: {state.consent.consentBasisNotes || "not recorded"}.
          </>
        )}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Assessment</h2>
      <p>
        {INFECTION_LABEL[a.infectionType] || "not recorded"}. Severity {a.severity || "not recorded"}. Site and extent:{" "}
        {a.affectedSite || "not recorded"}. Duration {a.durationDays || "not recorded"} day(s).
        {!cellulitisPgd && a.weightKg ? ` Weight ${a.weightKg} kg.` : ""}
      </p>
      <p>
        Observations: temperature {a.temperature || "not recorded"} C; pulse {a.pulse || "not recorded"}; respiratory rate{" "}
        {a.respiratoryRate || "not recorded"}
        {cellulitisPgd || band === "12+" ? `; systolic BP ${a.systolicBP || "not recorded"}` : ""}
        {!cellulitisPgd ? `; SpO2 ${a.oxygenSaturation || "not recorded"}%` : ""}
        {!cellulitisPgd && (band === "2-4" || band === "5-11")
          ? `; capillary refill ${a.capillaryRefillOver2s ? "more than 2 seconds" : "2 seconds or less"}`
          : ""}
        ; {a.alteredConsciousness ? "new confusion or drowsiness present" : "no new confusion or drowsiness"}
        {cellulitisPgd ? `; rigors ${a.rigors ? "present" : "absent"}` : ""}.
      </p>
      {!cellulitisPgd && (a.extensiveInfection || isCellulitisCase) && (
        <p>
          More extensive infection (Appendix 2):{" "}
          {isMoreExtensiveInfection(a)
            ? [
                a.extensiveInfection ? "erythema larger than about 10 cm across or more than one body region" : "",
                isCellulitisCase ? "cellulitis rather than a superficial infection" : "",
              ]
                .filter(Boolean)
                .join("; ")
            : "no"}
          .
        </p>
      )}
      {isCellulitisCase && (
        <p>
          Cellulitis: {cellulitisPgd ? "adult 18 or over" : "patient 12 or over"}. Margins marked:{" "}
          {a.marginsMarked ? "yes" : "NO"}
          {cellulitisPgd
            ? `. Time marked: ${a.marginMarkedTime || "not recorded"}`
            : `. In-person 48-hour review at this pharmacy booked for: ${a.reviewDateTime || "not recorded"}`}
          .
        </p>
      )}
      <p className="mb-4">
        {a.necrotisingFeatures ? "Necrotising fasciitis feature present. " : ""}
        {a.spreadingRapidly ? "Rapidly advancing erythema. " : ""}
        {a.systemicSymptoms ? "Systemic symptoms present. " : ""}
        {a.abscessSuspected ? "Abscess or surgical review needed. " : ""}
        {a.facialOrExcludedSite ? "Excluded site. " : ""}
        {a.biteOrWaterExposure ? "Bite or water exposure. " : ""}
        {a.jointOrBoneInvolvement ? "Joint, tendon or bone involvement suspected. " : ""}
        {a.possibleTinea ? "Possible tinea or untreated fungal infection. " : ""}
        {a.possibleViral ? "Possible viral infection or eczema herpeticum. " : ""}
        {a.diabeticFootOrLymphoedema ? "Diabetic foot, lymphoedema or venous ulceration. " : ""}
        {a.suspectedDvtOrBilateral ? "Suspected DVT or bilateral redness. " : ""}
        {a.antibioticAlreadyTaken ? "Antibiotic already taken this episode. " : ""}
        {a.antibioticFailureOrRecurrence ? "Antibiotic failure or recurrence within 3 months. " : ""}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Allergies and history</h2>
      <p>{state.medicalHistory.allergies || "not recorded"}</p>
      <p className="mb-4">
        {state.medicalHistory.pregnant ? "Pregnant. " : ""}
        {state.medicalHistory.breastfeeding ? "Breastfeeding. " : ""}
        {state.medicalHistory.immunosuppressed ? "Immunosuppressed. " : ""}
        {state.medicalHistory.renalFunction
          ? `Renal function asked: ${RENAL_LABEL[state.medicalHistory.renalFunction]}. `
          : ""}
        {state.medicalHistory.currentMedicines ? `Medicines: ${state.medicalHistory.currentMedicines}` : ""}
      </p>

      <h2 className="font-semibold border-b border-gray-300 mb-2">Outcome</h2>
      {stopped ? (
        <p className="mb-4 font-semibold">
          NOT SUPPLIED: exclusion criteria met; patient referred. See alerts below.
        </p>
      ) : (
        <div className="mb-4">
          <p className="font-semibold">
            Supplied: {ANTIBIOTIC_LABEL[state.antibioticSelection.choice] || "not recorded"}{" "}
            {state.antibioticSelection.formulation}
          </p>
          {dose && (
            <p>
              {dose.medicine}. {dose.dose}. {dose.duration}. Route: oral.
            </p>
          )}
          <p>
            Course: {state.antibioticSelection.courseDays || "not recorded"} days. Quantity:{" "}
            {state.antibioticSelection.quantitySupplied || "not recorded"}. Batch:{" "}
            {state.antibioticSelection.batchNumber || "not recorded"}. Expiry:{" "}
            {state.antibioticSelection.expiryDate || "not recorded"}.
          </p>
          {state.antibioticSelection.rationale && (
            <p>
              {state.antibioticSelection.choice && state.antibioticSelection.choice !== "flucloxacillin"
                ? "Reason flucloxacillin unsuitable: "
                : "Rationale: "}
              {state.antibioticSelection.rationale}
            </p>
          )}
        </div>
      )}

      {state.alerts.length > 0 && (
        <>
          <h2 className="font-semibold border-b border-gray-300 mb-2">Clinical alerts</h2>
          <ul className="list-disc list-inside mb-4">
            {state.alerts.map((al, i) => (
              <li key={i}>
                [{al.severity.toUpperCase()}] {al.message}
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
        {state.summary.pharmacistName}. GPhC {state.summary.pharmacistGPhC}
      </p>
      <p>
        {state.summary.pharmacyName} {state.summary.pharmacyAddress}
      </p>
      <p className="mt-6 text-xs text-gray-500">
        Supplied under the {cellulitisPgd ? "Cellulitis" : "Skin and Soft Tissue Infection"} Patient Group Direction ({PGD_VERSION_LABEL[state.variant]}). Signed and dated record retained per PGD record-keeping requirements.
      </p>
    </div>
  );
}
