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

function renalFunctionLabel(value: UTIConsultationState["medicalHistory"]["renalImpairment"]): string {
  switch (value) {
    case "none":
      return "Answer NO: no known kidney disease (patient's answer)";
    case "unknown":
      return "Patient does not know";
    case "moderate":
      return "Moderate impairment (eGFR 30 to 44)";
    case "severe":
      return "Severe impairment (eGFR under 30)";
    default:
      return "Not recorded";
  }
}

function trimethoprimReasonLabel(value: UTIConsultationState["medicineSelection"]["trimethoprimReason"]): string {
  switch (value) {
    case "contraindicated":
      return "Nitrofurantoin contraindicated for this patient";
    case "intolerance":
      return "Intolerable adverse effect on nitrofurantoin previously";
    case "unavailable":
      return "Nitrofurantoin not available and cannot be obtained the same day";
    default:
      return "Not recorded";
  }
}

export function UTISummaryReport({ state, alerts }: UTISummaryReportProps) {
  const isTrimethoprim = state.medicineSelection.medicine === "trimethoprim";
  const stopped = alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && Boolean(state.medicineSelection.medicine);
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
      {/* Header */}
      <div className="text-center mb-6 print:mb-4">
        <h1 className="text-xl font-bold text-navy-900 print:text-lg">
          Get Real Health, UTI Consultation Record
        </h1>
        <p className="text-sm text-gray-600 mt-1 print:text-xs">
          Patient Group Direction: Urinary Tract Infection in Women aged 16 to 64 (nitrofurantoin first line, trimethoprim second line), version 005, issued 11 September 2026
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
        <Row label="New Nocturia" value={state.symptoms.nocturia ? "Yes" : "No"} />
        <Row label="Frequency" value={state.symptoms.frequency ? "Yes" : "No"} />
        <Row label="Urgency" value={state.symptoms.urgency ? "Yes" : "No"} />
        <Row label="Suprapubic Pain" value={state.symptoms.suprapubicPain ? "Yes" : "No"} />
        <Row label="Vaginal Discharge" value={state.symptoms.vaginalDischarge ? "Yes" : "No"} />
        <Row label="Pelvic Pain" value={state.symptoms.pelvicPain ? "Yes" : "No"} />
        <Row label="Intermenstrual or Post-coital Bleeding" value={state.symptoms.abnormalBleeding ? "Yes" : "No"} />
        <Row label="History Suggesting STI" value={state.symptoms.stiHistory ? "Yes" : "No"} />
        <Row label="Duration" value={state.symptoms.duration || "Not specified"} />
        {state.symptoms.additionalNotes && (
          <Row label="Additional Notes" value={state.symptoms.additionalNotes} />
        )}
      </div>

      {/* Appendix 1 red flags */}
      <SectionHeader>Appendix 1 Red Flags</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="Red flags asked about" value={state.symptoms.redFlagsAsked ? "Yes" : "No"} />
        <Row label="Fever, rigors or shivering" value={state.symptoms.feverRigors ? "Yes" : "No"} />
        <Row label="Loin or flank pain" value={state.symptoms.loinFlankPain ? "Yes" : "No"} />
        <Row label="Nausea or vomiting" value={state.symptoms.nauseaVomiting ? "Yes" : "No"} />
        <Row label="Visible Haematuria" value={state.symptoms.haematuria ? "Yes" : "No"} />
        <Row label="Confusion, new drowsiness or feeling very unwell" value={state.symptoms.confusionDrowsiness ? "Yes" : "No"} />
        <Row label="Systemically unwell" value={state.symptoms.systemicallyUnwell ? "Yes" : "No"} />
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History</SectionHeader>
      <div className="space-y-1 mb-4">
        <Row label="Pregnant" value={state.medicalHistory.pregnant ? "Yes" : "No"} />
        <Row label="Pregnancy Possible" value={state.medicalHistory.pregnancyPossible ? "Yes" : "No"} />
        <Row label="Breastfeeding" value={state.medicalHistory.breastfeeding ? "Yes" : "No"} />
        <Row label="Catheter (indwelling or removed within 7 days)" value={state.medicalHistory.catheterised ? "Yes" : "No"} />
        <Row label="Antibiotic already taken for this episode" value={state.medicalHistory.antibioticThisEpisode ? "Yes" : "No"} />
        <Row
          label="Previous UTI Within 4 Weeks"
          value={state.medicalHistory.previousUTIWithin4Weeks ? "Yes" : "No"}
        />
        <Row label="UTI episodes in last 6 months" value={state.medicalHistory.utiEpisodesLast6Months || "Not recorded"} />
        <Row label="UTI episodes in last 12 months" value={state.medicalHistory.utiEpisodesLast12Months || "Not recorded"} />
        <Row label="Known kidney disease (answer given)" value={state.medicalHistory.kidneyDisease ? "Yes" : "No"} />
        <Row label="Renal function" value={renalFunctionLabel(state.medicalHistory.renalImpairment)} />
        <Row label="Abnormal Urinary Tract or Renal Stones" value={state.medicalHistory.knownAbnormalUrinaryTract ? "Yes" : "No"} />
        <Row label="Diabetes or Peripheral Neuropathy Risk" value={state.medicalHistory.diabetesUncontrolled ? "Yes" : "No"} />
        <Row label="Immunosuppressed" value={state.medicalHistory.immunosuppressed ? "Yes" : "No"} />
        <Row label="Nitrofurantoin Hypersensitivity" value={state.medicalHistory.nitrofurantoinHypersensitivity ? "Yes" : "No"} />
        <Row label="G6PD Deficiency" value={state.medicalHistory.g6pdDeficiency ? "Yes" : "No"} />
        <Row label="Previous Nitrofurantoin Reaction" value={state.medicalHistory.previousNitrofurantoinReaction ? "Yes" : "No"} />
        <Row label="Acute Porphyria" value={state.medicalHistory.acutePorphyria ? "Yes" : "No"} />
        <Row label="Trimethoprim Hypersensitivity" value={state.medicalHistory.trimethoprimHypersensitivity ? "Yes" : "No"} />
        <Row label="Trimethoprim in Last 3 Months" value={state.medicalHistory.trimethoprimLast3Months ? "Yes" : "No"} />
        <Row label="Folate Deficiency or Blood Dyscrasia" value={state.medicalHistory.folateDeficiencyOrBloodDyscrasia ? "Yes" : "No"} />
        <Row label="Methotrexate" value={state.medicalHistory.takingMethotrexate ? "Yes" : "No"} />
        <Row label="Potassium-sparing Agent (incl. ACEi/ARB)" value={state.medicalHistory.takingPotassiumSparingAgent ? "Yes" : "No"} />
        <Row label="Phenytoin/Azathioprine/Ciclosporin/Digoxin/Repaglinide/Dofetilide" value={state.medicalHistory.takingInteractingMedicine ? "Yes" : "No"} />
        <Row
          label="Warfarin or Coumarin"
          value={
            state.medicalHistory.takingWarfarin
              ? state.medicalHistory.anticoagulationServiceConsulted
                ? "Yes, anticoagulation service consulted"
                : "Yes"
              : "No"
          }
        />
        <Row label="Hepatic Impairment" value={state.medicalHistory.hepaticImpairment ? "Yes" : "No"} />
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
      {!supplied ? (
        <div className="space-y-1 mb-4">
          <Row label="Outcome" value={stopped ? "NOT SUPPLIED: exclusion criteria met. Patient advised and referred as recorded." : "No medicine selected"} />
        </div>
      ) : (
      <div className="space-y-1 mb-4">
        <Row
          label="Medicine"
          value={
            state.medicineSelection.medicine === "nitrofurantoin"
              ? "Nitrofurantoin 100mg modified release capsules (first line)"
              : state.medicineSelection.medicine === "trimethoprim"
                ? "Trimethoprim 200mg tablets (second line)"
                : "Not selected"
          }
        />
        {state.medicineSelection.medicine === "trimethoprim" && (
          <Row
            label="Reason nitrofurantoin unsuitable"
            value={trimethoprimReasonLabel(state.medicineSelection.trimethoprimReason)}
          />
        )}
        <Row
          label="Dose"
          value={
            state.medicineSelection.dose
              ? `${state.medicineSelection.dose} twice daily, oral${state.medicineSelection.medicine === "nitrofurantoin" ? ", with food or milk" : ""}`
              : "Not specified"
          }
        />
        <Row label="Duration" value={state.medicineSelection.duration || "Not specified"} />
        <Row
          label="Quantity"
          value={`${state.medicineSelection.quantity} ${state.medicineSelection.medicine === "trimethoprim" ? "tablets" : "capsules"}`}
        />
        <Row label="Form and route" value={isTrimethoprim ? "Tablet, oral" : "Modified release capsule, oral"} />
        <Row label="Date of supply" value={`${state.summary.consultationDate} ${state.summary.consultationTime}`.trim()} />
        <Row label="Supplied under" value="UTI in Women aged 16 to 64 PGD v005, 11 September 2026" />
      </div>
      )}

      {/* Counselling */}
      <SectionHeader>Patient Counselling</SectionHeader>
      <div className="mb-4">
        <CounsellingGrid
          items={[
            ["Take one twice a day for 3 days; finish the course", state.counselling.completeCourse] as [string, boolean],
            [
              isTrimethoprim ? "Doses about 12 hours apart" : "Take with food or milk",
              state.counselling.howToTake,
            ] as [string, boolean],
            ...(isTrimethoprim
              ? []
              : [["Urine may go dark yellow or brown (harmless)", state.counselling.darkUrine] as [string, boolean]]),
            ["Drink plenty of fluids", state.counselling.hydrationAdvice] as [string, boolean],
            [
              isTrimethoprim
                ? "Seek advice promptly for sore throat, fever, mouth ulcers, bruising or bleeding"
                : "Stop and seek advice for numbness, tingling or breathlessness",
              state.counselling.stopAndSeekAdvice,
            ] as [string, boolean],
            ["48 hour safety netting given: no better in 48 hours or worse at any point, contact GP or NHS 111 the same day", state.counselling.symptomsToReturn] as [string, boolean],
            ["Immediate-action symptoms given (fever, back or side pain, vomiting, visible blood, confusion)", state.counselling.immediateActionAdvice] as [string, boolean],
            ["Paracetamol or ibuprofen for pain if suitable", state.counselling.painRelief] as [string, boolean],
            ["Cranberry not evidence-based for treatment", state.counselling.avoidCranberry] as [string, boolean],
            ["Avoid sexual activity until symptoms resolve", state.counselling.sexualActivityAdvice] as [string, boolean],
            ["Patient information leaflet supplied", state.counselling.pilSupplied] as [string, boolean],
            ["Return unused medicine to a pharmacy", state.counselling.disposalAdvice] as [string, boolean],
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

      {/* Pharmacist Declaration, or a practitioner block when nothing was supplied */}
      {supplied ? (
        <PharmacistDeclaration
          pgdName="Uncomplicated UTI (Nitrofurantoin/Trimethoprim)"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      ) : (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">No medicine was supplied under this PGD. Advice given (including the 48 hour and immediate-action advice) and the decision reached are recorded above.</p>
          <div className="space-y-1 mb-4">
            <Row label="Name" value={state.summary.pharmacistName || "Not recorded"} />
            <Row label="GPhC number" value={state.summary.pharmacistGPhC || "Not recorded"} />
            <Row label="Pharmacy" value={state.summary.pharmacyName || "Not recorded"} />
          </div>
        </>
      )}

      {/* Footer */}
      <ReportFooter pgdName="Uncomplicated UTI" />
    </div>
  );
}
