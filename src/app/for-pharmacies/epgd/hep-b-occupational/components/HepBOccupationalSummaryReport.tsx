"use client";

import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type { ClinicalAlert } from "../../shared/types";
import { PGD_VERSION, VACCINE_LABEL, type HepBState } from "../lib/hep_b_occupational-types";

const PGD_NAME = "Hepatitis B (Engerix B / HBvaxPRO)";

const SITE_LABEL: Record<string, string> = {
  "left-deltoid": "Left deltoid",
  "right-deltoid": "Right deltoid",
};

const REFERRAL_LABEL: Record<string, string> = {
  "": "Not recorded",
  gp: "Referred to GP",
  "occupational-health": "Referred to occupational health",
  "immunisation-service": "Referred to an immunisation service or specialist",
  declined: "Patient declined referral; advice given",
};

const REASON_LABEL: Record<string, string> = {
  "healthcare-worker": "Healthcare worker",
  "care-worker": "Care worker",
  "first-responder": "First responder",
  "laboratory-worker": "Laboratory worker",
  "mortuary-embalming": "Mortuary or embalming worker",
  "sex-worker": "Sex worker",
  ivdu: "Intravenous drug user",
  "household-contact": "Household contact of HBV carrier",
  travel: "Travel to a high-prevalence country",
  "other-occupational": "Other occupational exposure",
  "other-lifestyle": "Other lifestyle risk",
};

interface Props {
  state: HepBState;
  alerts: ClinicalAlert[];
  blocked: boolean;
  nextDoseDate: string;
  courseComplete: boolean;
}

/**
 * Printed consultation record for the Hepatitis B (Engerix B / HBvaxPRO)
 * ePGD, rendered as the final step so Save & Print prints what the document's
 * records row requires: patient, consent, brand, batch, expiry, dose number,
 * schedule, site, next due date, advice, pharmacist, PGD version. With a stop
 * present it prints "not supplied" and no vaccine.
 */
