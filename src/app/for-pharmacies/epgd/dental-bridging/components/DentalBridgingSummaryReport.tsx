"use client";

import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type { DentalState } from "../DentalBridgingClient";
import { PGD_STRAPLINE, METRONIDAZOLE_ARM } from "../DentalBridgingClient";

interface Props {
  state: DentalState;
  alerts: ClinicalAlert[];
  outcome: "emergency" | "no-antibiotic" | "bridge";
  fever: boolean;
  selectedAntibiotic: string;
}

/**
 * Print-only consultation record for the Acute Dental Infection (bridging
 * antibiotic) PGD. Before this existed, Save & Print printed a green box
 * (adversarial review, 11 Sep 2026). Carries every "Records to be kept"
 * item, including WHICH of the three outcomes applied.
 */
export function DentalBridgingSummaryReport({ state, alerts, outcome, fever, selectedAntibiotic }: Props) {
  const { patient, consent, assessment: a, treatment: t, counselling: c, summary } = state;
  const stopped = alerts.some((x) => x.severity === "stop");
  const supplied = !stopped && outcome === "bridge";
  const isMetronidazole = selectedAntibiotic === METRONIDAZOLE_ARM;

  const outcomeLabel =
    outcome === "bridge"
      ? "2. Spreading or systemic infection (or higher risk), no emergency red flag: bridging antibiotic"
      : outcome === "emergency"
        ? "3. Emergency red flag: 999 or same-day emergency care. No antibiotic"
        : "1. Localised infection only: no antibiotic indicated";

  const decidingFindings = [
    fever && "temperature 38C or above",
    a.facialSwelling && "facial swelling",
    a.lymphadenopathy && "regional lymphadenopathy",
    a.cellulitis && "cellulitis of the face",
    a.malaise && "malaise",
    a.immunosuppressed && "significant immunosuppression",
    a.poorlyControlledDiabetes && "poorly controlled diabetes",
  ]
    .filter(Boolean)
    .join(", ");

  const redFlags = [
    a.difficultSwallowingBreathing && "difficulty breathing or swallowing",
    a.floorOfMouthSwelling && "floor of mouth swelling",
    a.trismus && "trismus",
    a.periorbital && "periorbital involvement",
    a.rapidlySpreading && "rapidly spreading swelling",
    a.sepsisSigns && "sepsis signs",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Acute Dental Infection ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record. {PGD_STRAPLINE}</p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth || "Not recorded"} />
          <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
          <Row label="Consent" value={consent.informedConsentGiven ? "Valid informed consent given" : "Not recorded"} />
          <Row label="ID verified" value={consent.idVerified ? consent.idType || "Yes" : "Not recorded"} />
          <Row label="GP copy" value={consent.notifyGp ? "Patient consented to a copy being sent to the GP" : "Not requested"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
          <Row label="Pharmacy address" value={summary.pharmacyAddress || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Assessment</SectionHeader>
        <div className="space-y-1 text-xs">
          <Row label="Outcome (of the three)" value={outcomeLabel} />
          <Row label="Finding that decided it" value={`${decidingFindings || "none recorded"}${a.higherRiskReason ? `; ${a.higherRiskReason}` : ""}`} />
          <Row label="Appendix 1 worked through" value={a.redFlagsAssessed ? (redFlags ? `Yes; emergency red flag PRESENT: ${redFlags}` : "Yes; no emergency red flag") : "NOT confirmed"} />
          <Row label="Temperature" value={a.temperature !== null ? `${a.temperature} C${fever ? " (fever)" : ""}` : "Not recorded"} />
          <Row label="Spread and systemic signs" value={a.spreadAssessed ? `Assessed: facial swelling ${a.facialSwelling ? "present" : "absent"}; lymphadenopathy ${a.lymphadenopathy ? "present" : "absent"}; cellulitis ${a.cellulitis ? "present" : "absent"}; malaise ${a.malaise ? "present" : "absent"}` : "NOT confirmed as assessed"} />
          <Row label="Local findings" value={[a.localisedSwelling && "localised gum swelling", a.pusDischarge && "purulent discharge"].filter(Boolean).join(", ") || "None recorded"} />
          <Row label="Pain" value={`${a.painType || "type not recorded"}; ${a.painDuration || "duration not recorded"}; ${a.painSeverity || "severity not recorded"}`} />
          <Row label="Penicillin allergy" value={a.penicillinAllergy ? `Yes: ${a.penicillinAllergyHistory || "history not recorded"}` : "No"} />
          <Row
            label="Other history"
            value={
              [
                a.metronidazoleAllergy && "metronidazole allergy",
                a.warfarin && "interacting medicine (warfarin, lithium, etc.)",
                a.pregnancy && "pregnant",
                a.breastfeeding && "breastfeeding",
                a.otherAntibiotics && "already taking an antibiotic",
                a.courseAlreadySuppliedThisEpisode && "course already supplied this episode",
                a.significantRenalImpairment && "significant renal impairment",
                a.mononucleosisOrALL && "mononucleosis or ALL",
                a.cockayneSyndrome && "Cockayne syndrome",
                a.severeHepaticOrNeurological && "severe hepatic or neurological disease",
              ]
                .filter(Boolean)
                .join("; ") || "Nothing relevant recorded"
            }
          />
          {a.penicillinAllergy && <Row label="Alcohol rule explained, patient can keep to it" value={a.alcoholCanAvoid === "yes" ? "Yes" : a.alcoholCanAvoid === "no" ? "No (excluded)" : "Not recorded"} />}
          {!a.penicillinAllergy && <Row label="Renal function asked, no significant impairment" value={a.renalFunctionAsked ? "Yes" : "No"} />}
          <Row label="Dental care" value={`${a.urgentDentalAppointmentCommitted ? "Unable to obtain definitive treatment before worsening; willing and able to arrange an urgent appointment within 24 to 48 hours" : "Inclusion NOT confirmed"}${a.dentalAppointmentBooked ? `; appointment booked ${a.dentalAppointmentDate || "(date not recorded)"}` : ""}`} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine</SectionHeader>
        <div className="space-y-1 text-xs">
          {supplied ? (
            <>
              <Row label="Outcome" value={`Supplied under the ${PGD_STRAPLINE}`} />
              <Row label="Medicine" value={isMetronidazole ? "Metronidazole 200mg tablets" : "Amoxicillin 500mg capsules"} />
              <Row label="Dose and route" value={isMetronidazole ? "200mg three times daily, oral, with or after food" : "500mg three times daily (every 8 hours), oral, with or without food"} />
              <Row label="Duration" value="5 days (one course per episode)" />
              <Row label="Quantity" value={`${t.quantity ?? "not recorded"} ${isMetronidazole ? "tablets" : "capsules"}`} />
              <Row label="Batch / expiry" value={`${t.batchNumber || "not recorded"} / ${t.expiryDate || "not recorded"}`} />
              <Row label="Date of supply" value={summary.consultationDate} />
              <Row label="Analgesia" value={`No analgesia supplied under this PGD. Advice given: ${t.analgesiaAdviceGiven ? "yes" : "no"}${t.analgesiaSoldUnderProtocol ? `; sold under the pharmacy's own protocol: ${t.analgesiaSoldUnderProtocol}` : ""}`} />
            </>
          ) : (
            <>
              <Row label="Outcome" value={outcome === "emergency" ? "NOT SUPPLIED: emergency red flag; 999 or same-day emergency care." : outcome === "no-antibiotic" ? "NOT SUPPLIED: localised infection, no antibiotic indicated." : "NOT SUPPLIED: exclusion criteria met; patient referred."} />
              <Row label="Advice given and decision" value={c.exclusionAdvice || "Not recorded"} />
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["A bridge, not a cure; dentist within 24 to 48 hours", c.bridgeNotCure],
            ["Finish the whole course", c.finishCourse],
            [isMetronidazole ? "One tablet every 8 hours, with or after food" : "One capsule every 8 hours, with or without food", c.howToTake],
            [isMetronidazole ? "No alcohol at all; metallic taste; numbness or pins and needles" : "Diarrhoea; rash, swelling or wheeze", c.armSpecific],
            ["Same-day help and 999 triggers", c.sameDayHelp],
            ["Pain relief available over the counter", c.painReliefOtc],
            ["Dental appointment arranged or NHS 111 route given", c.dentalAppointmentArranged],
            ["Patient information leaflet supplied", c.pilSupplied],
          ]}
        />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Adverse Drug Reactions</SectionHeader>
        <p className="text-xs text-gray-700 whitespace-pre-wrap">{c.adverseReactions || "None recorded at the time of supply. Report suspected reactions via https://yellowcard.mhra.gov.uk and inform the GP."}</p>
      </div>

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {supplied ? (
          <PharmacistDeclaration pgdName={PGD_STRAPLINE} pharmacistName={summary.pharmacistName} pharmacistGPhC={summary.pharmacistGPhC} pharmacyName={summary.pharmacyName} />
        ) : (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the {PGD_STRAPLINE}, that no antibiotic was supplied, and that the outcome, the advice given and the decision reached are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={PGD_STRAPLINE} />
      </div>
    </div>
  );
}
