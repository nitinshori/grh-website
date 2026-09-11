"use client";

import type { SmokingNRTConsultationState } from "../lib/smoking-nrt-types";
import { TIME_TO_FIRST_LABELS } from "../lib/smoking-nrt-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

const PGD_NAME = "Smoking Cessation, Nicotine Replacement Therapy";
const PGD_VERSION = "PGD version 002, issued 11 September 2026";

interface SmokingNRTSummaryReportProps {
  state: SmokingNRTConsultationState;
}

function NotSuppliedDeclaration({ pharmacistName, pharmacistGPhC, pharmacyName }: { pharmacistName: string; pharmacistGPhC: string; pharmacyName: string }) {
  return (
    <>
      <SectionHeader>Practitioner Declaration</SectionHeader>
      <p className="text-xs text-gray-600 mb-4">
        I confirm that this consultation was conducted under the Patient Group Direction for {PGD_NAME}, that an exclusion criterion applied, that NRT was NOT supplied, and that the patient was advised on alternative options and referred as recorded.
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

export function SmokingNRTSummaryReport({ state }: SmokingNRTSummaryReportProps) {
  const { patient, consent, assessment, medicalHistory, nrtSelection, counselling, summary, alerts } = state;
  const hasStops = alerts.some((a) => a.severity === "stop");
  const yesNo = (v: boolean | undefined) => (v ? "Yes" : "No");

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Smoking Cessation: NRT ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. {PGD_VERSION}: nicotine 24-hour patches 7mg, 14mg, 21mg and nicotine lozenges or gum 2mg and 4mg.
        </p>
      </div>

      {hasStops && (
        <div className="mx-6 mb-4 px-4 py-3 border-2 border-red-600 rounded-lg print:mx-4">
          <p className="text-sm font-bold text-red-700 uppercase">Not supplied: exclusion criteria met</p>
          <p className="text-xs text-red-700 mt-1">NRT was not supplied under this PGD. The exclusion(s) are listed under Clinical Alerts. Advice given and the referral decision are recorded in the clinical notes.</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={`${patient.age ?? ""} years`} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="NHS number" value={patient.nhsNumber || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consent</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Informed consent given" value={yesNo(consent.informedConsentGiven)} />
          <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "No"} />
          <Row label="Aware this is a private service" value={yesNo(consent.patientAwarePrivateService)} />
          <Row label="Copy to GP" value={yesNo(consent.notifyGp)} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
          <Row label="PGD" value={PGD_VERSION} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Smoking Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Cigarettes/Day" value={assessment.cigarettesPerDay !== null ? String(assessment.cigarettesPerDay) : "Not recorded"} />
          <Row label="Time to First Cigarette" value={TIME_TO_FIRST_LABELS[assessment.timeToFirstCigarette] || assessment.timeToFirstCigarette || "Not recorded"} />
          <Row label="Quit Date" value={assessment.quitDate || "Not set"} />
          <Row label="Motivated to quit" value={yesNo(assessment.motivated)} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medical History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Current medicines" value={medicalHistory.currentMedications || "Not recorded"} />
          <Row
            label="Cautions recorded"
            value={
              [
                medicalHistory.recentMI && "Recent MI (within 4 weeks)",
                medicalHistory.recentStroke && "Recent stroke",
                medicalHistory.unstableAngina && "Unstable angina",
                medicalHistory.cardiovascularDisease && "Cardiovascular disease / severe arrhythmias",
                medicalHistory.diabetes && "Diabetes",
                medicalHistory.pheochromocytoma && "Phaeochromocytoma",
                medicalHistory.hepaticRenalImpairment && "Hepatic or renal impairment",
                medicalHistory.pepticUlcer && "Peptic ulcer disease",
                medicalHistory.oralUlcerationOrDentalWork && "Oral ulceration or dental work",
                medicalHistory.pregnant && "Pregnant",
                medicalHistory.breastfeeding && "Breastfeeding",
              ]
                .filter(Boolean)
                .join(", ") || "None"
            }
          />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>{hasStops ? "Medicine" : "NRT Supplied"}</SectionHeader>
        {hasStops ? (
          <p className="text-xs font-semibold text-red-700">NOT SUPPLIED. Exclusion criteria met; see Clinical Alerts.</p>
        ) : (
          <div className="space-y-2 text-xs print:space-y-1">
            {nrtSelection.usePatches && (
              <>
                <Row label="Nicotine 24-hour patches" value={`${nrtSelection.patchStrength || "Strength not recorded"}/24-hour, ${nrtSelection.patchStage === "stepdown" ? "step-down supply" : "starting strength"}`} />
                <Row label="Patch brand" value={nrtSelection.patchBrand || "Not recorded"} />
                <Row label="Patch route and dose" value="Transdermal, one patch every 24 hours applied to clean, dry, hairless skin; rotate sites daily" />
                <Row label="Patches supplied" value={nrtSelection.patchQuantity ? `${nrtSelection.patchQuantity} patches` : "Not recorded"} />
              </>
            )}
            {nrtSelection.useOralForm && (
              <>
                <Row label="Oral NRT" value={`Nicotine ${nrtSelection.oralFormType || "gum or lozenge"} ${nrtSelection.oralStrength}`} />
                <Row label="Oral product brand" value={nrtSelection.oralBrand || "Not recorded"} />
                <Row label="Oral route and dose" value="Oral (buccal); initially 8 to 12 pieces a day, reduced gradually over 8 to 12 weeks" />
                <Row label="Pieces supplied" value={nrtSelection.oralQuantity ? `${nrtSelection.oralQuantity} pieces` : "Not recorded"} />
              </>
            )}
            <Row label="Date of supply" value={summary.consultationDate} />
            <Row label="Course" value="8 to 12 weeks; review at 2 weeks, 4 weeks, then regularly" />
            <Row label="Combination Therapy" value={nrtSelection.combinationTherapy ? "Yes" : "No"} />
            <Row label="Behavioural Support" value={nrtSelection.behavioralSupport ? "Arranged" : "Not arranged"} />
          </div>
        )}
      </div>

      {!hasStops && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Counselling Provided</SectionHeader>
          <CounsellingGrid
            items={[
              ["Combination therapy more effective than single form", counselling.combinationBetter],
              ["Quit date set and discussed", counselling.quitDate],
              ["Behavioural/psychological support arranged", counselling.behavioralSupport],
              ["Side effects and product-specific advice explained", counselling.sideEffects],
              ["Continue for the full 8 to 12 weeks; step-down explained", counselling.courseDuration],
              ["Correct technique explained", counselling.correctTechnique],
              ["Use enough NRT", counselling.useEnough],
              ["Do not smoke while using NRT", counselling.doNotSmoke],
              ["Withdrawal symptoms improve within 2 to 3 weeks", counselling.withdrawalSymptoms],
              ["Driving if dizzy; glucose monitoring if diabetic", counselling.drivingWarning],
              ["Seek immediate attention for chest pain, palpitations, breathlessness", counselling.cardiovascularSymptoms],
              ["Report severe skin reactions or oral irritation", counselling.reportReactions],
              ["Inform if pregnant or planning pregnancy", counselling.pregnancyAdvice],
              ["Follow-up at 2 weeks, 4 weeks, monthly; PIL supplied", counselling.followUpSchedule],
            ]}
          />
          <p className="text-xs text-gray-600 mt-2">Suspected adverse reactions to be reported via the Yellow Card scheme (yellowcard.mhra.gov.uk) and the GP informed as appropriate.</p>
        </div>
      )}

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes{hasStops ? " and Advice Given" : ""}</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
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
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
