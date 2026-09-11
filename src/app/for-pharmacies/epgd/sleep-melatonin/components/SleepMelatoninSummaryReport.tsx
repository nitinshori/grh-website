"use client";

import type { SleepMelatoninConsultationState } from "../lib/sleep-melatonin-types";
import type { ClinicalAlert } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

const PGD_NAME = "Insomnia in Adults Aged 55 and Over (Circadin)";
const PGD_VERSION = "PGD version 006, issued 11 September 2026";

/**
 * Appendix 1 of the PGD, to be given to every patient whether or not
 * anything is supplied. Printable on its own from any step of the tool.
 */
export function SleepHygieneAppendix({ patientName }: { patientName?: string }) {
  const sections: [string, string[]][] = [
    ["Timing", [
      "Get up at the same time every day, including at weekends. Fixing the wake time matters more than fixing the bedtime.",
      "Only go to bed when sleepy.",
      "If you are awake for more than about 20 minutes, get up, go to another room, do something quiet and dull, and go back when sleepy.",
    ]],
    ["Daytime", [
      "Get daylight in the morning, ideally outdoors.",
      "Take regular exercise, but not in the 3 hours before bed.",
      "Avoid daytime naps, or keep them under 20 minutes and before mid-afternoon.",
    ]],
    ["Substances", [
      "No caffeine after midday. That includes tea, cola and some painkillers, not just coffee.",
      "Alcohol gets you to sleep and then wakes you at 3am. It is not a sleep aid.",
      "Nicotine is a stimulant and also lowers melatonin levels.",
    ]],
    ["The bedroom", [
      "Cool, dark and quiet.",
      "Bed is for sleep. No screens, no work, no television.",
      "Turn the clock away from you. Watching the time makes it worse.",
    ]],
    ["The evening", [
      "Wind down for an hour before bed. Dim the lights.",
      "Write tomorrow's worries down earlier in the evening, so they are not waiting for you at midnight.",
      "Do not eat a large meal late.",
    ]],
  ];
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:p-0 print:break-before-page">
      <h2 className="text-base font-bold text-navy-900">Sleep hygiene advice (Appendix 1)</h2>
      <p className="text-xs text-gray-500 mt-1 mb-4">
        {PGD_NAME}. {patientName ? `For: ${patientName}. ` : ""}These measures have the better long-term evidence and matter more than any tablet over time. Keep doing them.
      </p>
      <div className="space-y-3">
        {sections.map(([title, items]) => (
          <div key={title}>
            <p className="text-xs font-bold text-navy-900 uppercase tracking-wide">{title}</p>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-0.5 mt-1">
              {items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-4">
        See your GP rather than continuing if sleep has not improved after 3 weeks; if you have low mood or are waking very early; if you are told you snore heavily or stop breathing in your sleep, or you are sleepy in the day.
      </p>
    </div>
  );
}

interface SleepMelatoninSummaryReportProps {
  state: SleepMelatoninConsultationState;
  alerts: ClinicalAlert[];
}

function NotSuppliedDeclaration({ pharmacistName, pharmacistGPhC, pharmacyName }: { pharmacistName: string; pharmacistGPhC: string; pharmacyName: string }) {
  return (
    <>
      <SectionHeader>Practitioner Declaration</SectionHeader>
      <p className="text-xs text-gray-600 mb-4">
        I confirm that this consultation was conducted under the Patient Group Direction for {PGD_NAME}, that an exclusion criterion applied, that Circadin was NOT supplied, that the sleep hygiene advice in Appendix 1 was given, and that the patient was advised and referred as recorded.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistGPhC || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacyName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>
    </>
  );
}

export function SleepMelatoninSummaryReport({ state, alerts }: SleepMelatoninSummaryReportProps) {
  const { patient, consent, assessment, secondaryCauses, prescription, counselling, summary } = state;
  const hasStops = alerts.some((a) => a.severity === "stop");
  const durationLabel: Record<string, string> = {
    less4w: "Less than 4 weeks (excluded)",
    "4w-3m": "4 weeks to 3 months",
    "3-12m": "3 to 12 months",
    over12m: "Over 12 months",
  };
  const yesNo = (v: boolean | undefined) => (v ? "Yes" : "No");
  return (
    <>
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">{PGD_NAME} Consultation Record</h1>
        <p className="text-xs text-gray-500 mt-1">Patient: {patient.firstName} {patient.lastName} | Age: {patient.age} years | {PGD_VERSION}</p>
      </div>

      {hasStops && (
        <div className="mb-4 px-4 py-3 border-2 border-red-600 rounded-lg">
          <p className="text-sm font-bold text-red-700 uppercase">Not supplied: exclusion criteria met</p>
          <p className="text-xs text-red-700 mt-1">Circadin was not supplied under this PGD. The exclusion(s) are listed under Clinical Alerts. Advice given and the referral decision are recorded in the clinical notes.</p>
        </div>
      )}

      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years (55 or over confirmed: ${yesNo(assessment.ageConfirmed)})` : "N/A"} />
      <Row label="DOB" value={patient.dateOfBirth} />
      <Row label="Address" value={patient.address || "Not recorded"} />
      <Row label="NHS number" value={patient.nhsNumber || "Not recorded"} />
      <Row label="GP" value={patient.gpName || "Not recorded"} />
      <Row label="GP practice" value={patient.gpPractice || "Not recorded"} />

      <SectionHeader>Consent</SectionHeader>
      <Row label="Valid informed consent given" value={yesNo(consent.informedConsentGiven)} />
      <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "No"} />
      <Row label="Aware this is a private service" value={yesNo(consent.patientAwarePrivateService)} />
      <Row label="Copy to GP" value={yesNo(consent.notifyGp)} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Sleep Assessment</SectionHeader>
      <Row label="Sleep Onset Issue" value={yesNo(assessment.sleepOnsetIssue)} />
      <Row label="Sleep Maintenance Issue" value={yesNo(assessment.sleepMaintenanceIssue)} />
      <Row label="Duration of Insomnia" value={durationLabel[assessment.durationOfInsomnia] || "Not documented"} />
      <Row label="Daytime functioning affected" value={`${yesNo(assessment.daytimeFunctioningAffected)}${assessment.daytimeImpact ? `: ${assessment.daytimeImpact}` : ""}`} />
      <Row label="Sleep hygiene advice given (Appendix 1)" value={yesNo(assessment.sleepHygieneAdviceGiven)} />
      <Row label="Sleep hygiene already tried" value={`${yesNo(assessment.sleepHygieneAttempted)}${assessment.sleepHygieneTried ? `: ${assessment.sleepHygieneTried}` : ""}`} />
      <Row
        label="Previous Circadin supply"
        value={
          assessment.previousCircadin
            ? `Yes, ${assessment.weeksTreatedToDate || "?"} weeks of treatment to date; last supplied ${assessment.lastSupplyDate || "date not recorded"}; ${assessment.previousCourseStatus === "completed" ? "previous course completed or stopped" : assessment.previousCourseStatus === "continuing" ? "continuing the current course" : "course status not recorded"}`
            : "No"
        }
      />

      <SectionHeader>Secondary-cause history (each asked and recorded)</SectionHeader>
      <Row label="History taken, no secondary cause apparent" value={yesNo(secondaryCauses.historyTaken)} />
      <Row label="Low mood, anxiety or mental health condition" value={yesNo(secondaryCauses.lowMoodOrMentalHealth)} />
      <Row label="Snoring with daytime sleepiness, apnoeas or morning headache" value={yesNo(secondaryCauses.snoringDaytimeSleepiness)} />
      <Row label="Pain disturbing sleep" value={yesNo(secondaryCauses.painDisturbingSleep)} />
      <Row label="Restless legs" value={yesNo(secondaryCauses.restlessLegs)} />
      <Row label="Nocturia" value={yesNo(secondaryCauses.nocturia)} />
      <Row label="Shift work or travel-driven pattern" value={yesNo(secondaryCauses.shiftWork)} />
      <Row label="Alcohol used to sleep or harmful drinking" value={yesNo(secondaryCauses.alcoholToSleep)} />
      <Row label="Caffeine not yet addressed" value={yesNo(secondaryCauses.caffeineNotAddressed)} />
      <Row label="Medicine that could cause insomnia" value={yesNo(secondaryCauses.medicineCausingInsomnia)} />

      <SectionHeader>{hasStops ? "Medicine" : "Supply Details"}</SectionHeader>
      {hasStops ? (
        <p className="text-xs font-semibold text-red-700">NOT SUPPLIED. Exclusion criteria met; see Clinical Alerts.</p>
      ) : (
        <>
          <Row label="Product (name, form, strength)" value={prescription.product} />
          <Row label="Dose" value={prescription.dose} />
          <Row label="Frequency" value={prescription.frequency} />
          <Row label="Route" value="Oral. Swallow whole with water; do not crush, chew or halve." />
          <Row label="Quantity supplied" value={prescription.quantityTablets ? `${prescription.quantityTablets} tablets (${prescription.quantityTablets} days)` : "Not recorded"} />
          <Row label="Date of supply" value={summary.consultationDate} />
          <Row label="Maximum treatment" value={prescription.duration} />
          <Row label="Supplied under" value={`${PGD_NAME}, ${PGD_VERSION}`} />
        </>
      )}

      {!hasStops && (
        <>
          <SectionHeader>Counselling Delivered</SectionHeader>
          <CounsellingGrid
            items={[
              ["One tablet 1 to 2 hours before bed, after food, swallowed whole", counselling.takeAfterFoodSwallowWhole],
              ["Advised about drowsiness and driving", counselling.drowsinessDrivingAdvised],
              ["Advised about alcohol", counselling.alcoholAdvised],
              ["Works with the body clock, gradually; not a sedative", counselling.notASedativeExplained],
              ["Sleep hygiene reinforced (Appendix 1 supplied)", counselling.sleepHygieneReinforcedFirstLine],
              ["Avoid screens before bed", counselling.avoidScreensAdvised],
              ["Short course, up to 13 weeks; return unused tablets", counselling.shortCourse13Weeks],
              ["When to see the GP rather than continuing", counselling.whenToSeekAdvice],
            ]}
          />
          <p className="text-xs text-gray-600 mt-2">Patient information leaflet and Appendix 1 supplied. Suspected adverse reactions to be reported via the Yellow Card scheme (yellowcard.mhra.gov.uk) and the GP informed.</p>
        </>
      )}

      {hasStops ? (
        <NotSuppliedDeclaration pharmacistName={summary.pharmacistName} pharmacistGPhC={summary.pharmacistGPhC} pharmacyName={summary.pharmacyName} />
      ) : (
        <PharmacistDeclaration
          pgdName={PGD_NAME}
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      )}

      <SectionHeader>Clinical Notes{hasStops ? " and Advice Given" : ""}</SectionHeader>
      <div className="text-xs text-navy-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
        {summary.clinicalNotes || "No additional notes"}
      </div>

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={summary.consultationDate} />
      <Row label="Time" value={summary.consultationTime} />
      <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />

      <ReportFooter pgdName={PGD_NAME} />
    </div>
    <div className="mt-6">
      <SleepHygieneAppendix patientName={`${patient.firstName} ${patient.lastName}`.trim()} />
    </div>
    </>
  );
}
