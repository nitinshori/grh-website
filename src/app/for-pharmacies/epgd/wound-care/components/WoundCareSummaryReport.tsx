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
import type { WoundState, AgeBand } from "../WoundCareClient";
import { WOUND_CARE_PGD_VERSION } from "../WoundCareClient";

interface Props {
  state: WoundState;
  alerts: ClinicalAlert[];
  band: AgeBand;
  doseText: { medicine: string; dose: string; quantity: string } | null;
  quantitySupplied: string;
}

const WOUND_TYPE_LABEL: Record<string, string> = {
  "laceration-cut": "Laceration / cut",
  "abrasion-graze": "Abrasion / graze",
  "puncture-wound": "Puncture wound",
  "bite-animal": "Animal bite",
  "bite-human": "Human bite",
  burn: "Burn",
};

const TETANUS_LABEL: Record<string, string> = {
  "up-to-date": "Up to date (complete course, last dose within 10 years)",
  "over-10-years": "Last tetanus-containing dose more than 10 years ago",
  "incomplete-or-unknown": "Incomplete or unknown history",
};

/**
 * Print-only consultation record for the Minor Wound Care PGD. Before this
 * existed, Save & Print printed whatever step was on screen, which on the
 * last step was a green box and nothing else (adversarial review, 11 Sep
 * 2026). Carries every item in the document's "Records to be kept" row.
 */
