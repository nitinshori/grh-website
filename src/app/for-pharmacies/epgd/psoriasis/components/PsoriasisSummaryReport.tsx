"use client";

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type { Clinical } from "../PsoriasisClient";
import { PSORIASIS_PGD_VERSION, FORMULATION_LABEL } from "../PsoriasisClient";

interface Props {
  patient: BasePatientDetails;
  consent: BaseConsent;
  clinical: Clinical;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
}

const COURSES_LABEL: Record<string, string> = { "0": "None", "1": "One", "2": "Two", "3-or-more": "Three or more" };

/**
 * Print-only consultation record for the Plaque Psoriasis PGD. Before this
 * existed the printed page was whatever step was on screen, and the record
 * block on the last step carried no patient name, DOB, address, GP or
 * consent statement (adversarial review, 11 Sep 2026).
 */
export function PsoriasisSummaryReport({ patient, consent, clinical: c, summary, alerts }: Props) {
  const stopped = alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && !!c.product;

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Plaque Psoriasis ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record. {PSORIASIS_PGD_VERSION}</p>
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
          <Row label="Diagnosis" value={c.confirmedPlaque ? "Stable plaque psoriasis, mild to moderate, amenable to topical therapy" : "Not confirmed"} />
          <Row label="Appendix 1 forms" value={c.emergencyFormsExcluded ? "Erythrodermic, pustular, exfoliative and guttate considered and excluded" : "NOT confirmed as excluded"} />
          <Row label="Body surface affected" value={c.extentPercent ? `${c.extentPercent}% (${c.extentEstimatedHow || "method not recorded"})` : "Not recorded"} />
          <Row label="Sites treated" value={`${c.sites || "Not recorded"}${c.scalpInvolved ? "; scalp involved" : ""}`} />
          <Row label="Face, genitals, flexures" value={c.faceGenitalFlexural ? "INVOLVED (excluded)" : "Not involved"} />
          <Row label="Course" value={c.courseType === "repeat" ? `Repeat. Last course ended ${c.lastCourseEndDate || "not recorded"}; GP review agreeing continuation on ${c.gpReviewDate || "not recorded"}` : c.courseType === "first" ? "First course under this PGD" : "Not recorded"} />
          <Row label="Courses in the last 12 months" value={COURSES_LABEL[c.coursesLast12Months] || "Not recorded"} />
          <Row label="Allergies" value={c.allergies.trim() || "Not recorded"} />
          <Row
            label="Exclusions and cautions recorded"
            value={
              [
                c.erythrodermic && "erythrodermic",
                c.pustular && "pustular",
                c.exfoliative && "exfoliative",
                c.guttate && "guttate",
                c.unstable && "unstable",
                c.over15gPerDay && "would need more than 15g a day",
                c.extensiveNeedsSystemic && "extensive, needs systemic treatment",
                c.otherSkinConditions && "skin infection or excluded skin condition",
                c.secondaryInfection && "secondary infection of plaques",
                c.atrophicSkin && "atrophic skin",
                c.ulcersOrWounds && "ulcers or wounds near the area",
                c.otherTopicalSteroidSameArea && "other topical steroid on the same area",
                c.phototherapyOrImmunosuppressed && "phototherapy or systemic treatment",
                c.pregnantOrBreastfeeding && "pregnant, planning pregnancy or breastfeeding",
                c.componentAllergy && "hypersensitivity to a component",
                c.calciumDisorder && "calcium metabolism disorder",
                c.severeRenalOrHepatic && "severe renal or hepatic disease",
                c.visualDisturbance && "visual disturbance",
                c.diabetes && "diabetes (caution)",
              ]
                .filter(Boolean)
                .join("; ") || "None recorded"
            }
          />
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
              <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met; patient referred." />
              <Row label="Advice given and decision" value={c.exclusionAdvice || "Not recorded"} />
            </>
          ) : supplied ? (
            <>
              <Row label="Outcome" value={`Supplied under the ${PSORIASIS_PGD_VERSION}`} />
              <Row label="Medicine" value="Calcipotriol 50 micrograms/g with betamethasone (as dipropionate) 0.5 mg/g" />
              <Row label="Formulation" value={c.formulation ? FORMULATION_LABEL[c.formulation] : "Not recorded"} />
              <Row label="Brand or generic" value={c.brand || "Not recorded"} />
              <Row label="Licensed for the site treated" value={c.licensedForSite ? "Confirmed" : "NOT confirmed"} />
              <Row label="Dose and route" value="Topical. Apply once daily to affected skin only. Maximum 15g in any one day; not more than 10% of body surface (the PGD ceiling)." />
              <Row label="Duration" value="4 weeks, then stop and review" />
              <Row label="Quantity" value={c.quantityGrams ? `${c.quantityGrams}g` : "Not recorded"} />
              <Row label="Batch / expiry" value={`${c.batchNumber || "not recorded"} / ${c.expiryDate || "not recorded"}`} />
              <Row label="Date of supply" value={summary.consultationDate} />
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
            ["Once a day, patchy areas only; not face, genitals or folds", c.applicationAdvice],
            ["No more than 15g a day; not more than about a third of the body", c.maxDoseAdvice],
            ["Wash hands; no dressing; no shower or bath straight after", c.handsDressingShowerAdvice],
            ["Keep using emollients", c.emollientAdvice],
            ["Fire risk from emollients and ointments explained", c.fireRiskAdvice],
            ["Avoid a lot of sun or sunbeds", c.sunAdvice],
            ["4 week course; not beyond without GP review", c.fourWeekAdvice],
            ["Rebound advice given in terms", c.reboundAdvice],
            ["Eye symptoms and hypercalcaemia symptoms", c.symptomsAdvice],
            ["Review at 4 weeks; sooner if worsening", c.reviewAdvice],
            ["Return unused product to a pharmacy", c.disposalAdvice],
            ["PIL and written advice sheet supplied", c.writtenAdviceGiven],
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
          <PharmacistDeclaration pgdName={PSORIASIS_PGD_VERSION} pharmacistName={summary.pharmacistName} pharmacistGPhC={summary.pharmacistGPhC} pharmacyName={summary.pharmacyName} />
        ) : (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the {PSORIASIS_PGD_VERSION}, that no medicine was supplied, and that the advice given and the decision reached are recorded above.
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
        <ReportFooter pgdName={PSORIASIS_PGD_VERSION} />
      </div>
    </div>
  );
}