export function HepBOccupationalSummaryReport({ state, alerts, blocked, nextDoseDate, courseComplete }: Props) {
  const { patient, consent, assessment, treatment: t, counselling: c, summary } = state;
  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">Hepatitis B (Engerix B / HBvaxPRO) ePGD. {PGD_VERSION}</p>
        {blocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6 print:space-y-4">
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
            <Row label="Date of birth" value={patient.dateOfBirth} />
            <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
            <Row label="Address" value={patient.address || "Not provided"} />
            <Row label="NHS number" value={patient.nhsNumber || "Not provided"} />
            <Row label="GP" value={[patient.gpName, patient.gpPractice].filter(Boolean).join(", ") || "Not provided"} />
          </div>
        </div>

        <div>
          <SectionHeader>Consent</SectionHeader>
          <CounsellingGrid items={[
            ["Informed consent obtained", consent.informedConsentGiven],
            ["ID verified", consent.idVerified],
            ["Aware this is a private service", consent.patientAwarePrivateService],
          ]} />
        </div>

        <div>
          <SectionHeader>Assessment</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Reason for vaccination" value={REASON_LABEL[assessment.reasonForVaccination] || "Not recorded"} />
            <Row label="Eligible under national or occupational health guidance" value={assessment.eligibleUnderGuidance ? "Confirmed" : "Not confirmed"} />
            <Row label="Previous hepatitis B vaccination" value={assessment.previousVaccination === "none" ? "None" : assessment.previousVaccination === "partial-course" ? "Partial course (1-2 doses)" : assessment.previousVaccination === "full-course" ? `Full course${assessment.antiHBsLevelChecked ? ` (anti-HBs ${assessment.antiHBsLevel === "above-10" ? "above 10 IU/L" : assessment.antiHBsLevel === "below-10" ? "below 10 IU/L" : "checked"})` : ""}` : "Not recorded"} />
          </div>
          <div className="mt-2">
            <CounsellingGrid items={[
              ["Known hepatitis B positive", assessment.knownHBPositive],
              ["Hypersensitivity to vaccine or excipient", assessment.allergyVaccineComponent],
              ["Previous reaction to a hepatitis B vaccine", assessment.previousSevereReaction],
              ["Acute severe febrile illness", assessment.currentAcuteIllness],
              ["Hepatitis C positive", assessment.knownHCVPositive],
              ["HIV positive", assessment.knownHIVPositive],
              ["Immunosuppressed", assessment.immunosuppressed],
              ["Pregnant", assessment.pregnancy],
              ["Bleeding disorder or anticoagulants", assessment.bleedingDisorderOrAnticoagulant],
            ]} />
          </div>
        </div>

        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </div>

        {blocked ? (
          <div>
            <SectionHeader>Exclusion Outcome</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Reason" value={alerts.filter((a) => a.severity === "stop").map((a) => a.message).join("; ")} />
              <Row label="Advice given and decision reached" value={assessment.exclusionAdvice || "Not recorded"} />
              <Row label="GP informed or referral" value={REFERRAL_LABEL[assessment.exclusionReferral] ?? assessment.exclusionReferral} />
              <Row label="Vaccine" value="Not supplied" />
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader>Vaccine Administered Under This PGD</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Vaccine (brand and strength)" value={t.vaccine ? VACCINE_LABEL[t.vaccine] : "Not recorded"} />
              <Row label="Dose, form and route" value="1 mL suspension for injection, intramuscular" />
              <Row label="Schedule" value={t.schedule === "standard" ? "Standard (0, 1, 6 months)" : t.schedule === "accelerated" ? "Accelerated (0, 1, 2, 12 months)" : "Not recorded"} />
              <Row label="Dose number" value={t.doseNumber || "Not recorded"} />
              {t.previousDoseDate && <Row label="Date of previous dose" value={t.previousDoseDate} />}
              <Row label="Batch number" value={t.batchNumber || "Not recorded"} />
              <Row label="Expiry date" value={t.expiryDate || "Not recorded"} />
              <Row label="Anatomical site" value={SITE_LABEL[t.injectionSite] || "Not recorded"} />
              <Row label="Date of administration" value={summary.consultationDate} />
              <Row label="Next dose due" value={courseComplete ? "Course complete with this dose" : nextDoseDate || "Not recorded"} />
              <Row label="Adrenaline 1 in 1,000, anaphylaxis protocol and telephone available" value={t.adrenalineAvailable ? "Confirmed" : "Not confirmed"} />
              <Row label="15 minute observation completed" value={t.observationPeriodCompleted ? "Yes" : "No"} />
              <Row label="Adverse reaction" value={t.adverseReaction ? t.adverseReactionDetails || "Yes, details not recorded" : "None observed"} />
              <Row label="Administered via PGD" value="Yes" />
            </div>
          </div>
        )}

        {!blocked && (
          <div>
            <SectionHeader>Advice Given</SectionHeader>
            <CounsellingGrid items={[
              ["Counselling provided (side effects; complete the schedule)", c.counsellingProvided],
              ["Patient information leaflet supplied", c.pilSupplied],
              ["Follow-up advice and Yellow Card reporting", c.followUpAdviceGiven],
              ["Anti-HBs serology recommended after the course", c.serologyRecommended],
              ["Post-exposure protocol explained", c.postExposureProtocolExplained],
            ]} />
            <div className="mt-2 space-y-1.5">
              <Row label="GP informed" value={c.gpInformed === "informed" ? "Yes" : c.gpInformed === "declined" ? "Patient declined" : "Not recorded"} />
              {c.counsellingNotes && <Row label="Counselling notes" value={c.counsellingNotes} />}
            </div>
          </div>
        )}

        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
            <Row label="Pharmacy" value={[summary.pharmacyName, summary.pharmacyAddress].filter(Boolean).join(", ") || "Not recorded"} />
          </div>
        </div>

        {blocked ? (
          <div>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this patient was assessed under the Patient Group Direction for {PGD_NAME}, that exclusion criteria applied, that no vaccine was administered under the PGD, and that the advice given and the decision reached are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </div>
        ) : (
          <PharmacistDeclaration
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