export function WoundCareSummaryReport({ state, alerts, band, doseText, quantitySupplied }: Props) {
  const { patient, consent, consentDetails, assessment: a, treatment: t, counselling: c, summary } = state;
  const stopped = alerts.some((x) => x.severity === "stop");
  const declined = t.patientDeclined;
  const supplied = !stopped && !declined && !!t.antibiotic;
  const isBite = a.woundType === "bite-animal" || a.woundType === "bite-human";

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Minor Wound Care ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record. {WOUND_CARE_PGD_VERSION}</p>
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
                ? patient.age !== null && patient.age < 16
                  ? `Valid informed consent given by ${consentDetails.parentName || "not recorded"} (${consentDetails.parentRelationship || "relationship not recorded"}), a person with parental responsibility`
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
        <SectionHeader>Wound Assessment</SectionHeader>
        <div className="space-y-1 text-xs">
          <Row label="Mechanism" value={`${WOUND_TYPE_LABEL[a.woundType] || a.woundType || "Not recorded"}${isBite ? " (bite)" : " (not a bite)"}${a.heavilyContaminated ? ", heavily contaminated with soil or organic material" : ""}`} />
          <Row label="Site" value={a.woundLocation || "Not recorded"} />
          <Row label="Extent" value={a.woundSize || "Not recorded"} />
          <Row label="Depth" value={a.woundDepth || "Not recorded"} />
          <Row label="Time of injury" value={a.timeOfInjury ? a.timeOfInjury.replace("T", " ") : "Not recorded"} />
          <Row label="Signs of infection" value={a.signsOfInfection.join(", ") || (a.noSignsOfInfection ? "None present (recorded)" : "None recorded")} />
          <Row label="Active bleeding" value={a.activeBleeding === "none" ? "None" : a.activeBleeding === "controlled" ? "Controlled by pressure" : a.activeBleeding === "not-controlled" ? "NOT controlled" : "Not recorded"} />
          <Row
            label="Red flags"
            value={
              [
                a.necrotisingFeatures && "necrotising fasciitis feature",
                a.redTrackingLines && "lymphangitis",
                a.spreadingCellulitis && "spreading cellulitis",
                a.needsClosureOrSurgicalReview && "needs closure or surgical review",
                a.foreignBody && "retained foreign body",
                a.overJointTendonBone && "over a joint, tendon or bone",
                a.tendonNerveDamage && "tendon or nerve damage suspected",
                a.abscess && "abscess",
                a.highRiskTetanusWound && "high-risk tetanus-prone wound (HTIG may be indicated)",
              ]
                .filter(Boolean)
                .join("; ") || "None recorded"
            }
          />
          <Row
            label="Medical history"
            value={
              [
                a.immunosuppressed && "immunosuppressed",
                a.diabetic && "diabetic",
                a.takingAnticoagulants && "anticoagulated",
                a.antibioticAlreadyTaken && "antibiotic already taken this episode",
                a.penicillinAllergy && "penicillin or beta-lactam allergy",
                a.cephalosporinAllergy && "cephalosporin allergy",
                a.coamoxiclavHepaticHistory && "co-amoxiclav hepatic history",
                a.flucloxHepaticHistory && "flucloxacillin hepatic history",
                a.mononucleosisOrALL && "mononucleosis or ALL",
                a.severeHepaticOrEgfrBelow30 && "severe hepatic dysfunction or eGFR below 30",
                a.crclBelow10 && "creatinine clearance below 10",
                a.pregnant && "pregnant",
                a.breastfeeding && "breastfeeding",
              ]
                .filter(Boolean)
                .join("; ") || "Nothing relevant recorded"
            }
          />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Observations (Appendix 1{band ? `, age band ${band === "2-4" ? "2 to 4" : band === "5-11" ? "5 to 11" : "12 and over"}` : ""})</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Temperature" value={a.temperature ? `${a.temperature} C` : "Not recorded"} />
          <Row label="Pulse" value={a.pulse ? `${a.pulse} per minute` : "Not recorded"} />
          <Row label="Respiratory rate" value={a.respiratoryRate ? `${a.respiratoryRate} per minute` : "Not recorded"} />
          <Row label="SpO2 on air" value={a.oxygenSaturation ? `${a.oxygenSaturation}%` : "Not recorded"} />
          {band === "12+" ? (
            <Row label="Systolic BP" value={a.systolicBP ? `${a.systolicBP} mmHg` : "Not recorded"} />
          ) : (
            <Row label="Capillary refill" value={a.capillaryRefill === "over-2s" ? "More than 2 seconds" : a.capillaryRefill === "2s-or-less" ? "2 seconds or less" : "Not measured"} />
          )}
          <Row label="Consciousness" value={a.alteredConsciousness ? (band === "12+" ? "New confusion or drowsiness" : "Drowsy, floppy or not responding normally") : "Alert, responding normally"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Tetanus</SectionHeader>
        <div className="space-y-1 text-xs">
          <Row label="Immunisation status" value={TETANUS_LABEL[a.tetanusStatus] || "Not recorded"} />
          <Row label="Action taken" value={a.tetanusAction || "Not recorded"} />
          {a.htigNotIndicatedReason && <Row label="Immunoglobulin not indicated because" value={a.htigNotIndicatedReason} />}
          {a.arm1TetanusManagement && (
            <Row
              label="Arm 1 tetanus management"
              value={
                a.arm1TetanusManagement === "completed-and-recorded"
                  ? `Completed and recorded: ${a.arm1TetanusManagementDetails || "details not recorded"}`
                  : a.arm1TetanusManagement === "not-tetanus-prone"
                    ? "Wound not tetanus-prone"
                    : "NOT completed: referred the same day"
              }
            />
          )}
          {t.tetanusReferralGenerated && <Row label="Vaccine" value="Tetanus referral or Td/IPV supply arranged" />}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine</SectionHeader>
        <div className="space-y-1 text-xs">
          {stopped && (
            <>
              <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met; patient referred." />
              <Row label="Advice given and decision" value={a.exclusionAdvice || "Not recorded"} />
            </>
          )}
          {!stopped && declined && (
            <>
              <Row label="Outcome" value="NOT SUPPLIED: patient declined treatment." />
              <Row label="Advice given" value={t.declinedAdvice || "Not recorded"} />
            </>
          )}
          {supplied && doseText && (
            <>
              <Row label="Outcome" value={`Supplied under the ${WOUND_CARE_PGD_VERSION}`} />
              <Row label="Medicine" value={doseText.medicine} />
              <Row label="Form" value={t.formulation === "tablets" ? "Tablets" : t.formulation === "capsules" ? "Capsules" : t.formulation === "suspension" ? "250mg/5mL oral suspension" : t.formulation === "suspension-500" ? "250mg/5mL oral suspension (500mg dose, 10 mL four times daily)" : "Not recorded"} />
              <Row label="Dose and route" value={`${doseText.dose}. Oral.`} />
              <Row label="Duration" value={t.courseDays ? `${t.courseDays} days (maximum 7; one course per episode)` : "Not recorded"} />
              <Row label="Quantity" value={quantitySupplied || "Not recorded"} />
              <Row label="Batch / expiry" value={`${t.suppliedItemBatch || "not recorded"} / ${t.suppliedItemExpiry || "not recorded"}`} />
              <Row label="Date of supply" value={summary.consultationDate} />
              <Row label="Chosen and why" value={t.antibioticRationale || "Not recorded"} />
              {(t.irrigationMethod || t.dressingType || t.topicalAntiseptic) && (
                <Row label="Wound care given" value={[t.irrigationMethod && `irrigation: ${t.irrigationMethod}`, t.dressingType && `dressing: ${t.dressingType}`, t.topicalAntiseptic && "topical antiseptic"].filter(Boolean).join("; ")} />
              )}
            </>
          )}
          {!stopped && !declined && !t.antibiotic && <Row label="Outcome" value="No medicine recorded" />}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Advice and Counselling</SectionHeader>
        <CounsellingGrid
          items={[
            [t.antibiotic === "co-amoxiclav" ? "One tablet three times a day at the start of a meal; finish the course" : "Empty stomach, an hour before or two hours after food; finish the course", c.administrationAdvice],
            ["Same-day warning signs (severe pain, spreading redness, darkening or blistering, fever, unwell)", c.sameDayWarningSigns],
            ["Red streaks tracking from the wound", c.redStreaks],
            ["Stop and seek urgent help for rash, wheeze, lip or tongue swelling", c.seriousReaction],
            ["Report jaundice or dark urine, even weeks after finishing", c.hepaticAdvice],
            ["Keep clean and dry; back in 2 to 3 days if no better", c.woundCareAndReview],
            ["Patient information leaflet supplied", c.counsellingProvided],
          ]}
        />
        {c.counsellingNotes && <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{c.counsellingNotes}</p>}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Adverse Drug Reactions</SectionHeader>
        <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.adverseReactions || "None recorded at the time of supply. Report suspected reactions via https://yellowcard.mhra.gov.uk and inform the GP."}</p>
      </div>

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {supplied ? (
          <PharmacistDeclaration pgdName={WOUND_CARE_PGD_VERSION} pharmacistName={summary.pharmacistName} pharmacistGPhC={summary.pharmacistGPhC} pharmacyName={summary.pharmacyName} />
        ) : (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the {WOUND_CARE_PGD_VERSION}, that no medicine was supplied, and that the advice given and the decision reached are recorded above.
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
        <ReportFooter pgdName={WOUND_CARE_PGD_VERSION} />
      </div>
    </div>
  );
}
