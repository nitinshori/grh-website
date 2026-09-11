"use client";

import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type { ChestState, Alert, Comorbidity } from "../ChestServiceClient";
import { PGD_STRAPLINE, ANTIBIOTIC_REGIMENS, comorbidityLabel } from "../ChestServiceClient";

interface Props {
  state: ChestState;
  alerts: Alert[];
  crbScore: number;
  inclusionFeature: string;
  comorbidities: Comorbidity[];
  isOver65: boolean;
}

/**
 * Print-only consultation record for the Acute Bacterial Bronchitis PGD.
 * Before this existed the printed page was whatever the last step showed,
 * with "Supplied under" printed even when nothing was supplied (adversarial
 * review, 11 Sep 2026).
 */
export function ChestServiceSummaryReport({ state, alerts, crbScore, inclusionFeature, comorbidities, isOver65 }: Props) {
  const { patient, consent, consent16, presentation: p, observations: o, redFlags, medicines: m, treatment: t, counselling: c, summary } = state;
  const stopped = alerts.some((a) => a.severity === "stop");
  const regimen = t.antibiotic ? ANTIBIOTIC_REGIMENS[t.antibiotic] : null;
  const supplied = !stopped && !!regimen;
  const under16 = patient.age !== null && patient.age < 16;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Chest Infection Service ePGD</h1>
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
          <Row
            label="Consent"
            value={
              consent.informedConsentGiven
                ? under16
                  ? `Valid informed consent given by ${consent16.basis === "parental" ? "a person with parental responsibility" : consent16.basis === "gillick" ? "the young person, assessed as Gillick competent" : "basis not recorded"}${consent16.detail ? `: ${consent16.detail}` : ""}`
                  : "Valid informed consent given"
                : "Not recorded"
            }
          />
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
        <SectionHeader>Presentation</SectionHeader>
        <div className="space-y-1 text-xs">
          <Row label="Cough duration" value={p.coughDurationDays !== null ? `${p.coughDurationDays} days` : "Not recorded"} />
          <Row label="Smoking status" value={p.smokingStatus || "Not recorded"} />
          <Row label="Symptoms" value={[p.purulentSputum && "purulent sputum", p.fever && "fever", p.breathless && "breathlessness", p.wheeze && "wheeze", p.chestPain && "chest pain"].filter(Boolean).join(", ") || "None recorded"} />
          <Row label="Higher-risk comorbidities" value={comorbidities.length > 0 ? comorbidities.map(comorbidityLabel).join(", ") : p.noComorbidity ? "None (confirmed)" : "Not recorded"} />
          {isOver65 && <Row label="Over 65: lower referral threshold considered" value={p.lowerThresholdOver65Considered ? "Yes" : "NOT recorded"} />}
          <Row label="Inclusion feature" value={inclusionFeature} />
          {p.rationale && <Row label="Clinical rationale" value={p.rationale} />}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Observations (Appendix 1)</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="SpO2 on air at rest" value={o.spo2 !== null ? `${o.spo2}%` : "Not recorded"} />
          <Row label="Respiratory rate" value={o.respiratoryRate !== null ? `${o.respiratoryRate} per minute` : "Not recorded"} />
          <Row label="Pulse" value={o.pulse !== null ? `${o.pulse} bpm` : "Not recorded"} />
          <Row label="Blood pressure" value={o.systolicBP !== null && o.diastolicBP !== null ? `${o.systolicBP}/${o.diastolicBP} mmHg` : "Not recorded"} />
          <Row label="Temperature" value={o.temperature !== null ? `${o.temperature} C` : "Not recorded"} />
          <Row label="New confusion" value={o.newConfusion ? "Yes" : "No"} />
          <Row label="COPD below baseline" value={o.copdBelowBaseline ? "Yes" : "No"} />
          <Row label="CRB score (without age point)" value={String(crbScore)} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Red Flags, Exclusions and Medicines</SectionHeader>
        <div className="space-y-1 text-xs">
          <Row label="Red flags" value={Object.entries(redFlags).filter(([, v]) => v).map(([k]) => k).join(", ") || "None recorded"} />
          <Row label="Exclusions recorded" value={Object.entries(state.exclusions).filter(([, v]) => v).map(([k]) => k).join(", ") || "None recorded"} />
          <Row label="Penicillin allergy" value={m.penicillinAllergy ? `Yes: ${m.penicillinAllergyHistory || "history not recorded"}` : "None recorded"} />
          <Row label="Other allergies" value={[m.tetracyclineAllergy && "tetracycline", m.macrolideAllergy && "macrolide"].filter(Boolean).join(", ") || "None recorded"} />
          <Row label="Interacting medicines" value={[m.onSimvastatin && "simvastatin or lovastatin", m.onClarithromycinInteracting && "clarithromycin-contraindicated medicine", m.onColchicine && "colchicine", m.onWarfarin && "warfarin", m.onDoac && "DOAC"].filter(Boolean).join(", ") || "None recorded"} />
          <Row label="Renal function asked" value={m.renalFunctionAsked ? `Yes${m.renalFunctionAnswer ? `: ${m.renalFunctionAnswer}` : ""}` : "No"} />
          {m.other && <Row label="Other medicines" value={m.other} />}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine</SectionHeader>
        <div className="space-y-1 text-xs">
          {stopped ? (
            <>
              <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met, or inclusion criteria not met; self-care or referral." />
              <Row label="Advice given and decision" value={c.exclusionAdvice || "Not recorded"} />
            </>
          ) : supplied && regimen ? (
            <>
              <Row label="Outcome" value={`Supplied under the ${PGD_STRAPLINE}`} />
              <Row label="Medicine" value={regimen.product} />
              <Row label="Dose" value={regimen.dose} />
              <Row label="Route" value={regimen.route} />
              <Row label="Duration" value="5 days (one course per episode)" />
              <Row label="Quantity" value={regimen.quantity} />
              <Row label="Batch / expiry" value={`${t.batch || "not recorded"} / ${t.expiry || "not recorded"}`} />
              <Row label="Date of supply" value={summary.consultationDate} />
              {t.firstLineUnsuitableReason && <Row label="Reason first-line agent not used" value={t.firstLineUnsuitableReason} />}
            </>
          ) : (
            <Row label="Outcome" value="No medicine recorded" />
          )}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Complete the full 5 day course", c.courseCompletion],
            ["A cough alone may take three weeks to settle", c.viralExplanation],
            ["Common side effects", c.sideEffects],
            ["Doxycycline-specific advice", c.doxycyclineAdvice],
            ["Amoxicillin-specific advice", c.amoxicillinAdvice],
            ["Clarithromycin-specific advice", c.clarithromycinAdvice],
            ["Self-care: fluids, rest, analgesia, honey", c.selfCare],
            ["Same-day help: breathless, chest pain, cough blood, much worse", c.safetyNetting],
            ["Seek advice if breathlessness, chest pain or fever develop or no better", c.followUp],
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
              I confirm that this consultation was conducted in accordance with the {PGD_STRAPLINE}, that no antibiotic was supplied, and that the advice given and the decision reached are recorded above.
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
