"use client";

import type { EDConsultationState, ClinicalAlert } from "../lib/ed-types";

interface EDSummaryReportProps {
  state: EDConsultationState;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 mt-6 first:mt-0 print:text-xs">
      {children}
    </h3>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 col-span-1">{label}</dt>
      <dd className="text-xs text-navy-900 col-span-2">{value}</dd>
    </div>
  );
}

function AlertSummary({ alerts }: { alerts: ClinicalAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-xs text-gray-500">No clinical alerts raised.</p>;
  }
  return (
    <div className="space-y-1.5">
      {alerts.map((alert) => (
        <div
          key={alert.code}
          className={`text-xs px-2 py-1.5 rounded ${
            alert.severity === "stop"
              ? "bg-red-50 text-red-700"
              : alert.severity === "caution"
                ? "bg-amber-50 text-amber-700"
                : "bg-orange-50 text-orange-700"
          }`}
        >
          <span className="font-semibold uppercase">{alert.severity}:</span>{" "}
          {alert.message}
        </div>
      ))}
    </div>
  );
}

export function EDSummaryReport({ state }: EDSummaryReportProps) {
  const medicineName =
    state.medicineSelection.medicine === "sildenafil"
      ? "Sildenafil"
      : "Tadalafil";
  const fullMedicine = `${medicineName} ${state.medicineSelection.dose}`;
  const regimenLabel =
    state.medicineSelection.dosingRegimen === "daily"
      ? "Once daily"
      : "On-demand";

  return (
    <div className="max-w-3xl mx-auto print:max-w-none">
      {/* Print header */}
      <div className="text-center mb-6 print:mb-4">
        <h1 className="text-xl font-bold text-navy-900 print:text-base">
          Get Real Health — ED Consultation Record
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Patient Group Direction: Sildenafil / Tadalafil for Erectile
          Dysfunction
        </p>
        <p className="text-xs text-gray-400">
          Date: {state.summary.consultationDate || new Date().toLocaleDateString("en-GB")} | Time:{" "}
          {state.summary.consultationTime ||
            new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
      </div>

      {/* Patient details */}
      <SectionHeader>Patient Details</SectionHeader>
      <dl>
        <Row
          label="Name"
          value={`${state.patient.firstName} ${state.patient.lastName}`}
        />
        <Row
          label="Date of Birth"
          value={
            state.patient.dateOfBirth
              ? new Date(state.patient.dateOfBirth).toLocaleDateString("en-GB")
              : "—"
          }
        />
        <Row label="Age" value={state.patient.age?.toString() ?? "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="Address" value={state.patient.address || "—"} />
        <Row label="Phone" value={state.patient.phone || "—"} />
        <Row label="GP" value={`${state.patient.gpName} — ${state.patient.gpPractice}`} />
      </dl>

      {/* Consent */}
      <SectionHeader>Consent & Verification</SectionHeader>
      <dl>
        <Row
          label="Informed consent"
          value={state.consent.informedConsentGiven ? "Yes" : "No"}
        />
        <Row
          label="ID verified"
          value={
            state.consent.idVerified
              ? `Yes — ${state.consent.idType || "type not specified"}`
              : "No"
          }
        />
        <Row
          label="Aware private service"
          value={state.consent.patientAwarePrivateService ? "Yes" : "No"}
        />
      </dl>

      {/* Presenting complaint */}
      <SectionHeader>Presenting Complaint</SectionHeader>
      <dl>
        <Row
          label="Onset"
          value={state.complaint.onsetType || "—"}
        />
        <Row label="Duration" value={state.complaint.duration || "—"} />
        <Row label="Severity" value={state.complaint.severity || "—"} />
        <Row
          label="Previous treatment"
          value={
            state.complaint.previousTreatment
              ? state.complaint.previousTreatmentDetails || "Yes"
              : "No"
          }
        />
        {state.complaint.description && (
          <Row label="Notes" value={state.complaint.description} />
        )}
      </dl>

      {/* Medical history */}
      <SectionHeader>Medical History</SectionHeader>
      <dl>
        <Row
          label="CV disease"
          value={
            state.medicalHistory.cardiovascularDisease
              ? state.medicalHistory.cardiovascularDetails || "Yes"
              : "No"
          }
        />
        <Row
          label="Diabetes"
          value={
            state.medicalHistory.diabetes
              ? state.medicalHistory.diabetesType || "Yes"
              : "No"
          }
        />
        <Row
          label="Hepatic impairment"
          value={state.medicalHistory.hepaticImpairment}
        />
        <Row
          label="Renal impairment"
          value={state.medicalHistory.renalImpairment}
        />
        <Row
          label="Retinal disorders"
          value={state.medicalHistory.retinalDisorders ? "Yes" : "No"}
        />
        <Row
          label="Sickle cell / blood disorders"
          value={state.medicalHistory.sickleCell ? "Yes" : "No"}
        />
        <Row
          label="Recent MI/stroke (<6m)"
          value={state.medicalHistory.recentMIOrStroke ? "Yes" : "No"}
        />
        <Row
          label="NAION history"
          value={state.medicalHistory.naionHistory ? "Yes" : "No"}
        />
      </dl>

      {/* Medications */}
      <SectionHeader>Current Medications</SectionHeader>
      <dl>
        <Row
          label="Nitrates"
          value={
            state.medications.takesNitrates
              ? `Yes — ${state.medications.nitrateDetails || "details not specified"}`
              : "No"
          }
        />
        <Row
          label="Riociguat"
          value={state.medications.takesRiociguat ? "Yes" : "No"}
        />
        <Row
          label="Alpha-blockers"
          value={
            state.medications.takesAlphaBlockers
              ? `Yes — ${state.medications.alphaBlockerDetails || "stable: " + (state.medications.alphaBlockerStable ? "yes" : "no")}`
              : "No"
          }
        />
        <Row
          label="CYP3A4 inhibitors"
          value={
            state.medications.takesCYP3A4Inhibitors
              ? state.medications.cyp3a4Details || "Yes"
              : "No"
          }
        />
        <Row
          label="Other medications"
          value={state.medications.otherMedications || "None"}
        />
        <Row
          label="Allergies"
          value={state.medications.allergies || "NKDA"}
        />
      </dl>

      {/* Observations */}
      <SectionHeader>Observations</SectionHeader>
      <dl>
        <Row
          label="Blood pressure"
          value={
            state.observations.systolicBP !== null
              ? `${state.observations.systolicBP}/${state.observations.diastolicBP} mmHg`
              : "—"
          }
        />
        <Row
          label="Heart rate"
          value={
            state.observations.heartRate !== null
              ? `${state.observations.heartRate} bpm`
              : "—"
          }
        />
      </dl>

      {/* Clinical alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {/* Medicine supplied */}
      <SectionHeader>Medicine Supplied</SectionHeader>
      <dl>
        <Row label="Medicine" value={fullMedicine} />
        <Row label="Regimen" value={regimenLabel} />
        <Row
          label="Quantity"
          value={`${state.medicineSelection.quantity} tablets`}
        />
        {state.medicineSelection.pharmacistOverride && (
          <Row
            label="Override reason"
            value={state.medicineSelection.overrideReason || "—"}
          />
        )}
      </dl>

      {/* Counselling */}
      <SectionHeader>Counselling Confirmed</SectionHeader>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {[
          ["Sexual stimulation", state.counselling.sexualStimulationRequired],
          ["Timing advice", state.counselling.timingAdvice],
          ["Food interactions", state.counselling.foodInteractions],
          ["Priapism warning", state.counselling.priapismWarning],
          ["Vision/hearing", state.counselling.visionHearingWarning],
          ["No STI protection", state.counselling.noSTIProtection],
          ["Grapefruit avoidance", state.counselling.grapefruitAvoidance],
          ["Alcohol moderation", state.counselling.alcoholModeration],
          ["Side effects", state.counselling.sideEffectsExplained],
          ["Review advice", state.counselling.reviewAdvice],
        ].map(([label, checked]) => (
          <div key={label as string} className="flex items-center gap-2 py-0.5">
            <span
              className={`w-3 h-3 rounded border flex items-center justify-center ${
                checked
                  ? "bg-teal-500 border-teal-500 text-white"
                  : "border-gray-300"
              }`}
            >
              {checked && (
                <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            <span className="text-gray-700">{label as string}</span>
          </div>
        ))}
      </div>

      {/* Clinical notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-navy-900 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      {/* Pharmacist signature */}
      <SectionHeader>Pharmacist Declaration</SectionHeader>
      <p className="text-xs text-gray-600 mb-4">
        I confirm that this consultation was conducted in accordance with the
        Patient Group Direction for Sildenafil/Tadalafil for Erectile
        Dysfunction, and that the patient met all inclusion criteria and no
        exclusion criteria applied.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Pharmacist name
          </p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
            {state.summary.pharmacistName || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            GPhC number
          </p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
            {state.summary.pharmacistGPhC || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Pharmacy
          </p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
            {state.summary.pharmacyName || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center">
        <p className="text-[10px] text-gray-400">
          Get Real Health ePGD — Consultation Record | Confidential
          Patient Information | Retain for 8 years (adults)
        </p>
      </div>
    </div>
  );
}
