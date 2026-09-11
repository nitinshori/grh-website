"use client";

import type { HLConsultationState } from "../lib/hair-loss-types";
import type { ClinicalAlert } from "../../shared/types";
import { PGD_STRAPLINE } from "../lib/hair-loss-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HLSummaryReportProps {
  state: HLConsultationState;
  alerts: ClinicalAlert[];
  hasStops?: boolean;
}

export function HLSummaryReport({ state, alerts, hasStops }: HLSummaryReportProps) {
  const stops = hasStops ?? alerts.some((a) => a.severity === "stop");
  const ms = state.medicineSupply;
  const supplied = !stops && ms.finasteride1mgOd && !!ms.quantityMonths;
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          Hair Loss, Finasteride Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record
        </p>
        <p className="text-xs text-gray-500 mt-1">{PGD_STRAPLINE}</p>
      </div>

      {/* Outcome */}
      <div>
        <SectionHeader>Outcome</SectionHeader>
        <div className={`text-sm font-semibold px-3 py-2 rounded ${stops ? "bg-red-50 text-red-700" : supplied ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
          {stops
            ? "NOT SUPPLIED: exclusion criteria met, patient advised and referred to the GP as appropriate"
            : supplied
              ? "Supplied under PGD"
              : "Not supplied: supply not confirmed"}
        </div>
        {stops && state.summary.exclusionAdvice && (
          <div className="mt-2">
            <Row label="Advice given / referral" value={state.summary.exclusionAdvice} />
          </div>
        )}
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age !== null ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="Sex" value={state.patient.sexRecorded === "male" ? "Male" : state.patient.sexRecorded === "not-male" ? "Female or other (excluded)" : "Not recorded"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        <Row label="GP" value={state.patient.gpName || "Not recorded"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not recorded"} />
      </div>

      {/* Consent */}
      <div>
        <SectionHeader>Consent</SectionHeader>
        <Row label="Informed consent" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes (${state.consent.idType})` : "No"} />
        <Row
          label="Private service awareness"
          value={state.consent.patientAwarePrivateService ? "Yes" : "No"}
        />
      </div>

      {/* Clinical Assessment */}
      <div>
        <SectionHeader>Clinical Assessment</SectionHeader>
        <Row
          label="Norwood-Hamilton Scale"
          value={state.clinicalAssessment.norwoodHamiltonScale !== null ? `Stage ${state.clinicalAssessment.norwoodHamiltonScale}` : "Not recorded"}
        />
        <Row
          label="Androgenetic alopecia confirmed"
          value={state.clinicalAssessment.hasAndrogeneticAlopecia ? "Yes" : "No"}
        />
        <Row
          label="Alopecia onset"
          value={state.clinicalAssessment.alopeciaOnset || "Not recorded"}
        />
        <Row
          label="Family history"
          value={state.clinicalAssessment.familyHistory ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <div>
        <SectionHeader>Medical History</SectionHeader>
        <Row label="Liver disease" value={state.medicalHistory.liverDisease ? "Yes" : "No"} />
        <Row label="Suspected or diagnosed prostate cancer" value={state.medicalHistory.prostateCancer ? "Yes" : "No"} />
        <Row label="Raised PSA under investigation" value={state.medicalHistory.psaAbnormalities ? "Yes" : "No"} />
        <Row
          label="Hypersensitivity to finasteride or any component"
          value={state.medicalHistory.hypersensitivity ? "Yes" : "No"}
        />
        <Row label="Current 5-alpha-reductase inhibitor use" value={state.medicalHistory.current5ARI ? "Yes" : "No"} />
        <Row label="Galactose intolerance / Lapp lactase deficiency / glucose-galactose malabsorption" value={state.medicalHistory.galactoseIntolerance ? "Yes" : "No"} />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
        <Row label="Questions put to patient" value={state.medicalHistory.questionsAsked ? "Yes, confirmed by pharmacist" : "NOT confirmed"} />
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row
          label="Depressive mood/changes"
          value={state.contraindications.depressiveMood ? "Yes" : "No"}
        />
        {state.contraindications.depressiveMood && (
          <>
            <Row
              label="Details"
              value={state.contraindications.depressiveMoodDetail || "Not recorded"}
            />
            <Row
              label="Reason for proceeding"
              value={state.contraindications.moodProceedReason || "Not recorded"}
            />
          </>
        )}
        <Row label="Current suicidal ideation" value={state.contraindications.suicidalIdeation ? "Yes (stop, referred)" : "No"} />
        <Row label="Questions put to patient" value={state.contraindications.questionsAsked ? "Yes, confirmed by pharmacist" : "NOT confirmed"} />
      </div>

      {/* Clinical Alerts */}
      <div>
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Supply */}
      <div>
        <SectionHeader>Medicine Supplied</SectionHeader>
        {stops ? (
          <p className="text-xs text-red-700 font-medium">No medicine supplied: exclusion criteria met.</p>
        ) : (
          <>
            <Row label="Medicine (name and brand)" value={`Finasteride 1 mg tablets (POM)${ms.brand ? `, ${ms.brand}` : ", brand not recorded"}`} />
            <Row label="Dose, form and route" value="1 mg orally once daily (tablet), with or without food" />
            <Row
              label="Quantity supplied"
              value={ms.tabletsSupplied !== null && ms.quantityMonths ? `${ms.tabletsSupplied} tablets (${ms.quantityMonths} months of treatment; first review after 3 to 6 months)` : "Not recorded"}
            />
            <Row label="Date of supply" value={state.summary.consultationDate} />
          </>
        )}
        <Row
          label="Finasteride 1 mg once daily supply confirmed"
          value={state.medicineSupply.finasteride1mgOd ? "Yes" : "No"}
        />
        <Row
          label="Tablets not to be handled by women who are or may become pregnant; partner informed"
          value={state.medicineSupply.partnerNotified ? "Yes" : "No"}
        />
        <Row
          label="Condom advice (female partner pregnant or likely to become pregnant)"
          value={state.medicineSupply.condomAdvice ? "Yes" : "No"}
        />
        <Row
          label="Patient to monitor SE"
          value={state.medicineSupply.willMonitorSE ? "Yes" : "No"}
        />
        <Row
          label="Understands PSA effect"
          value={state.medicineSupply.understandsPSAEffect ? "Yes" : "No"}
        />
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Continuous use 3 to 6 months before stabilisation; peak at 2 years; must continue", state.counselling.effectOnsetTime],
            ["If stopped, effects reverse by 6 months, baseline by 9 to 12 months", state.counselling.hairLossResumesStopped],
            [
              "Sexual side effects possible (libido, erectile dysfunction, ejaculation, breast tenderness; infertility reports)",
              state.counselling.sexualSideEffects,
            ],
            ["Psychological side effects: report mood changes; stop and seek advice", state.counselling.moodChanges],
            ["Report breast changes promptly (lumps, pain, gynaecomastia, nipple discharge)", state.counselling.breastChanges],
            ["Review after 3 to 6 months; reassess if no improvement after 12 months", state.counselling.annualReview],
            ["Realistic expectations, dose, scalp protection, psychosocial effects", state.counselling.expectations],
            [
              "Seek medical advice if adverse effects or systemically very unwell",
              state.counselling.reportChanges,
            ],
            ["PIL and patient card supplied", state.counselling.pilAndCardSupplied],
          ]}
        />
      </div>

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <div>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </div>
      )}

      {/* Consultation Details */}
      <div>
        <SectionHeader>Consultation Details</SectionHeader>
        <Row label="Date" value={state.summary.consultationDate} />
        <Row label="Time" value={state.summary.consultationTime} />
      </div>

      {/* Pharmacist Declaration: the shared wording ("no exclusion criteria
          applied") is only true for a supply. */}
      {stops ? (
        <div>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the Patient Group Direction for Hair Loss (Finasteride), that the patient met one or more exclusion criteria, that no medicine was supplied under this PGD, and that the advice given and the decision reached have been recorded above.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
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
        </div>
      ) : (
        <PharmacistDeclaration
          pgdName="Hair Loss (Finasteride)"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      {/* Footer */}
      <ReportFooter pgdName="Hair Loss (Finasteride)" />
    </div>
  );
}
