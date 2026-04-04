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
import type { UTIConsultationState } from "../lib/uti-types";

interface UTISummaryReportProps {
  state: UTIConsultationState;
  alerts: ClinicalAlert[];
}

export function UTISummaryReport({ state, alerts }: UTISummaryReportProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
      {/* Header */}
      <div className="text-center mb-6 print:mb-4">
        <h1 className="text-xl font-bold text-navy-900 print:text-lg">
          Get Real Health — UTI Consultation Record
        </h1>
        <p className="text-sm text-gray-600 mt-1 print:text-xs">
          Patient Group Direction: Nitrofurantoin / Trimethoprim for Uncomplicated UTI
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Date: {state.summary.consultationDate} | Time: {state.summary.consultationTime}
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={`${state.patient.age} years`} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not provided"} />
        <Row label="Address" value={state.patient.address || "Not provided"} />
        <Row label="Phone" value={state.patient.phone || "Not provided"} />
      </div>

      {/* GP Details */}
      <SectionHeader>GP Details</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="GP Name" value={state.patient.gpName || "Not provided"} />
        <Row label="GP Practice" value={state.patient.gpPractice || "Not provided"} />
      </div>

      {/* Consent */}
      <SectionHeader>Consent</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row
          label="Informed Consent"
          value={state.consent.informedConsentGiven ? "Yes" : "No"}
        />
        <Row label="ID Verified" value={state.consent.idVerified ? "Yes" : "No"} />
        {state.consent.idVerified && (
          <Row label="ID Type" value={state.consent.idType || "Not specified"} />
        )}
        <Row
          label="Private Service Awareness"
          value={state.consent.patientAwarePrivateService ? "Yes" : "No"}
        />
      </div>

      {/* Symptoms */}
      <SectionHeader>Symptom Assessment</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="Dysuria" value={state.symptoms.dysuria ? "Yes" : "No"} />
        <Row label="Frequency" value={state.symptoms.frequency ? "Yes" : "No"} />
        <Row label="Urgency" value={state.symptoms.urgency ? "Yes" : "No"} />
        <Row label="Suprapubic Pain" value={state.symptoms.suprapubicPain ? "Yes" : "No"} />
        <Row label="Visible Haematuria" value={state.symptoms.haematuria ? "Yes" : "No"} />
        <Row label="Vaginal Discharge" value={state.symptoms.vaginalDischarge ? "Yes" : "No"} />
        <Row label="Duration" value={state.symptoms.duration || "Not specified"} />
        {state.symptoms.additionalNotes && (
          <Row label="Additional Notes" value={state.symptoms.additionalNotes} />
        )}
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="Pregnant" value={state.medicalHistory.pregnant ? "Yes" : "No"} />
        <Row label="Pregnancy Possible" value={state.medicalHistory.pregnancyPossible ? "Yes" : "No"} />
        <Row label="Breastfeeding" value={state.medicalHistory.breastfeeding ? "Yes" : "No"} />
        <Row label="Catheterised" value={state.medicalHistory.catheterised ? "Yes" : "No"} />
        <Row
          label="Previous UTI Within 4 Weeks"
          value={state.medicalHistory.previousUTIWithin4Weeks ? "Yes" : "No"}
        />
        <Row label="Recurrent UTI (3+ in 12m)" value={state.medicalHistory.recurrentUTI ? "Yes" : "No"} />
        <Row label="Kidney Disease" value={state.medicalHistory.kidneyDisease ? "Yes" : "No"} />
        <Row label="Renal Impairment" value={state.medicalHistory.renalImpairment || "None"} />
        <Row label="Abnormal Urinary Tract" value={state.medicalHistory.knownAbnormalUrinaryTract ? "Yes" : "No"} />
        <Row label="Uncontrolled Diabetes" value={state.medicalHistory.diabetesUncontrolled ? "Yes" : "No"} />
        <Row label="Immunosuppressed" value={state.medicalHistory.immunosuppressed ? "Yes" : "No"} />
        {state.medicalHistory.allergies && (
          <Row label="Allergies" value={state.medicalHistory.allergies} />
        )}
        {state.medicalHistory.currentMedications && (
          <Row label="Current Medications" value={state.medicalHistory.currentMedications} />
        )}
      </div>

      {/* Observations */}
      <SectionHeader>Clinical Observations</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row
          label="Temperature"
          value={state.observations.temperature !== null ? `${state.observations.temperature}°C` : "Not recorded"}
        />
        <Row
          label="Blood Pressure"
          value={
            state.observations.systolicBP !== null && state.observations.diastolicBP !== null
              ? `${state.observations.systolicBP}/${state.observations.diastolicBP} mmHg`
              : "Not recorded"
          }
        />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <div className="mb-4">
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Selection */}
      <SectionHeader>Medicine & Dosing</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row
          label="Medicine"
          value={
            state.medicineSelection.medicine === "nitrofurantoin"
              ? "Nitrofurantoin 100mg MR"
              : "Trimethoprim 200mg"
          }
        />
        <Row label="Dose" value={state.medicineSelection.dose || "Not specified"} />
        <Row label="Duration" value={state.medicineSelection.duration || "Not specified"} />
        <Row label="Quantity" value={`${state.medicineSelection.quantity} doses`} />
        {state.medicineSelection.pharmacistOverride && (
          <>
            <Row label="Pharmacist Override" value="Yes" />
            {state.medicineSelection.overrideReason && (
              <Row label="Override Reason" value={state.medicineSelection.overrideReason} />
            )}
          </>
        )}
      </div>

      {/* Counselling */}
      <SectionHeader>Patient Counselling</SectionHeader>
      <div className="mb-4">
        <CounsellingGrid
          items={[
            ["Complete the full course (6 doses over 3 days)", state.counselling.completeCourse] as [string, boolean],
            ["Drink plenty of water and fluids", state.counselling.hydrationAdvice] as [string, boolean],
            ["Return to GP if not improving within 48 hours", state.counselling.symptomsToReturn] as [string, boolean],
            ["Cranberry not evidence-based for treatment", state.counselling.avoidCranberry] as [string, boolean],
            ["Paracetamol for discomfort/pain", state.counselling.painRelief] as [string, boolean],
            ["Alkalinising agents may help symptoms", state.counselling.alkalinisingAgents] as [string, boolean],
            ["Avoid sexual activity until symptoms resolve", state.counselling.sexualActivityAdvice] as [string, boolean],
            ...(state.medicalHistory.pregnancyPossible
              ? [["Contraception and pregnancy discussed", state.counselling.pregnancyPrecautions] as [string, boolean]]
              : []),
          ]}
        />
      </div>

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 mb-4 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Uncomplicated UTI (Nitrofurantoin/Trimethoprim)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="Uncomplicated UTI" />
    </div>
  );
}
