"use client";

import React from "react";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { PGD_VERSION, EXCLUSION_REFERRAL_LABEL, type Clinical } from "../junior-travel-types";

export interface VaccineGivenRow {
  id: string;
  name: string;
  dose: string;
  route: string;
  doseNumber: string;
  previousDoseDate: string;
  batchNumber: string;
  expiryDate: string;
  site: string;
  nextDueDate: string | null;
  nextDueLabel: string | null;
  schedule: string;
}

interface Props {
  patient: BasePatientDetails;
  consent: BaseConsent;
  summary: BaseSummary;
  clinical: Clinical;
  alerts: ClinicalAlert[];
  hasStops: boolean;
  vaccines: VaccineGivenRow[];
  daysToDeparture: number | null;
}

const CONSENT_BASIS_LABEL: Record<string, string> = {
  parental: "Person with parental responsibility",
  gillick: "Young person, assessed as Gillick competent",
  self: "Young person aged 16 or 17",
};

const doseLabel = (d: string) => (d === "booster" ? "Booster" : d ? `Dose ${d}` : "Not recorded");

/**
 * Printed consultation record for the Junior Travel Vaccines ePGD. Rendered
 * as the content of the final step so that Save & Print prints the record
 * (patient, consent, destination, each vaccine with dose, route, batch,
 * expiry, site and next due date, advice, pharmacist and PGD version) and
 * not the form. When a stop exists it prints "not supplied" and no vaccine,
 * and the shared declaration ("no exclusion criteria applied") is replaced.
 */
