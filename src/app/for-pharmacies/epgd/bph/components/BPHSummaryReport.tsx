"use client";

import type { BPHConsultationState } from "../lib/bph-types";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface BPHSummaryReportProps {
  state: BPHConsultationState;
  alerts: ClinicalAlert[];
}

export function BPHSummaryReport({ state, alerts }: BPHSummaryReportProps) {
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          BPH — Tamsulosin Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record
        </p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}, ${state.patient.gpPractice}` : "—"} />
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

      {/* LUTS Assessment */}
      <div>
        <SectionHeader>LUTS Assessment</SectionHeader>
        <Row
          label="IPSS Score"
          value={state.lutsAssessment.ipssScore !== null ? state.lutsAssessment.ipssScore : "—"}
        />
        <Row
          label="Frequency (>8x/24h)"
          value={state.lutsAssessment.frequency ? "Yes" : "No"}
        />
        <Row
          label="Urgency"
          value={state.lutsAssessment.urgency ? "Yes" : "No"}
        />
        <Row
          label="Nocturia (>1x/night)"
          value={state.lutsAssessment.nocturia ? "Yes" : "No"}
        />
        <Row
          label="Weak stream"
          value={state.lutsAssessment.weakStream ? "Yes" : "No"}
        />
        <Row
          label="Hesitancy"
          value={state.lutsAssessment.hesitancy ? "Yes" : "No"}
        />
        <Row
          label="Incomplete emptying"
          value={state.lutsAssessment.incompletEmptying ? "Yes" : "No"}
        />
        <Row
          label="Lower abdominal discomfort"
          value={state.lutsAssessment.lowerAbdominalDiscomfort ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <div>
        <SectionHeader>Medical History</SectionHeader>
        <Row
          label="Orthostatic hypotension history"
          value={state.medicalHistory.orthostasisHistory ? "Yes" : "No"}
        />
        <Row
          label="Severe hepatic impairment"
          value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
        />
        <Row
          label="Planned cataract surgery"
          value={state.medicalHistory.plannedCataractSurgery ? "Yes" : "No"}
        />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Red Flags */}
      <div>
        <SectionHeader>Red Flags Assessment</SectionHeader>
        <Row label="Haematuria" value={state.redFlags.haematuria ? "Yes" : "No"} />
        <Row label="Acute retention" value={state.redFlags.acuteRetention ? "Yes" : "No"} />
        <Row label="Palpable bladder" value={state.redFlags.palpableBladder ? "Yes" : "No"} />
        <Row label="PSA ≥4 ng/mL" value={state.redFlags.psa4OrAbove ? "Yes" : "No"} />
        <Row label="Unexplained weight loss" value={state.redFlags.weightLoss ? "Yes" : "No"} />
        <Row label="Bone pain" value={state.redFlags.bonePain ? "Yes" : "No"} />
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row
          label="Taking PDE5 inhibitor"
          value={state.contraindications.takingPde5Inhibitor ? "Yes" : "No"}
        />
        {state.contraindications.takingPde5Inhibitor && (
          <Row label="Details" value={state.contraindications.pde5Detail || "—"} />
        )}
        {state.contraindications.otherAntihypertensives && (
          <Row label="Other antihypertensives" value={state.contraindications.otherAntihypertensives} />
        )}
      </div>

      {/* Clinical Alerts */}
      <div>
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      {/* Medicine Supply */}
      <div>
        <SectionHeader>Medicine Supply</SectionHeader>
        <Row
          label="Tamsulosin 400mcg MR OD supplied"
          value={state.medicineSupply.tamsulosin400mcgMrOd ? "Yes" : "No"}
        />
        <Row
          label="After food (30 mins)"
          value={state.medicineSupply.afterFood30mins ? "Yes" : "No"}
        />
        <Row
          label="Same time daily"
          value={state.medicineSupply.sameTimeDaily ? "Yes" : "No"}
        />
        <Row
          label="First-dose hypotension discussed"
          value={state.medicineSupply.firstDoseHypotension ? "Yes" : "No"}
        />
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Take 30 mins after food at same time daily", state.counselling.take30minsAfterFood],
            ["First-dose hypotension — rise slowly", state.counselling.firstDoseHypotension],
            ["Retrograde ejaculation is common", state.counselling.retrogradeEjaculation],
            ["Inform ophthalmologist before eye surgery", state.counselling.informOphthalmologist],
            ["Review at 4-6 weeks", state.counselling.reviewAt4To6Weeks],
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

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="BPH (Tamsulosin)"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="BPH (Tamsulosin)" />
    </div>
  );
}
