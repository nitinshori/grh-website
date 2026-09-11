"use client";

import type { CovidBoosterConsultationState } from "../lib/covid-booster-types";
import { COVID_PRODUCTS } from "../lib/covid-booster-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface CovidBoosterSummaryReportProps {
  state: CovidBoosterConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: ReturnType<typeof import("../lib/covid-booster-clinical-logic").calculateDoseRecommendation>;
}

export function CovidBoosterSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: CovidBoosterSummaryReportProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:shadow-none print:p-0">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h2 className="text-lg font-bold text-navy-900">
          COVID-19 Booster ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Consultation Date: {state.summary.consultationDate} |{" "}
          {state.summary.consultationTime}
        </p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Age" value={`${state.patient.age} years`} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
      </div>

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Vaccine Eligibility</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Aged 12 or over" value={state.assessment.ageConfirmed ? "Yes" : "No"} />
        <Row
          label="Previous COVID-19 Vaccine"
          value={
            state.assessment.previousCovidVaccine
              ? `Yes${state.assessment.previousDoseDate ? ` (last dose ${state.assessment.previousDoseDate})` : " (date not known)"}`
              : "No"
          }
        />
        <Row label="Immunosuppressed" value={state.assessment.immunosuppressed ? "Yes" : "No"} />
        <Row label="Care home resident" value={state.assessment.careHomeResident ? "Yes" : "No"} />
        <Row
          label="NHS entitlement"
          value={
            state.assessment.nhsStatus === "not-eligible"
              ? "Does not qualify for NHS vaccination"
              : state.assessment.nhsStatus === "eligible-prefers-private"
                ? "Qualifies for NHS vaccination, told of entitlement, prefers private"
                : "Not recorded"
          }
        />
        <Row label="3 months since last dose, or first dose" value={state.assessment.timelinessEligible ? "Yes" : "No"} />
        {state.assessment.shorterIntervalNationalGuidance && (
          <Row label="Shorter interval" value="Under 3 months: shorter interval specifically advised in national guidance (see notes)" />
        )}
      </div>

      {state.patient.age !== null && state.patient.age < 16 && (
        <>
          <SectionHeader>Consent (under 16)</SectionHeader>
          <div className="space-y-0.5">
            <Row
              label="Consent given by"
              value={
                state.supply.consentBasis === "parental"
                  ? `Person with parental responsibility: ${state.supply.parentName} (${state.supply.parentRelationship})`
                  : state.supply.consentBasis === "gillick"
                    ? "Young person, assessed as Gillick competent"
                    : "Not recorded"
              }
            />
            {state.supply.consentBasis === "gillick" && (
              <Row label="Gillick assessment basis" value={state.supply.gillickBasis || "Not recorded"} />
            )}
          </div>
        </>
      )}

      <SectionHeader>Vaccine Administered</SectionHeader>
      <div className="space-y-0.5">
        <Row
          label="Product and variant"
          value={
            state.supply.vaccineProduct
              ? COVID_PRODUCTS[state.supply.vaccineProduct].label
              : "Not recorded"
          }
        />
        <Row label="Batch number" value={state.supply.batchNumber || "Not recorded"} />
        <Row label="Vaccine expiry" value={state.supply.expiryDate || "Not recorded"} />
        <Row
          label="Dose given"
          value={
            state.supply.vaccineProduct
              ? `${COVID_PRODUCTS[state.supply.vaccineProduct].volume}, intramuscular`
              : "Not recorded"
          }
        />
        <Row
          label="Site"
          value={
            state.supply.administrationSite === "left-deltoid"
              ? "Left deltoid"
              : state.supply.administrationSite === "right-deltoid"
                ? "Right deltoid"
                : "Not recorded"
          }
        />
        <Row label="Time administered" value={state.supply.administrationTime || "Not recorded"} />
        <Row label="Date administered" value={state.summary.consultationDate} />
        <Row label="Route" value="Intramuscular, deltoid" />
        {state.supply.coAdministeredVaccine && (
          <Row label="Other vaccine given at this visit" value={state.supply.coAdministeredVaccine} />
        )}
        {state.supply.vaccineProduct === "comirnaty-lp81" && (
          <Row
            label="Previous formulation explained"
            value={
              state.supply.lp81FormulationExplained
                ? "Yes. Patient told Comirnaty LP.8.1 is the previous seasonal formulation and that XFG is the current one, and accepted."
                : "NOT RECORDED"
            }
          />
        )}
      </div>

      <SectionHeader>Contraindication Check</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.anaphylaxisToPreviousDose ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.anaphylaxisToPreviousDose && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No anaphylaxis to previous COVID vaccine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded border flex items-center justify-center ${!state.assessment.anaphylaxisToPEG && !state.assessment.anaphylaxisToPolysorbate ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
            {!state.assessment.anaphylaxisToPEG && !state.assessment.anaphylaxisToPolysorbate && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span>No anaphylaxis to PEG or polysorbate</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 mt-2">
          <Row label="Acute severe febrile illness" value={state.assessment.severeFebrilIllness ? "Yes (postponed)" : "No"} />
          <Row label="Current COVID-19 infection" value={state.assessment.currentCovidInfection ? "Yes (deferred)" : "No"} />
          <Row label="Myocarditis or pericarditis after mRNA dose" value={state.assessment.myocarditisHistory ? "Yes (excluded)" : "No"} />
          <Row
            label="Bleeding disorder"
            value={
              state.assessment.bleedingDisorder
                ? state.assessment.bleedingDisorderAssessedSafe
                  ? "Yes, IM assessed as safe by a clinician"
                  : "Yes, not assessed (excluded)"
                : "No"
            }
          />
          <Row label="Anticoagulants" value={state.assessment.onAnticoagulants ? "Yes (caution)" : "No"} />
          <Row label="Pregnant" value={state.assessment.pregnant ? "Yes (caution)" : "No"} />
          <Row label="Capillary leak syndrome history" value={state.assessment.capillaryLeakHistory ? "Yes (caution)" : "No"} />
        </div>
      </div>

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Explained booster rationale (variant coverage)", state.counselling.explainedBoosterRationale],
          ["Discussed common reactions (arm soreness, fever)", state.counselling.discussedCommonReactions],
          ["Explained 15-minute observation requirement", state.counselling.explainedObservationPeriod],
          ["Cardiac warning signs and serious reactions: seek urgent medical attention", state.counselling.discussedSeriousReactions],
          ["Yellow Card self-reporting explained", state.counselling.explainedYellowCard],
          ["Leaflet for the product and variant given, plus written record", state.counselling.providedWrittenInfo],
        ]}
      />

      <SectionHeader>Vaccine Supply</SectionHeader>
      {doseRecommendation ? (
        <div className="space-y-0.5">
          <Row label="Vaccine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Frequency" value={doseRecommendation.frequency || ""} />
          <Row label="Clinical Reason" value={doseRecommendation.reason} />
        </div>
      ) : (
        <p className="text-xs text-gray-500">No vaccine recommendation (check alerts)</p>
      )}

      <SectionHeader>Clinical Notes</SectionHeader>
      <p className="text-xs text-gray-700 whitespace-pre-wrap">
        {state.summary.clinicalNotes || "(No additional notes)"}
      </p>

      <p className="text-[10px] text-gray-500 mt-4">
        Administered under the COVID-19 Vaccination 2026/27 Season Patient Group Direction, version 006, issued 11 September 2026.
      </p>

      <PharmacistDeclaration
        pgdName="COVID-19 Booster Vaccination"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      <ReportFooter pgdName="COVID-19 Booster Vaccination" />
    </div>
  );
}
