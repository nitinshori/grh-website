"use client";

import type { SleepMelatoninConsultationState } from "../lib/sleep-melatonin-types";
import type { ClinicalAlert } from "../../shared/types";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

interface SleepMelatoninSummaryReportProps {
  state: SleepMelatoninConsultationState;
  alerts: ClinicalAlert[];
}

export function SleepMelatoninSummaryReport({ state, alerts }: SleepMelatoninSummaryReportProps) {
  const { patient, assessment, secondaryCauses, prescription, counselling, summary } = state;
  const durationLabel: Record<string, string> = {
    less4w: "Less than 4 weeks (excluded)",
    "4w-3m": "4 weeks to 3 months",
    "3-12m": "3 to 12 months",
    over12m: "Over 12 months",
  };
  const yesNo = (v: boolean) => (v ? "Yes" : "No");
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">Insomnia in Adults Aged 55 and Over (Circadin) Consultation Record</h1>
        <p className="text-xs text-gray-500 mt-1">Patient: {patient.firstName} {patient.lastName} | Age: {patient.age} years | PGD version 005, issued 11 September 2026</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years (55 or over confirmed: ${yesNo(assessment.ageConfirmed)})` : "N/A"} />
      <Row label="DOB" value={patient.dateOfBirth} />
      <Row label="GP" value={patient.gpName || "Not provided"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Sleep Assessment</SectionHeader>
      <Row label="Sleep Onset Issue" value={yesNo(assessment.sleepOnsetIssue)} />
      <Row label="Sleep Maintenance Issue" value={yesNo(assessment.sleepMaintenanceIssue)} />
      <Row label="Duration of Insomnia" value={durationLabel[assessment.durationOfInsomnia] || "Not documented"} />
      <Row label="Daytime functioning affected" value={`${yesNo(assessment.daytimeFunctioningAffected)}${assessment.daytimeImpact ? `: ${assessment.daytimeImpact}` : ""}`} />
      <Row label="Sleep hygiene advice given" value={yesNo(assessment.sleepHygieneAdviceGiven)} />
      <Row label="Sleep hygiene already tried" value={`${yesNo(assessment.sleepHygieneAttempted)}${assessment.sleepHygieneTried ? `: ${assessment.sleepHygieneTried}` : ""}`} />
      <Row label="Previous Circadin supply" value={assessment.previousCircadin ? `Yes, ${assessment.weeksTreatedToDate || "?"} weeks of treatment to date` : "No"} />

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

      <SectionHeader>Supply Details</SectionHeader>
      <Row label="Product" value={prescription.product} />
      <Row label="Dose" value={prescription.dose} />
      <Row label="Frequency" value={prescription.frequency} />
      <Row label="Quantity" value={prescription.quantityTablets ? `${prescription.quantityTablets} tablets` : "Not supplied"} />
      <Row label="Maximum treatment" value={prescription.duration} />

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

      <PharmacistDeclaration
        pgdName="Sleep Support - Melatonin"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC}
        pharmacyName={summary.pharmacyName}
      />

      <SectionHeader>Clinical Notes</SectionHeader>
      <div className="text-xs text-navy-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
        {summary.clinicalNotes || "No additional notes"}
      </div>

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={summary.consultationDate} />
      <Row label="Time" value={summary.consultationTime} />

      <ReportFooter pgdName="Sleep Support - Melatonin" />
    </div>
  );
}
