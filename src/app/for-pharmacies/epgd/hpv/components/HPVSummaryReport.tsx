"use client";

import type { HPVConsultationState } from "../lib/hpv-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HPVSummaryReportProps {
  state: HPVConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: ReturnType<typeof import("../lib/hpv-clinical-logic").calculateDoseRecommendation>;
}

export function HPVSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: HPVSummaryReportProps) {
  const hasStop = alerts.some((a) => a.severity === "stop");
  const answer = (v: "" | "yes" | "no") => (v === "no" ? true : false);
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:shadow-none print:p-0">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h2 className="text-lg font-bold text-navy-900">
          HPV Vaccination (Gardasil 9) ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Consultation Date: {state.summary.consultationDate} |{" "}
          {state.summary.consultationTime}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Administered under the Get Real Health Gardasil 9 PGD, version 005, issued 11 September 2026.
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of birth" value={state.patient.dateOfBirth || "Not recorded"} />
        <Row label="Age" value={state.patient.age !== null ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="Address" value={state.patient.address || "Not provided"} />
        <Row label="GP" value={state.patient.gpName || "Not provided"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Vaccine Assessment */}
      <SectionHeader>Vaccine Assessment</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Sex (record only, all sexes eligible)" value={state.patient.sex || "Not recorded"} />
        <Row label="Immunosuppressed or HIV positive" value={state.assessment.immunosuppressedOrHIV ? "Yes: three-dose schedule" : "No"} />
        <Row label="Previous HPV vaccine doses" value={state.assessment.priorDoses || "Not recorded"} />
        <Row label="Dose received before 25th birthday" value={state.assessment.doseBefore25 ? "Yes: course complete, no further dose" : "No"} />
        <Row label="Pregnancy status" value={state.assessment.pregnancyStatus || "Not recorded"} />
        <Row label="Acute febrile illness" value={state.assessment.currentFebrileIllness ? "Yes" : "No"} />
        <Row label="Bleeding disorder or anticoagulated" value={state.assessment.bleedingDisorderOrAnticoagulated ? "Yes: technique adjusted" : "No"} />
        <Row label="Immunoglobulin or blood products in previous 3 months" value={state.assessment.bloodProductsLast3Months ? "Yes: recorded, not a contraindication" : "No"} />
        <Row label="Patient told whether NHS-eligible" value={state.assessment.nhsEligibilityDiscussed ? "Yes" : "Not recorded"} />
      </div>

      {/* Exclusions Check */}
      <SectionHeader>Exclusions Check</SectionHeader>
      <div className="space-y-1.5 text-xs">
        {([
          [`No confirmed anaphylaxis to a previous HPV vaccine dose${state.assessment.anaphylaxisToPreviousDose === "" ? " (NOT ANSWERED)" : ""}`, answer(state.assessment.anaphylaxisToPreviousDose)],
          [`No confirmed anaphylaxis to a component of Gardasil 9, and no hypersensitivity after previous Gardasil 9, Gardasil or Silgard${state.assessment.anaphylaxisToComponent === "" ? " (NOT ANSWERED)" : ""}`, answer(state.assessment.anaphylaxisToComponent)],
          ["Not known to be pregnant", state.assessment.pregnancyStatus !== "confirmed"],
          ["No acute severe febrile illness or systemic upset", !state.assessment.currentFebrileIllness],
          ["Course not already complete for age and immune status", !alerts.some((a) => a.code === "HPV_COURSE_COMPLETE")],
        ] as [string, boolean][]).map(([label, ok]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded border flex items-center justify-center ${ok ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)]/30 text-white" : "border-red-500 bg-red-50"}`}>
              {ok && (
                <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span>{label}</span>
          </div>
        ))}
        <p className="text-[11px] text-gray-500 pt-1">
          Yeast allergy is not a contraindication to HPV vaccine (Green Book chapter 18a) and is therefore not checked here.
        </p>
      </div>

      {/* Consent */}
      <SectionHeader>Consent</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Obtained before administration" : "Not recorded"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes${state.consent.idType ? ` (${state.consent.idType})` : ""}` : "Not recorded"} />
        <Row label="Aware this is a private service" value={state.consent.patientAwarePrivateService ? "Yes" : "Not recorded"} />
        {state.patient.age !== null && state.patient.age < 16 && (
          <>
            <Row
              label="Basis of consent (under 16)"
              value={
                state.consent16.basis === "parental"
                  ? `Person with parental responsibility: ${state.consent16.parentName}${state.consent16.parentRelationship ? ` (${state.consent16.parentRelationship})` : ""}`
                  : state.consent16.basis === "gillick"
                    ? "Young person, assessed as Gillick competent"
                    : "Not recorded"
              }
            />
            {state.consent16.basis === "gillick" && (
              <Row label="Gillick assessment basis" value={state.consent16.gillickBasis || "Not recorded"} />
            )}
          </>
        )}
        <Row
          label="Off-label schedule consent"
          value={
            state.consent16.offLabelConsentGiven
              ? "Explained and consented, naming the schedule"
              : "Not applicable or not recorded"
          }
        />
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Explained the schedule that applies to this patient", state.counselling.explainedDoseSchedule],
          ["Discussed HPV types protected (6, 11, 16, 18, 31, 33, 45, 52, 58)", state.counselling.explainedProtection],
          ["Counselled on common reactions (arm soreness, mild fever)", state.counselling.discussedCommonReactions],
          ["Clarified vaccine not treatment for existing infection", state.counselling.explainedNotTreatment],
          ["Explained cervical screening still needed and barrier protection still matters", state.counselling.explainedScreeningStillNeeded],
          ["Offered written information leaflet", state.counselling.offeredWrittenInfo],
        ]}
      />

      {/* Medicine Supply */}
      <SectionHeader>Vaccine Supply</SectionHeader>
      {hasStop ? (
        <div className="space-y-0.5">
          <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met (see clinical alerts above)" />
          <Row
            label="Advice given"
            value={state.summary.clinicalNotes || "Advised on alternative options and how to access them; informed or referred to the GP as appropriate"}
          />
        </div>
      ) : doseRecommendation ? (
        <div className="space-y-0.5">
          <Row label="Vaccine" value={doseRecommendation.medicine} />
          <Row label="Dose" value={doseRecommendation.dose} />
          <Row label="Schedule" value={doseRecommendation.dosingRegimen || ""} />
          <Row label="Clinical Reason" value={doseRecommendation.reason} />
        </div>
      ) : (
        <p className="text-xs text-gray-500">No vaccine recommendation (check alerts)</p>
      )}

      {/* Administration */}
      {!hasStop && (
      <>
      <SectionHeader>Administration and Safety</SectionHeader>
      <div className="space-y-0.5">
        <Row label="Product" value={`${state.administration.productName} suspension for injection`} />
        <Row label="Dose volume and route" value="0.5 mL intramuscular" />
        <Row label="Batch number" value={state.administration.batchNumber || "Not recorded"} />
        <Row label="Expiry date" value={state.administration.expiryDate || "Not recorded"} />
        <Row label="Anatomical site" value={state.administration.site || "Not recorded"} />
        <Row label="Dose number in course" value={state.administration.doseNumber || "Not recorded"} />
        {parseInt(state.administration.doseNumber || "0", 10) > 1 && (
          <Row label="Previous dose given" value={state.administration.previousDoseDate || "Not recorded"} />
        )}
        <Row
          label="Next dose due"
          value={state.administration.nextDoseDue || "Course complete: no further dose required"}
        />
        <Row
          label="Other vaccine at this visit (and site)"
          value={state.administration.otherVaccineSameVisit || "None"}
        />
        <Row
          label="Adrenaline 1 in 1,000 immediately available"
          value={state.administration.adrenalineAvailable ? "Confirmed" : "NOT CONFIRMED"}
        />
        <Row
          label="15 minute observation completed"
          value={state.administration.observedFifteenMinutes ? "Yes, patient observed seated" : "NOT RECORDED"}
        />
      </div>
      </>
      )}

      {/* Clinical Notes */}
      <SectionHeader>Clinical Notes</SectionHeader>
      <p className="text-xs text-gray-700 whitespace-pre-wrap">
        {state.summary.clinicalNotes || "(No additional notes)"}
      </p>

      {/* Pharmacist Declaration */}
      {hasStop ? (
        <>
          <SectionHeader>Practitioner Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the Patient Group
            Direction for Gardasil 9, that an exclusion criterion applied, that no vaccine was
            administered, and that the patient was advised as recorded above.
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
          pgdName="HPV Vaccination (Gardasil 9)"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      {/* Footer */}
      <ReportFooter pgdName="HPV Vaccination (Gardasil 9)" />
    </div>
  );
}
