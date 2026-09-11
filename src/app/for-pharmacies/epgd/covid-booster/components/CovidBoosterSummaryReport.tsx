"use client";

import type { CovidBoosterConsultationState } from "../lib/covid-booster-types";
import { COVID_PRODUCTS } from "../lib/covid-booster-types";
import { nhsEligible } from "../lib/covid-booster-clinical-logic";
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
  const hasStop = alerts.some((a) => a.severity === "stop");
  const answer = (v: "" | "yes" | "no", yesText: string) =>
    v === "yes" ? yesText : v === "no" ? "No" : "NOT ANSWERED";
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
        <Row label="Date of birth" value={state.patient.dateOfBirth || "Not recorded"} />
        <Row label="Age" value={state.patient.age !== null ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="Address" value={state.patient.address || "Not provided"} />
        <Row label="Registered GP" value={state.patient.gpName || "Not provided"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
      </div>

      <SectionHeader>Consent</SectionHeader>
      <CounsellingGrid
        items={[
          ["Valid informed consent obtained", state.consent.informedConsentGiven],
          [`ID verified${state.consent.idType ? ` (${state.consent.idType})` : ""}`, state.consent.idVerified],
          ["Patient aware this is a private service", state.consent.patientAwarePrivateService],
        ]}
      />
      {!(state.patient.age !== null && state.patient.age < 16) && (
        <div className="space-y-0.5 mt-2">
          <Row label="Consent given by" value={state.consent.informedConsentGiven ? "The patient" : "Not recorded"} />
        </div>
      )}

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Vaccine Eligibility</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Aged 12 or over" value={state.assessment.ageConfirmed ? "Yes" : "No"} />
        <Row
          label="Previous COVID-19 Vaccine"
          value={
            state.assessment.previousCovidVaccine
              ? `Yes${
                  state.assessment.previousDoseDate
                    ? ` (last dose ${state.assessment.previousDoseDate})`
                    : state.assessment.previousDoseDateUnknown
                      ? " (date not known: the individual states the last dose was more than 3 months ago)"
                      : " (date not recorded)"
                }`
              : "No (first dose)"
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
      {hasStop ? (
        <div className="space-y-0.5">
          <Row label="Outcome" value="NOT ADMINISTERED: exclusion criteria met (see clinical alerts above)" />
          <Row
            label="Advice given"
            value={state.summary.clinicalNotes || "Advised on alternative options and how to access them; informed or referred to the GP as appropriate"}
          />
        </div>
      ) : (
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
        <Row label="15 minute observation" value={state.supply.observedFifteenMinutes ? "Completed" : "Not recorded"} />
      </div>
      )}

      <SectionHeader>Adverse Reactions</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Adverse reaction" value={state.supply.adverseReaction.trim() || "None observed"} />
        {state.supply.adverseReaction.trim() && (
          <>
            <Row label="Action taken" value={state.supply.adverseReactionAction || "Not recorded"} />
            <Row label="Yellow Card" value={state.supply.yellowCardSubmitted ? "Reported via yellowcard.mhra.gov.uk with the variant designation" : "Not yet reported"} />
          </>
        )}
      </div>

      <SectionHeader>Contraindication Check</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 mt-2">
          <Row label="Anaphylaxis to a previous dose or component" value={answer(state.assessment.anaphylaxisToPreviousDose, "Yes (excluded)")} />
          <Row label="Hypersensitivity to PEG" value={answer(state.assessment.anaphylaxisToPEG, "Yes (excluded)")} />
          <Row label="Hypersensitivity to polysorbate 80" value={answer(state.assessment.anaphylaxisToPolysorbate, "Yes (excluded)")} />
          <Row label="Acute severe febrile illness" value={answer(state.assessment.severeFebrilIllness, "Yes (postponed)")} />
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
          <Row
            label="Pregnant"
            value={
              state.assessment.pregnant
                ? nhsEligible(state)
                  ? "Yes, in an NHS-eligible group: vaccinated per Green Book, mRNA vaccine, NHS entitlement explained"
                  : "Yes, not in an NHS-eligible group (excluded: referred)"
                : "No"
            }
          />
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
      {hasStop ? (
        <p className="text-xs text-gray-500">Not supplied: exclusion criteria met.</p>
      ) : doseRecommendation ? (
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
        Administered under the COVID-19 Vaccination 2026/27 Season Patient Group Direction, version 008, issued 11 September 2026.
      </p>

      {hasStop ? (
        <>
          <SectionHeader>Practitioner Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the COVID-19
            Vaccination 2026/27 Patient Group Direction, that an exclusion criterion applied, that
            no vaccine was administered, and that the individual was advised as recorded above.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistGPhC || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacyName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
              <div className="border-b border-gray-300 min-h-[2rem]" />
            </div>
          </div>
        </>
      ) : (
        <PharmacistDeclaration
          pgdName="COVID-19 Booster Vaccination"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      <ReportFooter pgdName="COVID-19 Booster Vaccination" />
    </div>
  );
}