export default function JuniorTravelSummaryReport({
  patient, consent, summary, clinical: c, alerts, hasStops, vaccines, daysToDeparture,
}: Props) {
  const stops = alerts.filter((a) => a.severity === "stop");
  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">Junior Travel Vaccines ePGD. {PGD_VERSION}</p>
        {hasStops && (
          <p className="mt-2 text-sm font-semibold text-red-700">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6 print:space-y-4">
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
            <Row label="Date of birth" value={patient.dateOfBirth} />
            <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
            <Row label="Address" value={patient.address || "Not provided"} />
            <Row label="NHS number" value={patient.nhsNumber || "Not provided"} />
            <Row label="GP" value={[patient.gpName, patient.gpPractice].filter(Boolean).join(", ") || "Not provided"} />
            <Row label="Allergies" value={c.allergies || "Not recorded"} />
          </div>
        </div>

        <div>
          <SectionHeader>Travel Risk Assessment</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Destination" value={c.destination || "Not recorded"} />
            <Row label="Departure date" value={c.departureDate ? `${c.departureDate}${daysToDeparture !== null ? ` (${daysToDeparture} days from consultation)` : ""}` : "Not recorded"} />
            <Row label="Itinerary" value={c.itinerary || "Not recorded"} />
            <Row label="Recommended for destination (NaTHNaC / TravelHealthPro) or Green Book risk" value={c.recommendedForDestination ? "Confirmed" : "Not confirmed"} />
            <Row label="Routine UK immunisations" value={c.routineUpToDate ? "Up to date" : c.catchUpPlanDiscussed ? "Not up to date; catch-up plan discussed and GP informed" : "Not confirmed"} />
          </div>
        </div>

        <div>
          <SectionHeader>Consent and Presence of an Adult</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consent given by" value={CONSENT_BASIS_LABEL[c.consentBasis] || "Not recorded"} />
            {c.consentDetail && (
              <Row label={c.consentBasis === "gillick" ? "Basis of Gillick competence assessment" : "Relationship to the child"} value={c.consentDetail} />
            )}
            <Row label="Person with parental responsibility or authorised adult present" value={c.parentPresent ? `Yes${c.parentPresentDetail ? `: ${c.parentPresentDetail}` : ""}` : "No"} />
          </div>
          <div className="mt-2">
            <CounsellingGrid items={[
              ["Informed consent obtained", consent.informedConsentGiven],
              ["ID verified", consent.idVerified],
              ["Aware this is a private service", consent.patientAwarePrivateService],
            ]} />
          </div>
        </div>

        <div>
          <SectionHeader>Exclusion Screen</SectionHeader>
          <CounsellingGrid items={[
            ["Anaphylaxis to previous dose or component", c.anaphylaxisComponent],
            ["Acute severe febrile illness", c.acuteFebrileIllness],
            ["Immunosuppression, asplenia or complement deficiency", c.immunosuppressed],
            ["Known or suspected pregnancy", c.pregnant],
            ["Bleeding disorder not assessed as safe", c.bleedingDisorder],
            ["Post-exposure treatment", c.postExposure],
            ["Clinical uncertainty", c.clinicalUncertainty],
          ]} />
        </div>

        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </div>

        {hasStops ? (
          <div>
            <SectionHeader>Exclusion Outcome</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Reason" value={stops.map((s) => s.message).join("; ")} />
              <Row label="Advice given and decision reached" value={c.exclusionAdvice || "Not recorded"} />
              <Row label="GP informed or referral" value={EXCLUSION_REFERRAL_LABEL[c.exclusionReferral]} />
              <Row label="Vaccines" value="Not supplied" />
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader>Vaccines Administered Under This PGD</SectionHeader>
            {vaccines.length === 0 ? (
              <p className="text-xs text-gray-500">No vaccine selected.</p>
            ) : (
              <div className="space-y-4">
                {vaccines.map((v) => (
                  <div key={v.id} className="space-y-1.5">
                    <p className="text-xs font-semibold text-navy-900">{v.name}</p>
                    <Row label="Dose, form and route" value={`${v.dose}; ${v.route}`} />
                    <Row label="Dose in course" value={doseLabel(v.doseNumber)} />
                    {v.previousDoseDate && <Row label="Date of previous dose" value={v.previousDoseDate} />}
                    <Row label="Batch number" value={v.batchNumber || "Not recorded"} />
                    <Row label="Expiry date" value={v.expiryDate || "Not recorded"} />
                    <Row label="Site" value={v.site || "Not recorded"} />
                    <Row label="Next dose due" value={v.nextDueDate ? `${v.nextDueDate}: ${v.nextDueLabel}` : "Course complete"} />
                  </div>
                ))}
                <Row label="Date of administration" value={summary.consultationDate} />
                <Row label="Administered via PGD" value="Yes" />
                <Row label="Adrenaline 1 in 1,000, anaphylaxis facilities and telephone available" value={c.anaphylaxisKit ? "Confirmed" : "Not confirmed"} />
                <Row label="15 minute seated observation completed" value={c.observationCompleted ? "Yes" : "No"} />
                <Row label="Adverse reaction" value={c.adverseReaction ? c.adverseReactionDetails || "Yes, details not recorded" : "None observed"} />
                <Row label="GP informed" value={c.gpInformed ? "Yes" : "No"} />
              </div>
            )}
          </div>
        )}

        {!hasStops && (
          <div>
            <SectionHeader>Advice Given</SectionHeader>
            <CounsellingGrid items={[
              ["PIL offered; written record of vaccines and dates; remaining doses explained", c.scheduleAdvice],
              ["Side effects and Yellow Card reporting explained", c.sideEffectAdvice],
              ["Written destination-specific advice: food and water, bites, animals, malaria", c.bitesAndFoodAdvice],
              ["Animal bite, scratch or lick abroad needs urgent treatment", c.rabiesAdvice],
            ]} />
            {c.twinrixCoAdminReason && (
              <div className="mt-2"><Row label="Twinrix Paediatric same-day co-administration reason" value={c.twinrixCoAdminReason} /></div>
            )}
          </div>
        )}

        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
          </div>
        </div>

        {hasStops ? (
          <div>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this child was assessed under the Patient Group Direction for Junior Travel Vaccines, that exclusion criteria applied, that no vaccine was administered under the PGD, and that the advice given and the decision reached are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </div>
        ) : (
          <PharmacistDeclaration
            pgdName="Junior Travel Vaccines"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName="Junior Travel Vaccines" />
      </div>
    </div>
  );
}
