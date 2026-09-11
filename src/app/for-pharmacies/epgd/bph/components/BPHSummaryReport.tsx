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
  const stopsExist = alerts.some((a) => a.severity === "stop");
  // Never print a supply, or the "no exclusion criteria applied" declaration,
  // when a stop exists (adversarial review, 11 Sep 2026).
  const supplied = !stopsExist && state.medicineSupply.tamsulosin400mcgMrOd;
  return (
    <div className="bg-white p-8 rounded-lg space-y-6 print:p-4">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold text-navy-900">
          BPH, Tamsulosin Consultation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ePGD Consultation Record. Tamsulosin 400mcg MR capsules for Benign Prostatic Hyperplasia PGD, version 002, issued 11 September 2026
        </p>
      </div>

      {/* Patient Details */}
      <div>
        <SectionHeader>Patient Details</SectionHeader>
        <Row label="Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="DOB" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "Not recorded"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        <Row label="Address" value={state.patient.address || "Not recorded"} />
        <Row label="GP" value={state.patient.gpName ? `${state.patient.gpName}, ${state.patient.gpPractice}` : state.patient.gpPractice || "Not recorded"} />
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
          value={state.lutsAssessment.ipssScore !== null ? state.lutsAssessment.ipssScore : "Not recorded"}
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
          label="Orthostatic hypotension history (exclusion)"
          value={state.medicalHistory.orthostasisHistory ? "Yes" : "No"}
        />
        <Row
          label="Severe hepatic impairment (Child-Pugh C)"
          value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
        />
        <Row label="Mild to moderate hepatic impairment" value={state.medicalHistory.mildModerateHepaticImpairment ? "Yes" : "No"} />
        <Row
          label="Planned cataract or glaucoma surgery"
          value={state.medicalHistory.plannedCataractSurgery ? "Yes" : "No"}
        />
        <Row label="Hypersensitivity to tamsulosin" value={state.medicalHistory.hypersensitivity ? "Yes" : "No"} />
        <Row label="Blood pressure today" value={state.medicalHistory.bloodPressure || "Not recorded"} />
        <Row label="Uncontrolled hypertension" value={state.medicalHistory.uncontrolledHypertension ? "Yes" : "No"} />
        <Row label="Neurological disease affecting bladder" value={state.medicalHistory.neurologicalBladderDisease ? "Yes" : "No"} />
        <Row label="History of syncope" value={state.medicalHistory.syncopeHistory ? "Yes" : "No"} />
        <Row label="Renal impairment (eGFR below 10)" value={state.medicalHistory.severeRenalImpairment ? "Yes" : "No"} />
        <Row
          label="Symptoms previously assessed by GP or urologist"
          value={
            state.medicalHistory.previouslyAssessedByGp
              ? "Yes"
              : `No. GP informed today: ${state.medicalHistory.gpInformedToday ? "yes" : "no"}; patient agrees to attend GP within 6 weeks: ${state.medicalHistory.patientAgreesGpWithin6Weeks ? "yes" : "no"}`
          }
        />
        {state.medicalHistory.otherConditions && (
          <Row label="Other conditions" value={state.medicalHistory.otherConditions} />
        )}
      </div>

      {/* Red Flags */}
      <div>
        <SectionHeader>Red Flags Assessment</SectionHeader>
        <Row label="Visible or non-visible haematuria" value={state.redFlags.haematuria ? "Yes" : "No"} />
        <Row label="Acute retention" value={state.redFlags.acuteRetention ? "Yes" : "No"} />
        <Row label="Palpable bladder" value={state.redFlags.palpableBladder ? "Yes" : "No"} />
        <Row label="Chronic retention symptoms" value={state.redFlags.chronicRetentionSymptoms ? "Yes" : "No"} />
        <Row label="Current or recurrent UTI, or dysuria with fever" value={state.redFlags.urinaryTractInfection ? "Yes" : "No"} />
        <Row label="Prostate cancer known or suspected, abnormal DRE, or raised PSA" value={state.redFlags.psa4OrAbove ? "Yes" : "No"} />
        <Row label="Unexplained weight loss" value={state.redFlags.weightLoss ? "Yes" : "No"} />
        <Row label="Bone pain" value={state.redFlags.bonePain ? "Yes" : "No"} />
      </div>

      {/* Contraindications */}
      <div>
        <SectionHeader>Contraindications Check</SectionHeader>
        <Row label="Other alpha-1 antagonist" value={state.contraindications.otherAlphaBlocker ? "Yes" : "No"} />
        <Row
          label="Taking PDE5 inhibitor"
          value={state.contraindications.takingPde5Inhibitor ? "Yes" : "No"}
        />
        <Row label="Taking antihypertensives" value={state.contraindications.takingAntihypertensives ? "Yes" : "No"} />
        {state.contraindications.takingPde5Inhibitor && (
          <Row label="Details" value={state.contraindications.pde5Detail || "Not recorded"} />
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
        <SectionHeader>{supplied ? "Medicine Supply" : "Outcome"}</SectionHeader>
        {supplied ? (
          <>
            <Row label="Tamsulosin 400 micrograms MR capsules, once daily, oral" value="Yes" />
            <Row label="Brand" value={state.medicineSupply.brand || "Not recorded"} />
            <Row label="Quantity" value={state.medicineSupply.quantity !== null ? `${state.medicineSupply.quantity} capsules` : "Not recorded"} />
            <Row
              label="Supply type"
              value={
                state.medicineSupply.supplyType === "initial"
                  ? "Initial 4-week supply"
                  : state.medicineSupply.supplyType === "continuation"
                    ? `Continuation: IPSS at start ${state.medicineSupply.previousIpss ?? "not recorded"}, GP examined ${state.medicineSupply.gpExaminedSinceStart ? "yes" : "no"}, ${state.medicineSupply.monthsOnTreatment ?? "?"} months on treatment`
                    : "Not recorded"
              }
            />
            <Row label="Supplied under" value="Tamsulosin for BPH PGD v002, 11 September 2026" />
            <Row
              label="After food, preferably breakfast"
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
          </>
        ) : (
          <>
            <Row
              label="Tamsulosin supplied"
              value={stopsExist ? "NOT SUPPLIED: exclusion criteria met (see clinical alerts above)" : "No"}
            />
            <Row label="PGD" value="Tamsulosin for BPH PGD v002, 11 September 2026" />
          </>
        )}
      </div>

      {/* Counselling */}
      <div>
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Take after food, preferably breakfast", state.counselling.take30minsAfterFood],
            ["Swallow whole; do not crush, chew or open", state.counselling.swallowWhole],
            ["Stand up slowly; avoid sudden posture change", state.counselling.firstDoseHypotension],
            ["Report dizziness, fainting or lightheadedness", state.counselling.reportDizzinessFainting],
            ["Abnormal ejaculation: tell GP or pharmacist", state.counselling.retrogradeEjaculation],
            ["Inform surgeons and dentists before procedures", state.counselling.informOphthalmologist],
            ["Priapism over 4 hours: A&E or GP", state.counselling.priapismWarning],
            ["Urgent help for rapid heartbeat, chest pain, severe dizziness", state.counselling.urgentSymptoms],
            ["Rash or allergy: stop and contact GP or pharmacist", state.counselling.rashAllergy],
            ["Review at 4 to 6 weeks", state.counselling.reviewAt4To6Weeks],
            ["PIL supplied", state.counselling.pilSupplied],
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
      {stopsExist ? (
        <div>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the
            Patient Group Direction for BPH (Tamsulosin), that exclusion criteria
            applied, that no medicine was supplied, and that the patient was given
            the advice recorded above.
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
          pgdName="BPH (Tamsulosin)"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      {/* Footer */}
      <ReportFooter pgdName="BPH (Tamsulosin)" />
    </div>
  );
}
